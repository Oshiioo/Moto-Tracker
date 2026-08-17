import Modal from "./Modal";
import { PALETTE, FONT_BODY } from "../../theme/palette";

export default function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <Modal title="Confirmer la suppression" onClose={onCancel}>
      <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: PALETTE.text, marginBottom: 20 }}>{message}</div>
      <div className="flex gap-2">
        <button
          onClick={onCancel}
          style={{
            flex: 1,
            background: PALETTE.surface,
            border: `1px solid ${PALETTE.hairline}`,
            color: PALETTE.text,
            fontFamily: FONT_BODY,
            fontWeight: 600,
            fontSize: 14,
            borderRadius: 8,
            padding: "12px",
          }}
        >
          Annuler
        </button>
        <button
          onClick={onConfirm}
          style={{
            flex: 1,
            background: PALETTE.danger,
            color: "#fff",
            fontFamily: FONT_BODY,
            fontWeight: 600,
            fontSize: 14,
            borderRadius: 8,
            padding: "12px",
          }}
        >
          Supprimer
        </button>
      </div>
    </Modal>
  );
}
