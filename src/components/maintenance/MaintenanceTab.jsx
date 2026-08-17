import SectionHeader from "../ui/SectionHeader";
import EmptyState from "../ui/EmptyState";
import Card from "../ui/Card";
import StatusPill from "./StatusPill";
import { PALETTE, FONT_DISPLAY, FONT_BODY, FONT_MONO } from "../../theme/palette";
import { fmtKm, fmtDate } from "../../lib/format";

export default function MaintenanceTab({ statuses, history, onAdd, onDelete }) {
  return (
    <div className="mt-2 space-y-6">
      <div>
        <SectionHeader title="Suivi par intervalle" onAdd={onAdd} addLabel="Entretien effectué" />
        <div className="space-y-2">
          {statuses.map((s) => (
            <div
              key={s.id}
              style={{
                background: PALETTE.surface,
                border: `1px solid ${s.status !== "ok" ? (s.status === "overdue" ? PALETTE.danger : PALETTE.yellow) : PALETTE.hairline}`,
                borderRadius: 10,
              }}
              className="p-3"
            >
              <div className="flex justify-between items-center">
                <span style={{ fontFamily: FONT_BODY, fontWeight: 500, fontSize: 14, color: PALETTE.text }}>{s.name}</span>
                <StatusPill status={s.status} />
              </div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: PALETTE.textMuted }} className="mt-1">
                {s.lastKm != null ? `Dernier : ${fmtKm(s.lastKm)} km (${fmtDate(s.lastDate)})` : "Jamais renseigné"}
                {s.nextDueKm != null ? ` · Prochain à ${fmtKm(s.nextDueKm)} km` : ""}
                {s.nextDueDate != null ? ` · avant le ${fmtDate(s.nextDueDate)}` : ""}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontFamily: FONT_DISPLAY, fontSize: 13, letterSpacing: "0.08em", color: PALETTE.textMuted }} className="mb-2">
          HISTORIQUE
        </div>
        {history.length === 0 ? (
          <EmptyState text="Aucune intervention enregistrée." />
        ) : (
          <div className="space-y-2">
            {history.map((m) => (
              <Card key={m.id} onDelete={() => onDelete(m.id)} confirmLabel={`« ${m.type} » du ${fmtDate(m.date)}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <div style={{ fontFamily: FONT_BODY, fontWeight: 500, fontSize: 14, color: PALETTE.text }}>{m.type}</div>
                    <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: PALETTE.textMuted }}>{fmtDate(m.date)} · {fmtKm(m.km)} km</div>
                    {m.note && <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: PALETTE.textMuted }} className="mt-1">{m.note}</div>}
                  </div>
                  {m.cost && <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: PALETTE.text }}>{m.cost} €</div>}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
