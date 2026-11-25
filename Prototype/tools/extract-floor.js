/* Paste into a floor page console (or Runtime.evaluate) to dump layer geometry in map px. */
(() => {
  const stage = document.getElementById("stage");
  stage.style.transform = "none";
  const map = document.querySelector(".map");
  const M = map.getBoundingClientRect();
  const r = (el) => {
    const b = el.getBoundingClientRect();
    return [
      Math.round(b.left - M.left),
      Math.round(b.top - M.top),
      Math.round(b.width),
      Math.round(b.height),
    ];
  };
  const out = {
    floor: document.body.dataset.floor,
    rooms: [],
    lifts: [],
    washrooms: [],
    doors: [],
    stairs: [],
    gates: [],
    labels: [],
    corridors: [],
    other: [],
  };
  map.querySelectorAll("path").forEach((p) => {
    const f = p.getAttribute("fill");
    const svg = p.closest("svg");
    const op = getComputedStyle(svg).opacity;
    if (f === "#9AABB2") out.rooms.push([...r(p), +op]);
    else if (f === "#595959") {
      const vb = svg.getAttribute("viewBox");
      (vb === "0 0 12 12" ? out.lifts : out.washrooms).push([...r(svg), +op]);
    } else if (["#D9DFE3", "#E9E9E9", "#E1E6E8"].includes(f))
      out.corridors.push([f, ...r(p), +op]);
    else if (["#A2E274", "#C59079", "#F8DB5B", "#FFDF8F", "#CDF8EF", "#FF8543"].includes(f))
      out.other.push([f, ...r(p), +op]);
  });
  map.querySelectorAll("div").forEach((d) => {
    const bg = d.style.backgroundColor;
    if (bg === "rgb(0, 67, 200)") out.doors.push(r(d));
    else if (bg === "rgb(217, 217, 217)") out.stairs.push(r(d));
    else if (bg === "rgb(255, 133, 67)") out.gates.push(r(d));
    else if (["rgb(217, 223, 227)", "rgb(233, 233, 233)", "rgb(225, 230, 232)"].includes(bg))
      out.corridors.push(["div", ...r(d), +getComputedStyle(d).opacity]);
    else if (!d.children.length && d.textContent.trim())
      out.labels.push([d.textContent.trim().replace(/\s+/g, " "), ...r(d)]);
  });
  return JSON.stringify(out);
})();
