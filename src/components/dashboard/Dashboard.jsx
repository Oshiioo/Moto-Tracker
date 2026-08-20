import { useState, useMemo } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell } from "recharts";
import { CheckCircle2, ChevronDown, LineChart as LineChartIcon } from "lucide-react";
import StatCard from "./StatCard";
import AlertRow from "./AlertRow";
import MiniRing from "./MiniRing";
import { PALETTE, FONT_BODY, FONT_MONO, statusColor, cardStyle, sectionLabelStyle, vehicleColorMap } from "../../theme/palette";
import { fmtKm, fmtEuro, fmtDate } from "../../lib/format";
import { ruleProgress } from "../../lib/maintenanceRules";

const Dot = ({ color }) => <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />;

// Résout la sélection propre à une carte : soit une moto précise, soit
// "all". Auto-guérison si la moto choisie disparaît (suppression) — retombe
// sur "all" sans effet de synchronisation, recalculé à chaque rendu.
function useVehicleView(allVehicles, defaultId) {
  const [viewMode, setViewMode] = useState(defaultId);
  const valid = viewMode !== "all" && !allVehicles.some((v) => v.id === viewMode) ? "all" : viewMode;
  const resolved = valid === "all" ? allVehicles : allVehicles.filter((v) => v.id === valid);
  return [resolved, valid, setViewMode];
}

// Label point coloré + nom, dans le coin d'une carte. Cliquable dès qu'il y a
// plus d'une moto : ouvre un petit menu pour choisir une autre moto (active,
// vendue ou archivée) ou "Toutes les motos". Chaque carte a son propre état —
// changer une carte ne touche ni les autres cartes ni la moto active de l'app.
function VehicleSwitcher({ vehicles, value, onChange }) {
  const [open, setOpen] = useState(false);

  if (vehicles.length <= 1) {
    const only = vehicles[0];
    return only ? (
      <div className="flex items-center gap-1">
        <Dot color={only.color} />
        <span style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 600, color: PALETTE.textMuted }}>{only.name}</span>
      </div>
    ) : null;
  }

  const current = value !== "all" ? vehicles.find((v) => v.id === value) : null;

  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex items-center gap-1" style={{ background: "transparent", border: "none", padding: 0 }}>
        {current && <Dot color={current.color} />}
        <span style={{ fontFamily: FONT_BODY, fontSize: 11, fontWeight: 600, color: PALETTE.textMuted, whiteSpace: "nowrap" }}>
          {current ? current.name : "Toutes"}
        </span>
        <ChevronDown size={12} color={PALETTE.textMuted} />
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} className="fixed inset-0" style={{ zIndex: 20 }} />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              right: 0,
              zIndex: 21,
              background: PALETTE.surfaceRaised,
              border: `1px solid ${PALETTE.hairline}`,
              borderRadius: 8,
              padding: 4,
              minWidth: 150,
              maxHeight: 220,
              overflowY: "auto",
              boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
            }}
          >
            <button
              type="button"
              onClick={() => {
                onChange("all");
                setOpen(false);
              }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "8px 10px",
                borderRadius: 6,
                fontFamily: FONT_BODY,
                fontSize: 13,
                fontWeight: value === "all" ? 700 : 500,
                color: value === "all" ? PALETTE.text : PALETTE.textMuted,
                background: value === "all" ? PALETTE.surface : "transparent",
              }}
            >
              Toutes les motos
            </button>
            {vehicles.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => {
                  onChange(v.id);
                  setOpen(false);
                }}
                className="flex items-center gap-2"
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 10px",
                  borderRadius: 6,
                  fontFamily: FONT_BODY,
                  fontSize: 13,
                  fontWeight: value === v.id ? 700 : 500,
                  color: value === v.id ? PALETTE.text : PALETTE.textMuted,
                  background: value === v.id ? PALETTE.surface : "transparent",
                }}
              >
                <Dot color={v.color} />
                {v.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

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

// Deux points fictifs, juste pour donner un domaine d'axes au graphe "vide"
// affiché quand une moto n'a pas encore assez de pleins pour une vraie courbe.
const EMPTY_CHART_PLACEHOLDER = [{ km: 0 }, { km: 1 }];

function ConsoStatCard({ allVehicles, defaultId }) {
  const [resolved, valid, setValid] = useVehicleView(allVehicles, defaultId);
  if (resolved.length === 0) return null;
  const switcher = <VehicleSwitcher vehicles={allVehicles} value={valid} onChange={setValid} />;

  const content =
    resolved.length === 1 ? (
      <StatCard label="Conso. moyenne" value={resolved[0].avgConsumption ? resolved[0].avgConsumption.toFixed(1) : "—"} unit="L/100km" tag={switcher} />
    ) : (
      <div style={cardStyle()}>
        <div className="flex items-start justify-between mb-3">
          <div style={sectionLabelStyle}>CONSO. MOYENNE</div>
          {switcher}
        </div>
        <div className="space-y-2">
          {resolved.map((v) => (
            <div key={v.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Dot color={v.color} />
                <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: PALETTE.text }}>{v.name}</span>
              </div>
              <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: PALETTE.textMuted }}>
                {v.avgConsumption ? `${v.avgConsumption.toFixed(1)} L/100km` : "—"}
              </span>
            </div>
          ))}
        </div>
      </div>
    );

  return (
    <div key={valid} style={{ animation: "tabContentIn 200ms ease" }}>
      {content}
    </div>
  );
}

