import { PALETTE, FONT_BODY } from "../../theme/palette";

export default function VehicleFilterChips({ vehicles, selectedIds, onToggle }) {
  return (
    <div className="flex flex-wrap gap-2 mb-1">
      {vehicles.map((v) => {
        const active = selectedIds.has(v.id);
        return (
          <button
            key={v.id}
            type="button"
            onClick={() => onToggle(v.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: active ? `${v.color}22` : "transparent",
              border: `1px solid ${active ? v.color : PALETTE.hairline}`,
              borderRadius: 999,
              padding: "6px 12px",
              fontFamily: FONT_BODY,
              fontSize: 12,
              fontWeight: 600,
              color: active ? PALETTE.text : PALETTE.textMuted,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: v.color, flexShrink: 0 }} />
            {v.name}
          </button>
        );
      })}
    </div>
  );
}
