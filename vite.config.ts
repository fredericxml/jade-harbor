import { defineConfig } from "vite";
export default defineConfig({
  base: "./",
  build: { target: "es2022", manifest: true },
  server: { host: "0.0.0.0", port: 4173, allowedHosts: true },
});
