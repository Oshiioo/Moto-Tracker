// Types suivis mais sans rappel dédié (pas de règle intervalKm/intervalMonths)
export const EXTRA_KNOWN_TYPES = ["Pression des pneus"];

// Filet de sécurité : rattache les synonymes courants au bon type existant,
// même si Gemini répond avec une formulation légèrement différente
const TYPE_SYNONYMS = [
  { canonical: "Pression des pneus", keywords: ["pression", "gonfl"] },
  { canonical: "Usure pneu avant", keywords: ["usure", "avant"] },
  { canonical: "Usure pneu arrière", keywords: ["usure", "arrière", "arriere"] },
  { canonical: "Graissage de la chaîne", keywords: ["graiss"] },
  { canonical: "Tension de la chaîne", keywords: ["tension"] },
  { canonical: "Vidange", keywords: ["vidange", "huile moteur"] },
  { canonical: "Filtre à air", keywords: ["filtre à air", "filtre a air"] },
  { canonical: "Bougies", keywords: ["bougie"] },
  { canonical: "Contrôle plaquettes et disques", keywords: ["plaquette", "disque"] },
  { canonical: "Purge des liquides de frein", keywords: ["purge", "liquide de frein"] },
];

export function normalizeType(rawType, knownTypes) {
  if (!rawType) return rawType;
  const norm = rawType
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // 1. Correspondance exacte avec un type déjà connu (insensible accents/casse)
  const exact = knownTypes.find(
    (t) => t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === norm
  );
  if (exact) return exact;

  // 2. Correspondance par mots-clés/synonymes
  for (const { canonical, keywords } of TYPE_SYNONYMS) {
    if (knownTypes.includes(canonical) && keywords.some((k) => norm.includes(k))) {
      return canonical;
    }
  }

  // 3. Aucune correspondance : on garde tel quel, avec majuscule initiale
  return rawType.charAt(0).toUpperCase() + rawType.slice(1);
}
