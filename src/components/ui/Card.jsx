import { useState } from "react";
import { Trash2 } from "lucide-react";
import ConfirmModal from "./ConfirmModal";
import { PALETTE } from "../../theme/palette";

export default function Card({ children, onDelete, confirmLabel = "cette entrée" }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <div style={{ background: PALETTE.surface, border: `1px solid ${PALETTE.hairline}`, borderRadius: 10 }} className="p-3 relative group">
      {children}
      <button
        onClick={() => setConfirming(true)}
        aria-label="Supprimer"
        style={{ color: PALETTE.steelDim }}
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 size={14} />
      </button>
      {confirming && (
        <ConfirmModal
          message={`Supprimer ${confirmLabel} ? Cette action est définitive.`}
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            setConfirming(false);
            onDelete();
          }}
        />
      )}
    </div>
  );
}
