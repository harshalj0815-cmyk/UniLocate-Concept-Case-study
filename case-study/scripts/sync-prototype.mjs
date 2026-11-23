/**
 * Builds a static snapshot of ../Prototype/web and copies it to
 * public/prototype-app/ so the case study can embed it (no second server).
 *
 *   npm run sync:prototype
 */
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, rmSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const protoDir = path.resolve(here, "../../Prototype/web");
const outDir = path.join(protoDir, "out");
const target = path.resolve(here, "../public/prototype-app");

if (!existsSync(protoDir)) {
  console.error(`Prototype not found at ${protoDir}`);
  process.exit(1);
}

const nextBin = path.join(protoDir, "node_modules/next/dist/bin/next");
if (!existsSync(nextBin)) {
  console.error("Run npm install in Prototype/web first.");
  process.exit(1);
}

const build = spawnSync(process.execPath, [nextBin, "build"], {
  cwd: protoDir,
  stdio: "inherit",
  env: { ...process.env, PROTO_EXPORT: "1", NEXT_TELEMETRY_DISABLED: "1" },
});
if (build.status !== 0) process.exit(build.status ?? 1);

if (!existsSync(path.join(outDir, "index.html"))) {
  console.error("Export finished without out/index.html");
  process.exit(1);
}

rmSync(target, { recursive: true, force: true });
cpSync(outDir, target, { recursive: true });
console.log(`Prototype snapshot copied to ${target}`);
