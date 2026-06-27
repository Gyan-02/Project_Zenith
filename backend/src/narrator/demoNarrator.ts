/**
 * GYA-45 — Demo Narrator Fallback
 *
 * Returns canned, demo-safe NarrationResponse objects for common prompts
 * when GEMINI_API_KEY is not set or the live LLM call fails.
 *
 * All responses are:
 *  - Schema-compatible with NarrationResponseSchema
 *  - Clearly labelled as demo/educational content
 *  - Free of invented real-time facts
 */

import type { NarrationResponse } from "../contracts.js";
import type { NarrateInput } from "./narrate.js";

// ---------------------------------------------------------------------------
// Canned responses
// ---------------------------------------------------------------------------

const DEMO_RESPONSES: Array<{
  /** One or more keywords/phrases that trigger this response (lowercased). */
  triggers: string[];
  response: NarrationResponse;
}> = [
  {
    triggers: ["saturn"],
    response: {
      text:
        "Saturn is the sixth planet from the Sun and the most visually striking object you can see through any small telescope. " +
        "Its iconic rings span about 270,000 km but are only 10–100 metres thick — thinner relative to their width than a sheet of paper. " +
        "Even at 25× magnification the rings are clearly resolved. Saturn is a gas giant with a density so low it would float on water. " +
        "It currently hosts over 140 confirmed moons, with Titan being the only moon in the Solar System with a thick atmosphere.",
      navigationTarget: { kind: "planet", id: "saturn", label: "Saturn" },
      citations: [{ title: "Saturn — NASA Cassini Mission", source: "NASA" }],
    },
  },
  {
    triggers: ["moon", "lunar"],
    response: {
      text:
        "The Moon is Earth's only natural satellite and the most closely studied body beyond our planet. " +
        "It stabilises Earth's axial tilt, moderates our seasons, and drives tides. " +
        "The shadow boundary — the terminator — is the best place to study craters because low-angle sunlight makes relief dramatic. " +
        "Binoculars reveal major maria (dark lava plains) and mountain ranges with ease. " +
        "Six Apollo missions landed humans on the Moon between 1969 and 1972.",
      navigationTarget: { kind: "moon", id: "moon", label: "Moon" },
      citations: [
        { title: "Moon — Lunar Reconnaissance Orbiter", source: "NASA" },
      ],
    },
  },
  {
    triggers: ["iss", "international space station", "space station"],
    response: {
      text:
        "The International Space Station orbits Earth at about 400 km altitude, completing one orbit every 92 minutes. " +
        "It is the largest structure ever assembled in space and has been continuously inhabited since November 2000. " +
        "With up to magnitude −4, it is the brightest satellite in the sky — outshining Venus. " +
        "It appears as a steady white dot moving quickly and silently across the sky, typically visible for 2–5 minutes per pass. " +
        "Use the Spot the Station tool or Heavens-Above.com to find the next pass for your location.",
      navigationTarget: { kind: "iss", id: "iss", label: "ISS" },
      citations: [{ title: "ISS — NASA Human Spaceflight", source: "NASA" }],
    },
  },
  {
    triggers: ["tonight", "visible", "sky", "what can i see"],
    response: {
      text:
        "Tonight's sky depends on your location and the current time, but here are reliable highlights. " +
        "The planets visible with the naked eye — Venus, Mars, Jupiter, and Saturn — are often the brightest non-stellar objects. " +
        "The ISS passes overhead several times each night and is unmistakable as a fast-moving, steady bright point of light. " +
        "In dark skies, the Milky Way is visible as a faint band stretching overhead. " +
        "Use the globe to explore all currently computed sky objects for your observer location and time.",
      navigationTarget: null,
      citations: [],
    },
  },
];

// ---------------------------------------------------------------------------
// Generic fallback
// ---------------------------------------------------------------------------

const GENERIC_FALLBACK: NarrationResponse = {
  text:
    "Welcome to Project Zenith — a digital twin of the sky. " +
    "You can explore planets, the Moon, satellites, constellations, and upcoming celestial events. " +
    "Select any object on the globe to see its educational reference card. " +
    "Try asking about Saturn, the Moon, the ISS, or what's visible tonight.",
  navigationTarget: null,
  citations: [],
};

// ---------------------------------------------------------------------------
// Public function
// ---------------------------------------------------------------------------

/**
 * Return a demo-safe narration response for the given input.
 *
 * Matches by scanning `input.query` and `input.intent.targetName`
 * against known trigger keywords. Falls back to a generic welcome message.
 */
export function demoNarrate(input: NarrateInput): NarrationResponse {
  const haystack =
    `${input.query} ${input.intent.targetName ?? ""}`.toLowerCase();

  for (const { triggers, response } of DEMO_RESPONSES) {
    if (triggers.some((t) => haystack.includes(t))) {
      return response;
    }
  }

  return GENERIC_FALLBACK;
}
