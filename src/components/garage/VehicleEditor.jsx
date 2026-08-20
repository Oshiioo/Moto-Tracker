import { useState, useEffect } from "react";
import Field from "../ui/Field";
import { PALETTE, FONT_BODY, inputStyle, submitStyle } from "../../theme/palette";
import { fmtKm, fmtDuration } from "../../lib/format";

export default function VehicleEditor({ vehicle, onUpdate }) {
  const [name, setName] = useState(vehicle.name);
  const [km, setKm] = useState(String(vehicle.currentKm));
  const [status, setStatus] = useState(vehicle.status || "active");
  const [acquisitionKm, setAcquisitionKm] = useState(String(vehicle.acquisitionKm || 0));
  const [acquisitionDate, setAcquisitionDate] = useState(vehicle.acquisitionDate || "");
  const [saleDate, setSaleDate] = useState(vehicle.saleDate || new Date().toISOString().slice(0, 10));
  const [finalKm, setFinalKm] = useState(String(vehicle.finalKm ?? vehicle.currentKm));
  const [archiveReason, setArchiveReason] = useState(vehicle.archiveReason || "Accidentée");
  const [archiveDate, setArchiveDate] = useState(vehicle.archiveDate || new Date().toISOString().slice(0, 10));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(vehicle.name);
    setKm(String(vehicle.currentKm));
    setStatus(vehicle.status || "active");
    setAcquisitionKm(String(vehicle.acquisitionKm || 0));
    setAcquisitionDate(vehicle.acquisitionDate || "");
    setSaleDate(vehicle.saleDate || new Date().toISOString().slice(0, 10));
    setFinalKm(String(vehicle.finalKm ?? vehicle.currentKm));
    setArchiveReason(vehicle.archiveReason || "Accidentée");
    setArchiveDate(vehicle.archiveDate || new Date().toISOString().slice(0, 10));
  }, [vehicle.name, vehicle.currentKm, vehicle.status, vehicle.acquisitionKm, vehicle.acquisitionDate, vehicle.saleDate, vehicle.finalKm, vehicle.archiveReason, vehicle.archiveDate]);

  const dirty =
    name !== vehicle.name ||
    Number(km) !== vehicle.currentKm ||
    status !== (vehicle.status || "active") ||
    Number(acquisitionKm) !== (vehicle.acquisitionKm || 0) ||
    acquisitionDate !== (vehicle.acquisitionDate || "") ||
    (status === "sold" && (saleDate !== vehicle.saleDate || Number(finalKm) !== vehicle.finalKm)) ||
    (status === "archived" && (archiveReason !== vehicle.archiveReason || archiveDate !== vehicle.archiveDate || Number(finalKm) !== vehicle.finalKm));

  const endKm = status === "sold" || status === "archived" ? Number(finalKm) : vehicle.currentKm;
  const kmSinceAcquisition = Math.max(0, endKm - Number(acquisitionKm || 0));
  const ownershipEndDate = status === "sold" ? saleDate : status === "archived" ? archiveDate : undefined;

  return (
    <div style={{ background: PALETTE.surface, border: `1px solid ${PALETTE.hairline}`, borderRadius: 10 }} className="p-4">
      <Field label="Nom de la moto">
        <input style={inputStyle} type="text" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>
      <Field label="Kilométrage actuel">
        <input style={inputStyle} type="number" value={km} onChange={(e) => setKm(e.target.value)} />
      </Field>
      <Field label="Kilométrage d'acquisition — pour calculer les km réellement parcourus">
        <input style={inputStyle} type="number" value={acquisitionKm} onChange={(e) => setAcquisitionKm(e.target.value)} />
      </Field>
      <Field label="Date d'achat">
        <input style={inputStyle} type="date" value={acquisitionDate} onChange={(e) => setAcquisitionDate(e.target.value)} />
      </Field>
      {acquisitionDate && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: PALETTE.textMuted }} className="mb-3">
          {status === "active" ? "Possédée depuis" : "Possédée pendant"} {fmtDuration(acquisitionDate, ownershipEndDate)} · {fmtKm(kmSinceAcquisition)} km parcourus
        </div>
      )}
      <Field label="Statut">
        <select style={inputStyle} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="active">Active</option>
          <option value="sold">Vendue</option>
          <option value="archived">Archivée</option>
        </select>
      </Field>
      {status === "sold" && (
        <>
          <Field label="Date de vente">
            <input style={inputStyle} type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} />
          </Field>
          <Field label="Kilométrage final">
            <input style={inputStyle} type="number" value={finalKm} onChange={(e) => setFinalKm(e.target.value)} />
          </Field>
        </>
      )}
      {status === "archived" && (
        <>
          <Field label="Raison">
            <select style={inputStyle} value={archiveReason} onChange={(e) => setArchiveReason(e.target.value)}>
              <option value="Accidentée">Accidentée</option>
              <option value="Volée">Volée</option>
              <option value="Autre">Autre</option>
            </select>
          </Field>
          <Field label="Date">
            <input style={inputStyle} type="date" value={archiveDate} onChange={(e) => setArchiveDate(e.target.value)} />
          </Field>
          <Field label="Kilométrage au moment des faits">
            <input style={inputStyle} type="number" value={finalKm} onChange={(e) => setFinalKm(e.target.value)} />
          </Field>
        </>
      )}
      <button
        disabled={!dirty}
        onClick={() => {
          onUpdate({
            name,
            currentKm: Number(km),
            status,
            acquisitionKm: Number(acquisitionKm),
            acquisitionDate: acquisitionDate || null,
            ...(status === "sold" ? { saleDate, finalKm: Number(finalKm) } : { saleDate: null }),
            ...(status === "archived" ? { archiveReason, archiveDate, finalKm: Number(finalKm) } : { archiveReason: null, archiveDate: null }),
            ...(status === "active" ? { finalKm: null } : {}),
          });
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        }}
        style={{ ...submitStyle, marginTop: 4, opacity: dirty ? 1 : 0.5 }}
      >
        {saved ? "Enregistré ✓" : "Mettre à jour"}
      </button>
    </div>
  );
}
