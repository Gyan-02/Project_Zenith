import { describe, expect, it } from "vitest";
import { NarrationResponseSchema } from "../narration";

describe("NarrationResponseSchema", () => {
  it("accepts the backend navigation contract", () => {
    expect(
      NarrationResponseSchema.parse({
        text: "Saturn is highlighted.",
        navigationTarget: { kind: "planet", id: "saturn", label: "Saturn" },
        citations: [{ title: "Saturn overview", source: "NASA" }],
      }),
    ).toMatchObject({ navigationTarget: { id: "saturn" } });
  });
});
