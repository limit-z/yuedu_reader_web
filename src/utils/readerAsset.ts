/** Resolve reader media paths through the same gateway prefix as API requests. */
export function resolveReaderAssetUrl(path?: string | null): string {
  if (!path) return '';
  if (/^(?:https?:|data:|blob:)/i.test(path)) return path;
  if (path.startsWith('/dev-api/') || path.startsWith('/prod-api/')) return path;
  const baseApi = import.meta.env.VITE_APP_BASE_API || '';
  return path.startsWith('/') ? `${baseApi}${path}` : `${baseApi}/${path}`;
}
