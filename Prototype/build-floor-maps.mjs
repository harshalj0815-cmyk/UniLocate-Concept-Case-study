import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const proto = __dirname;

function extractJsx(raw) {
  const start = raw.indexOf("(");
  const end = raw.lastIndexOf(")");
  if (start < 0 || end < 0) throw new Error("No JSX wrapper found");
  return raw.slice(start + 1, end).trim();
}

function styleObjectToCss(inner) {
  const decls = [];
  const re =
    /([A-Za-z_$][\w$]*)\s*:\s*(?:'([^']*)'|"([^"]*)"|([^,}]+?(?=\s*,\s*[A-Za-z_$][\w$]*\s*:|\s*$)))/g;
  let m;
  while ((m = re.exec(inner))) {
    let key = m[1];
    let val = (m[2] ?? m[3] ?? m[4] ?? "").trim();
    key = key
      .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
      .replace(/^Moz/, "-moz-")
      .replace(/^Webkit/, "-webkit-")
      .replace(/^-moz-/, "-moz-")
      .replace(/^-webkit-/, "-webkit-")
      .toLowerCase();
    // Fix double prefix edge cases from replace order
    key = key.replace(/^-moz--/, "-moz-").replace(/^-webkit--/, "-webkit-");
    val = val.replace(/"/g, "&quot;");
    decls.push(`${key}: ${val}`);
  }
  return decls.join("; ");
}

