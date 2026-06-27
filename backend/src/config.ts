import "dotenv/config";

function normalizeOrigin(origin: string | undefined): string | undefined {
  const trimmed = origin?.trim();
  if (!trimmed) return undefined;

  try {
    return new URL(trimmed).origin;
  } catch {
    return trimmed.replace(/\/+$/, "");
  }
}

function configuredFrontendOrigins(): string[] {
  const rawOrigins = process.env.FRONTEND_ORIGINS ?? process.env.FRONTEND_ORIGIN;
  const configured = (rawOrigins ?? "")
    .split(",")
    .map((origin) => normalizeOrigin(origin))
    .filter((origin): origin is string => Boolean(origin));

  return Array.from(new Set([
    ...configured,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ]));
}

const frontendOrigins = configuredFrontendOrigins();

export const config = {
  port: Number(process.env.PORT ?? 4000),
  frontendOrigin: frontendOrigins[0] ?? "http://localhost:3000",
  frontendOrigins,
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
  chromaUrl: process.env.CHROMA_URL,
  chromaApiKey: process.env.CHROMA_API_KEY,
  chromaTenant: process.env.CHROMA_TENANT,
  chromaDatabase: process.env.CHROMA_DATABASE,
  chromaCollection: process.env.CHROMA_COLLECTION ?? "zenith-knowledge",
} as const;
