export function normalizeCompetencyValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function inferToolCategory(value: string) {
  const normalized = normalizeCompetencyValue(value);
  if (
    normalized.includes("instrumento") ||
    normalized.includes("laud") ||
    normalized.includes("flauta") ||
    normalized.includes("tambor") ||
    normalized.includes("viola") ||
    normalized.includes("dulce") ||
    normalized.includes("cornamusa")
  ) {
    return "instrumentos" as const;
  }

  if (
    normalized.includes("juego") ||
    normalized.includes("dados") ||
    normalized.includes("cartas") ||
    normalized.includes("ajedrez") ||
    normalized.includes("dragones")
  ) {
    return "juegos" as const;
  }

  return "otros" as const;
}
