import { useState } from "react";
import { Loader2 } from "lucide-react";
import Field from "../ui/Field";
import { PALETTE, FONT_BODY, inputStyle, submitStyle, aiButtonStyle } from "../../theme/palette";
import { uid } from "../../lib/format";
import { geminiSearchExtract, GEMINI_CONFIGURED } from "../../lib/gemini";
import { normalizeType } from "../../lib/typeNormalization";

// Valeurs de départ génériques (pas spécifiques à une marque) — proposées à
// chaque ajout de moto pour que la liste ne soit jamais vide, y compris quand
// la recherche IA ne trouve rien (modèle récent/rare, quota, hors ligne...).
const GENERIC_SUGGESTIONS = [
  { name: "Vidange", intervalKm: 10000, intervalMonths: 12 },
  { name: "Filtre à air", intervalKm: 15000 },
  { name: "Bougies", intervalKm: 20000 },
  { name: "Graissage de la chaîne", intervalKm: 1000 },
  { name: "Tension de la chaîne", intervalKm: 1000 },
  { name: "Contrôle plaquettes et disques", intervalMonths: 12 },
  { name: "Purge des liquides de frein", intervalMonths: 24 },
  { name: "Liquide de refroidissement", intervalMonths: 24 },
  { name: "Entretien annuel", intervalMonths: 12 },
];

const SOURCE_LABELS = {
  generic: { label: "générique", color: PALETTE.textMuted },
  brand: { label: "estimé marque", color: PALETTE.yellow },
  model: { label: "modèle", color: PALETTE.ok },
};

const toSuggestion = (it, source = "generic") => ({
  id: uid(),
  name: it.name,
  intervalKm: it.intervalKm || "",
  intervalMonths: it.intervalMonths || "",
  checked: true,
  source,
});

// Complète la liste courante avec les résultats IA : met à jour l'intervalle
// d'une entrée existante si le nom correspond (mêmes synonymes que la saisie
// manuelle), sinon ajoute une nouvelle entrée. Ne supprime jamais rien.
const mergeSuggestions = (current, items) => {
  const next = [...current];
  for (const it of items) {
    if (!it.name || (!it.intervalKm && !it.intervalMonths)) continue;
    const source = it.source === "brand" ? "brand" : "model";
    const matchedName = normalizeType(it.name, next.map((s) => s.name));
    const idx = next.findIndex((s) => s.name === matchedName);
    if (idx >= 0) next[idx] = { ...next[idx], intervalKm: it.intervalKm || "", intervalMonths: it.intervalMonths || "", checked: true, source };
    else next.push(toSuggestion(it, source));
  }
  return next;
};

export default function AddVehicleForm({ onSubmit }) {
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [currentKm, setCurrentKm] = useState("");
  const [acquisitionDate, setAcquisitionDate] = useState(new Date().toISOString().slice(0, 10));
  const [searchStatus, setSearchStatus] = useState("idle"); // idle | busy | done | error
  const [searchError, setSearchError] = useState("");
  const [suggestions, setSuggestions] = useState(() => GENERIC_SUGGESTIONS.map(toSuggestion)); // [{ id, name, intervalKm, intervalMonths, checked }]

  const canSearch = GEMINI_CONFIGURED && brand.trim() && model.trim();

  const runSearch = async () => {
    setSearchStatus("busy");
    setSearchError("");
    const promptText = `Cherche sur le web les préconisations d'entretien constructeur pour une moto ${brand.trim()} ${model.trim()} ${year.trim()}.
Pour chaque poste d'entretien, applique cet ordre de priorité :
1. Si tu trouves l'intervalle officiel du plan de maintenance de ce modèle précis, utilise-le avec "source": "model".
2. Sinon, si tu connais l'intervalle générique/typique pratiqué par la marque ${brand.trim()} sur sa gamme (ex. beaucoup de BMW routent à 10 000 km, beaucoup de Honda à 12 000 km), utilise-le avec "source": "brand".
3. Si tu n'as ni l'un ni l'autre avec un minimum de confiance, ignore ce poste plutôt que d'inventer un chiffre.
Réponds uniquement avec un objet JSON strict, sans texte ni markdown autour, de cette forme exacte :
{"items": [{"name": "Vidange", "intervalKm": 12000, "intervalMonths": null, "source": "model"}, ...]}
Utilise de préférence ces noms s'ils correspondent : Vidange, Filtre à air, Bougies, Graissage de la chaîne, Tension de la chaîne, Contrôle plaquettes et disques, Purge des liquides de frein, Liquide de refroidissement, Entretien annuel — sinon un nom court et clair. intervalKm et intervalMonths sont des nombres ou null (au moins un des deux renseigné par entrée).`;
    try {
      const result = await geminiSearchExtract(promptText);
      const items = Array.isArray(result?.items) ? result.items : [];
      setSuggestions((current) => mergeSuggestions(current, items));
      setSearchStatus("done");
      if (items.length === 0) setSearchError("Aucune préconisation constructeur trouvée pour ce modèle — la liste ci-dessous reste éditable manuellement.");
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
        onSubmit(name.trim(), currentKm, rules, acquisitionDate);
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
      <Field label="Date d'achat">
        <input style={inputStyle} type="date" value={acquisitionDate} onChange={(e) => setAcquisitionDate(e.target.value)} />
      </Field>

      <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: PALETTE.textMuted }} className="mb-2 mt-1">
        Une liste d'entretiens générique est proposée plus bas, à corriger librement. Optionnel : renseigne la marque/le modèle pour l'affiner via une recherche des préconisations constructeur.
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
      {searchError && (
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
            {searchStatus === "done"
              ? "⚠ Intervalles complétés via recherche web — à vérifier auprès du constructeur ou de la notice avant de t'y fier. Décoche ou corrige ce qui te semble incertain."
              : "⚠ Valeurs génériques de départ, non spécifiques à ta moto — à corriger ou décocher. Renseigne marque/modèle ci-dessus pour tenter de les affiner automatiquement."}
          </div>
          <div className="space-y-2">
            {suggestions.map((s) => (
              <div key={s.id} style={{ background: PALETTE.surface, border: `1px solid ${PALETTE.hairline}`, borderRadius: 8 }} className="p-3">
                <label className="flex items-center gap-2 mb-2">
                  <input type="checkbox" checked={s.checked} onChange={(e) => updateSuggestion(s.id, { checked: e.target.checked })} />
                  <input
                    style={{ ...inputStyle, flex: 1, padding: "6px 8px" }}
                    type="text"
                    value={s.name}
                    onChange={(e) => updateSuggestion(s.id, { name: e.target.value })}
                  />
                  <span
                    style={{
                      fontFamily: FONT_BODY,
                      fontSize: 10,
                      fontWeight: 600,
                      color: SOURCE_LABELS[s.source]?.color || PALETTE.textMuted,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {SOURCE_LABELS[s.source]?.label || "générique"}
                  </span>
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
