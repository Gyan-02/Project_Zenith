import { defineConfig } from "vitest/config";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root,
  test: {
    root,
    include: ["{components,hooks,lib}/**/*.{test,spec}.{ts,tsx}"],
    environment: "jsdom",
    setupFiles: [resolve(root, "vitest.setup.ts")],
  },
});
