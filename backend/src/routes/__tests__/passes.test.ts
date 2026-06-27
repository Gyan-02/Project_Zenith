/**
 * GYA-25 – Tests for the passes API router.
 *
 * All tests use an injected fake predictor — no live CelesTrak or SGP4 calls.
 */

import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createPassesRouter, type PassesDependencies } from "../passes.js";
import type { PassPrediction } from "../../predictions/passes/index.js";

// ---------------------------------------------------------------------------
// Fixture
// ---------------------------------------------------------------------------

const FAKE_PASS: PassPrediction = {
  objectId: "sat-25544",
  name: "ISS (ZARYA)",
  riseTimeUtc: "2026-06-25T20:00:00.000Z",
  peakTimeUtc: "2026-06-25T20:02:30.000Z",
  setTimeUtc: "2026-06-25T20:05:00.000Z",
  durationSeconds: 300,
  maxElevationDeg: 45,
  riseAzimuthDeg: 315,
  setAzimuthDeg: 135,
  riseDirection: "NW",
  setDirection: "SE",
  visible: false,
  source: "CelesTrak TLE + satellite.js SGP4",
};

function fakeDeps(passes: PassPrediction[] = [FAKE_PASS]): PassesDependencies {
  const passMap = new Map([["sat-25544", passes]]);
  return { predict: vi.fn().mockResolvedValue(passMap) };
}

function failingDeps(): PassesDependencies {
  return { predict: vi.fn().mockRejectedValue(new Error("CelesTrak offline")) };
}

function buildApp(deps?: PassesDependencies) {
  const app = express();
  app.use(express.json());
  app.use("/api/passes", createPassesRouter(deps));
  return app;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

describe("GET /api/passes – validation", () => {
  it("returns 400 when lat is missing", async () => {
    await request(buildApp(fakeDeps()))
      .get("/api/passes?lon=85.14&start=2026-06-25T00:00:00Z&end=2026-06-26T00:00:00Z")
      .expect(400);
  });

  it("returns 400 for invalid latitude", async () => {
    await request(buildApp(fakeDeps()))
      .get("/api/passes?lat=200&lon=85.14&start=2026-06-25T00:00:00Z&end=2026-06-26T00:00:00Z")
      .expect(400);
  });

  it("returns 400 when start is missing", async () => {
    await request(buildApp(fakeDeps()))
      .get("/api/passes?lat=25.61&lon=85.14&end=2026-06-26T00:00:00Z")
      .expect(400);
  });

  it("returns 400 for an invalid date string", async () => {
    await request(buildApp(fakeDeps()))
      .get("/api/passes?lat=25.61&lon=85.14&start=not-a-date&end=2026-06-26T00:00:00Z")
      .expect(400);
  });

  it("returns 400 when start >= end", async () => {
    await request(buildApp(fakeDeps()))
      .get("/api/passes?lat=25.61&lon=85.14&start=2026-06-26T00:00:00Z&end=2026-06-25T00:00:00Z")
      .expect(400);
  });

  it("returns 400 for minElevationDeg out of range", async () => {
    await request(buildApp(fakeDeps()))
      .get(
        "/api/passes?lat=25.61&lon=85.14&start=2026-06-25T00:00:00Z&end=2026-06-26T00:00:00Z&minElevationDeg=150",
      )
      .expect(400);
  });

  it("includes issues array in 400 response", async () => {
    const res = await request(buildApp(fakeDeps()))
      .get("/api/passes?lat=999&lon=0&start=2026-06-25T00:00:00Z&end=2026-06-26T00:00:00Z")
      .expect(400);
    expect(Array.isArray(res.body.issues)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Successful query
// ---------------------------------------------------------------------------

describe("GET /api/passes – successful response", () => {
  it("returns 200 with the expected response shape", async () => {
    const deps = fakeDeps();
    const res = await request(buildApp(deps))
      .get(
        "/api/passes?lat=25.61&lon=85.14&start=2026-06-25T00:00:00Z&end=2026-06-26T00:00:00Z",
      )
      .expect(200);

    expect(res.body).toHaveProperty("location");
    expect(res.body).toHaveProperty("startUtc");
    expect(res.body).toHaveProperty("endUtc");
    expect(res.body).toHaveProperty("passes");
    expect(res.body).toHaveProperty("provenance");
    expect(Array.isArray(res.body.passes)).toBe(true);
  });

  it("calls the injected predictor with normalized params", async () => {
    const deps = fakeDeps();
    await request(buildApp(deps))
      .get(
        "/api/passes?lat=25.61&lon=85.14&start=2026-06-25T00:00:00Z&end=2026-06-26T00:00:00Z",
      )
      .expect(200);

    expect(deps.predict).toHaveBeenCalledOnce();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const callArg = (deps.predict as ReturnType<typeof vi.fn>).mock.calls[0]![0];
    expect(callArg.observer.lat).toBe(25.61);
    expect(callArg.observer.lon).toBe(85.14);
  });

  it("passes the optional elevationM when provided", async () => {
    const deps = fakeDeps();
    await request(buildApp(deps))
      .get(
        "/api/passes?lat=25.61&lon=85.14&elevationM=53&start=2026-06-25T00:00:00Z&end=2026-06-26T00:00:00Z",
      )
      .expect(200);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const callArg = (deps.predict as ReturnType<typeof vi.fn>).mock.calls[0]![0];
    expect(callArg.observer.elevationM).toBe(53);
  });

  it("defaults minElevationDeg to 10 when not provided", async () => {
    const deps = fakeDeps();
    await request(buildApp(deps))
      .get(
        "/api/passes?lat=25.61&lon=85.14&start=2026-06-25T00:00:00Z&end=2026-06-26T00:00:00Z",
      )
      .expect(200);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const callArg = (deps.predict as ReturnType<typeof vi.fn>).mock.calls[0]![0];
    expect(callArg.minimumElevationDeg).toBe(10);
  });

  it("uses the provided minElevationDeg", async () => {
    const deps = fakeDeps();
    await request(buildApp(deps))
      .get(
        "/api/passes?lat=25.61&lon=85.14&start=2026-06-25T00:00:00Z&end=2026-06-26T00:00:00Z&minElevationDeg=20",
      )
      .expect(200);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const callArg = (deps.predict as ReturnType<typeof vi.fn>).mock.calls[0]![0];
    expect(callArg.minimumElevationDeg).toBe(20);
  });

  it("includes the fake pass in the response", async () => {
    const res = await request(buildApp(fakeDeps()))
      .get(
        "/api/passes?lat=25.61&lon=85.14&start=2026-06-25T00:00:00Z&end=2026-06-26T00:00:00Z",
      )
      .expect(200);

    expect(res.body.passes).toHaveLength(1);
    expect(res.body.passes[0].objectId).toBe("sat-25544");
    expect(res.body.passes[0].name).toBe("ISS (ZARYA)");
  });
});

// ---------------------------------------------------------------------------
// 503 – dependency failure
// ---------------------------------------------------------------------------

describe("GET /api/passes – 503 dependency failure", () => {
  it("returns 503 when the predictor throws", async () => {
    const res = await request(buildApp(failingDeps()))
      .get(
        "/api/passes?lat=25.61&lon=85.14&start=2026-06-25T00:00:00Z&end=2026-06-26T00:00:00Z",
      )
      .expect(503);

    expect(res.body).toHaveProperty("error");
  });
});
