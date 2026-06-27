/**
 * GYA-11 – Tests for conditions.router.ts
 *
 * Uses a fake ConditionsService injected via the router factory.
 * No live API calls, no real service instantiation.
 */

import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createConditionsRouter } from "./conditions.router.js";
import type { ObservingConditionsResponse } from "./conditions.types.js";
import { ConditionsService } from "./conditions.service.js";

// ---------------------------------------------------------------------------
// Fixture response
// ---------------------------------------------------------------------------

const EXCELLENT_RESPONSE: ObservingConditionsResponse = {
  location: { lat: 51.5, lon: -0.1 },
  observedAt: "2026-08-12T21:00:00.000Z",
  quality: "Excellent",
  summary: "Excellent viewing: low cloud cover (5%).",
  cloudCoverPct: 5,
  visibilityMeters: 10_000,
  humidityPct: 40,
  temperatureC: 18,
  windSpeedMps: 2.0,
  cached: false,
  unavailable: false,
  source: "OpenWeatherMap",
};

const UNAVAILABLE_RESPONSE: ObservingConditionsResponse = {
  location: { lat: 51.5, lon: -0.1 },
  observedAt: "2026-08-12T21:00:00.000Z",
  quality: "Unknown",
  summary: "Observing conditions unavailable: weather API key not configured.",
  cloudCoverPct: null,
  visibilityMeters: null,
  humidityPct: null,
  temperatureC: null,
  windSpeedMps: null,
  cached: false,
  unavailable: true,
  source: "OpenWeatherMap",
};

// ---------------------------------------------------------------------------
// Helper – build a minimal Express app with the conditions router mounted
// ---------------------------------------------------------------------------

function buildApp(svcResponse: ObservingConditionsResponse) {
  const fakeSvc = {
    getConditions: vi.fn().mockResolvedValue(svcResponse),
    clearCache: vi.fn(),
  } as unknown as ConditionsService;

  const app = express();
  app.use(express.json());
  app.use("/api/conditions", createConditionsRouter(fakeSvc));
  return app;
}

// ---------------------------------------------------------------------------
// Query-parameter validation
// ---------------------------------------------------------------------------

describe("GET /api/conditions – query parameter validation", () => {
  it("returns 400 when lat is missing", async () => {
    const app = buildApp(EXCELLENT_RESPONSE);
    await request(app).get("/api/conditions?lon=-0.1").expect(400);
  });

  it("returns 400 when lon is missing", async () => {
    const app = buildApp(EXCELLENT_RESPONSE);
    await request(app).get("/api/conditions?lat=51.5").expect(400);
  });

  it("returns 400 for lat out of range", async () => {
    const app = buildApp(EXCELLENT_RESPONSE);
    await request(app).get("/api/conditions?lat=200&lon=0").expect(400);
  });

  it("returns 400 for lon out of range", async () => {
    const app = buildApp(EXCELLENT_RESPONSE);
    await request(app).get("/api/conditions?lat=51&lon=999").expect(400);
  });

  it("returns 400 for non-numeric lat", async () => {
    const app = buildApp(EXCELLENT_RESPONSE);
    await request(app).get("/api/conditions?lat=abc&lon=0").expect(400);
  });

  it("includes an issues array in the 400 body", async () => {
    const app = buildApp(EXCELLENT_RESPONSE);
    const res = await request(app).get("/api/conditions?lat=200&lon=0").expect(400);
    expect(res.body).toHaveProperty("issues");
    expect(Array.isArray(res.body.issues)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Successful response
// ---------------------------------------------------------------------------

describe("GET /api/conditions – successful response", () => {
  it("returns 200 with the conditions payload for valid params", async () => {
    const app = buildApp(EXCELLENT_RESPONSE);
    const res = await request(app)
      .get("/api/conditions?lat=51.5&lon=-0.1")
      .expect(200);

    expect(res.body).toMatchObject({
      quality: "Excellent",
      source: "OpenWeatherMap",
      unavailable: false,
    });
  });

  it("returns 200 even when the provider is unavailable (graceful degradation)", async () => {
    const app = buildApp(UNAVAILABLE_RESPONSE);
    const res = await request(app)
      .get("/api/conditions?lat=51.5&lon=-0.1")
      .expect(200);

    expect(res.body.unavailable).toBe(true);
    expect(res.body.quality).toBe("Unknown");
    expect(res.body.cloudCoverPct).toBeNull();
  });

  it("accepts the optional time query param without error", async () => {
    const app = buildApp(EXCELLENT_RESPONSE);
    await request(app)
      .get("/api/conditions?lat=51.5&lon=-0.1&time=2026-08-12T22:00:00Z")
      .expect(200);
  });

  it("response body contains all required fields", async () => {
    const app = buildApp(EXCELLENT_RESPONSE);
    const res = await request(app).get("/api/conditions?lat=51.5&lon=-0.1").expect(200);

    const body = res.body;
    expect(body).toHaveProperty("location");
    expect(body).toHaveProperty("observedAt");
    expect(body).toHaveProperty("quality");
    expect(body).toHaveProperty("summary");
    expect(body).toHaveProperty("cloudCoverPct");
    expect(body).toHaveProperty("visibilityMeters");
    expect(body).toHaveProperty("humidityPct");
    expect(body).toHaveProperty("temperatureC");
    expect(body).toHaveProperty("windSpeedMps");
    expect(body).toHaveProperty("cached");
    expect(body).toHaveProperty("unavailable");
    expect(body).toHaveProperty("source");
  });
});

// ---------------------------------------------------------------------------
// 503 safety-net (service throws unexpectedly)
// ---------------------------------------------------------------------------

describe("GET /api/conditions – 503 safety net", () => {
  it("returns 503 if the service throws an uncaught exception", async () => {
    const fakeSvc = {
      getConditions: vi.fn().mockRejectedValue(new Error("catastrophic failure")),
      clearCache: vi.fn(),
    } as unknown as ConditionsService;

    const app = express();
    app.use("/api/conditions", createConditionsRouter(fakeSvc));

    const res = await request(app)
      .get("/api/conditions?lat=51.5&lon=-0.1")
      .expect(503);

    expect(res.body).toHaveProperty("error");
  });
});
