import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar } from "recharts";
import { CheckCircle2 } from "lucide-react";
import StatCard from "./StatCard";
import AlertRow from "./AlertRow";
import MiniRing from "./MiniRing";
import { PALETTE, FONT_DISPLAY, FONT_BODY, FONT_MONO, statusColor } from "../../theme/palette";
import { fmtKm } from "../../lib/format";
import { ruleProgress } from "../../lib/maintenanceRules";

export default function Dashboard({ vehicle, avgConsumption, consumption, maintStatus, fuelCount, maintCount, onGoMaint, vehicles }) {
  const overdue = maintStatus.filter((m) => m.status === "overdue");
  const soon = maintStatus.filter((m) => m.status === "soon");

  const parcourus = (v) => {
    const endKm = v.status === "sold" && v.finalKm != null ? v.finalKm : v.currentKm;
    return Math.max(0, endKm - (v.acquisitionKm || 0));
  };
  const totalParcourus = vehicles ? vehicles.reduce((sum, v) => sum + parcourus(v), 0) : 0;

  const topMaint = [...maintStatus]
    .filter((r) => r.intervalKm || r.intervalMonths)
    .sort((a, b) => ruleProgress(b) - ruleProgress(a))
    .slice(0, 4);

  return (
    <div className="space-y-4 mt-2">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Conso. moyenne" value={avgConsumption ? avgConsumption.toFixed(1) : "—"} unit="L/100km" />
        <StatCard label="Pleins enregistrés" value={fuelCount} unit={fuelCount > 1 ? "entrées" : "entrée"} />
      </div>

      {consumption && consumption.length >= 2 && (
        <div style={{ background: PALETTE.surface, border: `1px solid ${PALETTE.hairline}`, borderRadius: 10 }} className="p-4">
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 13, letterSpacing: "0.08em", color: PALETTE.textMuted }} className="mb-3">
            CONSOMMATION
          </div>
          <div style={{ height: 140 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={consumption.map((c) => ({ km: c.km, value: Number(c.value.toFixed(1)) }))} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <XAxis dataKey="km" tickFormatter={fmtKm} stroke={PALETTE.textMuted} fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke={PALETTE.textMuted} fontSize={10} tickLine={false} axisLine={false} width={30} />
                <Tooltip
                  contentStyle={{ background: PALETTE.surfaceRaised, border: `1px solid ${PALETTE.hairline}`, borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: PALETTE.textMuted }}
                  itemStyle={{ color: PALETTE.text }}
                  labelFormatter={(km) => `${fmtKm(km)} km`}
                  formatter={(v) => [`${v} L/100km`, "Conso"]}
                />
                <Line type="monotone" dataKey="value" stroke={PALETTE.amber} strokeWidth={2} dot={{ r: 3, fill: PALETTE.amber }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {(overdue.length > 0 || soon.length > 0) && (
        <div style={{ background: PALETTE.surface, border: `1px solid ${PALETTE.hairline}`, borderRadius: 10 }} className="p-4">
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 13, letterSpacing: "0.08em", color: PALETTE.textMuted }} className="mb-3">
            À SURVEILLER
          </div>

          <div className="flex justify-around mb-4">
            {topMaint.map((r) => (
              <MiniRing key={r.id} percent={ruleProgress(r)} color={statusColor(r.status)} label={r.name} />
            ))}
          </div>

          <div className="space-y-2">
            {overdue.map((m) => (
              <AlertRow key={m.id} rule={m} />
            ))}
            {soon.map((m) => (
              <AlertRow key={m.id} rule={m} />
            ))}
          </div>
          <button onClick={onGoMaint} style={{ color: PALETTE.amberSoft, fontFamily: FONT_BODY, fontSize: 13 }} className="mt-3 font-medium">
            Voir l'entretien →
          </button>
        </div>
      )}

      {overdue.length === 0 && soon.length === 0 && maintCount > 0 && (
        <div style={{ background: PALETTE.surface, border: `1px solid ${PALETTE.hairline}`, borderRadius: 10 }} className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 size={20} color={PALETTE.ok} />
            <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: PALETTE.textMuted }}>
              Tout l'entretien est à jour.
            </div>
          </div>
          {topMaint.length > 0 && (
            <div className="flex justify-around">
              {topMaint.map((r) => (
                <MiniRing key={r.id} percent={ruleProgress(r)} color={statusColor(r.status)} label={r.name} />
              ))}
            </div>
          )}
        </div>
      )}

      {maintCount === 0 && (
        <div style={{ background: PALETTE.surface, border: `1px dashed ${PALETTE.hairline}`, borderRadius: 10 }} className="p-4">
          <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: PALETTE.textMuted }}>
            Aucun entretien enregistré pour l'instant. Ajoute ta dernière vidange ou révision pour démarrer le suivi.
          </div>
        </div>
      )}

      {vehicles && vehicles.length > 0 && (
        <div style={{ background: PALETTE.surface, border: `1px solid ${PALETTE.hairline}`, borderRadius: 10 }} className="p-4">
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 13, letterSpacing: "0.08em", color: PALETTE.textMuted }} className="mb-3">
            MON GARAGE EN UN COUP D'ŒIL
          </div>
          <div style={{ height: Math.max(60, vehicles.length * 44) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={vehicles.map((v) => ({ name: v.name, km: parcourus(v) }))}
                layout="vertical"
                margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
              >
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={100} stroke={PALETTE.textMuted} fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: PALETTE.surfaceRaised, border: `1px solid ${PALETTE.hairline}`, borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: PALETTE.text }}
                  itemStyle={{ color: PALETTE.amberSoft }}
                  formatter={(v) => [`${fmtKm(v)} km`, "Parcourus"]}
                  cursor={{ fill: PALETTE.hairline, opacity: 0.3 }}
                />
                <Bar dataKey="km" fill={PALETTE.amberSoft} radius={[0, 4, 4, 0]} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ borderTop: `1px solid ${PALETTE.hairline}`, paddingTop: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: FONT_BODY, fontWeight: 600, fontSize: 13, color: PALETTE.text }}>Total parcouru</span>
            <span style={{ fontFamily: FONT_MONO, fontSize: 16, fontWeight: 700, color: PALETTE.amberSoft }}>{fmtKm(totalParcourus)} km</span>
          </div>
        </div>
      )}
    </div>
  );
}
