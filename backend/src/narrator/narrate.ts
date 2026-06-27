import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { config } from "../config.js";
import type { IntentResult, NarrationResponse, SkyObject, SkyState } from "../contracts.js";
import { GeminiUpstreamError } from "../errors.js";
import { retrieveKnowledge } from "../knowledge/store.js";
import { getSkyObjects } from "../sky-state/skyState.utils.js";
import { demoNarrate } from "./demoNarrator.js";
import { resolveNavigationTarget } from "./navigation.js";
import { buildNarratorPrompt } from "./prompt.js";

export interface NarrateInput {
  query: string;
  intent: IntentResult;
  skyState: SkyState;
  selectedObjectId?: string;
}

function findRelevantObject(input: NarrateInput): SkyObject | undefined {
  const target = input.intent.targetName?.toLowerCase() ?? input.selectedObjectId?.toLowerCase();
  if (!target) return undefined;
  return getSkyObjects(input.skyState).find((object) =>
    [object.id, object.name].map((name) => name.toLowerCase()).includes(target),
  );
}

function localGroundedNarration(input: NarrateInput, fact: string | undefined): string {
  if (input.intent.delegated) {
    return "That question needs Zenith's historical or prediction engine. I won't invent an event or pass window without its computed data.";
  }

  const object = findRelevantObject(input);
  if (!object) {
    return "I can explain the current sky, but I need a matching object in the supplied sky-state before I can give object-specific position details.";
  }

  const position =
    object.position.altDeg === undefined || object.position.azDeg === undefined
      ? "Its current altitude and azimuth are unavailable in the supplied sky-state."
      : `The supplied sky-state places it at ${object.position.altDeg.toFixed(1)}° altitude and ${object.position.azDeg.toFixed(1)}° azimuth.`;
  const visibility = object.metadata?.visible === true ? "It is marked visible." : "Its visibility is not confirmed.";
  return `${object.name}: ${position} ${visibility}${fact ? ` ${fact}` : ""}`.trim();
}

function contentToText(content: unknown): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return String(content ?? "");
  return content
    .map((part) => (typeof part === "string" ? part : typeof part === "object" && part && "text" in part ? String(part.text) : ""))
    .join("\n")
    .trim();
}

async function invokeGemini(prompt: string): Promise<string> {
  if (!config.geminiApiKey) return "";

  try {
    const model = new ChatGoogleGenerativeAI({
      apiKey: config.geminiApiKey,
      model: config.geminiModel,
      temperature: 0.2,
      maxRetries: 1,
    });
    const request = model.invoke(prompt).then((message) => contentToText(message.content));
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new GeminiUpstreamError("Gemini exceeded the 4.5 second narrator budget")), 4_500),
    );
    return await Promise.race([request, timeout]);
  } catch (error) {
    if (error instanceof GeminiUpstreamError) throw error;
    throw new GeminiUpstreamError(error instanceof Error ? error.message : "Gemini request failed");
  }
}

export async function narrate(input: NarrateInput): Promise<NarrationResponse> {
  // When no Gemini key is configured, return a demo-safe canned response
  // so the narrator panel stays friendly during live demos.
  if (!config.geminiApiKey) {
    return demoNarrate(input);
  }

  const knowledge = await retrieveKnowledge(
    `${input.query} ${input.intent.targetName ?? ""} ${input.skyState.location.label ?? ""}`,
  );
  const prompt = buildNarratorPrompt({ ...input, knowledge });
  let generated = "";
  try {
    generated = await invokeGemini(prompt);
  } catch (error) {
    if (error instanceof GeminiUpstreamError) {
      return demoNarrate(input);
    }
    throw error;
  }
  const text = generated || localGroundedNarration(input, knowledge[0]?.text);

  return {
    text,
    navigationTarget: resolveNavigationTarget(input.intent, input.skyState),
    citations: knowledge.map(({ title, source }) => ({ title, source })),
  };
}
