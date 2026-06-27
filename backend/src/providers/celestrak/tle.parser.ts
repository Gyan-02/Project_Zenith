import { TleParseError } from "./celestrak.errors.js";
import type { TleRecord } from "./celestrak.types.js";

function catalogNumber(line: string): string {
  return line.slice(2, 7).trim();
}

export function parseTleCatalog(raw: string): TleRecord[] {
  const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const records: TleRecord[] = [];
  let index = 0;

  while (index < lines.length) {
    let name: string | undefined;
    if (!lines[index]?.startsWith("1 ")) {
      name = lines[index]?.replace(/^0\s+/, "").trim();
      index += 1;
    }

    const line1 = lines[index];
    const line2 = lines[index + 1];
    if (!line1?.startsWith("1 ") || !line2?.startsWith("2 ")) {
      throw new TleParseError(`Malformed TLE record near line ${index + 1}`);
    }

    const firstCatalog = catalogNumber(line1);
    const secondCatalog = catalogNumber(line2);
    if (!firstCatalog || firstCatalog !== secondCatalog) {
      throw new TleParseError(`TLE catalog number mismatch near line ${index + 1}`);
    }

    records.push({
      id: `sat-${firstCatalog}`,
      catalogNumber: firstCatalog,
      name: name || `Satellite ${firstCatalog}`,
      line1,
      line2,
    });
    index += 2;
  }

  if (records.length === 0) throw new TleParseError("CelesTrak returned no TLE records");
  return records;
}
