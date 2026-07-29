import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Fuel, Wrench, Gauge, Settings, Plus, Trash2, X, AlertTriangle, CheckCircle2, Clock, Camera, Mic, Loader2 } from "lucide-react";

const STORAGE_KEY = "moto-tracker-data";
const GEMINI_MODEL = "gemini-3.6-flash";
// Clé lue depuis le fichier .env.local (voir instructions), jamais depuis l'interface
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

async function geminiExtract(apiKey, { promptText, imageBase64, imageMimeType }) {
  const parts = [{ text: promptText }];
  if (imageBase64) parts.push({ inline_data: { mime_type: imageMimeType, data: imageBase64 } });
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    }
  );
  if (!res.ok) {
    const errText = await res.text();
    const messages = {
      404: "Modèle Gemini introuvable (config à mettre à jour)",
      401: "Clé API invalide",
      403: "Clé API refusée (vérifie les restrictions dans AI Studio)",
      429: "Quota Gemini atteint pour aujourd'hui",
    };
    throw new Error(messages[res.status] || `Erreur Gemini (${res.status})`);
  }
  const data = await res.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error("Réponse vide, réessaie");
  return JSON.parse(raw);
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Types suivis mais sans rappel dédié (pas de règle intervalKm/intervalMonths)
const EXTRA_KNOWN_TYPES = ["Pression des pneus"];

// Filet de sécurité : rattache les synonymes courants au bon type existant,
// même si Gemini répond avec une formulation légèrement différente
const TYPE_SYNONYMS = [
  { canonical: "Pression des pneus", keywords: ["pression", "gonfl"] },
  { canonical: "Usure pneu avant", keywords: ["usure", "avant"] },
  { canonical: "Usure pneu arrière", keywords: ["usure", "arrière", "arriere"] },
  { canonical: "Graissage de la chaîne", keywords: ["graiss"] },
  { canonical: "Tension de la chaîne", keywords: ["tension"] },
  { canonical: "Vidange", keywords: ["vidange", "huile moteur"] },
  { canonical: "Filtre à air", keywords: ["filtre à air", "filtre a air"] },
  { canonical: "Bougies", keywords: ["bougie"] },
  { canonical: "Contrôle plaquettes et disques", keywords: ["plaquette", "disque"] },
  { canonical: "Purge des liquides de frein", keywords: ["purge", "liquide de frein"] },
];

function normalizeType(rawType, knownTypes) {
  if (!rawType) return rawType;
  const norm = rawType
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // 1. Correspondance exacte avec un type déjà connu (insensible accents/casse)
  const exact = knownTypes.find(
    (t) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === norm
  );
  if (exact) return exact;

  // 2. Correspondance par mots-clés/synonymes
  for (const { canonical, keywords } of TYPE_SYNONYMS) {
    if (knownTypes.includes(canonical) && keywords.some((k) => norm.includes(k))) {
      return canonical;
    }
  }

  // 3. Aucune correspondance : on garde tel quel, avec majuscule initiale
  return rawType.charAt(0).toUpperCase() + rawType.slice(1);
}

// Préconisations constructeur Honda CB500F 2016, alignées sur les libellés
// utilisés dans l'historique importé depuis LibertyRider
const DEFAULT_RULES = [
  { id: "r1", name: "Vidange", intervalKm: 12000, alignToGrid: true },
  { id: "r2", name: "Filtre à air", intervalKm: 18000, alignToGrid: true },
  { id: "r3", name: "Bougies", intervalKm: 24000, alignToGrid: true },
  { id: "r4", name: "Graissage de la chaîne", intervalKm: 1000 },
  { id: "r5", name: "Tension de la chaîne", intervalKm: 1000 },
  { id: "r6", name: "Contrôle plaquettes et disques", intervalMonths: 12 },
  { id: "r7", name: "Purge des liquides de frein", intervalMonths: 24 },
  { id: "r8", name: "Liquide de refroidissement", intervalMonths: 36 },
  { id: "r9", name: "Entretien annuel", intervalMonths: 12 },
  { id: "r10", name: "Usure pneu avant", intervalKm: 2000, hideFromPicker: true },
  { id: "r11", name: "Usure pneu arrière", intervalKm: 2000, hideFromPicker: true },
];

