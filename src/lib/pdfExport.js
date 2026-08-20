import { fmtDate, fmtKm } from "./format";

// Génère le PDF du carnet d'entretien — mise en page neutre/professionnelle
// (indépendante du thème sombre de l'app), pensée pour être remise telle
// quelle à un acheteur.
// jsPDF/autotable sont chargés à la demande (~150 Ko) pour ne pas alourdir
// le bundle initial de l'app pour les utilisateurs qui n'exportent jamais.
export async function buildMaintenancePdf(vehicle, entries) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(20);
  doc.text("Carnet d'entretien", 14, 20);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.setTextColor(60);
  doc.text(vehicle.name, 14, 29);

  const infoLines = [
    `Kilométrage : ${fmtKm(vehicle.currentKm)} km`,
    vehicle.acquisitionDate ? `Possédée depuis le ${fmtDate(vehicle.acquisitionDate)}` : null,
  ].filter(Boolean);
  doc.setFontSize(10);
  doc.setTextColor(110);
  infoLines.forEach((line, i) => doc.text(line, 14, 37 + i * 5));

  doc.setDrawColor(200);
  doc.line(14, 37 + infoLines.length * 5 + 3, pageWidth - 14, 37 + infoLines.length * 5 + 3);

  autoTable(doc, {
    startY: 37 + infoLines.length * 5 + 9,
    head: [["Date", "Kilométrage", "Type d'entretien", "Note", "Coût"]],
    body: entries.map((m) => [fmtDate(m.date), `${fmtKm(m.km)} km`, m.type, m.note || "—", m.cost ? `${m.cost} €` : "—"]),
    headStyles: { fillColor: [35, 35, 35], textColor: 255, fontStyle: "bold" },
    styles: { fontSize: 9, cellPadding: 4, textColor: 40 },
    alternateRowStyles: { fillColor: [246, 246, 246] },
    columnStyles: { 1: { halign: "right" }, 4: { halign: "right" } },
    margin: { left: 14, right: 14 },
    didDrawPage: () => {
      doc.setFontSize(8);
      doc.setTextColor(160);
      doc.text(`Généré via Moto Tracker le ${fmtDate(new Date())}`, 14, pageHeight - 10);
      const page = doc.internal.getNumberOfPages();
      doc.text(String(page), pageWidth - 14, pageHeight - 10, { align: "right" });
    },
  });

  if (entries.length === 0) {
    doc.setFontSize(11);
    doc.setTextColor(140);
    doc.text("Aucune intervention à afficher pour la sélection choisie.", 14, 37 + infoLines.length * 5 + 20);
  }

  return doc;
}

export function pdfFileName(vehicle) {
  const slug = vehicle.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  return `carnet-entretien-${slug || "moto"}.pdf`;
}
