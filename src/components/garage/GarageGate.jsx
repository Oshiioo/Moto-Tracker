import { useState, useEffect, useCallback } from "react";
import { collection, doc, getDocs, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "../../firebase";
import { PALETTE, FONT_MONO } from "../../theme/palette";
import { STORAGE_KEY } from "../../lib/constants";
import { uid } from "../../lib/format";
import { DEFAULT_DATA, migrateData } from "../../lib/maintenanceRules";
import MotoTrackerApp from "../../MotoTrackerApp";

export default function GarageGate({ user }) {
  const [vehicles, setVehicles] = useState(null); // null = chargement
  const [activeVehicleId, setActiveVehicleId] = useState(null);
  const activeKey = `moto-tracker-active-vehicle-${user.uid}`;

  const refreshVehicles = useCallback(async () => {
    const snap = await getDocs(collection(db, "users", user.uid, "vehicles"));
    const list = snap.docs.map((d) => {
      const v = d.data().vehicle || {};
      return {
        id: d.id,
        name: v.name || "Ma moto",
        currentKm: v.currentKm || 0,
        status: v.status || "active",
        acquisitionKm: v.acquisitionKm || 0,
        acquisitionDate: v.acquisitionDate || null,
        saleDate: v.saleDate || null,
        finalKm: v.finalKm != null ? v.finalKm : null,
        archiveReason: v.archiveReason || null,
        archiveDate: v.archiveDate || null,
      };
    });
    setVehicles(list);
    return list;
  }, [user.uid]);

  useEffect(() => {
    (async () => {
      let list = await refreshVehicles();

      if (list.length === 0) {
        // Première connexion : migre les données locales existantes si présentes,
        // sinon crée une moto vierge.
        let initial = DEFAULT_DATA;
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw) initial = migrateData(JSON.parse(raw));
        } catch {
          /* ignore, on repart de DEFAULT_DATA */
        }
        const newId = uid();
        const clean = JSON.parse(JSON.stringify(initial));
        await setDoc(doc(db, "users", user.uid, "vehicles", newId), { ...clean, createdAt: serverTimestamp() });
        list = await refreshVehicles();
      }

      const savedActive = localStorage.getItem(activeKey);
      const validActive = list.find((v) => v.id === savedActive);
      setActiveVehicleId(validActive ? savedActive : list[0]?.id || null);
    })();
  }, [refreshVehicles, activeKey, user.uid]);

  const onSwitchVehicle = (id) => {
    setActiveVehicleId(id);
    localStorage.setItem(activeKey, id);
  };

  const onAddVehicle = async (name, currentKm = 0, rules = [], acquisitionDate = null) => {
    const newId = uid();
    const km = Number(currentKm) || 0;
    await setDoc(doc(db, "users", user.uid, "vehicles", newId), {
      vehicle: { name: name || "Nouvelle moto", currentKm: km, status: "active", acquisitionKm: km, acquisitionDate },
      fuel: [],
      maintenance: [],
      rules,
      createdAt: serverTimestamp(),
    });
    await refreshVehicles();
    onSwitchVehicle(newId);
  };

  const onDeleteVehicle = async (id) => {
    await deleteDoc(doc(db, "users", user.uid, "vehicles", id));
    const list = await refreshVehicles();
    if (activeVehicleId === id) {
      onSwitchVehicle(list[0]?.id || null);
    }
  };

  const onSignOut = () => signOut(auth);

  if (!vehicles || !activeVehicleId) {
    return (
      <div style={{ background: PALETTE.bg, height: "100dvh" }} className="flex items-center justify-center">
        <div style={{ color: PALETTE.steel, fontFamily: FONT_MONO }}>Chargement du garage…</div>
      </div>
    );
  }

  return (
    <MotoTrackerApp
      key={activeVehicleId}
      user={user}
      vehicleId={activeVehicleId}
      vehicles={vehicles}
      onRefreshVehicles={refreshVehicles}
      onSwitchVehicle={onSwitchVehicle}
      onAddVehicle={onAddVehicle}
      onDeleteVehicle={onDeleteVehicle}
      onSignOut={onSignOut}
    />
  );
}
