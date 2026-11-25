/**
 * Writes WebP copies of the heavy images so the deployed site loads fast.
 *
 * - Case study figures: resized to 1840px wide (2x the 920px column; 2240px for
 *   the two shown at 1120px), because
 *   the source exports are up to 3680x19470 and WebP cannot exceed 16383px.
 * - Prototype images: same size, re-encoded (PNG photos and polaroids).
 *
 * Run from case-study: `node scripts/optimize-images.mjs`, then
 * `npm run sync:prototype` so the prototype copy picks up its WebP files.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const here = path.dirname(fileURLToPath(import.meta.url));
const caseStudyPublic = path.resolve(here, "../public");
const prototypeImages = path.resolve(here, "../../Prototype/web/public/images");

/* Shown up to 1120px wide, so they keep 2x of that */
const CASE_STUDY_WIDE = ["thumbnail.png", "what-is-unilocate.png"];

const CASE_STUDY = [
  "problem-discovery.png",
  "ideas-explored.png",
  "concept-development.png",
  "what-was-decided.png",
  "edge-cases.png",
  "interview-crowd.png",
];

const PROTOTYPE = [
  "Background.png",
  "CollegeImage-01.png",
  "CollegeImage-02.png",
  "CollegeImage-03.png",
  "signup-door.png",
  "image-2.jpg",
  "image-3.jpg",
  "image-5.jpg",
  "image-6.jpg",
  "image-7.jpg",
];

const MAX_WIDTH = 1840;

async function toWebp(file, { maxWidth } = {}) {
  const out = file.replace(/\.(png|jpe?g)$/i, ".webp");
  let img = sharp(file, { limitInputPixels: false });
  if (maxWidth) img = img.resize({ width: maxWidth, withoutEnlargement: true });
  const info = await img.webp({ quality: 82, effort: 5 }).toFile(out);
  return { out: path.basename(out), width: info.width, height: info.height, kb: Math.round(info.size / 1024) };
}

for (const name of CASE_STUDY_WIDE) {
  const r = await toWebp(path.join(caseStudyPublic, name), { maxWidth: 2240 });
  console.log(`case-study  ${r.out.padEnd(28)} ${r.width}x${r.height}  ${r.kb} KB`);
}
for (const name of CASE_STUDY) {
  const r = await toWebp(path.join(caseStudyPublic, name), { maxWidth: MAX_WIDTH });
  console.log(`case-study  ${r.out.padEnd(28)} ${r.width}x${r.height}  ${r.kb} KB`);
}
for (const name of PROTOTYPE) {
  const r = await toWebp(path.join(prototypeImages, name));
  console.log(`prototype   ${r.out.padEnd(28)} ${r.width}x${r.height}  ${r.kb} KB`);
}