// Historique importé depuis LibertyRider (51 231 km → 68 453 km)
const IMPORTED_MAINTENANCE = [
  { date: "2025-02-14", km: 51231, type: "Pression des pneus" },
  { date: "2025-02-14", km: 51231, type: "Contrôle plaquettes et disques" },
  { date: "2025-02-14", km: 51231, type: "Entretien annuel" },
  { date: "2025-02-14", km: 51231, type: "Graissage de la chaîne" },
  { date: "2025-02-14", km: 51231, type: "Tension de la chaîne" },
  { date: "2025-02-24", km: 51794, type: "Tension de la chaîne" },
  { date: "2025-02-24", km: 51794, type: "Pression des pneus" },
  { date: "2025-02-24", km: 51794, type: "Graissage de la chaîne" },
  { date: "2025-03-04", km: 52318, type: "Graissage de la chaîne" },
  { date: "2025-03-04", km: 52318, type: "Pression des pneus" },
  { date: "2025-03-07", km: 52730, type: "Pression des pneus" },
  { date: "2025-03-20", km: 53223, type: "Tension de la chaîne" },
  { date: "2025-03-20", km: 53223, type: "Graissage de la chaîne" },
  { date: "2025-03-20", km: 53223, type: "Pression des pneus" },
  { date: "2025-03-31", km: 53949, type: "Pression des pneus" },
  { date: "2025-04-03", km: 54054, type: "Graissage de la chaîne" },
  { date: "2025-04-26", km: 54943, type: "Pression des pneus" },
  { date: "2025-04-26", km: 54943, type: "Graissage de la chaîne" },
  { date: "2025-05-02", km: 55231, type: "Tension de la chaîne" },
  { date: "2025-05-10", km: 55553, type: "Pression des pneus" },
  { date: "2025-05-18", km: 55975, type: "Pression des pneus" },
  { date: "2025-05-18", km: 55975, type: "Graissage de la chaîne" },
  { date: "2025-08-01", km: 57249, type: "Graissage de la chaîne" },
  { date: "2025-08-01", km: 57249, type: "Pression des pneus" },
  { date: "2025-08-01", km: 57249, type: "Tension de la chaîne" },
  { date: "2025-08-04", km: 57568, type: "Pression des pneus" },
  { date: "2025-08-13", km: 58178, type: "Pression des pneus" },
  { date: "2025-08-13", km: 58178, type: "Graissage de la chaîne" },
  { date: "2025-08-30", km: 58646, type: "Pression des pneus" },
  { date: "2025-09-05", km: 59246, type: "Pression des pneus" },
  { date: "2025-09-05", km: 59246, type: "Graissage de la chaîne" },
  { date: "2025-09-06", km: 59686, type: "Pression des pneus" },
  { date: "2025-09-06", km: 59686, type: "Graissage de la chaîne" },
  { date: "2025-09-16", km: 60001, type: "Tension de la chaîne" },
  { date: "2025-09-30", km: 60310, type: "Pression des pneus" },
  { date: "2025-10-10", km: 60852, type: "Graissage de la chaîne" },
  { date: "2025-10-10", km: 60852, type: "Pression des pneus" },
  { date: "2025-10-24", km: 61090, type: "Contrôle plaquettes et disques" },
  { date: "2025-10-24", km: 61090, type: "Purge des liquides de frein" },
  { date: "2025-10-24", km: 61090, type: "Vidange", note: "Filtre à huile changé" },
  { date: "2025-10-24", km: 61090, type: "Filtre à air" },
  { date: "2025-10-24", km: 61090, type: "Bougies" },
  { date: "2025-10-24", km: 61090, type: "Entretien annuel" },
  { date: "2025-12-14", km: 61551, type: "Pression des pneus" },
  { date: "2026-02-22", km: 62123, type: "Tension de la chaîne" },
  { date: "2026-02-22", km: 62123, type: "Pression des pneus" },
  { date: "2026-02-22", km: 62123, type: "Graissage de la chaîne" },
  { date: "2026-03-26", km: 62806, type: "Pression des pneus" },
  { date: "2026-03-26", km: 62806, type: "Graissage de la chaîne" },
  { date: "2026-04-13", km: 63680, type: "Graissage de la chaîne" },
  { date: "2026-04-13", km: 63680, type: "Pression des pneus" },
  { date: "2026-04-17", km: 64169, type: "Tension de la chaîne" },
  { date: "2026-04-17", km: 64265, type: "Pression des pneus" },
  { date: "2026-05-31", km: 66169, type: "Pression des pneus" },
  { date: "2026-05-31", km: 66169, type: "Graissage de la chaîne" },
  { date: "2026-05-31", km: 66169, type: "Tension de la chaîne" },
  { date: "2026-07-08", km: 67934, type: "Pression des pneus" },
  { date: "2026-07-23", km: 68453, type: "Pression des pneus" },
  { date: "2026-07-23", km: 68453, type: "Tension de la chaîne" },
].map((m, i) => ({ id: `import-${i}`, ...m }));

const DEFAULT_DATA = {
  vehicle: { name: "CB500F 2016", currentKm: 68984 },
  fuel: [{ id: "fuel-1", date: "2026-07-26", km: 68842, price: 23.42 }],
  maintenance: IMPORTED_MAINTENANCE,
  rules: DEFAULT_RULES,
};

const uid = () => Math.random().toString(36).slice(2, 10);
const fmtKm = (n) => new Intl.NumberFormat("fr-FR").format(Math.round(n));
const fmtDate = (d) =>
  new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

function loadData() {
  return DEFAULT_DATA;
}

function migrateData(loaded) {
  let next = loaded;
  const hasFrontTireRule = next.rules.some((r) => r.name === "Usure pneu avant");
  const hasRearTireRule = next.rules.some((r) => r.name === "Usure pneu arrière");
  if (!hasFrontTireRule || !hasRearTireRule) {
    const today = new Date().toISOString().slice(0, 10);
    const km = next.vehicle.currentKm;
    const newRules = [...next.rules];
    const newMaintenance = [...next.maintenance];
    if (!hasFrontTireRule) {
      newRules.push({ id: uid(), name: "Usure pneu avant", intervalKm: 2000, hideFromPicker: true });
      newMaintenance.push({ id: uid(), date: today, km, type: "Usure pneu avant", note: "Point de départ du suivi" });
    }
    if (!hasRearTireRule) {
      newRules.push({ id: uid(), name: "Usure pneu arrière", intervalKm: 2000, hideFromPicker: true });
      newMaintenance.push({ id: uid(), date: today, km, type: "Usure pneu arrière", note: "Point de départ du suivi" });
    }
    next = { ...next, rules: newRules, maintenance: newMaintenance };
  }
  return next;
}

