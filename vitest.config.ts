import { defineConfig } from "vitest/config";
export default defineConfig({ test: { pool: "threads", maxWorkers: 1, testTimeout: 30000, hookTimeout: 60000, include: ["tests/**/*.test.ts", "tests/city-performance.test.js"] } });
