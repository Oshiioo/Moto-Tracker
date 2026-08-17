import { PALETTE } from "./palette";

export default function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Work+Sans:wght@400;500;600&family=JetBrains+Mono:wght@500;700&display=swap');
      * { box-sizing: border-box; }
      html, body, #root { height: 100% !important; margin: 0 !important; }
      body { display: block !important; place-items: unset !important; min-width: 0 !important; }
      #root { max-width: none !important; padding: 0 !important; text-align: left !important; }
      button { background: none; border: none; font: inherit; color: inherit; cursor: pointer; padding: 0; -webkit-tap-highlight-color: transparent; }
      input, select { outline: none; }
      input:focus, select:focus { border-color: ${PALETTE.amber} !important; }
      ::placeholder { color: ${PALETTE.steelDim}; }
    `}</style>
  );
}