export default function MotoTracker() {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("dashboard");
  const [ready, setReady] = useState(false);
  const [showFuelForm, setShowFuelForm] = useState(false);
  const [showMaintForm, setShowMaintForm] = useState(false);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const loaded = raw ? JSON.parse(raw) : DEFAULT_DATA;
      const migrated = migrateData(loaded);
      setData(migrated);
      if (migrated !== loaded) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      }
    } catch (e) {
      setData(DEFAULT_DATA);
    } finally {
      setReady(true);
    }
    // Raccourci d'écran d'accueil : ?quickadd=1 ouvre directement la dictée
    if (new URLSearchParams(window.location.search).get("quickadd") === "1") {
      setShowQuickAdd(true);
    }
  }, []);

  const persist = useCallback((next) => {
    setData(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (e) {
      console.error("Erreur de sauvegarde", e);
    }
  }, []);

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
      <div style={{ background: PALETTE.bg, minHeight: "100vh" }} className="flex items-center justify-center">
        <div style={{ color: PALETTE.steel, fontFamily: FONT_MONO }}>Chargement…</div>
      </div>
    );
  }

  return (
    <div style={{ background: PALETTE.bg, minHeight: "100vh", fontFamily: FONT_BODY, color: PALETTE.text }}>
      <FontLoader />
      <Header vehicle={data.vehicle} onEdit={() => setEditingVehicle(true)} />

      <main className="max-w-md mx-auto px-4 pb-28 pt-4">
        {tab === "dashboard" && (
          <Dashboard
            vehicle={data.vehicle}
            avgConsumption={avgConsumption}
            maintStatus={maintStatus}
            fuelCount={data.fuel.length}
            maintCount={data.maintenance.length}
            onGoMaint={() => setTab("maintenance")}
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
            rules={data.rules}
            onAdd={() => setShowRuleForm(true)}
            onDelete={(id) => deleteItem("rules", id)}
            apiKeyConfigured={!!GEMINI_API_KEY}
          />
        )}
      </main>

      <TabBar tab={tab} setTab={setTab} />

      {showFuelForm && (
        <Modal title="Nouveau plein" onClose={() => setShowFuelForm(false)}>
          <FuelForm onSubmit={addFuel} defaultKm={data.vehicle.currentKm} apiKey={GEMINI_API_KEY} />
        </Modal>
      )}
      {showMaintForm && (
        <Modal title="Entretien effectué" onClose={() => setShowMaintForm(false)}>
          <MaintenanceForm
            onSubmit={addMaintenance}
            defaultKm={data.vehicle.currentKm}
            rules={data.rules}
            apiKey={GEMINI_API_KEY}
          />
        </Modal>
      )}
      {showRuleForm && (
        <Modal title="Nouveau type d'entretien" onClose={() => setShowRuleForm(false)}>
          <RuleForm onSubmit={addRule} />
        </Modal>
      )}
      {editingVehicle && (
        <Modal title="Ma moto" onClose={() => setEditingVehicle(false)}>
          <VehicleForm
            vehicle={data.vehicle}
            onSubmit={(patch) => {
              updateVehicle(patch);
              setEditingVehicle(false);
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
          apiKey={GEMINI_API_KEY}
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

/* ---------- Design tokens ---------- */

const PALETTE = {
  bg: "#1B1A17",
  surface: "#252320",
  surfaceRaised: "#2E2B26",
  steel: "#948C7C",
  steelDim: "#6B6558",
  amber: "#C97A2B",
  amberSoft: "#E0985A",
  yellow: "#E8B93B",
  danger: "#C1442E",
  ok: "#7A9B6E",
  text: "#F1ECE2",
  textMuted: "#B4AC9C",
  hairline: "#3A362F",
};

const FONT_DISPLAY = "'Oswald', sans-serif";
const FONT_BODY = "'Work Sans', sans-serif";
const FONT_MONO = "'JetBrains Mono', monospace";

function FontLoader() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Work+Sans:wght@400;500;600&family=JetBrains+Mono:wght@500;700&display=swap');
      * { box-sizing: border-box; }
      body { margin: 0; }
      input, select { outline: none; }
      input:focus, select:focus { border-color: ${PALETTE.amber} !important; }
      ::placeholder { color: ${PALETTE.steelDim}; }
    `}</style>
  );
}

/* ---------- Header ---------- */

function Header({ vehicle, onEdit }) {
  return (
    <header
      style={{ borderBottom: `1px solid ${PALETTE.hairline}`, background: PALETTE.surface }}
      className="px-4 py-4"
    >
      <div className="max-w-md mx-auto flex items-center justify-between">
        <div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 12, letterSpacing: "0.12em", color: PALETTE.amber }}>
            CARNET D'ENTRETIEN
          </div>
          <button onClick={onEdit} className="text-left" style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 600, color: PALETTE.text }}>
            {vehicle.name}
          </button>
        </div>
        <div className="text-right">
          <div style={{ fontFamily: FONT_MONO, fontSize: 26, fontWeight: 700, color: PALETTE.text, letterSpacing: "0.02em" }}>
            {fmtKm(vehicle.currentKm)}
          </div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: PALETTE.textMuted, letterSpacing: "0.05em" }}>
            KM AU COMPTEUR
          </div>
        </div>
      </div>
    </header>
  );
}

/* ---------- Dashboard ---------- */

function Dashboard({ vehicle, avgConsumption, maintStatus, fuelCount, maintCount, onGoMaint }) {
  const overdue = maintStatus.filter((m) => m.status === "overdue");
  const soon = maintStatus.filter((m) => m.status === "soon");

  return (
    <div className="space-y-4 mt-2">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Conso. moyenne" value={avgConsumption ? avgConsumption.toFixed(1) : "—"} unit="L/100km" />
        <StatCard label="Pleins enregistrés" value={fuelCount} unit={fuelCount > 1 ? "entrées" : "entrée"} />
      </div>

      {(overdue.length > 0 || soon.length > 0) && (
        <div
          style={{ background: PALETTE.surface, border: `1px solid ${PALETTE.hairline}`, borderRadius: 10 }}
          className="p-4"
        >
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 13, letterSpacing: "0.08em", color: PALETTE.textMuted }} className="mb-3">
            À SURVEILLER
          </div>
          <div className="space-y-2">
            {overdue.map((m) => (
              <AlertRow key={m.id} rule={m} />
            ))}
            {soon.map((m) => (
              <AlertRow key={m.id} rule={m} />
            ))}
          </div>
          <button onClick={onGoMaint} style={{ color: PALETTE.amberSoft, fontFamily: FONT_BODY, fontSize: 13 }} className="mt-3 font-medium">
            Voir l'entretien →
          </button>
        </div>
      )}

      {overdue.length === 0 && soon.length === 0 && maintCount > 0 && (
        <div style={{ background: PALETTE.surface, border: `1px solid ${PALETTE.hairline}`, borderRadius: 10 }} className="p-4 flex items-center gap-3">
          <CheckCircle2 size={20} color={PALETTE.ok} />
          <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: PALETTE.textMuted }}>
            Tout l'entretien est à jour.
          </div>
        </div>
      )}

      {maintCount === 0 && (
        <div style={{ background: PALETTE.surface, border: `1px dashed ${PALETTE.hairline}`, borderRadius: 10 }} className="p-4">
          <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: PALETTE.textMuted }}>
            Aucun entretien enregistré pour l'instant. Ajoute ta dernière vidange ou révision pour démarrer le suivi.
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, unit }) {
  return (
    <div style={{ background: PALETTE.surface, border: `1px solid ${PALETTE.hairline}`, borderRadius: 10 }} className="p-4">
      <div style={{ fontFamily: FONT_MONO, fontSize: 28, fontWeight: 700, color: PALETTE.text }}>{value}</div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: PALETTE.textMuted }}>
        {unit} · {label}
      </div>
    </div>
  );
}

function remainingLabel(rule) {
  // Priorise l'échéance la plus pressante entre km et calendaire
  const kmUrgency = rule.remainingKm != null ? rule.remainingKm : Infinity;
  const dateUrgencyKm = rule.remainingDays != null ? rule.remainingDays : Infinity;
  if (kmUrgency <= dateUrgencyKm && rule.remainingKm != null) {
    return rule.remainingKm <= 0 ? `dépassé de ${fmtKm(-rule.remainingKm)} km` : `dans ${fmtKm(rule.remainingKm)} km`;
  }
  if (rule.remainingDays != null) {
    return rule.remainingDays <= 0 ? `dépassé de ${Math.abs(rule.remainingDays)} j` : `dans ${rule.remainingDays} j`;
  }
  return "";
}

function AlertRow({ rule }) {
  const isOverdue = rule.status === "overdue";
  const color = isOverdue ? PALETTE.danger : PALETTE.yellow;
  const Icon = isOverdue ? AlertTriangle : Clock;
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon size={16} color={color} />
        <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: PALETTE.text }}>{rule.name}</span>
      </div>
      <span style={{ fontFamily: FONT_MONO, fontSize: 13, color }}>{remainingLabel(rule)}</span>
    </div>
  );
}

/* ---------- Fuel tab ---------- */

function FuelTab({ entries, consumption, onAdd, onDelete }) {
  const consByEntry = Object.fromEntries(consumption.map((c) => [c.id, c.value]));
  return (
    <div className="mt-2">
      <SectionHeader title="Pleins de carburant" onAdd={onAdd} addLabel="Ajouter un plein" />
      {entries.length === 0 ? (
        <EmptyState text="Aucun plein enregistré. Ajoute ton premier plein pour suivre la consommation." />
      ) : (
        <div className="space-y-2">
          {entries.map((e) => (
            <Card key={e.id} onDelete={() => onDelete(e.id)}>
              <div className="flex justify-between items-start">
                <div>
                  <div style={{ fontFamily: FONT_MONO, fontSize: 16, color: PALETTE.text }}>{fmtKm(e.km)} km</div>
                  <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: PALETTE.textMuted }}>{fmtDate(e.date)}</div>
                </div>
                <div className="text-right">
                  {e.liters ? (
                    <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: PALETTE.text }}>
                      {e.liters} L{e.price ? ` · ${e.price} €` : ""}
                    </div>
                  ) : (
                    <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: PALETTE.textMuted, fontStyle: "italic" }}>
                      {e.price ? `${e.price} € · litres à compléter` : "Litres à compléter"}
                    </div>
                  )}
                  {consByEntry[e.id] && (
                    <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: PALETTE.amberSoft }}>
                      {consByEntry[e.id].toFixed(1)} L/100km
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Maintenance tab ---------- */

function MaintenanceTab({ statuses, history, onAdd, onDelete }) {
  return (
    <div className="mt-2 space-y-6">
      <div>
        <SectionHeader title="Suivi par intervalle" onAdd={onAdd} addLabel="Entretien effectué" />
        <div className="space-y-2">
          {statuses.map((s) => (
            <div key={s.id} style={{ background: PALETTE.surface, border: `1px solid ${s.status !== "ok" ? (s.status === "overdue" ? PALETTE.danger : PALETTE.yellow) : PALETTE.hairline}`, borderRadius: 10 }} className="p-3">
              <div className="flex justify-between items-center">
                <span style={{ fontFamily: FONT_BODY, fontWeight: 500, fontSize: 14, color: PALETTE.text }}>{s.name}</span>
                <StatusPill status={s.status} />
              </div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: PALETTE.textMuted }} className="mt-1">
                {s.lastKm != null ? `Dernier : ${fmtKm(s.lastKm)} km (${fmtDate(s.lastDate)})` : "Jamais renseigné"}
                {s.nextDueKm != null ? ` · Prochain à ${fmtKm(s.nextDueKm)} km` : ""}
                {s.nextDueDate != null ? ` · avant le ${fmtDate(s.nextDueDate)}` : ""}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 13, letterSpacing: "0.08em", color: PALETTE.textMuted }} className="mb-2">
          HISTORIQUE
        </div>
        {history.length === 0 ? (
          <EmptyState text="Aucune intervention enregistrée." />
        ) : (
          <div className="space-y-2">
            {history.map((m) => (
              <Card key={m.id} onDelete={() => onDelete(m.id)}>
                <div className="flex justify-between items-start">
                  <div>
                    <div style={{ fontFamily: FONT_BODY, fontWeight: 500, fontSize: 14, color: PALETTE.text }}>{m.type}</div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: PALETTE.textMuted }}>{fmtDate(m.date)} · {fmtKm(m.km)} km</div>
                    {m.note && <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: PALETTE.textMuted }} className="mt-1">{m.note}</div>}
                  </div>
                  {m.cost && <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: PALETTE.text }}>{m.cost} €</div>}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    ok: { label: "À jour", color: PALETTE.ok },
    soon: { label: "Bientôt", color: PALETTE.yellow },
    overdue: { label: "Dépassé", color: PALETTE.danger },
  };
  const { label, color } = map[status];
  return (
    <span style={{ fontFamily: FONT_MONO, fontSize: 11, color, border: `1px solid ${color}`, borderRadius: 999, padding: "2px 8px" }}>
      {label}
    </span>
  );
}

/* ---------- Settings tab ---------- */

function SettingsTab({ rules, onAdd, onDelete, apiKeyConfigured }) {
  return (
    <div className="mt-2 space-y-6">
      <div>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 600, color: PALETTE.text }} className="mb-2">
          Saisie par photo / voix
        </div>
        <div style={{ background: PALETTE.surface, border: `1px solid ${PALETTE.hairline}`, borderRadius: 10 }} className="p-4">
          {apiKeyConfigured ? (
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} color={PALETTE.ok} />
              <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: PALETTE.text }}>
                Clé API Gemini configurée — photo et dictée disponibles sur les pleins et entretiens.
              </span>
            </div>
          ) : (
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: PALETTE.textMuted }}>
              Aucune clé API Gemini détectée. Ajoute <code>VITE_GEMINI_API_KEY=ta_clé</code> dans un fichier{" "}
              <code>.env.local</code> à la racine du projet (clé gratuite sur{" "}
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" style={{ color: PALETTE.amberSoft }}>
                aistudio.google.com/apikey
              </a>
              ), puis redémarre <code>npm run dev</code>.
            </div>
          )}
        </div>
      </div>

      <div>
        <SectionHeader title="Types d'entretien suivis" onAdd={onAdd} addLabel="Nouveau type" />
        <div className="space-y-2">
          {rules.map((r) => (
            <Card key={r.id} onDelete={() => onDelete(r.id)}>
              <div className="flex justify-between items-center">
                <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: PALETTE.text }}>{r.name}</span>
                <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: PALETTE.textMuted }}>
                  {[r.intervalKm ? `${fmtKm(r.intervalKm)} km` : null, r.intervalMonths ? `${r.intervalMonths} mois` : null]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Shared UI ---------- */

function SectionHeader({ title, onAdd, addLabel }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 600, color: PALETTE.text }}>{title}</div>
      <button
        onClick={onAdd}
        style={{ background: PALETTE.amber, color: "#1B1A17", fontFamily: FONT_BODY, fontWeight: 600, fontSize: 12, borderRadius: 8 }}
        className="flex items-center gap-1 px-3 py-2"
      >
        <Plus size={14} /> {addLabel}
      </button>
    </div>
  );
}

function Card({ children, onDelete }) {
  return (
    <div style={{ background: PALETTE.surface, border: `1px solid ${PALETTE.hairline}`, borderRadius: 10 }} className="p-3 relative group">
      {children}
      <button
        onClick={onDelete}
        aria-label="Supprimer"
        style={{ color: PALETTE.steelDim }}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div style={{ background: PALETTE.surface, border: `1px dashed ${PALETTE.hairline}`, borderRadius: 10 }} className="p-4">
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: PALETTE.textMuted }}>{text}</div>
    </div>
  );
}

function TabBar({ tab, setTab }) {
  const items = [
    { id: "dashboard", label: "Accueil", icon: Gauge },
    { id: "fuel", label: "Carburant", icon: Fuel },
    { id: "maintenance", label: "Entretien", icon: Wrench },
    { id: "settings", label: "Réglages", icon: Settings },
  ];
  return (
    <nav
      style={{ background: PALETTE.surface, borderTop: `1px solid ${PALETTE.hairline}` }}
      className="fixed bottom-0 left-0 right-0"
    >
      <div className="max-w-md mx-auto grid grid-cols-4">
        {items.map((it) => {
          const active = tab === it.id;
          const Icon = it.icon;
          return (
            <button key={it.id} onClick={() => setTab(it.id)} className="flex flex-col items-center gap-1 py-3">
              <Icon size={20} color={active ? PALETTE.amber : PALETTE.steelDim} />
              <span style={{ fontFamily: FONT_BODY, fontSize: 10, color: active ? PALETTE.amber : PALETTE.steelDim }}>
                {it.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: PALETTE.surfaceRaised, borderRadius: "14px 14px 0 0", maxWidth: 420 }}
        className="w-full sm:rounded-2xl p-5 max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 600, color: PALETTE.text }}>{title}</div>
          <button onClick={onClose} style={{ color: PALETTE.steelDim }}>
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="mb-3">
      <label style={{ fontFamily: FONT_BODY, fontSize: 12, color: PALETTE.textMuted }} className="block mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  background: PALETTE.surface,
  border: `1px solid ${PALETTE.hairline}`,
  borderRadius: 8,
  padding: "10px 12px",
  color: PALETTE.text,
  fontFamily: FONT_BODY,
  fontSize: 14,
};

const submitStyle = {
  width: "100%",
  background: PALETTE.amber,
  color: "#1B1A17",
  fontFamily: FONT_BODY,
  fontWeight: 600,
  fontSize: 14,
  borderRadius: 8,
  padding: "12px",
  marginTop: 8,
};

function AiCaptureBar({ apiKey, onExtract, promptText, disabled }) {
  const [status, setStatus] = useState("idle"); // idle | busy | error
  const [error, setError] = useState("");
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [voiceText, setVoiceText] = useState("");
  const fileRef = useRef(null);

  const runExtraction = async (payload) => {
    if (!apiKey) {
      setError("Clé API Gemini manquante (voir Réglages)");
      setStatus("error");
      return;
    }
    setStatus("busy");
    setError("");
    try {
      const result = await geminiExtract(apiKey, payload);
      onExtract(result);
      setStatus("idle");
      setVoiceOpen(false);
      setVoiceText("");
    } catch (e) {
      setError(e.message || "Échec de l'analyse, réessaie");
      setStatus("error");
    }
  };

  const onFileChange = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    const base64 = await fileToBase64(file);
    runExtraction({ promptText, imageBase64: base64, imageMimeType: file.type });
  };

  const onValidateVoice = () => {
    if (!voiceText.trim()) return;
    runExtraction({ promptText: `${promptText}\n\nTranscription vocale : "${voiceText.trim()}"` });
  };

  return (
    <div className="mb-4">
      <div className="flex gap-2">
        <button
          type="button"
          disabled={disabled || status === "busy"}
          onClick={() => fileRef.current?.click()}
          style={{ ...aiButtonStyle, opacity: status === "busy" ? 0.6 : 1 }}
        >
          <Camera size={14} /> Photo
        </button>
        <button
          type="button"
          disabled={disabled || status === "busy"}
          onClick={() => setVoiceOpen((v) => !v)}
          style={{ ...aiButtonStyle, opacity: status === "busy" ? 0.6 : 1 }}
        >
          <Mic size={14} /> Dicter
        </button>
        {status === "busy" && (
          <span className="flex items-center" style={{ color: PALETTE.amberSoft }}>
            <Loader2 size={16} className="animate-spin" />
          </span>
        )}
      </div>

      {voiceOpen && (
        <div className="mt-2">
          <textarea
            style={{ ...inputStyle, minHeight: 70, resize: "vertical" }}
            placeholder="Appuie sur le micro de ton clavier pour dicter, ex. « plein de 12 litres et demi, 22 euros, 69 100 kilomètres »"
            value={voiceText}
            onChange={(e) => setVoiceText(e.target.value)}
            autoFocus
          />
          <button
            type="button"
            onClick={onValidateVoice}
            disabled={status === "busy" || !voiceText.trim()}
            style={{ ...submitStyle, marginTop: 6, opacity: !voiceText.trim() ? 0.5 : 1 }}
          >
            Analyser
          </button>
        </div>
      )}

      {status === "error" && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: PALETTE.danger }} className="mt-2">
          {error}
        </div>
      )}
      <input type="file" accept="image/*" capture="environment" ref={fileRef} style={{ display: "none" }} onChange={onFileChange} />
    </div>
  );
}

const aiButtonStyle = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  background: PALETTE.surface,
  border: `1px solid ${PALETTE.hairline}`,
  color: PALETTE.amberSoft,
  fontFamily: FONT_BODY,
  fontSize: 12,
  fontWeight: 600,
  borderRadius: 8,
  padding: "8px 12px",
};

function FuelForm({ onSubmit, defaultKm, apiKey }) {
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), km: defaultKm || "", liters: "", price: "" });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!form.km || !form.liters) return;
        onSubmit(form);
      }}
    >
      <AiCaptureBar
        apiKey={apiKey}
        promptText="Analyse cette photo de ticket de caisse ou d'écran de pompe à essence, ou cette transcription vocale d'un plein d'essence moto en français. Réponds uniquement en JSON strict, sans texte autour, avec les clés km (kilométrage au compteur si mentionné/visible, sinon null), liters (nombre de litres, sinon null), price (prix total payé en euros, sinon null)."
        onExtract={(r) => {
          setForm((f) => ({
            ...f,
            km: r.km != null ? String(r.km) : f.km,
            liters: r.liters != null ? String(r.liters) : f.liters,
            price: r.price != null ? String(r.price) : f.price,
          }));
        }}
      />
      <Field label="Date">
        <input style={inputStyle} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
      </Field>
      <Field label="Kilométrage">
        <input style={inputStyle} type="number" placeholder="ex. 12450" value={form.km} onChange={(e) => setForm({ ...form, km: e.target.value })} />
      </Field>
      <Field label="Litres">
        <input style={inputStyle} type="number" step="0.01" placeholder="ex. 14.2" value={form.liters} onChange={(e) => setForm({ ...form, liters: e.target.value })} />
      </Field>
      <Field label="Prix total (€) — optionnel">
        <input style={inputStyle} type="number" step="0.01" placeholder="ex. 22.50" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
      </Field>
      <button type="submit" style={submitStyle}>Enregistrer le plein</button>
    </form>
  );
}

function MaintenanceForm({ onSubmit, defaultKm, rules, apiKey }) {
  const types = rules.map((r) => r.name);
  const pickerTypes = rules.filter((r) => !r.hideFromPicker).map((r) => r.name);
  const knownTypes = [...types, ...EXTRA_KNOWN_TYPES.filter((t) => !types.includes(t))];
  const visibleTypes = [...pickerTypes, ...EXTRA_KNOWN_TYPES.filter((t) => !pickerTypes.includes(t))];
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), km: defaultKm || "", type: pickerTypes[0] || "", note: "", cost: "" });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!form.km || !form.type) return;
        onSubmit(form);
      }}
    >
      <AiCaptureBar
        apiKey={apiKey}
        promptText={`Analyse cette photo (facture d'atelier, écran de compteur) ou cette transcription vocale en français d'une intervention d'entretien moto. Réponds uniquement en JSON strict, sans texte autour, avec les clés km (kilométrage si mentionné/visible, sinon null), type (reprends EXACTEMENT un de ces types si le sens correspond, même reformulé/synonyme : ${knownTypes.join(", ")} — sinon une courte description, sinon null), note (détails complémentaires, sinon null), cost (coût total en euros si mentionné, sinon null).`}
        onExtract={(r) => {
          setForm((f) => ({
            ...f,
            km: r.km != null ? String(r.km) : f.km,
            type: r.type ? normalizeType(r.type, knownTypes) : f.type,
            note: r.note || f.note,
            cost: r.cost != null ? String(r.cost) : f.cost,
          }));
        }}
      />
      <Field label="Type d'entretien">
        <input
          style={inputStyle}
          type="text"
          list="maint-types"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
        />
        <datalist id="maint-types">
          {visibleTypes.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
      </Field>
      <Field label="Date">
        <input style={inputStyle} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
      </Field>
      <Field label="Kilométrage">
        <input style={inputStyle} type="number" placeholder="ex. 12450" value={form.km} onChange={(e) => setForm({ ...form, km: e.target.value })} />
      </Field>
      <Field label="Note — optionnel">
        <input style={inputStyle} type="text" placeholder="ex. huile 10W40, filtre changé" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
      </Field>
      <Field label="Coût (€) — optionnel">
        <input style={inputStyle} type="number" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
      </Field>
      <button type="submit" style={submitStyle}>Enregistrer l'entretien</button>
    </form>
  );
}

function QuickAddModal({ apiKey, rules, defaultKm, onClose, onAddFuel, onAddMaintenance }) {
  const [stage, setStage] = useState("input"); // input | review
  const [text, setText] = useState("");
  const [status, setStatus] = useState("idle"); // idle | busy | error
  const [error, setError] = useState("");
  const [kind, setKind] = useState("fuel");
  const [form, setForm] = useState({});
  const fileRef = useRef(null);

  const ruleNames = rules.map((r) => r.name);
  const pickerRuleNames = rules.filter((r) => !r.hideFromPicker).map((r) => r.name);
  const knownTypes = [...ruleNames, ...EXTRA_KNOWN_TYPES.filter((t) => !ruleNames.includes(t))];
  const visibleTypes = [...pickerRuleNames, ...EXTRA_KNOWN_TYPES.filter((t) => !pickerRuleNames.includes(t))];
  const classifyPrompt = `Tu es un assistant qui classe une dictée ou une photo en français sur le suivi d'une moto (plein d'essence ou entretien). Réponds uniquement en JSON strict, sans texte autour, avec les clés :
kind ("fuel" ou "maintenance" selon le sujet),
km (nombre, kilométrage au compteur si mentionné/visible, sinon null),
liters (nombre, uniquement pertinent si kind="fuel", sinon null),
price (nombre, prix total en euros si mentionné, sinon null),
type (chaîne, uniquement pertinent si kind="maintenance" — reprends EXACTEMENT un de ces types si le sens correspond, même reformulé/synonyme : ${knownTypes.join(", ")} — par exemple "gonflage" ou "vérifier la pression" correspondent à "Pression des pneus" ; sinon une courte description, sinon null),
note (chaîne, détails complémentaires, sinon null),
date (chaîne au format AAAA-MM-JJ si une date est mentionnée, sinon null).
Un plein d'essence évoque des litres ou de l'essence. Un entretien évoque une intervention mécanique (vidange, chaîne, plaquettes, pneus, filtre, bougies, liquide, pression...).`;

  const applyResult = (r) => {
    const detectedKind = r.kind === "maintenance" ? "maintenance" : "fuel";
    setKind(detectedKind);
    setForm({
      date: r.date || new Date().toISOString().slice(0, 10),
      km: r.km != null ? String(r.km) : String(defaultKm || ""),
      liters: r.liters != null ? String(r.liters) : "",
      price: r.price != null ? String(r.price) : "",
      type: r.type ? normalizeType(r.type, knownTypes) : pickerRuleNames[0] || "",
      note: r.note || "",
      cost: r.price != null && detectedKind === "maintenance" ? String(r.price) : "",
    });
    setStage("review");
    setStatus("idle");
  };

  const runExtraction = async (payload) => {
    if (!apiKey) {
      setError("Clé API Gemini manquante (voir Réglages)");
      setStatus("error");
      return;
    }
    setStatus("busy");
    setError("");
    try {
      const result = await geminiExtract(apiKey, payload);
      applyResult(result);
    } catch (e) {
      setError(e.message || "Échec de l'analyse, réessaie");
      setStatus("error");
    }
  };

  const onAnalyzeText = () => {
    if (!text.trim()) return;
    runExtraction({ promptText: `${classifyPrompt}\n\nTranscription : "${text.trim()}"` });
  };

  const onFileChange = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    const base64 = await fileToBase64(file);
    runExtraction({ promptText: classifyPrompt, imageBase64: base64, imageMimeType: file.type });
  };

  const onSave = () => {
    if (!form.km) return;
    if (kind === "fuel") {
      if (!form.liters) return;
      onAddFuel({ date: form.date, km: form.km, liters: form.liters, price: form.price });
    } else {
      if (!form.type) return;
      onAddMaintenance({ date: form.date, km: form.km, type: form.type, note: form.note, cost: form.cost });
    }
    onClose();
  };

  return (
    <Modal title="Dictée rapide" onClose={onClose}>
      {stage === "input" && (
        <div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: PALETTE.textMuted }} className="mb-3">
            Décris ce qui vient de se passer — un plein ou un entretien — je détecte automatiquement lequel.
          </div>
          <textarea
            style={{ ...inputStyle, minHeight: 90, resize: "vertical" }}
            placeholder="Appuie sur le micro de ton clavier, ex. « plein de 12 litres, 22 euros, 69 100 kilomètres » ou « graissage chaîne fait aujourd'hui »"
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={onAnalyzeText}
              disabled={status === "busy" || !text.trim()}
              style={{ ...submitStyle, marginTop: 0, flex: 1, opacity: !text.trim() ? 0.5 : 1 }}
            >
              {status === "busy" ? "Analyse…" : "Analyser"}
            </button>
            <button
              type="button"
              disabled={status === "busy"}
              onClick={() => fileRef.current?.click()}
              style={{ ...aiButtonStyle, padding: "0 16px" }}
            >
              <Camera size={16} />
            </button>
          </div>
          <input type="file" accept="image/*" capture="environment" ref={fileRef} style={{ display: "none" }} onChange={onFileChange} />
          {status === "error" && (
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: PALETTE.danger }} className="mt-2">
              {error}
            </div>
          )}
        </div>
      )}

      {stage === "review" && (
        <div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: PALETTE.textMuted }} className="mb-2">
            J'ai compris :
          </div>
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setKind("fuel")}
              style={{
                flex: 1,
                padding: "8px 10px",
                borderRadius: 8,
                fontFamily: FONT_BODY,
                fontSize: 12,
                fontWeight: 600,
                background: kind === "fuel" ? PALETTE.amber : PALETTE.surface,
                color: kind === "fuel" ? "#1B1A17" : PALETTE.textMuted,
                border: `1px solid ${PALETTE.hairline}`,
              }}
            >
              ⛽ Plein d'essence
            </button>
            <button
              type="button"
              onClick={() => setKind("maintenance")}
              style={{
                flex: 1,
                padding: "8px 10px",
                borderRadius: 8,
                fontFamily: FONT_BODY,
                fontSize: 12,
                fontWeight: 600,
                background: kind === "maintenance" ? PALETTE.amber : PALETTE.surface,
                color: kind === "maintenance" ? "#1B1A17" : PALETTE.textMuted,
                border: `1px solid ${PALETTE.hairline}`,
              }}
            >
              🔧 Entretien
            </button>
          </div>

          <Field label="Date">
            <input style={inputStyle} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </Field>
          <Field label="Kilométrage">
            <input style={inputStyle} type="number" value={form.km} onChange={(e) => setForm({ ...form, km: e.target.value })} />
          </Field>

          {kind === "fuel" ? (
            <>
              <Field label="Litres">
                <input style={inputStyle} type="number" step="0.01" value={form.liters} onChange={(e) => setForm({ ...form, liters: e.target.value })} />
              </Field>
              <Field label="Prix total (€) — optionnel">
                <input style={inputStyle} type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </Field>
            </>
          ) : (
            <>
              <Field label="Type d'entretien">
                <input
                  style={inputStyle}
                  type="text"
                  list="quickadd-maint-types"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                />
                <datalist id="quickadd-maint-types">
                  {visibleTypes.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </Field>
              <Field label="Note — optionnel">
                <input style={inputStyle} type="text" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
              </Field>
              <Field label="Coût (€) — optionnel">
                <input style={inputStyle} type="number" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
              </Field>
            </>
          )}

          <div className="flex gap-2 mt-2">
            <button type="button" onClick={() => setStage("input")} style={{ ...aiButtonStyle, flex: 1, justifyContent: "center" }}>
              Redicter
            </button>
            <button type="button" onClick={onSave} style={{ ...submitStyle, marginTop: 0, flex: 2 }}>
              Enregistrer
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}


function RuleForm({ onSubmit }) {
  const [form, setForm] = useState({ name: "", intervalKm: "", intervalMonths: "" });
  const canSubmit = form.name && (form.intervalKm || form.intervalMonths);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit) return;
        onSubmit({
          name: form.name,
          intervalKm: form.intervalKm ? Number(form.intervalKm) : undefined,
          intervalMonths: form.intervalMonths ? Number(form.intervalMonths) : undefined,
        });
      }}
    >
      <Field label="Nom">
        <input style={inputStyle} type="text" placeholder="ex. Liquide de frein" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </Field>
      <Field label="Intervalle en kilomètres — optionnel">
        <input style={inputStyle} type="number" placeholder="ex. 20000" value={form.intervalKm} onChange={(e) => setForm({ ...form, intervalKm: e.target.value })} />
      </Field>
      <Field label="Intervalle en mois — optionnel">
        <input style={inputStyle} type="number" placeholder="ex. 24" value={form.intervalMonths} onChange={(e) => setForm({ ...form, intervalMonths: e.target.value })} />
      </Field>
      <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: PALETTE.textMuted }} className="mb-2">
        Renseigne au moins un des deux. L'alerte se déclenchera sur celui qui arrive en premier.
      </div>
      <button type="submit" style={submitStyle} disabled={!canSubmit}>Ajouter</button>
    </form>
  );
}

function VehicleForm({ vehicle, onSubmit }) {
  const [form, setForm] = useState({ name: vehicle.name, currentKm: vehicle.currentKm });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ name: form.name, currentKm: Number(form.currentKm) });
      }}
    >
      <Field label="Nom de la moto">
        <input style={inputStyle} type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </Field>
      <Field label="Kilométrage actuel">
        <input style={inputStyle} type="number" value={form.currentKm} onChange={(e) => setForm({ ...form, currentKm: e.target.value })} />
      </Field>
      <button type="submit" style={submitStyle}>Mettre à jour</button>
    </form>
  );
}
