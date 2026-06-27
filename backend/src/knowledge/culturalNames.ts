import { getDataset } from "../cultural-names/cultural-names.service.js";
import type { KnowledgeDocument } from "./types.js";

export const culturalNameDocuments: KnowledgeDocument[] = Object.entries(getDataset()).flatMap(
  ([objectId, object]) =>
    Object.entries(object.names).map(([tradition, entry]) => ({
      id: `culture-${tradition}-${objectId}`,
      title: `${object.scientific} in ${tradition} tradition`,
      text: [
        `${object.scientific} is called ${entry.name}`,
        entry.transliteration ? `(${entry.transliteration})` : "",
        `in ${tradition} tradition.`,
        entry.meaning ? `The name is described as: ${entry.meaning}.` : "",
        "This is cultural context, not a source for scientific position data.",
      ]
        .filter(Boolean)
        .join(" "),
      source: "Zenith cultural astronomy dataset v1",
      culture: tradition,
      objectIds: [objectId],
    })),
);
