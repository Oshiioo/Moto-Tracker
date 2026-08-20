import { AlertTriangle, Clock } from "lucide-react";
import { PALETTE, FONT_BODY, FONT_MONO } from "../../theme/palette";
import { fmtKm } from "../../lib/format";

function remainingLabel(rule) {
  // Priorise l'échéance la plus pressante entre km et calendaire
  const kmUrgency = rule.remainingKm != null ? rule.remainingKm : Infinity;
  const dateUrgencyKm = rule.remainingDays != null ? rule.remainingDays : Infinity;
  if (kmUrgency <= dateUrgencyKm && rule.remainingKm != null) {
    return rule.remainingKm <= 0 ? `dépassé de ${fmtKm(-rule.remainingKm)} km` : `dans ${fmtKm(rule.remainingKm)} km`;
  }
  if (rule.remainingDays != null) {
    return rule.remainingDays <= 0 ? `dépassé de ${Math.abs(rule.remainingDays)} j` : `dans ${rule.remainingDays} j`;
  }
  return "";
}

export default function AlertRow({ rule }) {
  const isOverdue = rule.status === "overdue";
  const color = isOverdue ? PALETTE.danger : PALETTE.warning;
  const Icon = isOverdue ? AlertTriangle : Clock;
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon size={16} color={color} />
        <span style={{ fontFamily: FONT_BODY, fontSize: 14, color: PALETTE.text }}>{rule.name}</span>
      </div>
      <span style={{ fontFamily: FONT_MONO, fontSize: 13, color }}>{remainingLabel(rule)}</span>
    </div>
  );
}
