import { PALETTE, FONT_MONO } from "../../theme/palette";

const STATUS_MAP = {
  ok: { label: "À jour", color: PALETTE.ok },
  soon: { label: "Bientôt", color: PALETTE.yellow },
  overdue: { label: "Dépassé", color: PALETTE.danger },
};

export default function StatusPill({ status }) {
  const { label, color } = STATUS_MAP[status];
  return (
    <span style={{ fontFamily: FONT_MONO, fontSize: 11, color, border: `1px solid ${color}`, borderRadius: 999, padding: "2px 8px" }}>
      {label}
    </span>
  );
}