function jsxToHtml(jsx) {
  let html = jsx;

  // style={{ ... }} → style="..."
  html = html.replace(/style=\{\{([\s\S]*?)\}\}/g, (_, inner) => {
    return `style="${styleObjectToCss(inner)}"`;
  });

  // className → class
  html = html.replace(/\bclassName=/g, "class=");

  // SVG camelCase attrs → kebab
  const attrMap = [
    ["fillRule", "fill-rule"],
    ["clipRule", "clip-rule"],
    ["strokeWidth", "stroke-width"],
    ["strokeLinecap", "stroke-linecap"],
    ["strokeLinejoin", "stroke-linejoin"],
    ["strokeMiterlimit", "stroke-miterlimit"],
    ["strokeDasharray", "stroke-dasharray"],
    ["strokeDashoffset", "stroke-dashoffset"],
    ["strokeOpacity", "stroke-opacity"],
    ["fillOpacity", "fill-opacity"],
    ["clipPath", "clip-path"],
    ["vectorEffect", "vector-effect"],
    ["preserveAspectRatio", "preserveAspectRatio"],
    ["xmlnsXlink", "xmlns:xlink"],
    ["xlinkHref", "xlink:href"],
    ["tabIndex", "tabindex"],
    ["htmlFor", "for"],
  ];
  for (const [from, to] of attrMap) {
    html = html.replace(new RegExp(`\\b${from}=`, "g"), `${to}=`);
  }

  // Self-closing non-void HTML tags → open/close (keep SVG voids: path, polyline, …)
  // Must use (?=[\s/>]) so "p" does not match "path"
  html = html.replace(
    /<(div|span|p|section|article|header|footer|nav|main|aside|h[1-6]|ul|ol|li|button|a|label|output)(?=[\s/>])([^>]*?)\/>/gi,
    "<$1$2></$1>"
  );

  // Fix any already-broken path closings if present
  html = html.replace(/<(path|circle|rect|line|polyline|polygon|ellipse|g|defs|clipPath|mask|use|image|text|tspan)(\s[^>]*)?><\/p>/gi, "<$1$2 />");

  // JSX comments
  html = html.replace(/\{\/\*[\s\S]*?\*\/\}/g, "");

  // Remove leftover JSX expressions that are just strings in braces (rare)
  html = html.replace(/\{(['"`])(.*?)\1\}/g, "$2");

  // Fix overflow clip → visible for map root (like ground floor)
  html = html.replace(/overflow:\s*clip/g, "overflow: visible");
  html = html.replace(/overflow:\s*&quot;clip&quot;/g, "overflow: visible");

  // Force Plus Jakarta on font-family mentions of Satoshi if any
  html = html.replace(/Satoshi/g, "Plus Jakarta Sans");

  return html;
}

function shell({ title, floorKey, mapId, mapHtml, active }) {
  const floors = [
    { key: "ground", href: "ground-floor-map.html", label: "Ground" },
    { key: "1st", href: "first-floor-map.html", label: "1st" },
    { key: "2nd", href: "second-floor-map.html", label: "2nd" },
  ];
  const switcher = floors
    .map(
      (f) =>
        `<a class="floor-btn${f.key === active ? " is-active" : ""}" href="${f.href}">${f.label}</a>`
    )
    .join("\n      ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Cache-Control" content="no-store" />
  <title>UniLocate — ${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700&display=swap" rel="stylesheet" />
  <style>
    :root {
      --map-font: "Plus Jakarta Sans", system-ui, sans-serif;
      --map-w: 2184;
      --map-h: 2114;
    }

    * { box-sizing: border-box; }

    html, body {
      margin: 0;
      height: 100%;
      background: #ffffff;
      font-family: var(--map-font);
      overflow: hidden;
      touch-action: none;
    }

    .viewport {
      position: relative;
      width: 100vw;
      height: 100vh;
      background: #ffffff;
      overflow: hidden;
      cursor: grab;
      user-select: none;
      perspective: 1600px;
      perspective-origin: 50% 40%;
    }

    .viewport.is-dragging { cursor: grabbing; }

    .world {
      position: absolute;
      left: 50%;
      top: 50%;
      width: 0;
      height: 0;
      pointer-events: none;
      transform-style: preserve-3d;
    }

    .tilt-layer {
      position: absolute;
      left: calc(var(--map-w) * -0.5px);
      top: calc(var(--map-h) * -0.5px);
      width: calc(var(--map-w) * 1px);
      height: calc(var(--map-h) * 1px);
      transform-origin: center center;
      transform-style: preserve-3d;
      pointer-events: none;
    }

    .stage {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background: #ffffff;
      transform-origin: center center;
      pointer-events: auto;
    }

    .map {
      width: calc(var(--map-w) * 1px) !important;
      height: calc(var(--map-h) * 1px) !important;
      position: relative !important;
      background: #ffffff !important;
      overflow: visible !important;
      font-family: var(--map-font) !important;
      font-weight: 500;
      color: #2a2a2a;
      -webkit-font-smoothing: antialiased;
      text-rendering: geometricPrecision;
    }

    .map, .map * { font-family: var(--map-font) !important; }

    .map > svg,
    .map > div:not(.map-label) { z-index: 1; }

    .map svg { shape-rendering: geometricPrecision; }

    .map-label {
      z-index: 8 !important;
      overflow: hidden !important;
      display: -webkit-box !important;
      -webkit-box-orient: vertical !important;
      -webkit-line-clamp: 2 !important;
      line-clamp: 2 !important;
      white-space: pre-line !important;
      text-align: center !important;
      translate: none !important;
      transform: translate(-50%, -50%);
      transform-origin: center center;
      letter-spacing: 0;
      font-size: 12px;
      line-height: 15px;
      font-weight: 500 !important;
      color: #2a2a2a !important;
      pointer-events: none;
      height: auto !important;
      width: max-content !important;
      max-width: none !important;
      transition: opacity 120ms linear;
    }

    .controls {
      position: fixed;
      left: 16px;
      bottom: 16px;
      z-index: 20;
      width: min(320px, calc(100vw - 32px));
      padding: 14px 14px 12px;
      border: 1px solid #e6e6e6;
      background: rgba(255, 255, 255, 0.94);
      font-family: var(--map-font);
      color: #2a2a2a;
      backdrop-filter: blur(8px);
    }

    .controls h1 {
      margin: 0 0 10px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.02em;
    }

    .floor-switch {
      display: flex;
      gap: 6px;
      margin-bottom: 12px;
    }

    .floor-btn {
      flex: 1;
      text-align: center;
      text-decoration: none;
      color: #2a2a2a;
      font-size: 11px;
      font-weight: 600;
      padding: 7px 0;
      border: 1px solid #e6e6e6;
      background: #fff;
    }

    .floor-btn.is-active {
      background: #2a2a2a;
      color: #fff;
      border-color: #2a2a2a;
    }

    .control-row {
      display: grid;
      grid-template-columns: 64px 1fr 44px;
      gap: 8px;
      align-items: center;
      margin-bottom: 8px;
    }

    .control-row label {
      font-size: 11px;
      font-weight: 600;
    }

    .control-row output {
      font-size: 11px;
      text-align: right;
      font-variant-numeric: tabular-nums;
    }

    .control-row input[type="range"] { width: 100%; }

    .control-actions { margin-top: 4px; }

    .control-actions button {
      width: 100%;
      border: 1px solid #e6e6e6;
      background: #fff;
      padding: 8px 0;
      font: inherit;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }

    .hint {
      margin: 10px 0 0;
      font-size: 10px;
      color: #777;
      line-height: 1.35;
    }
  </style>
</head>
<body data-floor="${active === "1st" ? "first" : active === "2nd" ? "second" : "ground"}">
  <div class="viewport" id="viewport" aria-label="Interactive ${title}">
    <div class="world">
      <div class="tilt-layer" id="tiltLayer">
        <div class="stage" id="stage">
${mapHtml.replace(
  /^<div\b([^>]*)>/,
  (_, attrs) => {
    let a = attrs
      .replace(/\s*\bid\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/i, "")
      .replace(/\s*\bclass\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/i, "");
    return `<div id="${mapId}" class="map"${a}>`;
  }
)}
        </div>
      </div>
    </div>
  </div>

  <aside class="controls" aria-label="Map controls">
    <h1>${title}</h1>
    <div class="floor-switch" role="navigation" aria-label="Floors">
      ${switcher}
    </div>
    <div class="control-row">
      <label for="zoom">Zoom</label>
      <input id="zoom" type="range" min="0.2" max="2" step="0.01" value="0.5" />
      <output id="zoomOut">50%</output>
    </div>
    <div class="control-row">
      <label for="rotate">Rotate</label>
      <input id="rotate" type="range" min="-180" max="180" step="1" value="0" />
      <output id="rotateOut">0°</output>
    </div>
    <div class="control-row">
      <label for="tilt">Tilt</label>
      <input id="tilt" type="range" min="0" max="55" step="1" value="18" />
      <output id="tiltOut">18°</output>
    </div>
    <div class="control-actions">
      <button type="button" id="resetView">Reset</button>
    </div>
    <p class="hint">Scroll to zoom · Drag to pan · Labels scale together · 2 lines max</p>
  </aside>

  <script>
    (() => {
      const viewport = document.getElementById("viewport");
      const tiltLayer = document.getElementById("tiltLayer");
      const stage = document.getElementById("stage");
      const map = document.getElementById("${mapId}");
      const zoomInput = document.getElementById("zoom");
      const rotateInput = document.getElementById("rotate");
      const tiltInput = document.getElementById("tilt");
      const zoomOut = document.getElementById("zoomOut");
      const rotateOut = document.getElementById("rotateOut");
      const tiltOut = document.getElementById("tiltOut");
      const resetBtn = document.getElementById("resetView");

      const state = {
        x: 0,
        y: 0,
        zoom: Number(zoomInput.value),
        rotate: Number(rotateInput.value),
        tilt: Number(tiltInput.value),
      };
      const defaults = { ...state };

      const labels = [...map.querySelectorAll(":scope > div")].filter((el) => {
        const text = el.textContent.trim();
        if (!text) return false;
        return /font-size\\s*:/i.test(el.getAttribute("style") || "");
      });

      function toMaxTwoLines(raw) {
        const words = raw
          .replace(/<br\\s*\\/?>/gi, " ")
          .replace(/<[^>]+>/g, "")
          .replace(/\\s+/g, " ")
          .trim()
          .split(" ")
          .filter(Boolean);
        if (words.length <= 1) return words.join(" ");
        if (words.length === 2) return words.join("\\n");
        const joined = words.join(" ");
        if (/^entry exit gate$/i.test(joined)) return "Entry Exit\\nGate";
        if (/^multi purpose court$/i.test(joined)) return "Multi purpose\\ncourt";
        if (/^enquiry desk$/i.test(joined)) return "Enquiry\\nDesk";
        if (/^gym khana$/i.test(joined)) return "Gym\\nKhana";
        if (/^main stage$/i.test(joined)) return "Main\\nStage";
        if (/^fees counter$/i.test(joined)) return "Fees\\nCounter";
        if (/^print shop$/i.test(joined)) return "Print\\nShop";
        if (/^placement cell$/i.test(joined)) return "Placement\\nCell";
        const mid = Math.ceil(words.length / 2);
        return words.slice(0, mid).join(" ") + "\\n" + words.slice(mid).join(" ");
      }

      labels.forEach((el) => {
        el.classList.add("map-label");
        el.textContent = toMaxTwoLines(el.innerHTML);
        el.style.translate = "none";
        el.style.width = "max-content";
        el.style.maxWidth = "none";
        el.style.transform = "translate(-50%, -50%)";
      });

      function clamp(n, min, max) {
        return Math.min(max, Math.max(min, n));
      }

      function labelOpacity(zoom) {
        return clamp((zoom - 0.15) / 0.85, 0.12, 1);
      }

      function applyLabels() {
        const mapFont = clamp(12 / state.zoom, 8, 28);
        const opacity = labelOpacity(state.zoom);
        labels.forEach((el) => {
          el.style.setProperty("font-size", \`\${mapFont.toFixed(2)}px\`, "important");
          el.style.setProperty("line-height", \`\${(mapFont * 1.25).toFixed(2)}px\`, "important");
          el.style.setProperty("opacity", opacity.toFixed(3));
          el.style.transform = "translate(-50%, -50%)";
        });
      }

      function render() {
        tiltLayer.style.transform = "";
        stage.style.zoom = "";
        stage.style.transform =
          \`perspective(1400px)\` +
          \` translate(\${state.x}px, \${state.y}px)\` +
          \` rotateX(\${state.tilt}deg)\` +
          \` rotateZ(\${state.rotate}deg)\` +
          \` scale(\${state.zoom})\`;

        zoomInput.value = String(state.zoom);
        rotateInput.value = String(state.rotate);
        tiltInput.value = String(state.tilt);
        zoomOut.textContent = \`\${Math.round(state.zoom * 100)}%\`;
        rotateOut.textContent = \`\${Math.round(state.rotate)}°\`;
        tiltOut.textContent = \`\${Math.round(state.tilt)}°\`;
        applyLabels();
      }

      function setZoom(next, originX, originY) {
        const prev = state.zoom;
        const zoom = clamp(next, 0.2, 2);
        if (zoom === prev) return;
        if (originX != null && originY != null) {
          const rect = viewport.getBoundingClientRect();
          const cx = originX - rect.left - rect.width / 2;
          const cy = originY - rect.top - rect.height / 2;
          state.x = cx - ((cx - state.x) * zoom) / prev;
          state.y = cy - ((cy - state.y) * zoom) / prev;
        }
        state.zoom = zoom;
        render();
      }

      zoomInput.addEventListener("input", () => setZoom(Number(zoomInput.value)));
      rotateInput.addEventListener("input", () => {
        state.rotate = Number(rotateInput.value);
        render();
      });
      tiltInput.addEventListener("input", () => {
        state.tilt = Number(tiltInput.value);
        render();
      });
      resetBtn.addEventListener("click", () => {
        Object.assign(state, defaults);
        render();
      });

      viewport.addEventListener(
        "wheel",
        (e) => {
          e.preventDefault();
          setZoom(state.zoom * Math.exp(-e.deltaY * 0.0015), e.clientX, e.clientY);
        },
        { passive: false }
      );

      const pointers = new Map();
      let dragging = false;
      let lastX = 0;
      let lastY = 0;
      let pinchStartDist = 0;
      let pinchStartZoom = 1;

      viewport.addEventListener("pointerdown", (e) => {
        if (e.target.closest(".controls")) return;
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        viewport.setPointerCapture(e.pointerId);
        if (pointers.size === 1) {
          dragging = true;
          lastX = e.clientX;
          lastY = e.clientY;
          viewport.classList.add("is-dragging");
        }
        if (pointers.size === 2) {
          dragging = false;
          viewport.classList.remove("is-dragging");
          const pts = [...pointers.values()];
          pinchStartDist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
          pinchStartZoom = state.zoom;
        }
      });

      viewport.addEventListener("pointermove", (e) => {
        if (!pointers.has(e.pointerId)) return;
        pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (pointers.size === 2 && pinchStartDist > 0) {
          const pts = [...pointers.values()];
          const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
          setZoom(pinchStartZoom * (dist / pinchStartDist), (pts[0].x + pts[1].x) / 2, (pts[0].y + pts[1].y) / 2);
          return;
        }
        if (!dragging || pointers.size !== 1) return;
        state.x += e.clientX - lastX;
        state.y += e.clientY - lastY;
        lastX = e.clientX;
        lastY = e.clientY;
        render();
      });

      function endPointer(e) {
        pointers.delete(e.pointerId);
        if (pointers.size < 2) pinchStartDist = 0;
        if (pointers.size === 0) {
          dragging = false;
          viewport.classList.remove("is-dragging");
        } else if (pointers.size === 1) {
          const remaining = [...pointers.values()][0];
          dragging = true;
          lastX = remaining.x;
          lastY = remaining.y;
          viewport.classList.add("is-dragging");
        }
        try { viewport.releasePointerCapture(e.pointerId); } catch (_) {}
      }

      viewport.addEventListener("pointerup", endPointer);
      viewport.addEventListener("pointercancel", endPointer);
      render();
    })();
  </script>
  <script src="map-nav.js?v=20251114s"></script>
</body>
</html>
`;
}

const floors = [
  {
    source: String.raw`C:\Users\Harshal\.cursor\projects\c-Users-Harshal-Desktop-UniLocate\agent-tools\f9d3fef9-1aa5-4c95-b7e3-d866eb7b6e1c.txt`,
    out: path.join(proto, "first-floor-map.html"),
    title: "1st Floor",
    mapId: "first-floor-map",
    active: "1st",
  },
  {
    source: String.raw`C:\Users\Harshal\.cursor\projects\c-Users-Harshal-Desktop-UniLocate\agent-tools\56e2156e-81e8-4347-9d3b-b76c059a7fcb.txt`,
    out: path.join(proto, "second-floor-map.html"),
    title: "2nd Floor",
    mapId: "second-floor-map",
    active: "2nd",
  },
];

for (const floor of floors.filter((f) => f.active === "2nd")) {
  const raw = fs.readFileSync(floor.source, "utf8");
  const jsx = extractJsx(raw);
  const mapHtml = jsxToHtml(jsx);
  const html = shell({
    title: floor.title,
    floorKey: floor.active,
    mapId: floor.mapId,
    mapHtml,
    active: floor.active,
  });
  fs.writeFileSync(floor.out, html, "utf8");
  console.log("Wrote", floor.out, "bytes", html.length);
}
