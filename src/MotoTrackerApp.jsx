import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mic } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

import GlobalStyles from "./theme/GlobalStyles";
import { PALETTE, FONT_BODY, FONT_MONO } from "./theme/palette";
import { CONTENT_MAX_WIDTH } from "./lib/constants";
import { uid, monthsBetween } from "./lib/format";
import { DEFAULT_DATA, migrateData } from "./lib/maintenanceRules";
import { GEMINI_CONFIGURED } from "./lib/gemini";

import Header from "./components/layout/Header";
import TabBar from "./components/layout/TabBar";
import Modal from "./components/ui/Modal";

import Dashboard from "./components/dashboard/Dashboard";
import FuelTab from "./components/fuel/FuelTab";
import FuelForm from "./components/fuel/FuelForm";
import MaintenanceTab from "./components/maintenance/MaintenanceTab";
import MaintenanceForm from "./components/maintenance/MaintenanceForm";
import RuleForm from "./components/maintenance/RuleForm";
import SettingsTab from "./components/settings/SettingsTab";
import AddVehicleForm from "./components/garage/AddVehicleForm";
import QuickAddModal from "./components/quickadd/QuickAddModal";

export default function MotoTrackerApp({ user, vehicleId, vehicles, onRefreshVehicles, onSwitchVehicle, onAddVehicle, onDeleteVehicle, onSignOut }) {
  const [data, setData] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const tab = location.pathname === "/" || location.pathname === "" ? "dashboard" : location.pathname.replace("/", "");
  const setTab = (t) => navigate(t === "dashboard" ? "/" : `/${t}`);
  const [ready, setReady] = useState(false);
  const [showFuelForm, setShowFuelForm] = useState(false);
  const [showMaintForm, setShowMaintForm] = useState(false);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [showAddVehicleForm, setShowAddVehicleForm] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  const vehicleRef = useMemo(() => doc(db, "users", user.uid, "vehicles", vehicleId), [user.uid, vehicleId]);

  useEffect(() => {
    (async () => {
      setReady(false);
      try {
        const snap = await getDoc(vehicleRef);
        const loaded = snap.exists() ? snap.data() : DEFAULT_DATA;
        const migrated = migrateData(loaded);
        setData(migrated);
        if (migrated !== loaded) {
          await setDoc(vehicleRef, migrated, { merge: true });
        }
      } catch (e) {
        console.error("Erreur de chargement", e);
        setData(DEFAULT_DATA);
      } finally {
        setReady(true);
      }
    })();
    // Raccourci d'écran d'accueil : ?quickadd=1 ouvre directement la dictée
    if (new URLSearchParams(window.location.search).get("quickadd") === "1") {
      setShowQuickAdd(true);
    }
  }, [vehicleRef]);

  const persist = useCallback(
    (next) => {
      setData(next);
      const clean = JSON.parse(JSON.stringify(next)); // retire les clés undefined, incompatibles avec Firestore
      setDoc(vehicleRef, clean, { merge: false }).catch((e) => console.error("Erreur de sauvegarde", e));
      onRefreshVehicles();
    },
    [vehicleRef, onRefreshVehicles]
  );

  const updateVehicle = (patch) => persist({ ...data, vehicle: { ...data.vehicle, ...patch } });

  const addFuel = (entry) => {
    const km = Number(entry.km);
    const next = {
      ...data,
      fuel: [...data.fuel, { id: uid(), ...entry, km }].sort((a, b) => a.km - b.km),
      vehicle: { ...data.vehicle, currentKm: Math.max(data.vehicle.currentKm, km) },
    };
    persist(next);
    setShowFuelForm(false);
  };

  const addMaintenance = (entry) => {
    const km = Number(entry.km);
    const next = {
      ...data,
      maintenance: [...data.maintenance, { id: uid(), ...entry, km }].sort((a, b) => b.km - a.km),
      vehicle: { ...data.vehicle, currentKm: Math.max(data.vehicle.currentKm, km) },
    };
    persist(next);
    setShowMaintForm(false);
  };

  const addRule = (rule) => {
    persist({ ...data, rules: [...data.rules, { id: uid(), ...rule }] });
    setShowRuleForm(false);
  };

  const deleteItem = (list, id) => persist({ ...data, [list]: data[list].filter((i) => i.id !== id) });

  const consumption = useMemo(() => {
    if (!data) return [];
    const sorted = [...data.fuel].sort((a, b) => a.km - b.km);
    const out = [];
    for (let i = 1; i < sorted.length; i++) {
      const dist = sorted[i].km - sorted[i - 1].km;
      if (dist > 0 && sorted[i].liters) {
        out.push({
          id: sorted[i].id,
          date: sorted[i].date,
          km: sorted[i].km,
          value: (sorted[i].liters / dist) * 100,
        });
      }
    }
    return out;
  }, [data]);

  const avgConsumption = useMemo(() => {
    if (consumption.length === 0) return null;
    const recent = consumption.slice(-5);
    return recent.reduce((s, c) => s + c.value, 0) / recent.length;
  }, [consumption]);

  const ownership = useMemo(() => {
    if (!data) return null;
    const totalCost = data.fuel.reduce((s, f) => s + (Number(f.price) || 0), 0) + data.maintenance.reduce((s, m) => s + (Number(m.cost) || 0), 0);
    const kmSinceAcquisition = Math.max(0, data.vehicle.currentKm - (data.vehicle.acquisitionKm || 0));
    const months = data.vehicle.acquisitionDate ? monthsBetween(data.vehicle.acquisitionDate) : null;
    return {
      totalCost,
      costPerKm: kmSinceAcquisition > 0 ? totalCost / kmSinceAcquisition : null,
      costPerMonth: months ? totalCost / months : null,
    };
  }, [data]);

  const maintStatus = useMemo(() => {
    if (!data) return [];
    const currentKm = data.vehicle.currentKm;
    const now = new Date();
    return data.rules.map((rule) => {
      const done = data.maintenance
        .filter((m) => m.type === rule.name)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      const last = done[0] || null;
      const lastKm = last?.km ?? null;
      const lastDate = last?.date ?? null;

      let nextDueKm = null;
      let remainingKm = null;
      let kmStatus = null;
      if (rule.intervalKm) {
        if (rule.alignToGrid) {
          // Aligné sur la grille officielle constructeur (multiples fixes de l'intervalle),
          // indépendamment du kilométrage réel de la dernière intervention
          nextDueKm = Math.ceil(currentKm / rule.intervalKm) * rule.intervalKm;
          if (nextDueKm === 0) nextDueKm = rule.intervalKm;
        } else {
          nextDueKm = (lastKm ?? 0) + rule.intervalKm;
        }
        remainingKm = nextDueKm - currentKm;
        kmStatus = remainingKm <= 0 ? "overdue" : remainingKm <= rule.intervalKm * 0.1 ? "soon" : "ok";
      }

      let nextDueDate = null;
      let remainingDays = null;
      let dateStatus = null;
      if (rule.intervalMonths) {
        const base = lastDate ? new Date(lastDate) : now;
        nextDueDate = new Date(base);
        nextDueDate.setMonth(nextDueDate.getMonth() + rule.intervalMonths);
        remainingDays = Math.round((nextDueDate - now) / (1000 * 60 * 60 * 24));
        dateStatus = remainingDays <= 0 ? "overdue" : remainingDays <= 30 ? "soon" : "ok";
      }

      const statuses = [kmStatus, dateStatus].filter(Boolean);
      const status = statuses.includes("overdue") ? "overdue" : statuses.includes("soon") ? "soon" : "ok";

      return { ...rule, lastKm, lastDate, nextDueKm, remainingKm, nextDueDate, remainingDays, status };
    });
  }, [data]);

  if (!ready || !data) {
    return (
      <div style={{ background: PALETTE.bg, height: "100dvh" }} className="flex items-center justify-center">
        <div style={{ color: PALETTE.steel, fontFamily: FONT_MONO }}>Chargement…</div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: PALETTE.bg,
        height: "100dvh",
        fontFamily: FONT_BODY,
        color: PALETTE.text,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <GlobalStyles />
      <Header vehicle={data.vehicle} />

      <main
        style={{
          width: "100%",
          flex: 1,
          overflowY: "auto",
          WebkitOverflowScrolling: "touch",
          maxWidth: CONTENT_MAX_WIDTH,
          margin: "0 auto",
          padding: "16px 20px 0",
          boxSizing: "border-box",
        }}
      >
        <div key={tab} style={{ animation: "tabContentIn 200ms ease" }}>
          {tab === "dashboard" && (
            <Dashboard
              avgConsumption={avgConsumption}
              consumption={consumption}
              maintStatus={maintStatus}
              fuelCount={data.fuel.length}
              maintCount={data.maintenance.length}
              onGoMaint={() => setTab("maintenance")}
              vehicles={vehicles}
              ownership={ownership}
            />
          )}

          {tab === "fuel" && (
            <FuelTab
              entries={[...data.fuel].sort((a, b) => b.km - a.km)}
              consumption={consumption}
              onAdd={() => setShowFuelForm(true)}
              onDelete={(id) => deleteItem("fuel", id)}
            />
          )}

          {tab === "maintenance" && (
            <MaintenanceTab
              statuses={maintStatus}
              history={[...data.maintenance].sort((a, b) => b.km - a.km)}
              onAdd={() => setShowMaintForm(true)}
              onDelete={(id) => deleteItem("maintenance", id)}
            />
          )}

          {tab === "settings" && (
            <SettingsTab
              vehicle={data.vehicle}
              onUpdateVehicle={updateVehicle}
              vehicles={vehicles}
              activeVehicleId={vehicleId}
              onSwitchVehicle={onSwitchVehicle}
              onRequestAddVehicle={() => setShowAddVehicleForm(true)}
              onDeleteVehicle={onDeleteVehicle}
              rules={data.rules}
              onAddRule={() => setShowRuleForm(true)}
              onDeleteRule={(id) => deleteItem("rules", id)}
              apiKeyConfigured={GEMINI_CONFIGURED}
              userEmail={user.email}
              onSignOut={onSignOut}
            />
          )}
        </div>
        <div style={{ height: 24 }} />
      </main>

      <TabBar tab={tab} setTab={setTab} />

      {showFuelForm && (
        <Modal title="Nouveau plein" onClose={() => setShowFuelForm(false)}>
          <FuelForm onSubmit={addFuel} defaultKm={data.vehicle.currentKm} />
        </Modal>
      )}
      {showMaintForm && (
        <Modal title="Entretien effectué" onClose={() => setShowMaintForm(false)}>
          <MaintenanceForm onSubmit={addMaintenance} defaultKm={data.vehicle.currentKm} rules={data.rules} />
        </Modal>
      )}
      {showRuleForm && (
        <Modal title="Nouveau type d'entretien" onClose={() => setShowRuleForm(false)}>
          <RuleForm onSubmit={addRule} />
        </Modal>
      )}
      {showAddVehicleForm && (
        <Modal title="Ajouter une moto" onClose={() => setShowAddVehicleForm(false)}>
          <AddVehicleForm
            onSubmit={(name, currentKm, rules, acquisitionDate) => {
              onAddVehicle(name, currentKm, rules, acquisitionDate);
              setShowAddVehicleForm(false);
            }}
          />
        </Modal>
      )}

      <button
        onClick={() => setShowQuickAdd(true)}
        aria-label="Dictée rapide"
        style={{
          position: "fixed",
          right: 16,
          bottom: 88,
          width: 56,
          height: 56,
          borderRadius: 999,
          background: PALETTE.amber,
          color: "#1B1A17",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 14px rgba(0,0,0,0.4)",
        }}
      >
        <Mic size={24} />
      </button>

      {showQuickAdd && (
        <QuickAddModal
          rules={data.rules}
          defaultKm={data.vehicle.currentKm}
          onClose={() => setShowQuickAdd(false)}
          onAddFuel={addFuel}
          onAddMaintenance={addMaintenance}
        />
      )}
    </div>
  );
}
