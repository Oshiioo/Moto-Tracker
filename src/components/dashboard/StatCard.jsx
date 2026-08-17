import { PALETTE, FONT_BODY, FONT_MONO } from "../../theme/palette";

export default function StatCard({ label, value, unit }) {
  return (
    <div style={{ background: PALETTE.surface, border: `1px solid ${PALETTE.hairline}`, borderRadius: 10 }} className="p-4">
      <div style={{ fontFamily: FONT_MONO, fontSize: 28, fontWeight: 700, color: PALETTE.text }}>{value}</div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: PALETTE.textMuted }}>
        {unit} · {label}
      </div>
    </div>
  );
}
