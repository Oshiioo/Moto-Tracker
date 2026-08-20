import { PALETTE, FONT_BODY, FONT_MONO, cardStyle } from "../../theme/palette";

export default function StatCard({ label, value, unit, tag }) {
  return (
    <div style={{ ...cardStyle(), position: "relative" }}>
      {tag && <div style={{ position: "absolute", top: 12, right: 12 }}>{tag}</div>}
      <div style={{ fontFamily: FONT_MONO, fontSize: 28, fontWeight: 700, color: PALETTE.text }}>{value}</div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: PALETTE.textMuted }}>
        {unit} · {label}
      </div>
    </div>
  );
}
