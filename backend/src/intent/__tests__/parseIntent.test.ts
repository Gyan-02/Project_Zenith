import { describe, expect, it } from "vitest";
import { parseIntent } from "../parseIntent.js";

describe("parseIntent", () => {
  it.each([
    ["Show Saturn", "object_search", "Saturn"],
    ["Where is the ISS?", "object_search", "ISS"],
    ["What am I looking at?", "sky_exploration", null],
    ["Explain why Jupiter has bands", "education", "Jupiter"],
    ["What happened in the sky in 1969?", "historical", null],
    ["When is the next ISS pass?", "prediction", "ISS"],
  ] as const)("classifies %s", async (query, intent, targetName) => {
    await expect(parseIntent(query)).resolves.toMatchObject({ intent, targetName });
  });
});
