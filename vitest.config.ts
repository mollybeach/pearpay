import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // `forks` (child processes) is markedly more stable than the default
    // `threads` (worker_threads) pool. Some Node builds — notably macOS arm64
    // Node v22.20.0's V8 — segfault when vitest spawns worker threads, even for
    // a trivial test. Forks side-steps that crash. See README -> "Running tests".
    pool: "forks",
    poolOptions: {
      forks: { singleFork: true },
    },
  },
  resolve: {
    alias: {
      "@/core": fileURLToPath(new URL("./src/core", import.meta.url)),
      "@/integrations": fileURLToPath(
        new URL("./src/integrations", import.meta.url),
      ),
      "@/channels": fileURLToPath(new URL("./src/channels", import.meta.url)),
      "@/lib": fileURLToPath(new URL("./src/lib", import.meta.url)),
    },
  },
});
