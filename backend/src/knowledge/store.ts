import { ChromaClient, CloudClient, type Collection, type EmbeddingFunction } from "chromadb";
import { config } from "../config.js";
import { KnowledgeBaseError } from "../errors.js";
import { createDeterministicEmbedding } from "./embedding.js";
import { knowledgeDocuments } from "./documents.js";
import type { KnowledgeDocument } from "./types.js";

export interface RetrievedKnowledge extends KnowledgeDocument {
  score: number;
}

let collectionPromise: Promise<Collection> | undefined;

const deterministicEmbeddingFunction: EmbeddingFunction = {
  generate: async (texts: string[]) => texts.map((text) => createDeterministicEmbedding(text)),
  generateForQueries: async (texts: string[]) => texts.map((text) => createDeterministicEmbedding(text)),
};

function hasChromaConfig(): boolean {
  return Boolean(config.chromaUrl || config.chromaApiKey);
}

function cloudHostFromUrl(): string | undefined {
  if (!config.chromaUrl) return undefined;
  try {
    return new URL(config.chromaUrl).hostname;
  } catch {
    return config.chromaUrl.replace(/^https?:\/\//, "").split(":")[0];
  }
}

function createCollection(): Promise<Collection> {
  if (!hasChromaConfig()) {
    throw new KnowledgeBaseError("Chroma is not configured");
  }

  const client = config.chromaApiKey
    ? new CloudClient({
        apiKey: config.chromaApiKey,
        host: cloudHostFromUrl(),
        tenant: config.chromaTenant,
        database: config.chromaDatabase,
      })
    : new ChromaClient({ path: config.chromaUrl });

  return client.getOrCreateCollection({
    name: config.chromaCollection,
    embeddingFunction: deterministicEmbeddingFunction,
    metadata: { description: "Project Zenith grounded narrator corpus" },
  });
}

async function getCollection(): Promise<Collection> {
  collectionPromise ??= createCollection();
  return collectionPromise;
}

export async function seedKnowledgeBase(): Promise<{ count: number; mode: "chroma" | "memory" }> {
  if (!hasChromaConfig()) {
    return { count: knowledgeDocuments.length, mode: "memory" };
  }

  try {
    const collection = await getCollection();
    await collection.upsert({
      ids: knowledgeDocuments.map((document) => document.id),
      documents: knowledgeDocuments.map((document) => document.text),
      embeddings: knowledgeDocuments.map((document) =>
        createDeterministicEmbedding(`${document.title} ${document.text} ${document.objectIds.join(" ")}`),
      ),
      metadatas: knowledgeDocuments.map((document) => ({
        title: document.title,
        source: document.source,
        culture: document.culture ?? "international",
        objectIds: document.objectIds.join(","),
      })),
    });
    return { count: knowledgeDocuments.length, mode: "chroma" };
  } catch (error) {
    collectionPromise = undefined;
    throw new KnowledgeBaseError(error instanceof Error ? error.message : "Unable to seed ChromaDB");
  }
}

function lexicalRetrieve(query: string, limit: number): RetrievedKnowledge[] {
  const queryTokens = new Set(query.toLowerCase().match(/[a-z0-9]+/g) ?? []);
  return knowledgeDocuments
    .map((document) => {
      const haystack = `${document.title} ${document.text} ${document.objectIds.join(" ")}`.toLowerCase();
      const matches = [...queryTokens].filter((token) => haystack.includes(token)).length;
      const groundingBoost = document.id === "grounding-policy" ? 0.25 : 0;
      return { ...document, score: matches + groundingBoost };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}

export async function retrieveKnowledge(query: string, limit = 4): Promise<RetrievedKnowledge[]> {
  if (!hasChromaConfig()) {
    return lexicalRetrieve(query, limit);
  }

  try {
    await seedKnowledgeBase();
    const collection = await getCollection();
    const result = await collection.query({
      queryEmbeddings: [createDeterministicEmbedding(query)],
      nResults: limit,
      include: ["documents", "metadatas", "distances"],
    });

    const ids = result.ids[0] ?? [];
    return ids.map((id, index) => {
      const metadata = result.metadatas?.[0]?.[index];
      const document = result.documents?.[0]?.[index] ?? "";
      const distance = result.distances?.[0]?.[index] ?? 1;
      return {
        id,
        title: String(metadata?.title ?? id),
        text: document ?? "",
        source: String(metadata?.source ?? "Project Zenith knowledge base"),
        culture: (metadata?.culture as KnowledgeDocument["culture"]) ?? "international",
        objectIds: String(metadata?.objectIds ?? "").split(",").filter(Boolean),
        score: 1 - distance,
      };
    });
  } catch (error) {
    if (error instanceof KnowledgeBaseError) throw error;
    throw new KnowledgeBaseError(error instanceof Error ? error.message : "ChromaDB query failed");
  }
}
