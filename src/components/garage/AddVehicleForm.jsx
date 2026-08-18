import { useState } from "react";
import { Loader2 } from "lucide-react";
import Field from "../ui/Field";
import { PALETTE, FONT_BODY, inputStyle, submitStyle, aiButtonStyle } from "../../theme/palette";
import { uid } from "../../lib/format";
import { geminiSearchExtract, GEMINI_CONFIGURED } from "../../lib/gemini";

export default function AddVehicleForm({ onSubmit }) {
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [currentKm, setCurrentKm] = useState("");
  const [searchStatus, setSearchStatus] = useState("idle"); // idle | busy | done | error
  const [searchError, setSearchError] = useState("");
  const [suggestions, setSuggestions] = useState([]); // [{ id, name, intervalKm, intervalMonths, checked }]

  const canSearch = GEMINI_CONFIGURED && brand.trim() && model.trim();

  const runSearch = async () => {
    setSearchStatus("busy");
    setSearchError("");
    const promptText = `Cherche sur le web les préconisations d'entretien constructeur (plan de maintenance officiel) pour une moto ${brand.trim()} ${model.trim()} ${year.trim()}. Réponds uniquement avec un objet JSON strict, sans texte ni markdown autour, de cette forme exacte :
{"items": [{"name": "Vidange", "intervalKm": 12000, "intervalMonths": null}, ...]}
Utilise de préférence ces noms s'ils correspondent : Vidange, Filtre à air, Bougies, Graissage de la chaîne, Tension de la chaîne, Contrôle plaquettes et disques, Purge des liquides de frein, Liquide de refroidissement, Entretien annuel — sinon un nom court et clair. intervalKm et intervalMonths sont des nombres ou null (au moins un des deux renseigné par entrée). N'inclus que les intervalles dont tu es raisonnablement sûr à partir de sources fiables (constructeur, notices, revendeurs officiels).`;
    try {
      const result = await geminiSearchExtract(promptText);
      const items = Array.isArray(result?.items) ? result.items : [];
      setSuggestions(
        items
          .filter((it) => it.name && (it.intervalKm || it.intervalMonths))
          .map((it) => ({
            id: uid(),
            name: it.name,
            intervalKm: it.intervalKm || "",
            intervalMonths: it.intervalMonths || "",
            checked: true,
          }))
      );
      setSearchStatus("done");
    } catch (e) {
      setSearchError(e.message || "Échec de la recherche, réessaie");
      setSearchStatus("error");
    }
  };

  const updateSuggestion = (id, patch) => {
    setSuggestions((list) => list.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        const rules = suggestions
          .filter((s) => s.checked)
          .map((s) => ({
            id: uid(),
            name: s.name,
            ...(s.intervalKm ? { intervalKm: Number(s.intervalKm) } : {}),
            ...(s.intervalMonths ? { intervalMonths: Number(s.intervalMonths) } : {}),
          }));
        onSubmit(name.trim(), currentKm, rules);
      }}
    >
      <Field label="Nom de la moto">
        <input
          style={inputStyle}
          type="text"
          placeholder="ex. Ducati Monster"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </Field>
      <Field label="Kilométrage actuel">
        <input style={inputStyle} type="number" placeholder="ex. 0" value={currentKm} onChange={(e) => setCurrentKm(e.target.value)} />
      </Field>

      <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: PALETTE.textMuted }} className="mb-2 mt-1">
        Optionnel : recherche automatique des intervalles d'entretien constructeur.
      </div>
      <div className="flex gap-2 mb-2">
        <input style={{ ...inputStyle, flex: 1 }} type="text" placeholder="Marque" value={brand} onChange={(e) => setBrand(e.target.value)} />
        <input style={{ ...inputStyle, flex: 1 }} type="text" placeholder="Modèle" value={model} onChange={(e) => setModel(e.target.value)} />
        <input style={{ ...inputStyle, width: 90 }} type="text" placeholder="Année" value={year} onChange={(e) => setYear(e.target.value)} />
      </div>
      <button
        type="button"
        disabled={!canSearch || searchStatus === "busy"}
        onClick={runSearch}
        style={{ ...aiButtonStyle, width: "100%", justifyContent: "center", opacity: !canSearch ? 0.5 : 1, marginBottom: 12 }}
      >
        {searchStatus === "busy" ? (
          <>
            <Loader2 size={14} className="animate-spin" /> Recherche en cours…
          </>
        ) : (
          "Rechercher les intervalles constructeur"
        )}
      </button>
      {!GEMINI_CONFIGURED && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: PALETTE.textMuted }} className="mb-3">
          Assistant IA non configuré — la recherche n'est pas disponible, tu peux ajouter les intervalles manuellement après coup.
        </div>
      )}
      {searchStatus === "error" && (
        <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: PALETTE.danger }} className="mb-3">
          {searchError}
        </div>
      )}

      {suggestions.length > 0 && (
        <div className="mb-3">
          <div
            style={{
              background: PALETTE.surface,
              border: `1px solid ${PALETTE.yellow}`,
              borderRadius: 8,
              padding: "8px 12px",
              fontFamily: FONT_BODY,
              fontSize: 11,
              color: PALETTE.yellow,
            }}
            className="mb-2"
          >
            ⚠ Intervalles générés automatiquement via recherche web — à vérifier auprès du constructeur ou de la notice avant de t'y fier. Décoche ou corrige ce qui te semble incertain.
          </div>
          <div className="space-y-2">
            {suggestions.map((s) => (
              <div key={s.id} style={{ background: PALETTE.surface, border: `1px solid ${PALETTE.hairline}`, borderRadius: 8 }} className="p-2">
                <label className="flex items-center gap-2 mb-2">
                  <input type="checkbox" checked={s.checked} onChange={(e) => updateSuggestion(s.id, { checked: e.target.checked })} />
                  <input
                    style={{ ...inputStyle, flex: 1, padding: "6px 8px" }}
                    type="text"
                    value={s.name}
                    onChange={(e) => updateSuggestion(s.id, { name: e.target.value })}
                  />
                </label>
                <div className="flex gap-2 pl-6">
                  <input
                    style={{ ...inputStyle, flex: 1, padding: "6px 8px" }}
                    type="number"
                    placeholder="km"
                    value={s.intervalKm}
                    onChange={(e) => updateSuggestion(s.id, { intervalKm: e.target.value })}
                  />
                  <input
                    style={{ ...inputStyle, flex: 1, padding: "6px 8px" }}
                    type="number"
                    placeholder="mois"
                    value={s.intervalMonths}
                    onChange={(e) => updateSuggestion(s.id, { intervalMonths: e.target.value })}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button type="submit" style={submitStyle}>Ajouter au garage</button>
    </form>
  );
}
