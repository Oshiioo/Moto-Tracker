import { PALETTE, FONT_DISPLAY, FONT_BODY, FONT_MONO } from "../../theme/palette";
import { CONTENT_MAX_WIDTH } from "../../lib/constants";
import { fmtKm } from "../../lib/format";

export default function Header({ vehicle }) {
  return (
    <header
      style={{ borderBottom: `1px solid ${PALETTE.hairline}`, background: PALETTE.surface }}
      className="py-4"
    >
      <div
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          maxWidth: CONTENT_MAX_WIDTH,
          margin: "0 auto",
          padding: "0 20px",
          boxSizing: "border-box",
        }}
      >
        <div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 12, letterSpacing: "0.12em", color: PALETTE.primary }}>
            CARNET D'ENTRETIEN
          </div>
          <div style={{ fontFamily: FONT_DISPLAY, fontSize: 22, fontWeight: 600, color: PALETTE.text }}>
            {vehicle.name}
          </div>
        </div>
        <div className="text-right">
          <div style={{ fontFamily: FONT_MONO, fontSize: 26, fontWeight: 700, color: PALETTE.text, letterSpacing: "0.02em" }}>
            {fmtKm(vehicle.currentKm)}
          </div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: PALETTE.textMuted, letterSpacing: "0.05em" }}>
            KM AU COMPTEUR
          </div>
        </div>
      </div>
    </header>
  );
}
