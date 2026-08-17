import { CheckCircle2, LogOut } from "lucide-react";
import SectionHeader from "../ui/SectionHeader";
import Card from "../ui/Card";
import GarageRow from "../garage/GarageRow";
import VehicleEditor from "../garage/VehicleEditor";
import { PALETTE, FONT_DISPLAY, FONT_BODY, FONT_MONO } from "../../theme/palette";
import { fmtKm } from "../../lib/format";

export default function SettingsTab({
  vehicle,
  onUpdateVehicle,
  vehicles,
  activeVehicleId,
  onSwitchVehicle,
  onRequestAddVehicle,
  onDeleteVehicle,
  rules,
  onAddRule,
  onDeleteRule,
  apiKeyConfigured,
  userEmail,
  onSignOut,
}) {
  return (
    <div className="mt-2 space-y-6">
      <div>
        <SectionHeader title="Mon garage" onAdd={onRequestAddVehicle} addLabel="Ajouter une moto" />
        <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: PALETTE.textMuted }} className="mb-2">
          Connecté en tant que {userEmail}
        </div>
        <div className="space-y-2">
          {vehicles.map((v) => (
            <GarageRow
              key={v.id}
              vehicle={v}
              active={v.id === activeVehicleId}
              onSwitch={() => onSwitchVehicle(v.id)}
              onDelete={() => onDeleteVehicle(v.id)}
              deletable={vehicles.length > 1}
            />
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 600, color: PALETTE.text }} className="mb-2">
          Ma moto
        </div>
        <VehicleEditor vehicle={vehicle} onUpdate={onUpdateVehicle} />
      </div>

      <div>
        <SectionHeader title="Intervalles d'entretien" onAdd={onAddRule} addLabel="Nouveau type" />
        <div className="space-y-2">
          {rules.map((r) => (
            <Card key={r.id} onDelete={() => onDeleteRule(r.id)} confirmLabel={`le suivi « ${r.name} » (et son rappel associé)`}>
              <div className="flex justify-between items-center">
                <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: PALETTE.text }}>{r.name}</span>
                <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: PALETTE.textMuted }}>
                  {[r.intervalKm ? `${fmtKm(r.intervalKm)} km` : null, r.intervalMonths ? `${r.intervalMonths} mois` : null]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 16, fontWeight: 600, color: PALETTE.text }} className="mb-2">
          Saisie par photo / voix
        </div>
        <div style={{ background: PALETTE.surface, border: `1px solid ${PALETTE.hairline}`, borderRadius: 10 }} className="p-4">
          {apiKeyConfigured ? (
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} color={PALETTE.ok} />
              <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: PALETTE.text }}>
                Clé API Gemini configurée — disponible pour la dictée rapide.
              </span>
            </div>
          ) : (
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: PALETTE.textMuted }}>
              Aucune clé API Gemini détectée. Ajoute <code>VITE_GEMINI_API_KEY=ta_clé</code> dans un fichier{" "}
              <code>.env.local</code> à la racine du projet (clé gratuite sur{" "}
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer" style={{ color: PALETTE.amberSoft }}>
                aistudio.google.com/apikey
              </a>
              ), puis redémarre <code>npm run dev</code>.
            </div>
          )}
        </div>
      </div>

      <button
        onClick={onSignOut}
        style={{ display: "flex", alignItems: "center", gap: 8, background: "transparent", border: "none", color: PALETTE.danger, fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600 }}
      >
        <LogOut size={16} /> Se déconnecter
      </button>
    </div>
  );
}
