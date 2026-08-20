import { PALETTE } from "./palette";

export default function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Work+Sans:wght@400;500;600&family=JetBrains+Mono:wght@500;700&display=swap');
      * { box-sizing: border-box; }
      html, body, #root { height: 100% !important; margin: 0 !important; }
      body { display: block !important; place-items: unset !important; min-width: 0 !important; }
      #root { max-width: none !important; padding: 0 !important; text-align: left !important; }
      button { background: none; border: none; font: inherit; color: inherit; cursor: pointer; padding: 0; -webkit-tap-highlight-color: transparent; transition: transform 100ms ease; }
      button:active { transform: scale(0.96); }
      input, select { outline: none; }
      input:focus, select:focus { border-color: ${PALETTE.amber} !important; }
      ::placeholder { color: ${PALETTE.steelDim}; }

      @keyframes modalBackdropIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes modalPanelIn { from { opacity: 0; transform: translateY(12px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
      @keyframes tabContentIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes savedPop { 0% { transform: scale(0.9); opacity: 0; } 60% { transform: scale(1.03); opacity: 1; } 100% { transform: scale(1); } }
      @keyframes listeningPulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(201, 122, 43, 0.4); } 50% { box-shadow: 0 0 0 8px rgba(201, 122, 43, 0); } }

      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
      }
    `}</style>
  );
}
