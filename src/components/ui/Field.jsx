import { PALETTE, FONT_BODY } from "../../theme/palette";

export default function Field({ label, children }) {
  return (
    <div className="mb-3">
      <label style={{ fontFamily: FONT_BODY, fontSize: 12, color: PALETTE.textMuted }} className="block mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}
