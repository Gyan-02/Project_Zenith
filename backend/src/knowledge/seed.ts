import { seedKnowledgeBase } from "./store.js";

const result = await seedKnowledgeBase();
console.log(`Seeded ${result.count} Zenith knowledge documents (${result.mode} mode).`);
