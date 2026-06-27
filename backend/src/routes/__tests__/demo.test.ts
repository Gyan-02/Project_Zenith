import express from "express";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { createDemoRouter } from "../demo.js";

function buildApp() {
  const app = express();
  app.use("/api/demo", createDemoRouter());
  return app;
}

describe("GET /api/demo", () => {
  it.each([
    "/api/demo/sky-state",
    "/api/demo/conditions",
    "/api/demo/events",
    "/api/demo/passes",
  ])("returns demo payload for %s", async (path) => {
    const response = await request(buildApp()).get(path).expect(200);
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(response.body).toBeTruthy();
    expect(JSON.stringify(response.body)).toContain("demo");
  });

  it("returns a non-empty sky-state fixture", async () => {
    const response = await request(buildApp()).get("/api/demo/sky-state").expect(200);
    expect(response.body.demo).toBe(true);
    expect(response.body.moon).toBeTruthy();
    expect(response.body.location).toBeTruthy();
  });

  it("returns a non-empty events fixture", async () => {
    const response = await request(buildApp()).get("/api/demo/events").expect(200);
    expect(response.body.demo).toBe(true);
    expect(response.body.events.length).toBeGreaterThan(0);
  });

  it("returns a non-empty passes fixture", async () => {
    const response = await request(buildApp()).get("/api/demo/passes").expect(200);
    expect(response.body.demo).toBe(true);
    expect(response.body.passes.length).toBeGreaterThan(0);
  });
});
