"use client";

import { FormEvent, useEffect, useState } from "react";
import { useNarrator } from "../../hooks/useNarrator";
import { navigationBus } from "../../lib/navigationBus";
import type { ViewerContext } from "../../lib/narration";

interface CosmicNarratorProps {
  context: ViewerContext;
  forceOpen?: boolean;
}

const SUGGESTIONS = ["Show Saturn", "Where is the ISS?", "What am I looking at?"];

export function CosmicNarrator({ context, forceOpen = false }: CosmicNarratorProps) {
  const [query, setQuery] = useState("");
  const [isMinimized, setIsMinimized] = useState(false);
  const { messages, isLoading, error, ask } = useNarrator(context);
  const isActuallyMinimized = !forceOpen && isMinimized;

  useEffect(() => {
    if (forceOpen) return;
    const media = window.matchMedia("(max-width: 760px)");
    if (media.matches) setIsMinimized(true);
  }, [forceOpen]);

  useEffect(() => {
    const handlePrefill = (e: Event) => {
      const customEvent = e as CustomEvent<{ query: string }>;
      if (customEvent.detail?.query) {
        setQuery(customEvent.detail.query);
        if (!forceOpen) setIsMinimized(false);
      }
    };
    window.addEventListener("zenith-prefill-narrator", handlePrefill);
    return () => {
      window.removeEventListener("zenith-prefill-narrator", handlePrefill);
    };
  }, [forceOpen]);

  async function submit(value: string) {
    const cleanQuery = value.trim();
    if (!cleanQuery || isLoading) return;
    setQuery("");
    const response = await ask(cleanQuery);
    if (response?.navigationTarget) navigationBus.publish(response.navigationTarget);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit(query);
  }

  if (isActuallyMinimized) {
    return (
      <aside className="narrator-panel narrator-panel-minimized" aria-label="Cosmic Narrator">
        <button
          type="button"
          className="narrator-restore-button"
          aria-label="Open Cosmic Narrator"
          onClick={() => setIsMinimized(false)}
        >
          <span className="narrator-orb narrator-orb-small" aria-hidden="true" />
          <span>
            <span className="eyebrow">Ask Zenith</span>
            <strong>Cosmic Narrator</strong>
          </span>
        </button>
      </aside>
    );
  }

  return (
    <aside className="narrator-panel" aria-label="Cosmic Narrator">
      <header className="narrator-header">
        <div className="narrator-orb" aria-hidden="true" />
        <div>
          <p className="eyebrow">Gemini grounded guide</p>
          <h2>Cosmic Narrator</h2>
        </div>
        <span className="live-pill">Live sky</span>
        {!forceOpen ? (
          <button
            type="button"
            className="narrator-minimize-button"
            aria-label="Minimize Cosmic Narrator"
            onClick={() => setIsMinimized(true)}
          >
            Minimize
          </button>
        ) : null}
      </header>

      <div className="message-list" aria-live="polite">
        {messages.map((message) => (
          <article key={message.id} className={`message message-${message.role}`}>
            <span>{message.role === "narrator" ? "Zenith" : "You"}</span>
            <p>{message.text}</p>
            {message.citations?.length ? (
              <details>
                <summary>{message.citations.length} sources</summary>
                <ul>
                  {message.citations.map((citation) => (
                    <li key={`${citation.title}-${citation.source}`}>{citation.title}</li>
                  ))}
                </ul>
              </details>
            ) : null}
          </article>
        ))}
        {isLoading ? <p className="thinking">Reading the current sky-state…</p> : null}
        {error ? <p className="narrator-error">{error}</p> : null}
      </div>

      <div className="suggestions" aria-label="Suggested questions">
        {SUGGESTIONS.map((suggestion) => (
          <button key={suggestion} type="button" onClick={() => void submit(suggestion)} disabled={isLoading}>
            {suggestion}
          </button>
        ))}
      </div>

      <form className="narrator-form" onSubmit={handleSubmit}>
        <label className="sr-only" htmlFor="cosmic-query">Ask the Cosmic Narrator</label>
        <input
          id="cosmic-query"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ask about this sky…"
          maxLength={2_000}
        />
        <button type="submit" disabled={isLoading || !query.trim()} aria-label="Send question">
          ↗
        </button>
      </form>
    </aside>
  );
}
