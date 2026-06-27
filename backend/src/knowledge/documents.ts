import { culturalNameDocuments } from "./culturalNames.js";
import type { KnowledgeDocument } from "./types.js";

const scientificDocuments: KnowledgeDocument[] = [
  {
    id: "nasa-saturn-overview",
    title: "Saturn overview",
    text: "Saturn is the sixth planet from the Sun and the second-largest planet. Its ring system is made mostly of ice particles with rock and dust.",
    source: "https://science.nasa.gov/saturn/",
    culture: "international",
    objectIds: ["saturn"],
  },
  {
    id: "nasa-jupiter-overview",
    title: "Jupiter overview",
    text: "Jupiter is the largest planet in the Solar System. Its Great Red Spot is a long-lived storm larger than Earth.",
    source: "https://science.nasa.gov/jupiter/",
    culture: "international",
    objectIds: ["jupiter"],
  },
  {
    id: "nasa-moon-overview",
    title: "Earth's Moon",
    text: "The Moon is Earth's only natural satellite. Its changing phases are caused by the changing geometry of the Sun, Earth, and Moon.",
    source: "https://science.nasa.gov/moon/",
    culture: "international",
    objectIds: ["moon"],
  },
  {
    id: "nasa-iss-overview",
    title: "International Space Station",
    text: "The International Space Station is a crewed laboratory in low Earth orbit. When illuminated by the Sun it can appear as a bright, steadily moving point.",
    source: "https://www.nasa.gov/international-space-station/",
    culture: "international",
    objectIds: ["iss"],
  },
  {
    id: "iau-orion",
    title: "Orion constellation",
    text: "Orion is one of the 88 constellations recognized by the International Astronomical Union. Its bright belt stars make it easy to identify.",
    source: "https://www.iau.org/public/themes/constellations/",
    culture: "international",
    objectIds: ["orion"],
  },
  {
    id: "grounding-policy",
    title: "Zenith grounding policy",
    text: "Object coordinates, visibility, distance, and timing must come only from the supplied sky-state. If a value is absent, say that it is unavailable rather than estimating it.",
    source: "Project Zenith PRD v1.0",
    culture: "international",
    objectIds: [],
  },
];

export const knowledgeDocuments: KnowledgeDocument[] = [...scientificDocuments, ...culturalNameDocuments];
