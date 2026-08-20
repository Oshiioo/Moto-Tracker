export const PALETTE = {
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

export const FONT_DISPLAY = "'Oswald', sans-serif";
export const FONT_BODY = "'Work Sans', sans-serif";
export const FONT_MONO = "'JetBrains Mono', monospace";

export const statusColor = (status) =>
  status === "overdue" ? PALETTE.danger : status === "soon" ? PALETTE.yellow : PALETTE.ok;

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
  background: PALETTE.amber,
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
  color: PALETTE.amberSoft,
  fontFamily: FONT_BODY,
  fontSize: 12,
  fontWeight: 600,
  borderRadius: 8,
  padding: "8px 12px",
};
