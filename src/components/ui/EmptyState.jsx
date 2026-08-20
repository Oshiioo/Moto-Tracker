import { PALETTE, FONT_BODY, cardStyle } from "../../theme/palette";

export default function EmptyState({ text }) {
  return (
    <div style={cardStyle(PALETTE.hairline, true)}>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: PALETTE.textMuted }}>{text}</div>
    </div>
  );
}
