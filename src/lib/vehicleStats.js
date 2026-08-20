import { monthsBetween } from "./format";

function computeConsumption(data) {
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
}

function computeAvgConsumption(consumption) {
  if (consumption.length === 0) return null;
  const recent = consumption.slice(-5);
  return recent.reduce((s, c) => s + c.value, 0) / recent.length;
}

function computeOwnership(data) {
  const totalCost = data.fuel.reduce((s, f) => s + (Number(f.price) || 0), 0) + data.maintenance.reduce((s, m) => s + (Number(m.cost) || 0), 0);
  // Le coût ne couvre que ce qui a été saisi dans l'app : on rapporte le
  // total aux km/mois écoulés depuis la 1ère saisie, pas depuis l'achat,
  // sinon le coût/km et coût/mois sont sous-évalués si le suivi a démarré
  // après l'achat de la moto.
  const entries = [...data.fuel, ...data.maintenance].filter((e) => e.date);
  if (entries.length === 0) {
    return { totalCost, costPerKm: null, costPerMonth: null, trackedSince: null };
  }
  const earliest = entries.reduce((a, b) => (new Date(b.date) < new Date(a.date) ? b : a));
  const kmTracked = Math.max(0, data.vehicle.currentKm - (earliest.km ?? 0));
  const months = monthsBetween(earliest.date);
  return {
    totalCost,
    costPerKm: kmTracked > 0 ? totalCost / kmTracked : null,
    costPerMonth: months > 0 ? totalCost / months : null,
    trackedSince: earliest.date,
  };
}

function computeMaintStatus(data) {
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
}

export function computeVehicleStats(data) {
  if (!data) return { consumption: [], avgConsumption: null, ownership: null, maintStatus: [] };
  const consumption = computeConsumption(data);
  return {
    consumption,
    avgConsumption: computeAvgConsumption(consumption),
    ownership: computeOwnership(data),
    maintStatus: computeMaintStatus(data),
  };
}
