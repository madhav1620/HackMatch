/** SQLite has no array columns — skills / techTags / requiredRoles are JSON strings.
 *  PROD-NOTE: on Postgres these become native String[] and helpers become no-ops. */

export function parseJsonArray<T = string>(raw: string | null | undefined): T[] {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? (v as T[]) : [];
  } catch {
    return [];
  }
}

export function toJsonArray(arr: string[] | undefined | null): string {
  return JSON.stringify(Array.isArray(arr) ? arr : []);
}
