import { PALETTE, FONT_DISPLAY } from "../../theme/palette";

// Avatar rond d'une moto : photo si renseignée, sinon un rond de couleur
// avec l'initiale du nom (jamais de silhouette générique vide).
export default function VehicleAvatar({ photo, name, size = 40, color }) {
  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        background: color || PALETTE.surfaceRaised,
        border: color ? "none" : `1px solid ${PALETTE.hairline}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT_DISPLAY,
        fontWeight: 600,
        fontSize: size * 0.42,
        color: color ? "#fff" : PALETTE.textMuted,
      }}
    >
      {(name || "?").trim().charAt(0).toUpperCase()}
    </div>
  );
}
