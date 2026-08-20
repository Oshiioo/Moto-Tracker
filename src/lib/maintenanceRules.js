import { uid } from "./format";

// Préconisations constructeur Honda CB500F 2016, alignées sur les libellés
// utilisés dans l'historique importé depuis LibertyRider
export const DEFAULT_RULES = [
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
export const IMPORTED_MAINTENANCE = [
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

// Utilisé comme donnée de secours uniquement lors de la toute première migration
// (compte sans aucune moto encore créée) — jamais comme modèle pour une nouvelle moto.
export const DEFAULT_DATA = {
  vehicle: { name: "CB500F 2016", currentKm: 68984, status: "active", acquisitionKm: 51140 },
  fuel: [{ id: "fuel-1", date: "2026-07-26", km: 68842, price: 23.42 }],
  maintenance: IMPORTED_MAINTENANCE,
  rules: DEFAULT_RULES,
};

export function migrateData(loaded) {
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
  if (next.vehicle.status === undefined || next.vehicle.acquisitionKm === undefined) {
    const isCB500F = next.vehicle.name === "CB500F 2016";
    next = {
      ...next,
      vehicle: {
        ...next.vehicle,
        status: next.vehicle.status ?? "active",
        acquisitionKm: next.vehicle.acquisitionKm ?? (isCB500F ? 51140 : 0),
      },
    };
  }
  if (next.vehicle.acquisitionDate === undefined) {
    next = { ...next, vehicle: { ...next.vehicle, acquisitionDate: null } };
  }
  return next;
}

// Pourcentage (0 à 1+) de l'intervalle déjà consommé pour une règle donnée
export function ruleProgress(rule) {
  if (rule.intervalKm && rule.remainingKm != null) {
    return (rule.intervalKm - rule.remainingKm) / rule.intervalKm;
  }
  if (rule.intervalMonths && rule.remainingDays != null) {
    const totalDays = rule.intervalMonths * 30;
    return (totalDays - rule.remainingDays) / totalDays;
  }
  return 0;
}
