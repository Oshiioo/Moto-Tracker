import { PALETTE, FONT_BODY, FONT_MONO, cardStyle } from "../../theme/palette";

export default function StatCard({ label, value, unit }) {
  return (
    <div style={cardStyle()}>
      <div style={{ fontFamily: FONT_MONO, fontSize: 28, fontWeight: 700, color: PALETTE.text }}>{value}</div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: PALETTE.textMuted }}>
        {unit} · {label}
      </div>
    </div>
  );
}
