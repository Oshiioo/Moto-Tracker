import { useState, useEffect, useMemo } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, Cell } from "recharts";
import { CheckCircle2 } from "lucide-react";
import StatCard from "./StatCard";
import AlertRow from "./AlertRow";
import MiniRing from "./MiniRing";
import VehicleFilterChips from "./VehicleFilterChips";
import { PALETTE, FONT_BODY, FONT_MONO, statusColor, cardStyle, sectionLabelStyle, vehicleColorMap } from "../../theme/palette";
import { fmtKm, fmtEuro, fmtDate } from "../../lib/format";
import { ruleProgress } from "../../lib/maintenanceRules";

const Dot = ({ color }) => <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />;

const CornerTag = ({ name, color }) => (
  <div className="flex items-center gap-1">
    <Dot color={color} />
    <span style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 600, color: PALETTE.textMuted }}>{name}</span>
  </div>
);

// Fusionne les séries de conso de plusieurs motos par date (les km ne sont
// pas comparables d'une moto à l'autre) pour un graphe multi-lignes.
function buildConsumptionSeries(vehicles) {
  const dateSet = new Set();
  vehicles.forEach((v) => v.consumption.forEach((c) => dateSet.add(c.date)));
  const dates = [...dateSet].sort((a, b) => new Date(a) - new Date(b));
  return dates.map((date) => {
    const row = { date };
    vehicles.forEach((v) => {
      const entry = v.consumption.find((c) => c.date === date);
      if (entry) row[v.id] = Number(entry.value.toFixed(1));
    });
    return row;
  });
}

function SingleVehicleDashboard({ v, onGoMaint }) {
  const { avgConsumption, consumption, maintStatus, fuelCount, maintCount, ownership } = v;
  const overdue = maintStatus.filter((m) => m.status === "overdue");
  const soon = maintStatus.filter((m) => m.status === "soon");

  const bestTank = consumption.length >= 2 ? consumption.reduce((a, b) => (b.value < a.value ? b : a)) : null;
  const worstTank = consumption.length >= 2 ? consumption.reduce((a, b) => (b.value > a.value ? b : a)) : null;

  const topMaint = [...maintStatus]
    .filter((r) => r.intervalKm || r.intervalMonths)
    .sort((a, b) => ruleProgress(b) - ruleProgress(a))
    .slice(0, 4);

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Conso. moyenne" value={avgConsumption ? avgConsumption.toFixed(1) : "—"} unit="L/100km" tag={{ name: v.name, color: v.color }} />
        <StatCard label="Pleins enregistrés" value={fuelCount} unit={fuelCount > 1 ? "entrées" : "entrée"} />
      </div>

      {ownership && (fuelCount > 0 || maintCount > 0) && (
        <div style={cardStyle()}>
          <div className="flex items-start justify-between mb-3">
            <div style={sectionLabelStyle}>
              COÛT DE SUIVI{ownership.trackedSince ? ` · DEPUIS LE ${fmtDate(ownership.trackedSince).toUpperCase()}` : ""}
            </div>
            <CornerTag name={v.name} color={v.color} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 17, fontWeight: 700, color: PALETTE.text }}>{fmtEuro(ownership.totalCost, 0)}</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: PALETTE.textMuted }}>Total</div>
            </div>
            <div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 17, fontWeight: 700, color: PALETTE.text }}>
                {ownership.costPerKm != null ? fmtEuro(ownership.costPerKm) : "—"}
              </div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: PALETTE.textMuted }}>Par km</div>
            </div>
            <div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 17, fontWeight: 700, color: PALETTE.text }}>
                {ownership.costPerMonth != null ? fmtEuro(ownership.costPerMonth, 0) : "—"}
              </div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: PALETTE.textMuted }}>Par mois</div>
            </div>
          </div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: PALETTE.textMuted }} className="mt-2">
            Basé sur les pleins et entretiens enregistrés dans l'app, pas sur toute la durée de possession.
          </div>
        </div>
      )}

      {consumption.length >= 2 && (
        <div style={cardStyle()}>
          <div className="flex items-start justify-between mb-3">
            <div style={sectionLabelStyle}>CONSOMMATION</div>
            <CornerTag name={v.name} color={v.color} />
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
                <Line type="monotone" dataKey="value" stroke={PALETTE.amber} strokeWidth={2} dot={{ r: 3, fill: PALETTE.amber }} animationDuration={500} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-between mt-3 pt-3" style={{ borderTop: `1px solid ${PALETTE.hairline}` }}>
            <div>
              <div style={{ fontFamily: FONT_MONO, fontSize: 15, fontWeight: 700, color: PALETTE.ok }}>{bestTank.value.toFixed(1)} L/100km</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: PALETTE.textMuted }}>Meilleur plein · {fmtKm(bestTank.km)} km</div>
            </div>
            <div className="text-right">
              <div style={{ fontFamily: FONT_MONO, fontSize: 15, fontWeight: 700, color: PALETTE.danger }}>{worstTank.value.toFixed(1)} L/100km</div>
              <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: PALETTE.textMuted }}>Pire plein · {fmtKm(worstTank.km)} km</div>
            </div>
          </div>
        </div>
      )}

      {(overdue.length > 0 || soon.length > 0) && (
        <div style={cardStyle()}>
          <div className="flex items-start justify-between mb-3">
            <div style={sectionLabelStyle}>À SURVEILLER</div>
            <CornerTag name={v.name} color={v.color} />
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
        <div style={cardStyle()}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={20} color={PALETTE.ok} />
              <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: PALETTE.textMuted }}>
                Tout l'entretien est à jour.
              </div>
            </div>
            <CornerTag name={v.name} color={v.color} />
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
        <div style={cardStyle(PALETTE.hairline, true)}>
          <div className="flex items-start justify-between">
            <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: PALETTE.textMuted }}>
              Aucun entretien enregistré pour l'instant. Ajoute ta dernière vidange ou révision pour démarrer le suivi.
            </div>
            <CornerTag name={v.name} color={v.color} />
          </div>
        </div>
      )}
    </>
  );
}

