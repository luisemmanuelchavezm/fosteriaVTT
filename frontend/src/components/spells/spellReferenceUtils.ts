export interface SpellReferenceItem {
  displayText: string;
  lookupName: string;
  prefix?: string;
}

function normalizeValue(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function normalizeChoiceCatalog(catalog: string | null | undefined) {
  const normalizedCatalog = normalizeValue(catalog);

  switch (normalizedCatalog) {
    case "spells":
    case "conjuros":
      return "conjuros";
    case "cantrips":
    case "trucos":
      return "trucos";
    case "wizardcantrips":
    case "trucosdemago":
      return "trucosdemago";
    case "skills":
    case "habilidades":
      return "habilidades";
    case "languages":
    case "idiomas":
      return "idiomas";
    case "abilityscores":
    case "puntuacionescaracteristica":
      return "puntuacionescaracteristica";
    case "artisantools":
    case "herramientasartesano":
      return "herramientasartesano";
    case "games":
    case "juegos":
      return "juegos";
    case "instruments":
    case "instrumentos":
      return "instrumentos";
    case "draconicancestors":
    case "ancestrosdraconicos":
      return "ancestrosdraconicos";
    default:
      return normalizedCatalog;
  }
}

export function isSpellChoiceCatalog(catalog: string | null | undefined) {
  const normalizedCatalog = normalizeChoiceCatalog(catalog);
  return (
    normalizedCatalog === "conjuros" ||
    normalizedCatalog === "trucos" ||
    normalizedCatalog === "trucosdemago"
  );
}

export function hasSpellLikeTags(tags: string | null | undefined) {
  return (tags ?? "")
    .split(",")
    .map((tag) => normalizeValue(tag))
    .some((tag) => tag === "conjuro" || tag === "truco");
}

export function isSpellReferenceColumn(columnName: string | null | undefined) {
  const normalizedColumnName = normalizeValue(columnName);
  return (
    normalizedColumnName.includes("conjuro") ||
    normalizedColumnName.includes("truco")
  );
}

export function extractSpellReferenceItems(text: string): SpellReferenceItem[] {
  const cleanText = text.trim();
  if (!cleanText || /\d/.test(cleanText)) {
    return [];
  }

  const cantripMatch = cleanText.match(/^truco\s+(.+)$/i);
  if (cantripMatch?.[1]) {
    const lookupName = cantripMatch[1].trim();
    return lookupName
      ? [{ displayText: lookupName, lookupName, prefix: "Truco" }]
      : [];
  }

  const items = cleanText
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (items.length > 1) {
    return items.map((item) => ({ displayText: item, lookupName: item }));
  }

  return [{ displayText: cleanText, lookupName: cleanText }];
}