function PleinsStatCard({ allVehicles, defaultId }) {
  const [resolved, valid, setValid] = useVehicleView(allVehicles, defaultId);
  if (resolved.length === 0) return null;
  const switcher = <VehicleSwitcher vehicles={allVehicles} value={valid} onChange={setValid} />;

  const content =
    resolved.length === 1 ? (
      <StatCard label="Pleins enregistrés" value={resolved[0].fuelCount} unit={resolved[0].fuelCount > 1 ? "entrées" : "entrée"} tag={switcher} />
    ) : (
      <div style={cardStyle()}>
        <div className="flex items-start justify-between mb-3">
          <div style={sectionLabelStyle}>PLEINS ENREGISTRÉS</div>
          {switcher}
        </div>
        <div className="space-y-2">
          {resolved.map((v) => (
            <div key={v.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Dot color={v.color} />
                <span style={{ fontFamily: FONT_BODY, fontSize: 13, color: PALETTE.text }}>{v.name}</span>
              </div>
              <span style={{ fontFamily: FONT_MONO, fontSize: 12, color: PALETTE.textMuted }}>
                {v.fuelCount} {v.fuelCount > 1 ? "pleins" : "plein"}
              </span>
            </div>
          ))}
        </div>
      </div>
    );

  return (
    <div key={valid} style={{ animation: "tabContentIn 200ms ease" }}>
      {content}
    </div>
  );
}

function CoutDeSuiviCard({ allVehicles, defaultId }) {
  const [resolved, valid, setValid] = useVehicleView(allVehicles, defaultId);
  if (resolved.length === 0) return null;
  const withData = resolved.filter((v) => v.fuelCount > 0 || v.maintCount > 0);
  const switcher = <VehicleSwitcher vehicles={allVehicles} value={valid} onChange={setValid} />;

  if (withData.length === 0) {
    return (
      <div key={valid} style={{ ...cardStyle(PALETTE.hairline, true), animation: "tabContentIn 200ms ease" }}>
        <div className="flex items-start justify-between">
          <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: PALETTE.textMuted }}>
            Pas encore de plein ni d'entretien enregistré pour calculer un coût.
          </div>
          {switcher}
        </div>
      </div>
    );
  }

  if (resolved.length === 1) {
    const v = resolved[0];
    const { ownership } = v;
    return (
      <div key={valid} style={{ ...cardStyle(), animation: "tabContentIn 200ms ease" }}>
        <div className="flex items-start justify-between mb-3">
          <div style={sectionLabelStyle}>
            COÛT DE SUIVI{ownership.trackedSince ? ` · DEPUIS LE ${fmtDate(ownership.trackedSince).toUpperCase()}` : ""}
          </div>
          {switcher}
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
    );
  }

  const totalCost = resolved.reduce((s, v) => s + (v.ownership?.totalCost || 0), 0);
  return (
    <div key={valid} style={{ ...cardStyle(), animation: "tabContentIn 200ms ease" }}>
      <div className="flex items-start justify-between mb-3">
        <div style={sectionLabelStyle}>COÛT DE SUIVI</div>
        {switcher}
      </div>
      <div style={{ fontFamily: FONT_MONO, fontSize: 22, fontWeight: 700, color: PALETTE.text }}>{fmtEuro(totalCost, 0)}</div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: PALETTE.textMuted }} className="mb-3">
        Total cumulé, toutes motos
      </div>
      <div className="space-y-2 pt-2" style={{ borderTop: `1px solid ${PALETTE.hairline}` }}>
        {resolved.map((v) => (
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
  );
}

function ConsommationCard({ allVehicles, defaultId }) {
  const [resolved, valid, setValid] = useVehicleView(allVehicles, defaultId);
  if (resolved.length === 0) return null;
  const withConsumption = resolved.filter((v) => v.consumption.length >= 2);
  const switcher = <VehicleSwitcher vehicles={allVehicles} value={valid} onChange={setValid} />;

  if (withConsumption.length === 0) {
    return (
      <div key={valid} style={{ ...cardStyle(), animation: "tabContentIn 200ms ease" }}>
        <div className="flex items-start justify-between mb-3">
          <div style={sectionLabelStyle}>CONSOMMATION</div>
          {switcher}
        </div>
        <div style={{ height: 140, position: "relative" }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={EMPTY_CHART_PLACEHOLDER} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid stroke={PALETTE.hairline} strokeDasharray="4 4" />
              <XAxis dataKey="km" tick={false} axisLine={false} tickLine={false} />
              <YAxis tick={false} axisLine={false} tickLine={false} width={30} />
            </LineChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-2">
            <LineChartIcon size={26} color={PALETTE.steelDim} strokeWidth={1.5} />
            <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: PALETTE.textMuted, maxWidth: 220 }}>
              Pas encore assez de pleins enregistrés pour calculer une consommation.
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (resolved.length === 1) {
    const v = resolved[0];
    const { consumption } = v;
    const bestTank = consumption.reduce((a, b) => (b.value < a.value ? b : a));
    const worstTank = consumption.reduce((a, b) => (b.value > a.value ? b : a));
    return (
      <div key={valid} style={{ ...cardStyle(), animation: "tabContentIn 200ms ease" }}>
        <div className="flex items-start justify-between mb-3">
          <div style={sectionLabelStyle}>CONSOMMATION</div>
          {switcher}
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
    );
  }

  const series = buildConsumptionSeries(withConsumption);
  return (
    <div key={valid} style={{ ...cardStyle(), animation: "tabContentIn 200ms ease" }}>
      <div className="flex items-start justify-between mb-3">
        <div style={sectionLabelStyle}>CONSOMMATION</div>
        {switcher}
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
  );
}

function ASurveillerCard({ allVehicles, defaultId, onGoMaint }) {
  const [resolved, valid, setValid] = useVehicleView(allVehicles, defaultId);
  if (resolved.length === 0) return null;
  const switcher = <VehicleSwitcher vehicles={allVehicles} value={valid} onChange={setValid} />;

  if (resolved.length > 1) {
    return (
      <div key={valid} style={{ ...cardStyle(), animation: "tabContentIn 200ms ease" }}>
        <div className="flex items-start justify-between mb-3">
          <div style={sectionLabelStyle}>À SURVEILLER</div>
          {switcher}
        </div>
        <div className="space-y-4">
          {resolved.map((v) => {
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
    );
  }

  const v = resolved[0];
  const overdue = v.maintStatus.filter((m) => m.status === "overdue");
  const soon = v.maintStatus.filter((m) => m.status === "soon");
  const topMaint = [...v.maintStatus]
    .filter((r) => r.intervalKm || r.intervalMonths)
    .sort((a, b) => ruleProgress(b) - ruleProgress(a))
    .slice(0, 4);

  if (overdue.length > 0 || soon.length > 0) {
    return (
      <div key={valid} style={{ ...cardStyle(), animation: "tabContentIn 200ms ease" }}>
        <div className="flex items-start justify-between mb-3">
          <div style={sectionLabelStyle}>À SURVEILLER</div>
          {switcher}
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
    );
  }

  if (v.maintCount > 0) {
    return (
      <div key={valid} style={{ ...cardStyle(), animation: "tabContentIn 200ms ease" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={20} color={PALETTE.ok} />
            <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: PALETTE.textMuted }}>Tout l'entretien est à jour.</div>
          </div>
          {switcher}
        </div>
        {topMaint.length > 0 && (
          <div className="flex justify-around">
            {topMaint.map((r) => (
              <MiniRing key={r.id} percent={ruleProgress(r)} color={statusColor(r.status)} label={r.name} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div key={valid} style={{ ...cardStyle(PALETTE.hairline, true), animation: "tabContentIn 200ms ease" }}>
      <div className="flex items-start justify-between">
        <div style={{ fontFamily: FONT_BODY, fontSize: 14, color: PALETTE.textMuted }}>
          Aucun entretien enregistré pour l'instant. Ajoute ta dernière vidange ou révision pour démarrer le suivi.
        </div>
        {switcher}
      </div>
    </div>
  );
}

export default function Dashboard({ vehiclesData, vehicles, activeVehicleId, onGoMaint }) {
  const parcourus = (v) => {
    const endKm = v.status === "sold" && v.finalKm != null ? v.finalKm : v.currentKm;
    return Math.max(0, endKm - (v.acquisitionKm || 0));
  };
  const totalParcourus = vehicles ? vehicles.reduce((sum, v) => sum + parcourus(v), 0) : 0;
  // Couleurs calculées uniquement sur les motos actives : garantit que les
  // 2-3 motos actives ne partagent jamais la même teinte. Les motos
  // vendues/archivées restent en gris neutre, y compris ici.
  const garageColorMap = useMemo(() => vehicleColorMap((vehicles || []).filter((v) => v.status === "active")), [vehicles]);

  return (
    <div className="space-y-4 mt-2">
      <div className="grid grid-cols-2 gap-3">
        <ConsoStatCard allVehicles={vehiclesData} defaultId={activeVehicleId} />
        <PleinsStatCard allVehicles={vehiclesData} defaultId={activeVehicleId} />
      </div>
      <CoutDeSuiviCard allVehicles={vehiclesData} defaultId={activeVehicleId} />
      <ConsommationCard allVehicles={vehiclesData} defaultId={activeVehicleId} />
      <ASurveillerCard allVehicles={vehiclesData} defaultId={activeVehicleId} onGoMaint={onGoMaint} />

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
