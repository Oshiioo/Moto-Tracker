export const uid = () => Math.random().toString(36).slice(2, 10);

export const fmtKm = (n) => new Intl.NumberFormat("fr-FR").format(Math.round(n));

export const fmtDate = (d) =>
  new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
