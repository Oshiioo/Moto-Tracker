import { useState, useEffect } from "react";
import { Camera, X } from "lucide-react";
import Field from "../ui/Field";
import VehicleAvatar from "./VehicleAvatar";
import { PALETTE, FONT_BODY, inputStyle, submitStyle, cardStyle } from "../../theme/palette";
import { fmtKm, fmtDuration } from "../../lib/format";
import { resizeImageToSquare } from "../../lib/image";

export default function VehicleEditor({ vehicle, onUpdate }) {
  const [name, setName] = useState(vehicle.name);
  const [photo, setPhoto] = useState(vehicle.photo || null);
  const [photoError, setPhotoError] = useState("");
  const [brand, setBrand] = useState(vehicle.brand || "");
  const [model, setModel] = useState(vehicle.model || "");
  const [year, setYear] = useState(vehicle.year || "");
  const [km, setKm] = useState(String(vehicle.currentKm));
  const [status, setStatus] = useState(vehicle.status || "active");
  const [acquisitionKm, setAcquisitionKm] = useState(String(vehicle.acquisitionKm || 0));
  const [acquisitionDate, setAcquisitionDate] = useState(vehicle.acquisitionDate || "");
  const [nextInspectionDate, setNextInspectionDate] = useState(vehicle.nextInspectionDate || "");
  const [saleDate, setSaleDate] = useState(vehicle.saleDate || new Date().toISOString().slice(0, 10));
  const [finalKm, setFinalKm] = useState(String(vehicle.finalKm ?? vehicle.currentKm));
  const [archiveReason, setArchiveReason] = useState(vehicle.archiveReason || "Accidentée");
  const [archiveDate, setArchiveDate] = useState(vehicle.archiveDate || new Date().toISOString().slice(0, 10));
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(vehicle.name);
    setPhoto(vehicle.photo || null);
    setBrand(vehicle.brand || "");
    setModel(vehicle.model || "");
    setYear(vehicle.year || "");
    setKm(String(vehicle.currentKm));
    setStatus(vehicle.status || "active");
    setAcquisitionKm(String(vehicle.acquisitionKm || 0));
    setAcquisitionDate(vehicle.acquisitionDate || "");
    setNextInspectionDate(vehicle.nextInspectionDate || "");
    setSaleDate(vehicle.saleDate || new Date().toISOString().slice(0, 10));
    setFinalKm(String(vehicle.finalKm ?? vehicle.currentKm));
    setArchiveReason(vehicle.archiveReason || "Accidentée");
    setArchiveDate(vehicle.archiveDate || new Date().toISOString().slice(0, 10));
  }, [vehicle.name, vehicle.photo, vehicle.brand, vehicle.model, vehicle.year, vehicle.currentKm, vehicle.status, vehicle.acquisitionKm, vehicle.acquisitionDate, vehicle.nextInspectionDate, vehicle.saleDate, vehicle.finalKm, vehicle.archiveReason, vehicle.archiveDate]);

  const dirty =
    name !== vehicle.name ||
    photo !== (vehicle.photo || null) ||
    brand !== (vehicle.brand || "") ||
    model !== (vehicle.model || "") ||
    year !== (vehicle.year || "") ||
    Number(km) !== vehicle.currentKm ||
    status !== (vehicle.status || "active") ||
    Number(acquisitionKm) !== (vehicle.acquisitionKm || 0) ||
    acquisitionDate !== (vehicle.acquisitionDate || "") ||
    nextInspectionDate !== (vehicle.nextInspectionDate || "") ||
    (status === "sold" && (saleDate !== vehicle.saleDate || Number(finalKm) !== vehicle.finalKm)) ||
    (status === "archived" && (archiveReason !== vehicle.archiveReason || archiveDate !== vehicle.archiveDate || Number(finalKm) !== vehicle.finalKm));

  const endKm = status === "sold" || status === "archived" ? Number(finalKm) : vehicle.currentKm;
  const kmSinceAcquisition = Math.max(0, endKm - Number(acquisitionKm || 0));
  const ownershipEndDate = status === "sold" ? saleDate : status === "archived" ? archiveDate : undefined;

  return (
    <div style={{ ...cardStyle(), height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      <div>
        <div className="flex items-center gap-3 mb-4">
          <VehicleAvatar photo={photo} name={name} size={56} />
          <div>
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                cursor: "pointer",
                fontFamily: FONT_BODY,
                fontSize: 12,
                fontWeight: 600,
                color: PALETTE.primarySoft,
              }}
            >
              <Camera size={14} />
              {photo ? "Changer la photo" : "Ajouter une photo"}
              <input
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  e.target.value = "";
                  if (!file) return;
                  setPhotoError("");
                  try {
                    setPhoto(await resizeImageToSquare(file));
                  } catch {
                    setPhotoError("Impossible de lire cette image, réessaie avec une autre.");
                  }
                }}
              />
            </label>
            {photo && (
              <button
                type="button"
                onClick={() => setPhoto(null)}
                className="flex items-center gap-1"
                style={{ fontFamily: FONT_BODY, fontSize: 12, color: PALETTE.textMuted, marginTop: 4 }}
              >
                <X size={12} /> Retirer
              </button>
            )}
            {photoError && (
              <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: PALETTE.danger, marginTop: 4 }}>{photoError}</div>
            )}
          </div>
        </div>
        <Field label="Nom de la moto">
          <input style={inputStyle} type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: PALETTE.textMuted }} className="mb-2">
          Marque, modèle, année — optionnel
        </div>
        <div className="flex gap-2 mb-3">
          <input style={{ ...inputStyle, flex: 1 }} type="text" placeholder="Marque" value={brand} onChange={(e) => setBrand(e.target.value)} />
          <input style={{ ...inputStyle, flex: 1 }} type="text" placeholder="Modèle" value={model} onChange={(e) => setModel(e.target.value)} />
          <input style={{ ...inputStyle, width: 90 }} type="text" placeholder="Année" value={year} onChange={(e) => setYear(e.target.value)} />
        </div>
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
        <Field label="Prochain contrôle technique — optionnel">
          <input style={inputStyle} type="date" value={nextInspectionDate} onChange={(e) => setNextInspectionDate(e.target.value)} />
        </Field>
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
      </div>
      <button
        disabled={!dirty}
        onClick={() => {
          onUpdate({
            name,
            photo,
            brand: brand || null,
            model: model || null,
            year: year || null,
            currentKm: Number(km),
            status,
            acquisitionKm: Number(acquisitionKm),
            acquisitionDate: acquisitionDate || null,
            nextInspectionDate: nextInspectionDate || null,
            ...(status === "sold" ? { saleDate, finalKm: Number(finalKm) } : { saleDate: null }),
            ...(status === "archived" ? { archiveReason, archiveDate, finalKm: Number(finalKm) } : { archiveReason: null, archiveDate: null }),
            ...(status === "active" ? { finalKm: null } : {}),
          });
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        }}
        style={{ ...submitStyle, marginTop: 4, opacity: dirty ? 1 : 0.5, animation: saved ? "savedPop 300ms ease" : "none" }}
      >
        {saved ? "Enregistré ✓" : "Mettre à jour"}
      </button>
    </div>
  );
}
