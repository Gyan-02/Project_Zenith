/**
 * GYA-30 – Tests for the shared API client foundation.
 */

import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { getApiBaseUrl } from "./baseUrl.js";
import { buildQuery } from "./query.js";
import { apiGetJson, ApiError } from "./http.js";

// ---------------------------------------------------------------------------
// getApiBaseUrl
// ---------------------------------------------------------------------------

describe("getApiBaseUrl", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("returns the default URL when env is not set", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "");
    // Empty string falls through to default
    const url = getApiBaseUrl();
    expect(url).toBe("http://localhost:4000");
  });

  it("uses NEXT_PUBLIC_API_URL when set", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.com");
    expect(getApiBaseUrl()).toBe("https://api.example.com");
  });

  it("strips a single trailing slash", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.com/");
    expect(getApiBaseUrl()).toBe("https://api.example.com");
  });

  it("strips multiple trailing slashes", () => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.example.com///");
    expect(getApiBaseUrl()).toBe("https://api.example.com");
  });
});

// ---------------------------------------------------------------------------
// buildQuery
// ---------------------------------------------------------------------------

describe("buildQuery", () => {
  it("serialises a simple string param", () => {
    expect(buildQuery({ q: "moon" }).toString()).toBe("q=moon");
  });

  it("serialises a number", () => {
    expect(buildQuery({ lat: 51.5 }).toString()).toBe("lat=51.5");
  });

  it("serialises a boolean as its string representation", () => {
    expect(buildQuery({ visible: true }).get("visible")).toBe("true");
  });

  it("omits undefined values", () => {
    expect(buildQuery({ a: "x", b: undefined }).toString()).toBe("a=x");
  });

  it("omits null values", () => {
    expect(buildQuery({ a: "x", b: null }).toString()).toBe("a=x");
  });

  it("omits empty string values", () => {
    expect(buildQuery({ a: "x", b: "" }).toString()).toBe("a=x");
  });

  it("repeats array params", () => {
    const qs = buildQuery({ type: ["meteor_shower", "eclipse"] }).toString();
    expect(qs).toBe("type=meteor_shower&type=eclipse");
  });

  it("omits undefined/null items within an array", () => {
    const params: Record<string, string[]> = { type: ["a", "b"] };
    expect(buildQuery(params).getAll("type")).toEqual(["a", "b"]);
  });

  it("converts a Date to ISO-8601", () => {
    const d = new Date("2026-08-12T00:00:00.000Z");
    expect(buildQuery({ time: d }).get("time")).toBe("2026-08-12T00:00:00.000Z");
  });

  it("returns empty URLSearchParams for an all-omitted record", () => {
    expect(buildQuery({ a: undefined, b: null }).toString()).toBe("");
  });
});

// ---------------------------------------------------------------------------
// apiGetJson
// ---------------------------------------------------------------------------

describe("apiGetJson", () => {
  beforeEach(() => vi.unstubAllGlobals());
  afterEach(() => vi.unstubAllGlobals());

  it("fetches the correct URL and returns parsed JSON", async () => {
    const payload = { quality: "Excellent" };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify(payload), { status: 200 })),
    );

    const result = await apiGetJson<typeof payload>("/api/conditions", { lat: 51.5, lon: -0.1 });
    expect(result).toEqual(payload);

    const calledUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]![0] as string;
    expect(calledUrl).toContain("/api/conditions");
    expect(calledUrl).toContain("lat=51.5");
    expect(calledUrl).toContain("lon=-0.1");
  });

  it("throws ApiError for a non-OK response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 503, statusText: "Service Unavailable" })),
    );

    await expect(apiGetJson("/api/conditions")).rejects.toBeInstanceOf(ApiError);
  });

  it("ApiError carries the HTTP status code", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 404, statusText: "Not Found" })),
    );

    try {
      await apiGetJson("/api/reference/nope");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(404);
    }
  });

  it("does not swallow AbortError", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new DOMException("aborted", "AbortError")),
    );
    await expect(apiGetJson("/api/conditions")).rejects.toThrow("aborted");
  });

  it("works without query params", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify([]), { status: 200 })),
    );
    await expect(apiGetJson("/api/events")).resolves.toEqual([]);

    const calledUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]![0] as string;
    // No trailing ?
    expect(calledUrl.endsWith("/api/events")).toBe(true);
  });
});
