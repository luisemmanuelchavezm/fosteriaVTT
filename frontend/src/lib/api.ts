const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() ?? "";

export function buildApiUrl(path: string): string {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (!apiBaseUrl) {
    return normalizedPath;
  }

  const normalizedBase = apiBaseUrl.endsWith("/")
    ? apiBaseUrl.slice(0, -1)
    : apiBaseUrl;

  return `${normalizedBase}${normalizedPath}`;
}
