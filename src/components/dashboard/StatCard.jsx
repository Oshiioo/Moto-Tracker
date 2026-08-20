import { PALETTE, FONT_BODY, FONT_MONO, cardStyle } from "../../theme/palette";

export default function StatCard({ label, value, unit, tag }) {
  return (
    <div style={{ ...cardStyle(), position: "relative" }}>
      {tag && (
        <div style={{ position: "absolute", top: 12, right: 12, display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: tag.color, flexShrink: 0 }} />
          <span style={{ fontFamily: FONT_BODY, fontSize: 10, fontWeight: 600, color: PALETTE.textMuted }}>{tag.name}</span>
        </div>
      )}
      <div style={{ fontFamily: FONT_MONO, fontSize: 28, fontWeight: 700, color: PALETTE.text }}>{value}</div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: PALETTE.textMuted }}>
        {unit} · {label}
      </div>
    </div>
  );
}
