export const GEMINI_MODEL = "gemini-3.6-flash";
// Clé lue depuis le fichier .env.local (voir instructions), jamais depuis l'interface
export const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

const ERROR_MESSAGES = {
  404: "Modèle Gemini introuvable (config à mettre à jour)",
  401: "Clé API invalide",
  403: "Clé API refusée (vérifie les restrictions dans AI Studio)",
  429: "Quota Gemini atteint pour aujourd'hui",
};

export async function geminiExtract(apiKey, { promptText, imageBase64, imageMimeType }) {
  const parts = [{ text: promptText }];
  if (imageBase64) parts.push({ inline_data: { mime_type: imageMimeType, data: imageBase64 } });
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    }
  );
  if (!res.ok) {
    throw new Error(ERROR_MESSAGES[res.status] || `Erreur Gemini (${res.status})`);
  }
  const data = await res.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error("Réponse vide, réessaie");
  return JSON.parse(raw);
}

// Variante avec recherche web activée (grounding) — l'API ne permet pas de combiner
// la recherche avec le mode JSON strict, donc on demande le JSON dans le prompt
// et on extrait/parse la réponse de façon tolérante.
export async function geminiSearchExtract(apiKey, promptText) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        tools: [{ google_search: {} }],
      }),
    }
  );
  if (!res.ok) {
    throw new Error(ERROR_MESSAGES[res.status] || `Erreur Gemini (${res.status})`);
  }
  const searchData = await res.json();
  const searchRaw = searchData?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!searchRaw) throw new Error("Réponse vide, réessaie");
  const match = searchRaw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Réponse inattendue, réessaie");
  return JSON.parse(match[0]);
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
