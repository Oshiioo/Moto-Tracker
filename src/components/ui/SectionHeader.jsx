import { Plus } from "lucide-react";
import { PALETTE, FONT_DISPLAY, FONT_BODY } from "../../theme/palette";

export default function SectionHeader({ title, onAdd, addLabel }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 600, color: PALETTE.text }}>{title}</div>
      <button
        onClick={onAdd}
        style={{ background: PALETTE.amber, color: "#1B1A17", fontFamily: FONT_BODY, fontWeight: 600, fontSize: 12, borderRadius: 8 }}
        className="flex items-center gap-1 px-3 py-2"
      >
        <Plus size={14} /> {addLabel}
      </button>
    </div>
  );
}
