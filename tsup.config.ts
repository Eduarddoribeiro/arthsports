import { defineConfig } from "tsup";

export default defineConfig({
  entry: { index: "src/server/index.ts", "definir-senha": "src/server/scripts/definir-senha.ts" },
  outDir: "dist/server",
  format: ["esm"],
  platform: "node",
  target: "node22",
  clean: true,
  sourcemap: true,
  // Código compartilhado (src/shared) é embutido; dependências do npm ficam externas.
});
