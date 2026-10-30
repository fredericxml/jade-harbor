// Validate a portable Jade Harbor ZIP through an ordinary static HTTP server.
// Usage: npm run test:archive -- ../path/to/archive.zip
import { spawn, execFileSync } from "node:child_process";
import { mkdtemp, readFile, writeFile, rm, mkdir, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";
import { createServer } from "node:net";
import { createRequire } from "node:module";

const packageMeta = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const defaultArchive = `../JadeHarbor_v${packageMeta.version}_Source_and_Dist.zip`;
const archive = resolve(process.argv[2] ?? process.env.JADE_HARBOR_ARCHIVE ?? defaultArchive);
const pythonCandidates = process.platform === "win32" ? ["python", "py"] : ["python3", "python"];

async function assertFile(path) {
  try {
    const info = await stat(path);
    if (!info.isFile()) throw new Error();
  } catch {
    throw new Error(
      `Archive not found: ${path}\n` +
      `Usage: npm run test:archive -- ../Your_JadeHarbor.zip\n` +
      `or set JADE_HARBOR_ARCHIVE. Default: ${defaultArchive}`,
    );
  }
}

function findPython() {
  for (const candidate of pythonCandidates) {
    try {
      execFileSync(candidate, ["-c", "import sys; print(sys.version_info[0])"], { stdio: "ignore" });
      return candidate;
    } catch {}
  }
  throw new Error(`Python is required for archive extraction. Tried: ${pythonCandidates.join(", ")}`);
}

async function freePort() {
  return await new Promise((resolvePort, reject) => {
    const probe = createServer();
    probe.unref();
    probe.on("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      const port = typeof address === "object" && address ? address.port : 0;
      probe.close(() => resolvePort(port));
    });
  });
}

async function waitForServer(url, server, timeoutMs = 8000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`Static server exited with code ${server.exitCode}`);
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (response.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`Static server did not become ready within ${timeoutMs} ms: ${url}`);
}

await assertFile(archive);
const directory = await mkdtemp(join(tmpdir(), "jade-harbor-zip-"));
const python = findPython();
execFileSync(python, [
  "-c",
  [
    "import zipfile,sys,pathlib",
    "z=zipfile.ZipFile(sys.argv[1])",
    "bad=z.testzip()",
    "assert bad is None, f'ZIP CRC failure: {bad}'",
    "names=z.namelist()",
    "assert 'JadeHarbor/dist/index.html' in names, 'Missing JadeHarbor/dist/index.html'",
    "assert any(n.startswith('JadeHarbor/dist/assets/generation.worker-') and n.endswith('.js') for n in names), 'Missing generation worker'",
    "assert not any('/node_modules/' in n or '/.git/' in n or '/test-results/' in n for n in names), 'Archive contains forbidden development output'",
    "assert not any(n.startswith('JadeHarbor/docs/proof/') for n in names), 'Curated archive includes docs/proof'",
    "z.extractall(sys.argv[2])",
  ].join("; "),
  archive,
  directory,
]);

const port = await freePort();
const url = `http://127.0.0.1:${port}`;
const server = spawn(
  python,
  [
    "-u",
    "-m",
    "http.server",
    String(port),
    "--bind",
    "127.0.0.1",
    "--directory",
    join(directory, "JadeHarbor", "dist"),
  ],
  { stdio: ["ignore", "pipe", "pipe"] },
);
let serverLog = "";
server.stdout.on("data", (b) => (serverLog += b.toString()));
server.stderr.on("data", (b) => (serverLog += b.toString()));

try {
  await waitForServer(url, server);
  const require = createRequire(import.meta.url);
  try {
    require.resolve("playwright");
  } catch {
    await mkdir("test-results", { recursive: true });
    const blocked = {
      status: "blocked",
      archive,
      blocker: "Playwright is not installed. Run npm ci before the browser archive smoke test.",
      checksPassed: [
        "ZIP CRC integrity",
        "required archive structure and generation worker",
        "forbidden development output absent",
        "extracted dist served successfully over loopback HTTP",
      ],
    };
    await writeFile("test-results/archive-smoke-results.json", JSON.stringify(blocked, null, 2));
    throw new Error(blocked.blocker);
  }
  const exit = await new Promise((ok, fail) => {
    const child = spawn(process.execPath, ["tests/production.mjs"], {
      stdio: "inherit",
      env: { ...process.env, PRODUCTION_URL: url },
    });
    child.on("error", fail);
    child.on("exit", ok);
  });
  if (exit !== 0) throw new Error(`Extracted production smoke failed: ${exit}`);
  const result = {
    status: "passed",
    archive,
    sha256: createHash("sha256").update(await readFile(archive)).digest("hex"),
    checks: [
      "ZIP CRC integrity",
      "required archive structure and generation worker",
      "forbidden development output absent",
      "extracted dist served by Python HTTP server",
      "production WebGL2 and asset/worker paths",
      "create, choose block, save, reload without dev hook",
    ],
    errors: [],
  };
  await mkdir("test-results", { recursive: true });
  await writeFile("test-results/archive-smoke-results.json", JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  if (serverLog.trim()) console.error("Static server log:\n" + serverLog.trim());
  throw error;
} finally {
  server.kill();
  await rm(directory, { recursive: true, force: true });
}
