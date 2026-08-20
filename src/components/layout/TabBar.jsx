import { Fuel, Wrench, Gauge, Settings } from "lucide-react";
import { PALETTE, FONT_BODY } from "../../theme/palette";
import { CONTENT_MAX_WIDTH } from "../../lib/constants";

const TABS = [
  { id: "dashboard", label: "Accueil", icon: Gauge },
  { id: "fuel", label: "Carburant", icon: Fuel },
  { id: "maintenance", label: "Entretien", icon: Wrench },
  { id: "settings", label: "Réglages", icon: Settings },
];

export default function TabBar({ tab, setTab }) {
  return (
    <nav style={{ background: PALETTE.surface, borderTop: `1px solid ${PALETTE.hairline}`, flexShrink: 0 }}>
      <div
        style={{
          width: "100%",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          maxWidth: CONTENT_MAX_WIDTH,
          margin: "0 auto",
          padding: "0 20px",
          boxSizing: "border-box",
        }}
      >
        {TABS.map((it) => {
          const active = tab === it.id;
          const Icon = it.icon;
          return (
            <button key={it.id} onClick={() => setTab(it.id)} className="flex flex-col items-center gap-1 py-3">
              <Icon size={20} color={active ? PALETTE.primary : PALETTE.steelDim} />
              <span style={{ fontFamily: FONT_BODY, fontSize: 10, color: active ? PALETTE.primary : PALETTE.steelDim }}>
                {it.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
