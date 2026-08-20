import { useState } from "react";
import { X } from "lucide-react";
import { PALETTE, FONT_DISPLAY } from "../../theme/palette";

const CLOSE_DURATION = 180;

export default function Modal({ title, onClose, children }) {
  const [closing, setClosing] = useState(false);

  const requestClose = () => {
    setClosing(true);
    setTimeout(onClose, CLOSE_DURATION);
  };

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
        opacity: closing ? 0 : 1,
        transition: `opacity ${CLOSE_DURATION}ms ease`,
        animation: "modalBackdropIn 180ms ease",
      }}
      onClick={requestClose}
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
          opacity: closing ? 0 : 1,
          transform: closing ? "translateY(12px) scale(0.98)" : "translateY(0) scale(1)",
          transition: `opacity ${CLOSE_DURATION}ms ease, transform ${CLOSE_DURATION}ms ease`,
          animation: "modalPanelIn 200ms cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 18, fontWeight: 600, color: PALETTE.text }}>{title}</div>
          <button onClick={requestClose} style={{ color: PALETTE.steelDim }}>
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
