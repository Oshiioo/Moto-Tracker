import { PALETTE, FONT_BODY } from "../../theme/palette";

export default function EmptyState({ text }) {
  return (
    <div style={{ background: PALETTE.surface, border: `1px dashed ${PALETTE.hairline}`, borderRadius: 10 }} className="p-4">
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: PALETTE.textMuted }}>{text}</div>
    </div>
  );
}
