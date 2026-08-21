import { useMemo, useState } from "react";
import { Wrench, FileDown, ListFilter } from "lucide-react";
import SectionHeader from "../ui/SectionHeader";
import EmptyState from "../ui/EmptyState";
import Card from "../ui/Card";
import IconBadge from "../ui/IconBadge";
import StatusPill from "./StatusPill";
import MaintenanceExportModal from "./MaintenanceExportModal";
import { PALETTE, FONT_BODY, FONT_MONO, cardStyle, sectionLabelStyle, statusColor, inputStyle } from "../../theme/palette";
import { fmtKm, fmtDate } from "../../lib/format";

const HISTORY_PREVIEW_COUNT = 5;

export default function MaintenanceTab({ vehicle, statuses, history, onAdd, onDelete }) {
  const [showExport, setShowExport] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [typeFilter, setTypeFilter] = useState("");

  const types = useMemo(
    () => [...new Set(history.map((m) => m.type))].sort((a, b) => a.localeCompare(b, "fr")),
    [history],
  );
  const filtered = typeFilter ? history.filter((m) => m.type === typeFilter) : history;
  const visibleHistory = typeFilter ? filtered : expanded ? filtered : filtered.slice(0, HISTORY_PREVIEW_COUNT);
  const hasMore = !typeFilter && !expanded && filtered.length > HISTORY_PREVIEW_COUNT;
  return (
    <div className="mt-2 space-y-6">
      <div>
        <SectionHeader title="Suivi par intervalle" onAdd={onAdd} addLabel="Entretien effectué" />
        <div className="space-y-2">
          {statuses.map((s) => (
            <div
              key={s.id}
              style={cardStyle(s.status !== "ok" ? (s.status === "overdue" ? PALETTE.danger : PALETTE.warning) : PALETTE.hairline)}
            >
              <div className="flex items-start gap-3">
                <IconBadge icon={Wrench} color={statusColor(s.status)} />
                <div className="flex-1">
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
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-3">
          <div style={sectionLabelStyle}>HISTORIQUE</div>
          {history.length > 0 && (
            <button
              type="button"
              onClick={() => setShowExport(true)}
              style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: FONT_BODY, fontSize: 12, fontWeight: 600, color: PALETTE.primarySoft }}
            >
              <FileDown size={14} /> Exporter
            </button>
          )}
        </div>
        {history.length === 0 ? (
          <EmptyState text="Aucune intervention enregistrée." />
        ) : (
          <>
            {types.length > 1 && (
              <div className="flex items-center gap-2 mb-3">
                <ListFilter size={14} color={PALETTE.textMuted} />
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  style={{ ...inputStyle, width: "auto", padding: "6px 10px", fontSize: 13 }}
                >
                  <option value="">Tous les types</option>
                  {types.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            )}
            {filtered.length === 0 ? (
              <EmptyState text={`Aucune intervention « ${typeFilter} » enregistrée.`} />
            ) : (
              <div className="space-y-2">
                {visibleHistory.map((m) => (
                  <Card key={m.id} onDelete={() => onDelete(m.id)} confirmLabel={`« ${m.type} » du ${fmtDate(m.date)}`}>
                    <div className="flex items-start gap-3">
                      <IconBadge icon={Wrench} color={PALETTE.steel} />
                      <div className="flex justify-between items-start flex-1">
                        <div>
                          <div style={{ fontFamily: FONT_BODY, fontWeight: 500, fontSize: 14, color: PALETTE.text }}>{m.type}</div>
                          <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: PALETTE.textMuted }}>{fmtDate(m.date)} · {fmtKm(m.km)} km</div>
                          {m.note && <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: PALETTE.textMuted }} className="mt-1">{m.note}</div>}
                        </div>
                        {m.cost && <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: PALETTE.text }}>{m.cost} €</div>}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
            {hasMore && (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "center",
                  marginTop: 12,
                  fontFamily: FONT_BODY,
                  fontSize: 13,
                  fontWeight: 600,
                  color: PALETTE.primarySoft,
                }}
              >
                Afficher tout l'historique ({filtered.length - HISTORY_PREVIEW_COUNT} de plus)
              </button>
            )}
          </>
        )}
      </div>

      {showExport && <MaintenanceExportModal vehicle={vehicle} history={history} onClose={() => setShowExport(false)} />}
    </div>
  );
}
