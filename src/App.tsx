import { useState, useEffect } from "react";
import { HashRouter } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

import AppShell from "./components/layout/AppShell";
import LoginScreen from "./components/auth/LoginScreen";
import GarageGate from "./components/garage/GarageGate";
import { PALETTE, FONT_MONO } from "./theme/palette";

export default function MotoTracker() {
  const [user, setUser] = useState(undefined); // undefined = chargement, null = déconnecté

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return unsubscribe;
  }, []);

  if (user === undefined) {
    return (
      <AppShell>
        <div style={{ background: PALETTE.bg, height: "100dvh" }} className="flex items-center justify-center">
          <div style={{ color: PALETTE.steel, fontFamily: FONT_MONO }}>Chargement…</div>
        </div>
      </AppShell>
    );
  }

  if (user === null) {
    return (
      <AppShell>
        <LoginScreen />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <HashRouter>
        <GarageGate user={user} />
      </HashRouter>
    </AppShell>
  );
}
