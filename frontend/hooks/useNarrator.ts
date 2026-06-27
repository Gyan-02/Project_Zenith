"use client";

import { useCallback, useState } from "react";
import {
  NarrationResponseSchema,
  ViewerContextSchema,
  type NarrationResponse,
  type ViewerContext,
} from "../lib/narration";

export interface NarratorMessage {
  id: string;
  role: "user" | "narrator";
  text: string;
  citations?: NarrationResponse["citations"];
}

export function useNarrator(context: ViewerContext) {
  const [messages, setMessages] = useState<NarratorMessage[]>([
    {
      id: "welcome",
      role: "narrator",
      text: "Ask me what is above you, or tell me which object to find.",
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ask = useCallback(
    async (query: string): Promise<NarrationResponse | null> => {
      const requestBody = ViewerContextSchema.parse({ query, ...context });
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: "user", text: query },
      ]);
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/narrate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });
        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? `Narrator request failed (${response.status})`);
        }

        const result = NarrationResponseSchema.parse(await response.json());
        setMessages((current) => [
          ...current,
          {
            id: crypto.randomUUID(),
            role: "narrator",
            text: result.text,
            citations: result.citations,
          },
        ]);
        return result;
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "The narrator is unavailable");
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [context],
  );

  return { messages, isLoading, error, ask };
}
