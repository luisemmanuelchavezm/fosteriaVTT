export function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function uniqueNormalizedValues(values: string[]) {
  return values.filter(
    (value, index, allValues) =>
      allValues.findIndex(
        (entry) => normalizeText(entry) === normalizeText(value),
      ) === index,
  );
}

export function parseBiographySections(biography: string | null | undefined) {
  const rawBiography = (biography ?? "").trim();
  if (!rawBiography) {
    return { alignment: null, personalHistory: null };
  }

  const alignmentMatch = rawBiography.match(/Alineamiento:\s*(.+)/i);
  const historyMatch = rawBiography.match(/Historia personal:\s*([\s\S]+)/i);

  return {
    alignment: alignmentMatch?.[1]?.trim() || null,
    personalHistory: historyMatch?.[1]?.trim() || null,
  };
}
