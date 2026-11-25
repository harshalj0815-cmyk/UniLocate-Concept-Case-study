/*
 * Stair plate arrows: pointing at the corridor = where you come out of the stairs,
 * pointing away = where you go in to change floor.
 * The Paper art has both plates of the south-west and south-east stairs pointing away,
 * so the vertical plate of each is turned to point back up its corridor.
 *
 *   node tools/fix-stair-arrows.mjs        patches the three floor pages in place
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PLATES = [
  "left: calc(50% - 476px); position: absolute; rotate: 90deg; top: calc(50% + 292px)", // south-west
  "left: calc(50% - 136px); position: absolute; rotate: 90deg; top: calc(50% + 292px)", // south-east
];
// Arrow group inside the 36×20 plate; turning it 180° about the plate centre
// maps matrix(-1 0 0 -1 a b) to matrix(1 0 0 1 36-a 20-b).
const AWAY = /<g transform="matrix\(-1 0 0 -1 ([\d.]+) ([\d.]+)\)">/y;

export function fixStairArrows(html) {
  let fixed = 0;
  for (const plate of PLATES) {
    const at = html.indexOf(plate);
    if (at < 0) continue;
    const end = html.indexOf("</svg>", at);
    const g = html.indexOf('<g transform="matrix(-1 0 0 -1 ', at);
    if (g < 0 || g > end) continue;
    AWAY.lastIndex = g;
    const m = AWAY.exec(html);
    if (!m) continue;
    const toward = `<g transform="matrix(1 0 0 1 ${36 - Number(m[1])} ${20 - Number(m[2])})">`;
    html = html.slice(0, g) + toward + html.slice(g + m[0].length);
    fixed++;
  }
  return { html, fixed };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const proto = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  for (const name of ["ground-floor-map.html", "first-floor-map.html", "second-floor-map.html"]) {
    const file = path.join(proto, name);
    const { html, fixed } = fixStairArrows(fs.readFileSync(file, "utf8"));
    if (fixed) fs.writeFileSync(file, html, "utf8");
    console.log(name, fixed ? `flipped ${fixed}` : "already correct");
  }
}
