import { Fuel } from "lucide-react";
import SectionHeader from "../ui/SectionHeader";
import EmptyState from "../ui/EmptyState";
import Card from "../ui/Card";
import IconBadge from "../ui/IconBadge";
import { PALETTE, FONT_BODY, FONT_MONO } from "../../theme/palette";
import { fmtKm, fmtDate } from "../../lib/format";

export default function FuelTab({ entries, consumption, onAdd, onDelete }) {
  const consByEntry = Object.fromEntries(consumption.map((c) => [c.id, c.value]));
  return (
    <div className="mt-2">
      <SectionHeader title="Pleins de carburant" onAdd={onAdd} addLabel="Ajouter un plein" />
      {entries.length === 0 ? (
        <EmptyState text="Aucun plein enregistré. Ajoute ton premier plein pour suivre la consommation." />
      ) : (
        <div className="space-y-2">
          {entries.map((e) => (
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
}
