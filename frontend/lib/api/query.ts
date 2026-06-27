/**
 * GYA-30 – Query string builder.
 *
 * Converts a plain record into a URLSearchParams string.
 *
 * Rules:
 *  - `undefined`, `null`, and `""` are omitted.
 *  - Arrays are serialised by repeating the key (e.g. `type=a&type=b`).
 *  - Numbers and booleans are coerced to strings.
 *  - Date objects are converted to ISO-8601.
 */

export type QueryValue =
  | string
  | number
  | boolean
  | Date
  | null
  | undefined
  | Array<string | number | boolean>;

export type QueryParams = Record<string, QueryValue>;

/**
 * Build a URLSearchParams from a params object.
 * Returns an empty URLSearchParams when all values are omitted.
 */
export function buildQuery(params: QueryParams): URLSearchParams {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined && item !== null && item !== "") {
          search.append(key, String(item));
        }
      }
      continue;
    }

    if (value instanceof Date) {
      search.set(key, value.toISOString());
      continue;
    }

    search.set(key, String(value));
  }

  return search;
}
