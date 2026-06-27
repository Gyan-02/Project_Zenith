import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../../app.js";

describe("cultural names routes", () => {
  it("returns the full cacheable dataset", async () => {
    const response = await request(createApp()).get("/api/cultural-names").expect(200);
    expect(response.headers["cache-control"]).toBe("public, max-age=86400");
    expect(response.body).toHaveProperty("traditions.vedic");
    expect(response.body).toHaveProperty("objects.jupiter");
  });

  it("returns one object or a JSON 404", async () => {
    const found = await request(createApp()).get("/api/cultural-names/jupiter").expect(200);
    expect(found.body.names.vedic.name).toBe("Brihaspati");
    expect(found.headers["cache-control"]).toBe("public, max-age=86400");

    await request(createApp()).get("/api/cultural-names/not-a-real-object").expect(404);
  });
});
