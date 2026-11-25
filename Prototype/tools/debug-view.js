/* Dev helper: centre the map on (cx, cy) at `scale` with a coordinate grid. */
window.ulDebugView = (cx, cy, scale = 2.5, opts = {}) => {
  const stage = document.getElementById("stage");
  const tilt = document.getElementById("tiltLayer");
  const controls = document.querySelector(".controls");
  if (controls) controls.style.display = "none";
  stage.style.transformOrigin = "0 0";
  stage.style.transform = "none";
  const T = tilt.getBoundingClientRect();
  const vw = innerWidth;
  const vh = innerHeight;
  stage.style.transform = `translate(${vw / 2 - T.left - scale * cx}px, ${
    vh / 2 - T.top - scale * cy
  }px) scale(${scale})`;
  const map = document.querySelector(".map");
  let grid = map.querySelector("#ul-debug-grid");
  if (opts.grid === false) {
    if (grid) grid.remove();
    return;
  }
  if (!grid) {
    const NS = "http://www.w3.org/2000/svg";
    grid = document.createElementNS(NS, "svg");
    grid.id = "ul-debug-grid";
    grid.setAttribute("viewBox", "0 0 2184 2114");
    grid.style.cssText =
      "position:absolute;left:0;top:0;width:2184px;height:2114px;pointer-events:none;z-index:40";
    let s = "";
    for (let x = 0; x <= 2184; x += 20) {
      const major = x % 100 === 0;
      s += `<line x1="${x}" y1="0" x2="${x}" y2="2114" stroke="${major ? "#ff0055" : "#ff005533"}" stroke-width="${major ? 0.8 : 0.4}"/>`;
    }
    for (let y = 0; y <= 2114; y += 20) {
      const major = y % 100 === 0;
      s += `<line x1="0" y1="${y}" x2="2184" y2="${y}" stroke="${major ? "#ff0055" : "#ff005533"}" stroke-width="${major ? 0.8 : 0.4}"/>`;
    }
    for (let x = 0; x <= 2184; x += 100)
      for (let y = 0; y <= 2114; y += 100)
        s += `<text x="${x + 2}" y="${y + 8}" font-size="7" fill="#ff0055" font-family="monospace">${x},${y}</text>`;
    grid.innerHTML = s;
    map.appendChild(grid);
  }
};
