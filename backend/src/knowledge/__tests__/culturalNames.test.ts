import { describe, expect, it } from "vitest";
import { getDataset } from "../../cultural-names/cultural-names.service.js";
import { culturalNameDocuments } from "../culturalNames.js";
import { knowledgeDocuments } from "../documents.js";

describe("cultural name dataset", () => {
  it("validates GYA-5 data and turns every entry into a seed document", () => {
    const dataset = getDataset();
    expect(Object.keys(dataset)).toHaveLength(18);
    expect(culturalNameDocuments).toHaveLength(18 * 4);
    expect(knowledgeDocuments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "culture-vedic-saturn",
          culture: "vedic",
          objectIds: ["saturn"],
        }),
      ]),
    );
  });
});
