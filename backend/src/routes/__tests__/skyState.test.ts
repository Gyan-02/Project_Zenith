import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import type { SkyState } from "../../contracts.js";
import { createApp } from "../../app.js";
import { createSkyStateRouter } from "../skyState.js";
import express from "express";

const fixture: SkyState = {
  location: { lat: 25.61, lon: 85.14 },
  timestampUtc: "2026-06-25T00:00:00.000Z",
  planets: [],
  satellites: [],
  iss: null,
  moon: { id: "moon", kind: "moon", name: "Moon", position: { ra: 1, dec: 2 } },
  constellations: [],
  meteorShowers: [],
  provenance: [],
};

describe("GET /sky-state", () => {
  it("validates query parameters", async () => {
    await request(createApp()).get("/sky-state?lat=200&lon=85").expect(400);
  });

  it("returns a contract-valid sky-state", async () => {
    const app = express();
    app.use("/sky-state", createSkyStateRouter(vi.fn().mockResolvedValue(fixture)));
    const response = await request(app)
      .get("/sky-state?lat=25.61&lon=85.14&time=2026-06-25T00:00:00.000Z")
      .expect(200);
    expect(response.body).toMatchObject({ location: { lat: 25.61, lon: 85.14 }, moon: { id: "moon" } });
  });
});
