import type { IntentResult, SkyState } from "../contracts.js";
import type { RetrievedKnowledge } from "../knowledge/store.js";

export function buildNarratorPrompt(input: {
  query: string;
  intent: IntentResult;
  skyState: SkyState;
  knowledge: RetrievedKnowledge[];
}): string {
  return `You are the Cosmic Narrator for Project Zenith.

NON-NEGOTIABLE GROUNDING RULES:
- Coordinates, visibility, distance, location and time may only come from SKY_STATE.
- Never calculate or estimate astronomical positions.
- If SKY_STATE has a null or missing value, say it is unavailable.
- Treat RETRIEVED_KNOWLEDGE as explanatory context, not live position data.
- Clearly distinguish scientific facts from mythology and cultural tradition.
- Historical and prediction intents are delegated; explain that the relevant engine must supply those results.
- Keep the answer concise, helpful, and suitable for a curious general audience.

INTENT:
${JSON.stringify(input.intent)}

SKY_STATE:
${JSON.stringify(input.skyState)}

RETRIEVED_KNOWLEDGE:
${JSON.stringify(input.knowledge.map(({ title, text, source, culture }) => ({ title, text, source, culture })))}

USER_QUERY:
${input.query}`;
}
