import { X } from "lucide-react";
import { PALETTE, FONT_DISPLAY } from "../../theme/palette";

export default function Modal({ title, onClose, children }) {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        background: "rgba(0,0,0,0.7)",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: PALETTE.surfaceRaised,
          borderRadius: 16,
          maxWidth: 420,
          width: "100%",
          padding: 20,
          maxHeight: "85dvh",
          overflowY: "auto",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 600, color: PALETTE.text }}>{title}</div>
          <button onClick={onClose} style={{ color: PALETTE.steelDim }}>
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
