import { useMemo, useState } from "react";
import { Fuel, ChevronDown } from "lucide-react";
import SectionHeader from "../ui/SectionHeader";
import EmptyState from "../ui/EmptyState";
import Card from "../ui/Card";
import IconBadge from "../ui/IconBadge";
import { PALETTE, FONT_BODY, FONT_MONO, FONT_DISPLAY } from "../../theme/palette";
import { fmtKm, fmtDate } from "../../lib/format";

export default function FuelTab({ entries, consumption, onAdd, onDelete }) {
  const consByEntry = Object.fromEntries(consumption.map((c) => [c.id, c.value]));

  // Regroupe par année (repliable) pour rester lisible même avec des années
  // d'historique — seule l'année la plus récente est dépliée par défaut.
  const groups = useMemo(() => {
    const byYear = new Map();
    entries.forEach((e) => {
      const year = new Date(e.date).getFullYear();
      if (!byYear.has(year)) byYear.set(year, []);
      byYear.get(year).push(e);
    });
    return [...byYear.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([year, list]) => {
        const totalLiters = list.reduce((s, e) => s + (Number(e.liters) || 0), 0);
        const kms = list.map((e) => e.km);
        // Distance entre le 1er et le dernier plein de l'année — approximation
        // la plus honnête possible à partir des seuls relevés de pleins.
        const kmDriven = kms.length >= 2 ? Math.max(...kms) - Math.min(...kms) : null;
        return { year, list, totalLiters, kmDriven };
      });
  }, [entries]);
  const mostRecentYear = groups[0]?.year;

  const [toggledYears, setToggledYears] = useState(() => new Set());
  const toggleYear = (year) => {
    setToggledYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });
  };

  return (
    <div className="mt-2">
      <SectionHeader title="Pleins de carburant" onAdd={onAdd} addLabel="Ajouter un plein" />
      {entries.length === 0 ? (
        <EmptyState text="Aucun plein enregistré. Ajoute ton premier plein pour suivre la consommation." />
      ) : (
        <div className="space-y-1">
          {groups.map(({ year, list, totalLiters, kmDriven }) => {
            const isOpen = toggledYears.has(year) ? year !== mostRecentYear : year === mostRecentYear;
            return (
              <div key={year}>
                <button
                  type="button"
                  onClick={() => toggleYear(year)}
                  className="flex items-center justify-between w-full"
                  style={{ padding: "10px 0", borderBottom: `1px solid ${PALETTE.hairline}` }}
                >
                  <span style={{ fontFamily: FONT_DISPLAY, fontSize: 15, fontWeight: 600, color: PALETTE.text }}>{year}</span>
                  <span className="flex items-center gap-2">
                    <span style={{ fontFamily: FONT_BODY, fontSize: 12, color: PALETTE.textMuted }}>
                      {list.length} plein{list.length > 1 ? "s" : ""}
                      {totalLiters > 0 ? ` · ${totalLiters.toFixed(1)} L` : ""}
                      {kmDriven != null ? ` · ${fmtKm(kmDriven)} km` : ""}
                    </span>
                    <ChevronDown
                      size={14}
                      color={PALETTE.textMuted}
                      style={{ transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 150ms ease" }}
                    />
                  </span>
                </button>
                {isOpen && (
                  <div className="space-y-2 mt-2 mb-3">
                    {list.map((e) => (
                      <Card key={e.id} onDelete={() => onDelete(e.id)} confirmLabel={`ce plein du ${fmtDate(e.date)}`}>
                        <div className="flex items-start gap-3">
                          <IconBadge icon={Fuel} color={PALETTE.primary} />
                          <div className="flex justify-between items-start flex-1">
                            <div>
                              <div style={{ fontFamily: FONT_MONO, fontSize: 16, color: PALETTE.text }}>{fmtKm(e.km)} km</div>
                              <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: PALETTE.textMuted }}>{fmtDate(e.date)}</div>
                            </div>
                            <div className="text-right">
                              {e.liters ? (
                                <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: PALETTE.text }}>
                                  {e.liters} L{e.price ? ` · ${e.price} €` : ""}
                                </div>
                              ) : (
                                <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: PALETTE.textMuted, fontStyle: "italic" }}>
                                  {e.price ? `${e.price} € · litres à compléter` : "Litres à compléter"}
                                </div>
                              )}
                              {consByEntry[e.id] && (
                                <div style={{ fontFamily: FONT_MONO, fontSize: 13, color: PALETTE.primarySoft }}>
                                  {consByEntry[e.id].toFixed(1)} L/100km
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
