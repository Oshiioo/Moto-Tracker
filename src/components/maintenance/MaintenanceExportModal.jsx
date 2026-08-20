import { useState } from "react";
import { Download, Share2, Printer, Loader2 } from "lucide-react";
import Modal from "../ui/Modal";
import { PALETTE, FONT_BODY, submitStyle, aiButtonStyle } from "../../theme/palette";
import { buildMaintenancePdf, pdfFileName } from "../../lib/pdfExport";

export default function MaintenanceExportModal({ vehicle, history, onClose }) {
  const allTypes = [...new Set(history.map((m) => m.type))].sort();
  const [selected, setSelected] = useState(() => new Set(allTypes));
  const [busy, setBusy] = useState(false);

  const toggleType = (t) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  };

  const selectedEntries = history.filter((m) => selected.has(m.type)).sort((a, b) => a.km - b.km);
  const canShareFiles = typeof navigator !== "undefined" && !!navigator.canShare && !!navigator.share;

  const withBusy = (fn) => async () => {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  const handleDownload = withBusy(async () => {
    const doc = await buildMaintenancePdf(vehicle, selectedEntries);
    doc.save(pdfFileName(vehicle));
  });

  const handleOpen = withBusy(async () => {
    const doc = await buildMaintenancePdf(vehicle, selectedEntries);
    doc.output("dataurlnewwindow");
  });

  const handleShare = withBusy(async () => {
    const doc = await buildMaintenancePdf(vehicle, selectedEntries);
    const blob = doc.output("blob");
    const file = new File([blob], pdfFileName(vehicle), { type: "application/pdf" });
    if (!navigator.canShare({ files: [file] })) return;
    try {
      await navigator.share({ files: [file], title: `Carnet d'entretien — ${vehicle.name}` });
    } catch {
      /* partage annulé par l'utilisateur, rien à faire */
    }
  });

  return (
    <Modal title="Exporter le carnet d'entretien" onClose={onClose}>
      <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: PALETTE.textMuted }} className="mb-3">
        Choisis les types d'entretien à inclure dans le PDF, prêt à envoyer ou remettre à un acheteur.
      </div>

      {allTypes.length === 0 ? (
        <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: PALETTE.textMuted }} className="mb-4">
          Aucun entretien enregistré pour cette moto.
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-2">
            <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: PALETTE.textMuted }}>
              {selectedEntries.length} entretien{selectedEntries.length > 1 ? "s" : ""} sélectionné{selectedEntries.length > 1 ? "s" : ""}
            </span>
            <button
              type="button"
              onClick={() => setSelected(selected.size === allTypes.length ? new Set() : new Set(allTypes))}
              style={{ fontFamily: FONT_BODY, fontSize: 12, color: PALETTE.primarySoft, fontWeight: 600 }}
            >
              {selected.size === allTypes.length ? "Tout désélectionner" : "Tout sélectionner"}
            </button>
          </div>

          <div className="space-y-1 mb-4" style={{ maxHeight: 200, overflowY: "auto" }}>
            {allTypes.map((t) => (
              <label key={t} className="flex items-center gap-2" style={{ padding: "6px 0" }}>
                <input type="checkbox" checked={selected.has(t)} onChange={() => toggleType(t)} />
                <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: PALETTE.text }}>{t}</span>
              </label>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={selectedEntries.length === 0 || busy}
              style={{ ...submitStyle, marginTop: 0, flex: 1, opacity: selectedEntries.length === 0 || busy ? 0.5 : 1 }}
              className="flex items-center justify-center gap-2"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} Télécharger
            </button>
            {canShareFiles && (
              <button
                type="button"
                onClick={handleShare}
                disabled={selectedEntries.length === 0 || busy}
                style={{ ...aiButtonStyle, padding: "0 16px", opacity: selectedEntries.length === 0 || busy ? 0.5 : 1 }}
              >
                <Share2 size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={handleOpen}
              disabled={selectedEntries.length === 0 || busy}
              style={{ ...aiButtonStyle, padding: "0 16px", opacity: selectedEntries.length === 0 || busy ? 0.5 : 1 }}
            >
              <Printer size={16} />
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
