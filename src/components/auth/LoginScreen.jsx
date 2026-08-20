import { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { Bike } from "lucide-react";
import { auth, googleProvider } from "../../firebase";
import { PALETTE, FONT_DISPLAY, FONT_BODY } from "../../theme/palette";

export default function LoginScreen() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onLogin = async () => {
    setError("");
    setBusy(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      console.error("Erreur de connexion Firebase :", e);
      setError(`${e.code || "Erreur"} — ${e.message || "réessaie"}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ background: PALETTE.bg, height: "100dvh" }} className="flex flex-col items-center justify-center px-6">
      <div
        style={{ background: PALETTE.surfaceRaised, border: `1px solid ${PALETTE.hairline}`, borderRadius: 16, padding: 8 }}
        className="mb-4"
      >
        <Bike size={32} color={PALETTE.primarySoft} />
      </div>
      <div style={{ fontFamily: FONT_DISPLAY, fontSize: 24, fontWeight: 600, color: PALETTE.text }} className="mb-1 text-center">
        Carnet d'entretien
      </div>
      <div style={{ fontFamily: FONT_BODY, fontSize: 13, color: PALETTE.textMuted }} className="mb-8 text-center">
        Connecte-toi pour accéder à ton garage.
      </div>
      <button
        onClick={onLogin}
        disabled={busy}
        style={{
          background: PALETTE.primary,
          color: "#FFFFFF",
          fontFamily: FONT_BODY,
          fontWeight: 600,
          fontSize: 14,
          borderRadius: 8,
          padding: "12px 24px",
          opacity: busy ? 0.6 : 1,
        }}
      >
        {busy ? "Connexion…" : "Se connecter avec Google"}
      </button>
      {error && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: PALETTE.danger, maxWidth: 320 }} className="mt-4 text-center">
          {error}
        </div>
      )}
    </div>
  );
}
