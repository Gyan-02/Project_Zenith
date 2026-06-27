import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";

const dataDirectory = new URL("../data/cultural-names/", import.meta.url);
const readJson = (name: string) => JSON.parse(readFileSync(fileURLToPath(new URL(name, dataDirectory)), "utf8"));

const schema = readJson("schema.json");
const dataset = readJson("dataset.json") as Record<string, { names?: Record<string, unknown> }>;
const traditions = readJson("traditions.json") as Record<string, unknown>;
const ajv = new Ajv2020({ allErrors: true, strict: true });
const validate = ajv.compile(schema);

if (!validate(dataset)) {
  console.error(validate.errors);
  process.exitCode = 1;
} else {
  const requiredTraditions = ["vedic", "chinese", "greek", "arabic"];
  const missing = Object.entries(dataset).flatMap(([objectId, entry]) =>
    requiredTraditions
      .filter((tradition) => !entry.names?.[tradition])
      .map((tradition) => `${objectId}.${tradition}`),
  );
  const registryMissing = requiredTraditions.filter((tradition) => !traditions[tradition]);
  const requiredObjects = [
    "mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune",
    "moon", "sun", "orion", "ursa_major", "cassiopeia", "pleiades", "sirius", "betelgeuse", "polaris", "vega",
  ];
  const objectsMissing = requiredObjects.filter((objectId) => !dataset[objectId]);
  const brihaspati = (dataset.jupiter as { names: { vedic: { name?: string } } })?.names.vedic.name;
  const mrigashira = (dataset.orion as { names: { vedic: { name?: string } } })?.names.vedic.name;

  if (missing.length || registryMissing.length || objectsMissing.length || brihaspati !== "Brihaspati" || mrigashira !== "Mrigashira") {
    console.error({ missing, registryMissing, objectsMissing, brihaspati, mrigashira });
    process.exitCode = 1;
  } else {
    console.log(`Validated ${Object.keys(dataset).length} cultural objects across ${requiredTraditions.length} traditions.`);
  }
}
