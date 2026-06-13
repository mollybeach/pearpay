import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
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
