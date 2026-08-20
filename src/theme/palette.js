// Charte "Éclat" — claire et énergique (violet + touches vives), choisie
// parmi 3 pistes proposées pour remplacer l'ancienne palette sombre jugée
// trop austère (tons terreux marron/olive sur fond quasi noir).
export const PALETTE = {
  bg: "#FAF9FF",
  surface: "#FFFFFF",
  surfaceRaised: "#F3F1FC",
  steel: "#8B84A6",
  steelDim: "#B6AFC9",
  primary: "#7C5CFC",
  primarySoft: "#6D4FD1",
  warning: "#9C6B0A",
  danger: "#EF4B6E",
  ok: "#14B87A",
  text: "#211A38",
  textMuted: "#7A7290",
  hairline: "#E4E0F5",
};

export const FONT_DISPLAY = "'Oswald', sans-serif";
export const FONT_BODY = "'Work Sans', sans-serif";
export const FONT_MONO = "'JetBrains Mono', monospace";

export const statusColor = (status) =>
  status === "overdue" ? PALETTE.danger : status === "soon" ? PALETTE.warning : PALETTE.ok;

// Palette catégorielle pour distinguer plusieurs motos (dashboard multi-motos).
// 3 teintes distinctes du reste de la palette (pas de rouge/jaune/vert, déjà
// pris par statusColor). Assignation par index sur les ids triés (pas de hash)
// pour garantir des couleurs différentes tant qu'il y a 2-3 motos actives.
export const VEHICLE_COLORS = ["#3987e5", "#d95926", "#199e70"];

export const vehicleColorMap = (vehicles) => {
  const sortedIds = [...vehicles].map((v) => v.id).sort();
  const map = {};
  sortedIds.forEach((id, i) => {
    map[id] = VEHICLE_COLORS[i % VEHICLE_COLORS.length];
  });
  return map;
};

// Style de carte standard — remplace les triplets background/border/borderRadius
// et le padding (p-2/p-3/p-4 incohérents) répétés dans chaque composant.
export const cardStyle = (borderColor = PALETTE.hairline, dashed = false) => ({
  background: PALETTE.surface,
  border: `1px ${dashed ? "dashed" : "solid"} ${borderColor}`,
  borderRadius: 10,
  padding: 16,
});

// Petit label de section en majuscules (ex. "CONSOMMATION", "HISTORIQUE")
export const sectionLabelStyle = {
  fontFamily: FONT_DISPLAY,
  fontSize: 13,
  letterSpacing: "0.08em",
  color: PALETTE.textMuted,
};

export const inputStyle = {
  width: "100%",
  background: PALETTE.surface,
  border: `1px solid ${PALETTE.hairline}`,
  borderRadius: 8,
  padding: "10px 12px",
  color: PALETTE.text,
  fontFamily: FONT_BODY,
  fontSize: 14,
};

export const submitStyle = {
  width: "100%",
  background: PALETTE.primary,
  color: "#1B1A17",
  fontFamily: FONT_BODY,
  fontWeight: 600,
  fontSize: 14,
  borderRadius: 8,
  padding: "12px",
  marginTop: 8,
};

export const aiButtonStyle = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  background: PALETTE.surface,
  border: `1px solid ${PALETTE.hairline}`,
  color: PALETTE.primarySoft,
  fontFamily: FONT_BODY,
  fontSize: 12,
  fontWeight: 600,
  borderRadius: 8,
  padding: "8px 12px",
};
