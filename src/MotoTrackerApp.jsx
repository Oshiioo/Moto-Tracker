import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mic } from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebase";

import GlobalStyles from "./theme/GlobalStyles";
import { PALETTE, FONT_BODY, FONT_MONO, vehicleColorMap } from "./theme/palette";
import { CONTENT_MAX_WIDTH, TAB_IDS } from "./lib/constants";
import { uid } from "./lib/format";
import { DEFAULT_DATA, migrateData } from "./lib/maintenanceRules";
import { GEMINI_CONFIGURED } from "./lib/gemini";
import { computeVehicleStats } from "./lib/vehicleStats";

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
  const mainRef = useRef(null);
  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
  }, [tab]);

  // Swipe gauche/droite pour changer d'onglet, en plus de la TabBar. On ne
  // décide qu'au relâchement (touchend), sur le déplacement total — jamais de
  // preventDefault, pour ne pas gêner le scroll vertical normal de la page.
  const touchStartRef = useRef(null);
  const onTouchStart = (e) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    const SWIPE_THRESHOLD = 60;
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    const idx = TAB_IDS.indexOf(tab);
    if (dx < 0 && idx < TAB_IDS.length - 1) setTab(TAB_IDS[idx + 1]);
    else if (dx > 0 && idx > 0) setTab(TAB_IDS[idx - 1]);
  };
  const [ready, setReady] = useState(false);
  const [showFuelForm, setShowFuelForm] = useState(false);
  const [showMaintForm, setShowMaintForm] = useState(false);
  const [ruleModal, setRuleModal] = useState(null); // null | "new" | règle en édition
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
    setRuleModal(null);
  };

  const updateRule = (id, patch) => {
    persist({ ...data, rules: data.rules.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
    setRuleModal(null);
  };

  const deleteItem = (list, id) => persist({ ...data, [list]: data[list].filter((i) => i.id !== id) });

  const activeStats = useMemo(() => computeVehicleStats(data), [data]);
  const { consumption, maintStatus } = activeStats;

  // Dashboard multi-motos : on ne charge en entier (fuel/maintenance/rules)
  // que la moto active + toutes les autres motos du garage, quel que soit
  // leur statut — une moto vendue/archivée doit rester consultable dans le
  // dashboard. La clé de dépendance est une chaîne primitive (pas le tableau
  // `vehicles`, qui change de référence à chaque persist()) pour ne refetch
  // que quand la liste des motos du garage change réellement.
  const [extraVehiclesData, setExtraVehiclesData] = useState({});
  const otherVehiclesKey = useMemo(
    () =>
      vehicles
        .filter((v) => v.id !== vehicleId)
        .map((v) => v.id)
        .sort()
        .join(","),
    [vehicles, vehicleId]
  );
  useEffect(() => {
    const ids = otherVehiclesKey ? otherVehiclesKey.split(",") : [];
    if (ids.length === 0) {
      setExtraVehiclesData({});
      return;
    }
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        ids.map(async (id) => {
          try {
            const snap = await getDoc(doc(db, "users", user.uid, "vehicles", id));
            return [id, snap.exists() ? migrateData(snap.data()) : null];
          } catch (e) {
            console.error("Erreur de chargement véhicule", id, e);
            return [id, null];
          }
        })
      );
      if (!cancelled) setExtraVehiclesData(Object.fromEntries(entries.filter(([, d]) => d)));
    })();
    return () => {
      cancelled = true;
    };
  }, [otherVehiclesKey, user.uid]);

  const dashboardVehicles = useMemo(() => {
    // Couleurs garanties distinctes uniquement pour les motos actives (2-3
    // en simultané dans le cas réel) ; les motos vendues/archivées, qui ne
    // servent qu'à consulter leur historique, restent en gris neutre.
    const colorMap = vehicleColorMap(vehicles.filter((v) => v.status === "active"));
    return vehicles
      .map((v) => {
        const fullData = v.id === vehicleId ? data : extraVehiclesData[v.id];
        if (!fullData) return null; // pas encore chargée
        const stats = v.id === vehicleId ? activeStats : computeVehicleStats(fullData);
        return {
          id: v.id,
          name: v.name,
          color: colorMap[v.id] || PALETTE.steelDim,
          fuelCount: fullData.fuel.length,
          maintCount: fullData.maintenance.length,
          ...stats,
        };
      })
      .filter(Boolean);
  }, [vehicles, vehicleId, data, extraVehiclesData, activeStats]);

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
        ref={mainRef}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
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
            <Dashboard vehiclesData={dashboardVehicles} vehicles={vehicles} activeVehicleId={vehicleId} onGoMaint={() => setTab("maintenance")} />
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
              vehicle={data.vehicle}
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
              onAddRule={() => setRuleModal("new")}
              onEditRule={(rule) => setRuleModal(rule)}
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
      {ruleModal && (
        <Modal title={ruleModal === "new" ? "Nouveau type d'entretien" : "Modifier l'entretien"} onClose={() => setRuleModal(null)}>
          <RuleForm
            initialRule={ruleModal === "new" ? null : ruleModal}
            onSubmit={(values) => (ruleModal === "new" ? addRule(values) : updateRule(ruleModal.id, values))}
          />
        </Modal>
      )}
      {showAddVehicleForm && (
        <Modal title="Ajouter une moto" onClose={() => setShowAddVehicleForm(false)}>
          <AddVehicleForm
            onSubmit={(payload) => {
              onAddVehicle(payload);
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
          background: PALETTE.primary,
          color: "#FFFFFF",
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
