import { useState } from "react";
import { Trash2 } from "lucide-react";
import ConfirmModal from "./ConfirmModal";
import { PALETTE, cardStyle } from "../../theme/palette";

export default function Card({ children, onDelete, confirmLabel = "cette entrée" }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <div style={{ ...cardStyle(), paddingRight: 40 }} className="relative">
      {children}
      <button
        onClick={() => setConfirming(true)}
        aria-label="Supprimer"
        style={{ color: PALETTE.steelDim }}
        className="absolute top-4 right-4"
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
