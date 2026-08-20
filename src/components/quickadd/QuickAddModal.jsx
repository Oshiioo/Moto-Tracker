import { useState, useRef, useEffect } from "react";
import { Camera, Mic, Square } from "lucide-react";
import Modal from "../ui/Modal";
import Field from "../ui/Field";
import { PALETTE, FONT_BODY, inputStyle, submitStyle, aiButtonStyle } from "../../theme/palette";
import { geminiExtract, fileToBase64, GEMINI_CONFIGURED } from "../../lib/gemini";
import { normalizeType, EXTRA_KNOWN_TYPES } from "../../lib/typeNormalization";

const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;

export default function QuickAddModal({ rules, defaultKm, onClose, onAddFuel, onAddMaintenance }) {
  const [stage, setStage] = useState("input"); // input | review
  const [text, setText] = useState("");
  const [status, setStatus] = useState("idle"); // idle | busy | error
  const [error, setError] = useState("");
  const [kind, setKind] = useState("fuel");
  const [form, setForm] = useState({});
  const [listening, setListening] = useState(false);
  const fileRef = useRef(null);
  const recognitionRef = useRef(null);
  const baseTextRef = useRef("");

  const startListening = () => {
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "fr-FR";
    recognition.interimResults = true;
    recognition.continuous = false;
    baseTextRef.current = text.trim();
    recognition.onresult = (e) => {
      let transcript = "";
      for (let i = 0; i < e.results.length; i++) transcript += e.results[i][0].transcript;
      setText(baseTextRef.current ? `${baseTextRef.current} ${transcript}` : transcript);
    };
    recognition.onerror = (e) => {
      if (e.error !== "no-speech" && e.error !== "aborted") {
        setError(e.error === "not-allowed" ? "Micro refusé, vérifie les autorisations" : "Échec de la dictée, réessaie");
        setStatus("error");
      }
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    setListening(true);
    setStatus("idle");
    setError("");
    recognition.start();
  };

  const toggleListening = () => {
    if (listening) {
      recognitionRef.current?.stop();
    } else {
      startListening();
    }
  };

  // Démarre l'écoute automatiquement à l'ouverture — la modale n'a que cet
  // usage (dictée rapide), pas besoin d'un tap supplémentaire ni du clavier.
  useEffect(() => {
    if (SpeechRecognitionCtor) startListening();
    return () => recognitionRef.current?.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ruleNames = rules.map((r) => r.name);
  const pickerRuleNames = rules.filter((r) => !r.hideFromPicker).map((r) => r.name);
  const knownTypes = [...ruleNames, ...EXTRA_KNOWN_TYPES.filter((t) => !ruleNames.includes(t))];
  const visibleTypes = [...pickerRuleNames, ...EXTRA_KNOWN_TYPES.filter((t) => !pickerRuleNames.includes(t))];
  const classifyPrompt = `Tu es un assistant qui classe une dictée ou une photo en français sur le suivi d'une moto (plein d'essence ou entretien). Réponds uniquement en JSON strict, sans texte autour, avec les clés :
kind ("fuel" ou "maintenance" selon le sujet),
km (nombre, kilométrage au compteur si mentionné/visible, sinon null),
liters (nombre, uniquement pertinent si kind="fuel", sinon null),
price (nombre, prix total en euros si mentionné, sinon null),
type (chaîne, uniquement pertinent si kind="maintenance" — reprends EXACTEMENT un de ces types si le sens correspond, même reformulé/synonyme : ${knownTypes.join(", ")} — par exemple "gonflage" ou "vérifier la pression" correspondent à "Pression des pneus" ; sinon une courte description, sinon null),
note (chaîne, détails complémentaires, sinon null),
date (chaîne au format AAAA-MM-JJ si une date est mentionnée, sinon null).
Un plein d'essence évoque des litres ou de l'essence. Un entretien évoque une intervention mécanique (vidange, chaîne, plaquettes, pneus, filtre, bougies, liquide, pression...).`;

  const applyResult = (r) => {
    const detectedKind = r.kind === "maintenance" ? "maintenance" : "fuel";
    setKind(detectedKind);
    setForm({
      date: r.date || new Date().toISOString().slice(0, 10),
      km: r.km != null ? String(r.km) : String(defaultKm || ""),
      liters: r.liters != null ? String(r.liters) : "",
      price: r.price != null ? String(r.price) : "",
      type: r.type ? normalizeType(r.type, knownTypes) : pickerRuleNames[0] || "",
      note: r.note || "",
      cost: r.price != null && detectedKind === "maintenance" ? String(r.price) : "",
    });
    setStage("review");
    setStatus("idle");
  };

  const runExtraction = async (payload) => {
    if (!GEMINI_CONFIGURED) {
      setError("Assistant IA non configuré (voir Réglages)");
      setStatus("error");
      return;
    }
    setStatus("busy");
    setError("");
    try {
      const result = await geminiExtract(payload);
      applyResult(result);
    } catch (e) {
      setError(e.message || "Échec de l'analyse, réessaie");
      setStatus("error");
    }
  };

  const onAnalyzeText = () => {
    if (!text.trim()) return;
    runExtraction({ promptText: `${classifyPrompt}\n\nTranscription : "${text.trim()}"` });
  };

  const onFileChange = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    const base64 = await fileToBase64(file);
    runExtraction({ promptText: classifyPrompt, imageBase64: base64, imageMimeType: file.type });
  };

  const onSave = () => {
    if (!form.km) return;
    if (kind === "fuel") {
      if (!form.liters) return;
      onAddFuel({ date: form.date, km: form.km, liters: form.liters, price: form.price });
    } else {
      if (!form.type) return;
      onAddMaintenance({ date: form.date, km: form.km, type: form.type, note: form.note, cost: form.cost });
    }
    onClose();
  };

  return (
    <Modal title="Dictée rapide" onClose={onClose}>
      {stage === "input" && (
        <div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: PALETTE.textMuted }} className="mb-3">
            Décris ce qui vient de se passer — un plein ou un entretien — je détecte automatiquement lequel.
          </div>
          {SpeechRecognitionCtor && (
            <button
              type="button"
              onClick={toggleListening}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                width: "100%",
                padding: "12px",
                borderRadius: 10,
                marginBottom: 10,
                fontFamily: FONT_BODY,
                fontSize: 13,
                fontWeight: 600,
                border: `1px solid ${listening ? PALETTE.amber : PALETTE.hairline}`,
                background: listening ? PALETTE.amber : PALETTE.surface,
                color: listening ? "#1B1A17" : PALETTE.text,
              }}
            >
              {listening ? <Square size={16} /> : <Mic size={16} />}
              {listening ? "Écoute… (touche pour arrêter)" : "Dicter"}
            </button>
          )}
          <textarea
            style={{ ...inputStyle, minHeight: 90, resize: "vertical" }}
            placeholder="Ex. « plein de 12 litres, 22 euros, 69 100 kilomètres » ou « graissage chaîne fait aujourd'hui »"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={onAnalyzeText}
              disabled={status === "busy" || !text.trim()}
              style={{ ...submitStyle, marginTop: 0, flex: 1, opacity: !text.trim() ? 0.5 : 1 }}
            >
              {status === "busy" ? "Analyse…" : "Analyser"}
            </button>
            <button
              type="button"
              disabled={status === "busy"}
              onClick={() => fileRef.current?.click()}
              style={{ ...aiButtonStyle, padding: "0 16px" }}
            >
              <Camera size={16} />
            </button>
          </div>
          <input type="file" accept="image/*" capture="environment" ref={fileRef} style={{ display: "none" }} onChange={onFileChange} />
          {status === "error" && (
            <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: PALETTE.danger }} className="mt-2">
              {error}
            </div>
          )}
        </div>
      )}

      {stage === "review" && (
        <div>
          <div style={{ fontFamily: FONT_BODY, fontSize: 12, color: PALETTE.textMuted }} className="mb-2">
            J'ai compris :
          </div>
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => setKind("fuel")}
              style={{
                flex: 1,
                padding: "8px 10px",
                borderRadius: 8,
                fontFamily: FONT_BODY,
                fontSize: 12,
                fontWeight: 600,
                background: kind === "fuel" ? PALETTE.amber : PALETTE.surface,
                color: kind === "fuel" ? "#1B1A17" : PALETTE.textMuted,
                border: `1px solid ${PALETTE.hairline}`,
              }}
            >
              ⛽ Plein d'essence
            </button>
            <button
              type="button"
              onClick={() => setKind("maintenance")}
              style={{
                flex: 1,
                padding: "8px 10px",
                borderRadius: 8,
                fontFamily: FONT_BODY,
                fontSize: 12,
                fontWeight: 600,
                background: kind === "maintenance" ? PALETTE.amber : PALETTE.surface,
                color: kind === "maintenance" ? "#1B1A17" : PALETTE.textMuted,
                border: `1px solid ${PALETTE.hairline}`,
              }}
            >
              🔧 Entretien
            </button>
          </div>

          <Field label="Date">
            <input style={inputStyle} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </Field>
          <Field label="Kilométrage">
            <input style={inputStyle} type="number" value={form.km} onChange={(e) => setForm({ ...form, km: e.target.value })} />
          </Field>

          {kind === "fuel" ? (
            <>
              <Field label="Litres">
                <input style={inputStyle} type="number" step="0.01" value={form.liters} onChange={(e) => setForm({ ...form, liters: e.target.value })} />
              </Field>
              <Field label="Prix total (€) — optionnel">
                <input style={inputStyle} type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
              </Field>
            </>
          ) : (
            <>
              <Field label="Type d'entretien">
                <input
                  style={inputStyle}
                  type="text"
                  list="quickadd-maint-types"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                />
                <datalist id="quickadd-maint-types">
                  {visibleTypes.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </Field>
              <Field label="Note — optionnel">
                <input style={inputStyle} type="text" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
              </Field>
              <Field label="Coût (€) — optionnel">
                <input style={inputStyle} type="number" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
              </Field>
            </>
          )}

          <div className="flex gap-2 mt-2">
            <button type="button" onClick={() => setStage("input")} style={{ ...aiButtonStyle, flex: 1, justifyContent: "center" }}>
              Redicter
            </button>
            <button type="button" onClick={onSave} style={{ ...submitStyle, marginTop: 0, flex: 2 }}>
              Enregistrer
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
