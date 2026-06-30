import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";
import pkg from "./package.json" with { type: "json" };

export default defineConfig({
  plugins: [sveltekit(), tailwindcss()],
  // Pin the dev port: config.ts and playwright's baseURL assume 5173, so fail
  // fast instead of silently drifting to 5174 if the port is taken.
  server: { port: 5173, strictPort: true },
  // Mirror the pin for `vite preview` (default 4173) for the same reason.
  preview: { port: 4173, strictPort: true },
  // Emit source maps so production stack traces map back to real source.
  build: { sourcemap: true },
  // Inject the package version as a compile-time constant (see app.d.ts).
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  // Unit tests only — Playwright e2e lives in e2e/ and runs separately.
  test: {
    include: ["src/**/*.test.ts"],
    exclude: ["e2e/**", "node_modules/**"],
    clearMocks: true,
    restoreMocks: true,
    reporters: process.env.CI ? ["default", "github-actions"] : "default",
    coverage: {
      provider: "v8",
      // lcov is what Codecov ingests; text for the CLI, html for the artifact.
      reporter: ["text", "html", "lcov"],
      include: ["src/lib/**"]
    }
  }
});
