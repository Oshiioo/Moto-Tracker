import { Plus } from "lucide-react";
import { PALETTE, FONT_DISPLAY, FONT_BODY } from "../../theme/palette";

export default function SectionHeader({ title, onAdd, addLabel }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 600, color: PALETTE.text }}>{title}</div>
      <button
        onClick={onAdd}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: PALETTE.primary,
          color: "#FFFFFF",
          fontFamily: FONT_BODY,
          fontWeight: 700,
          fontSize: 13,
          borderRadius: 10,
          padding: "10px 16px",
          boxShadow: `0 2px 10px ${PALETTE.primary}4D`,
        }}
      >
        <Plus size={16} strokeWidth={2.5} /> {addLabel}
      </button>
    </div>
  );
}
