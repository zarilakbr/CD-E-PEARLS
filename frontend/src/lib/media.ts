/**
 * Media URL resolution utility for CD'E Pearls.
 * Converts relative storage paths (/storage/... or storage/...) into absolute URLs
 * pointing to the API origin (derived from VITE_API_URL or VITE_API_BASE_URL without /api/v1).
 * Preserves already-absolute URLs (http://, https://, data:, blob:).
 */

export function getApiOrigin(): string {
  const apiUrl =
    (typeof import.meta !== 'undefined' &&
      import.meta.env &&
      (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL)) ||
    'https://api.cdepearlslombok.id/api/v1';

  return apiUrl.replace(/\/api(\/v1)?\/?$/i, '').replace(/\/+$/, '');
}

/**
 * Resolves a media path to a full URL.
 * - If url is falsy, returns fallback or empty string.
 * - If url is already absolute (http://, https://, data:, blob:), returns it unchanged.
 * - If url starts with /storage or storage/, resolves to ${apiOrigin}/${path}.
 * - Other relative paths (e.g. local assets /images/...) are returned unchanged.
 */
export function resolveMediaUrl(url?: string | null, fallback = ''): string {
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return fallback;
  }

  const trimmed = url.trim();

  // Return absolute or data/blob URLs as is
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  // Handle /storage/... or storage/...
  if (trimmed.startsWith('/storage') || trimmed.startsWith('storage/')) {
    const origin = getApiOrigin();
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${origin}${cleanPath}`;
  }

  // Return other relative paths (e.g. /images/...) as is
  return trimmed;
}

/**
 * Resolves the WebP version of a media path.
 * If the URL already ends with .webp, returns the resolved URL.
 * If it ends with .jpg, .jpeg, or .png, replaces the extension with .webp.
 */
export function resolveWebpUrl(url?: string | null, fallback = ''): string {
  const resolved = resolveMediaUrl(url, fallback);
  if (!resolved) return fallback;
  if (resolved.toLowerCase().endsWith('.webp')) return resolved;
  return resolved.replace(/\.(jpg|jpeg|png)$/i, '.webp');
}
