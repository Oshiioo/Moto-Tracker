import { PALETTE } from "../../theme/palette";

export default function IconBadge({ icon: Icon, color = PALETTE.steel, size = 36 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `${color}22`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Icon size={Math.round(size * 0.5)} color={color} />
    </div>
  );
}
