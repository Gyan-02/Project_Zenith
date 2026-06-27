import type { IntentResult, NarrationResponse, SkyObject, SkyState } from "../contracts.js";
import { getSkyObjects } from "../sky-state/skyState.utils.js";

function normalizedNames(object: SkyObject): string[] {
  return [object.id, object.name].map((name) => name.toLowerCase());
}

export function resolveNavigationTarget(
  intent: IntentResult,
  skyState: SkyState,
): NarrationResponse["navigationTarget"] {
  if (intent.intent !== "object_search" || !intent.targetName) return null;

  const target = intent.targetName.toLowerCase();
  const object = getSkyObjects(skyState).find((candidate) => normalizedNames(candidate).includes(target));
  if (!object) return null;

  if (object.kind === "meteor_shower") return null;
  return { kind: object.kind, id: object.id, label: object.name };
}
