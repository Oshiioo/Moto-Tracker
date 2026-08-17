import { useState } from "react";
import { Trash2 } from "lucide-react";
import ConfirmModal from "../ui/ConfirmModal";
import { PALETTE, FONT_BODY, FONT_MONO } from "../../theme/palette";
import { fmtKm } from "../../lib/format";

export default function GarageRow({ vehicle, active, onSwitch, onDelete, deletable }) {
  const [confirming, setConfirming] = useState(false);
  return (
    <div
      style={{
        background: PALETTE.surface,
        border: `1px solid ${active ? PALETTE.amber : PALETTE.hairline}`,
        borderRadius: 10,
        padding: 12,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "relative",
      }}
    >
      <button onClick={onSwitch} style={{ textAlign: "left", flex: 1, background: "transparent", border: "none" }}>
        <div style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 14, color: PALETTE.text }}>
          {vehicle.name}{" "}
          {active && <span style={{ color: PALETTE.amber, fontSize: 11 }}>· active</span>}
          {vehicle.status === "sold" && <span style={{ color: PALETTE.textMuted, fontSize: 11 }}>· vendue</span>}
          {vehicle.status === "archived" && (
            <span style={{ color: PALETTE.textMuted, fontSize: 11 }}>
              · archivée{vehicle.archiveReason ? ` (${vehicle.archiveReason.toLowerCase()})` : ""}
            </span>
          )}
        </div>
        <div style={{ fontFamily: FONT_MONO, fontSize: 12, color: PALETTE.textMuted, marginTop: 2 }}>
          {vehicle.status === "sold" && vehicle.finalKm != null ? fmtKm(vehicle.finalKm) : fmtKm(vehicle.currentKm)} km
        </div>
      </button>
      {deletable && (
        <button
          onClick={() => setConfirming(true)}
          aria-label={`Supprimer ${vehicle.name}`}
          style={{ color: PALETTE.steelDim, background: "transparent", border: "none", marginLeft: 8, padding: 4 }}
        >
          <Trash2 size={16} />
        </button>
      )}
      {confirming && (
        <ConfirmModal
          message={`Supprimer "${vehicle.name}" et tout son historique ? Cette action est définitive.`}
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
