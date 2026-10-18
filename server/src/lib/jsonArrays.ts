/** Skill / role / tag lists are native `String[]` columns on Postgres.
 *  These helpers only normalize defensively — a null column, or a stray legacy
 *  JSON string from an old row — so read paths never throw. */

export function toArray<T = string>(raw: readonly T[] | string | null | undefined): T[] {
  if (!raw) return [];
  if (typeof raw !== "string") return [...raw];
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? (v as T[]) : [];
  } catch {
    return [];
  }
}

/** Write-side normalizer: guarantee a well-formed `string[]` before persistence. */
export function toStrArray(arr: readonly string[] | undefined | null): string[] {
  return Array.isArray(arr) ? [...arr] : [];
}
