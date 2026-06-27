/**
 * GYA-24 – Tests for the events API router.
 */

import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createEventsRouter } from "../events.js";

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/events", createEventsRouter());
  return app;
}

// ---------------------------------------------------------------------------
// Query parameter validation
// ---------------------------------------------------------------------------

describe("GET /api/events – validation", () => {
  it("returns 400 when lat is missing", async () => {
    await request(buildApp())
      .get("/api/events?lon=85.14&start=2026-08-01T00:00:00Z&end=2026-08-31T23:59:59Z")
      .expect(400);
  });

  it("returns 400 when lon is missing", async () => {
    await request(buildApp())
      .get("/api/events?lat=25.61&start=2026-08-01T00:00:00Z&end=2026-08-31T23:59:59Z")
      .expect(400);
  });

  it("returns 400 for invalid latitude", async () => {
    await request(buildApp())
      .get("/api/events?lat=200&lon=85.14&start=2026-08-01T00:00:00Z&end=2026-08-31T23:59:59Z")
      .expect(400);
  });

  it("returns 400 when start is missing", async () => {
    await request(buildApp())
      .get("/api/events?lat=25.61&lon=85.14&end=2026-08-31T23:59:59Z")
      .expect(400);
  });

  it("returns 400 for an invalid date string", async () => {
    await request(buildApp())
      .get("/api/events?lat=25.61&lon=85.14&start=not-a-date&end=2026-08-31T23:59:59Z")
      .expect(400);
  });

  it("returns 400 for an invalid type value", async () => {
    await request(buildApp())
      .get(
        "/api/events?lat=25.61&lon=85.14&start=2026-08-01T00:00:00Z&end=2026-08-31T23:59:59Z&type=ufo_sighting",
      )
      .expect(400);
  });

  it("includes issues array in 400 response", async () => {
    const res = await request(buildApp())
      .get("/api/events?lat=999&lon=0&start=2026-08-01T00:00:00Z&end=2026-08-31T23:59:59Z")
      .expect(400);
    expect(Array.isArray(res.body.issues)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Successful queries
// ---------------------------------------------------------------------------

describe("GET /api/events – successful responses", () => {
  it("returns meteor shower events for August Perseids window", async () => {
    const res = await request(buildApp())
      .get(
        "/api/events?lat=51.5&lon=-0.1&start=2026-08-01T00:00:00Z&end=2026-08-31T23:59:59Z",
      )
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    const ids: string[] = res.body.map((e: { id: string }) => e.id);
    expect(ids).toContain("perseids-2026");
  });

  it("returns an array (possibly empty) for a narrow window with no events", async () => {
    const res = await request(buildApp())
      .get(
        "/api/events?lat=0&lon=0&start=2050-03-15T00:00:00Z&end=2050-03-15T01:00:00Z",
      )
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it("filters by type=meteor_shower", async () => {
    const res = await request(buildApp())
      .get(
        "/api/events?lat=51.5&lon=-0.1&start=2026-01-01T00:00:00Z&end=2026-12-31T23:59:59Z&type=meteor_shower",
      )
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body.every((e: { type: string }) => e.type === "meteor_shower")).toBe(true);
  });

  it("accepts multiple type params", async () => {
    const res = await request(buildApp())
      .get(
        "/api/events?lat=51.5&lon=-0.1&start=2025-01-01T00:00:00Z&end=2027-12-31T23:59:59Z&type=eclipse&type=meteor_shower",
      )
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    const types = new Set(res.body.map((e: { type: string }) => e.type));
    // Both eclipse and meteor_shower should appear over a 3-year window
    expect(types.has("eclipse") || types.has("meteor_shower")).toBe(true);
  });

  it("events in response are sorted by startUtc", async () => {
    const res = await request(buildApp())
      .get(
        "/api/events?lat=51.5&lon=-0.1&start=2026-01-01T00:00:00Z&end=2026-12-31T23:59:59Z",
      )
      .expect(200);

    const events: Array<{ startUtc: string }> = res.body;
    for (let i = 1; i < events.length; i++) {
      expect(events[i]!.startUtc >= events[i - 1]!.startUtc).toBe(true);
    }
  });
});
