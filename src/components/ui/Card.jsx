import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import ConfirmModal from "./ConfirmModal";
import { PALETTE, cardStyle } from "../../theme/palette";

export default function Card({ children, onEdit, onDelete, confirmLabel = "cette entrée" }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <div style={{ ...cardStyle(), paddingRight: onEdit ? 68 : 40 }} className="relative">
      {children}
      <div className="absolute top-4 right-4 flex items-center gap-3">
        {onEdit && (
          <button onClick={onEdit} aria-label="Modifier" style={{ color: PALETTE.steelDim }}>
            <Pencil size={14} />
          </button>
        )}
        <button onClick={() => setConfirming(true)} aria-label="Supprimer" style={{ color: PALETTE.steelDim }}>
          <Trash2 size={14} />
        </button>
      </div>
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
