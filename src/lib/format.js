export const uid = () => Math.random().toString(36).slice(2, 10);

export const fmtKm = (n) => new Intl.NumberFormat("fr-FR").format(Math.round(n));

export const fmtDate = (d) =>
  new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

// Durée écoulée entre deux dates, formatée en français (ex. "2 ans et 3 mois", "8 mois", "moins d'un mois")
export const fmtDuration = (fromISO, toISO = new Date().toISOString().slice(0, 10)) => {
  const from = new Date(fromISO);
  const to = new Date(toISO);
  let months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
  if (to.getDate() < from.getDate()) months -= 1;
  if (months <= 0) return "moins d'un mois";
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  if (years === 0) return `${remMonths} mois`;
  const yearPart = `${years} an${years > 1 ? "s" : ""}`;
  return remMonths === 0 ? yearPart : `${yearPart} et ${remMonths} mois`;
};
