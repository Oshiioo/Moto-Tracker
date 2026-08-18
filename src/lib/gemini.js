// L'app ne détient plus jamais la clé Gemini — elle appelle un Worker Cloudflare
// qui garde la clé en secret côté serveur et relaie la requête à Gemini.
const WORKER_URL = import.meta.env.VITE_GEMINI_WORKER_URL || "";
const WORKER_SECRET = import.meta.env.VITE_GEMINI_WORKER_SECRET || "";

export const GEMINI_CONFIGURED = !!(WORKER_URL && WORKER_SECRET);

const ERROR_MESSAGES = {
  401: "Accès refusé par le proxy (secret partagé incorrect)",
  404: "Worker introuvable (vérifie VITE_GEMINI_WORKER_URL)",
  429: "Quota Gemini atteint pour aujourd'hui",
};

async function callWorker(body) {
  if (!GEMINI_CONFIGURED) {
    throw new Error("Worker Gemini non configuré (voir Réglages)");
  }
  const res = await fetch(WORKER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shared-Secret": WORKER_SECRET,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(ERROR_MESSAGES[res.status] || `Erreur (${res.status})`);
  }
  const data = await res.json();
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error("Réponse vide, réessaie");
  return raw;
}

export async function geminiExtract({ promptText, imageBase64, imageMimeType }) {
  const parts = [{ text: promptText }];
  if (imageBase64) parts.push({ inline_data: { mime_type: imageMimeType, data: imageBase64 } });
  const raw = await callWorker({
    contents: [{ parts }],
    generationConfig: { responseMimeType: "application/json" },
  });
  return JSON.parse(raw);
}

// Variante avec recherche web activée (grounding) — l'API ne permet pas de combiner
// la recherche avec le mode JSON strict, donc on demande le JSON dans le prompt
// et on extrait/parse la réponse de façon tolérante.
export async function geminiSearchExtract(promptText) {
  const raw = await callWorker({
    contents: [{ parts: [{ text: promptText }] }],
    tools: [{ google_search: {} }],
  });
  const match = raw.match(/\{[\s\S]*\}/);
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
