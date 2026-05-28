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

export function buildWebSocketUrl(path: string): string {
  if (/^wss?:\/\//.test(path)) {
    return path;
  }

  if (/^https?:\/\//.test(path)) {
    const url = new URL(path);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    return url.toString();
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (apiBaseUrl) {
    const baseUrl = new URL(apiBaseUrl);
    const wsProtocol = baseUrl.protocol === "https:" ? "wss:" : "ws:";
    return `${wsProtocol}//${baseUrl.host}${normalizedPath}`;
  }

  const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${wsProtocol}//${window.location.host}${normalizedPath}`;
}