function MultiVehicleDashboard({ vehicles, onGoMaint }) {
  const totalCost = vehicles.reduce((s, v) => s + (v.ownership?.totalCost || 0), 0);
  const showCost = vehicles.some((v) => v.fuelCount > 0 || v.maintCount > 0);
  const series = useMemo(() => buildConsumptionSeries(vehicles.filter((v) => v.consumption.length >= 2)), [vehicles]);
  const withConsumption = vehicles.filter((v) => v.consumption.length >= 2);

  return (
    <>
      <div style={cardStyle()}>
        <div style={sectionLabelStyle} className="mb-3">
          CONSO. MOYENNE & PLEINS
        </div>
        <div className="space-y-3">
          {vehicles.map((v) => (
            <div key={v.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Dot color={v.color} />
                <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: PALETTE.text }}>{v.name}</span>
              </div>
              <span style={{ fontFamily: FONT_MONO, fontSize: 13, color: PALETTE.textMuted }}>
                {v.avgConsumption ? `${v.avgConsumption.toFixed(1)} L/100km` : "—"} · {v.fuelCount} {v.fuelCount > 1 ? "pleins" : "plein"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {showCost && (
        <div style={cardStyle()}>
          <div style={sectionLabelStyle} className="mb-3">
            COÛT DE SUIVI
          </div>
          <div style={{ fontFamily: FONT_MONO, fontSize: 22, fontWeight: 700, color: PALETTE.text }}>{fmtEuro(totalCost, 0)}</div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: PALETTE.textMuted }} className="mb-3">
            Total cumulé, motos sélectionnées
          </div>
          <div className="space-y-2 pt-2" style={{ borderTop: `1px solid ${PALETTE.hairline}` }}>
            {vehicles.map((v) => (
              <div key={v.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Dot color={v.color} />
                  <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: PALETTE.text }}>{v.name}</span>
                </div>
                <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: PALETTE.textMuted }}>
                  {fmtEuro(v.ownership?.totalCost || 0, 0)}
                  {v.ownership?.costPerKm != null ? ` · ${fmtEuro(v.ownership.costPerKm)}/km` : ""}
                  {v.ownership?.costPerMonth != null ? ` · ${fmtEuro(v.ownership.costPerMonth, 0)}/mois` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {series.length >= 2 && (
        <div style={cardStyle()}>
          <div style={sectionLabelStyle} className="mb-3">
            CONSOMMATION
          </div>
          <div style={{ height: 140 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" tickFormatter={(d) => fmtDate(d)} stroke={PALETTE.textMuted} fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke={PALETTE.textMuted} fontSize={10} tickLine={false} axisLine={false} width={30} />
                <Tooltip
                  contentStyle={{ background: PALETTE.surfaceRaised, border: `1px solid ${PALETTE.hairline}`, borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: PALETTE.textMuted }}
                  labelFormatter={(d) => fmtDate(d)}
                  formatter={(v, name) => [`${v} L/100km`, name]}
                />
                {withConsumption.map((v) => (
                  <Line key={v.id} type="monotone" dataKey={v.id} name={v.name} stroke={v.color} strokeWidth={2} dot={{ r: 3, fill: v.color }} connectNulls animationDuration={500} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-3 pt-3" style={{ borderTop: `1px solid ${PALETTE.hairline}` }}>
            {withConsumption.map((v) => {
              const best = v.consumption.reduce((a, b) => (b.value < a.value ? b : a));
              const worst = v.consumption.reduce((a, b) => (b.value > a.value ? b : a));
              return (
                <div key={v.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Dot color={v.color} />
                    <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: PALETTE.text }}>{v.name}</span>
                  </div>
                  <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: PALETTE.textMuted }}>
                    <span style={{ color: PALETTE.ok }}>{best.value.toFixed(1)}</span> / <span style={{ color: PALETTE.danger }}>{worst.value.toFixed(1)}</span> L/100km
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={cardStyle()}>
        <div style={sectionLabelStyle} className="mb-3">
          À SURVEILLER
        </div>
        <div className="space-y-4">
          {vehicles.map((v) => {
            const overdue = v.maintStatus.filter((m) => m.status === "overdue");
            const soon = v.maintStatus.filter((m) => m.status === "soon");
            return (
              <div key={v.id}>
                <div className="flex items-center gap-2 mb-2">
                  <Dot color={v.color} />
                  <span style={{ fontFamily: FONT_BODY, fontSize: 13, fontWeight: 600, color: PALETTE.text }}>{v.name}</span>
                </div>
                {overdue.length > 0 || soon.length > 0 ? (
                  <div className="space-y-2">
                    {overdue.map((m) => (
                      <AlertRow key={m.id} rule={m} />
                    ))}
                    {soon.map((m) => (
                      <AlertRow key={m.id} rule={m} />
                    ))}
                  </div>
                ) : v.maintCount > 0 ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={14} color={PALETTE.ok} />
                    <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: PALETTE.textMuted }}>À jour</span>
                  </div>
                ) : (
                  <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: PALETTE.textMuted }}>Pas encore d'historique</div>
                )}
              </div>
            );
          })}
        </div>
        <button onClick={onGoMaint} style={{ color: PALETTE.amberSoft, fontFamily: FONT_BODY, fontSize: 13 }} className="mt-3 font-medium">
          Voir l'entretien →
        </button>
      </div>
    </>
  );
}

export default function Dashboard({ vehiclesData, vehicles, onGoMaint }) {
  const idsKey = useMemo(() => [...vehiclesData].map((v) => v.id).sort().join(","), [vehiclesData]);
  const [selectedIds, setSelectedIds] = useState(() => new Set(vehiclesData.map((v) => v.id)));
  useEffect(() => {
    setSelectedIds(new Set(idsKey ? idsKey.split(",") : []));
  }, [idsKey]);

  const toggle = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size === 1) return prev;
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const filtered = vehiclesData.filter((v) => selectedIds.has(v.id));

  const parcourus = (v) => {
    const endKm = v.status === "sold" && v.finalKm != null ? v.finalKm : v.currentKm;
    return Math.max(0, endKm - (v.acquisitionKm || 0));
  };
  const totalParcourus = vehicles ? vehicles.reduce((sum, v) => sum + parcourus(v), 0) : 0;
  // Couleurs calculées uniquement sur les motos actives : garantit que les
  // 2-3 motos actives (celles affichées dans les sections ci-dessus) ne
  // partagent jamais la même teinte. Les motos vendues/archivées, qui
  // n'apparaissent que dans ce graphique, restent en gris neutre.
  const garageColorMap = useMemo(() => vehicleColorMap((vehicles || []).filter((v) => v.status === "active")), [vehicles]);

  return (
    <div className="space-y-4 mt-2">
      {vehiclesData.length > 1 && <VehicleFilterChips vehicles={vehiclesData} selectedIds={selectedIds} onToggle={toggle} />}

      {filtered.length === 1 && <SingleVehicleDashboard v={filtered[0]} onGoMaint={onGoMaint} />}
      {filtered.length > 1 && <MultiVehicleDashboard vehicles={filtered} onGoMaint={onGoMaint} />}

      {vehicles && vehicles.length > 0 && (
        <div style={cardStyle()}>
          <div style={sectionLabelStyle} className="mb-3">
            MON GARAGE EN UN COUP D'ŒIL
          </div>
          <div style={{ height: Math.max(60, vehicles.length * 44) }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={vehicles.map((v) => ({ id: v.id, name: v.name, km: parcourus(v) }))}
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
                <Bar dataKey="km" radius={[0, 4, 4, 0]} animationDuration={500}>
                  {vehicles.map((v) => (
                    <Cell key={v.id} fill={garageColorMap[v.id] || PALETTE.steelDim} />
                  ))}
                </Bar>
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
