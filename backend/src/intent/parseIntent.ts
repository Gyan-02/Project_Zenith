import type { IntentResult, NarratorIntent } from "../contracts.js";

const KNOWN_TARGETS: Record<string, string> = {
  iss: "ISS",
  "international space station": "ISS",
  saturn: "Saturn",
  shani: "Saturn",
  jupiter: "Jupiter",
  brihaspati: "Jupiter",
  moon: "Moon",
  chandra: "Moon",
  orion: "Orion",
};

function findTarget(query: string): string | null {
  const normalized = query.toLowerCase();
  const match = Object.entries(KNOWN_TARGETS).find(([alias]) => normalized.includes(alias));
  return match?.[1] ?? null;
}

function result(intent: NarratorIntent, confidence: number, targetName: string | null, delegated = false): IntentResult {
  return { intent, confidence, targetName, delegated };
}

export async function parseIntent(
  query: string,
  context: { selectedObjectId?: string } = {},
): Promise<IntentResult> {
  const normalized = query.trim().toLowerCase();
  const targetName = findTarget(normalized) ?? context.selectedObjectId ?? null;

  if (/\b(1969|1910|2014|1999|2020|histor|past|ago|rewind|when did)\b/.test(normalized)) {
    return result("historical", 0.96, targetName, true);
  }

  if (/\b(next|upcoming|predict|pass|flyover|eclipse|meteor|conjunction|tonight)\b/.test(normalized)) {
    return result("prediction", 0.95, targetName, true);
  }

  if (/\b(show|find|locate|where is|point to|highlight|take me to)\b/.test(normalized)) {
    return result("object_search", targetName ? 0.98 : 0.78, targetName);
  }

  if (/\b(what is|explain|teach|why|how|fact|distance|radius|orbit)\b/.test(normalized)) {
    return result("education", 0.9, targetName);
  }

  return result("sky_exploration", 0.82, targetName);
}
