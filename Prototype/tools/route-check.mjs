// node tools/route-check.mjs [--verbose]  — offline sanity checks for the layered campus graph
import { createRequire } from "module";
import path from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));
globalThis.window = globalThis;
require(path.join(here, "../nav/campus-data.js"));
const { create } = require(path.join(here, "../nav/campus-router.js"));

const verbose = process.argv.includes("--verbose");
const data = globalThis.UL_CAMPUS;
const router = create(data);
let problems = 0;

for (const f of data.floors) {
  for (const c of router.connectorsFor(f.id)) {
    if (c.gap > 24) {
      problems++;
      console.log(`[gap] ${c.key} snaps ${c.gap.toFixed(1)}px to the nearest path`);
    }
  }
}

const starts = [
  data.defaultStart,
  { floor: "first", x: 931, y: 1200 },
  { floor: "second", x: 1019, y: 700 },
];
for (const start of starts) {
  for (const pref of ["stairs", "lift"]) {
    for (const t of router.targets.values()) {
      if (t.layer === "verticals") continue;
      const r = router.route(start, t.id, { pref });
      if (r.error) {
        problems++;
        console.log(`[unreachable] ${start.floor}(${start.x},${start.y}) → ${t.id} [${pref}]: ${r.error}`);
      }
    }
  }
}

const samples = [
  ["2-t201", "stairs"],
  ["2-t201", "lift"],
  ["1-exam", "stairs"],
  ["2-biotech", "stairs"],
  ["g-library", "stairs"],
  ["gate-southeast", "stairs"],
];
for (const [id, pref] of samples) {
  const r = router.route(data.defaultStart, id, { pref });
  console.log(`\n→ ${id} [${pref}]  ${r.meters} m · ~${r.minutes} min · legs: ${r.legs.map((l) => l.floor + (l.exit ? `→(${l.exit.name})` : "")).join(" ")}`);
  if (verbose || id === "2-t201") for (const s of r.steps) console.log(`   ${s.text}${s.meters ? ` · ${s.meters} m` : ""}`);
}

console.log(`\n${problems ? problems + " problem(s)" : "All targets reachable, no large snap gaps"}`);
process.exit(problems ? 1 : 0);
