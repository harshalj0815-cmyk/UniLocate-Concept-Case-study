/* Sticker cursor: drop-in. Load this file with a script tag. */
(function () {
  if (!matchMedia("(pointer: fine)").matches) return; // skip touch devices
  var W = 22, H = 25;   // cursor size in px (make both bigger or smaller together)
  var HX = 4, HY = 4;   // hotspot: tip of the arrow inside the box
  var MIN_DOWN = 150;   // ms the pressed look stays, so even a quick click shows the effect
  var MARK_MS = 3000;   // hold ~0.5s, then fade out; gone by 3s
  var MARK_MAX = 8;     // cap concurrent imprints so rapid clicks don't pile up
  var reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var G = "linear-gradient(to bottom,transparent 0,transparent 33.3%,#000 58%,#000 100%)";
  var EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";
  var d = "M64.5 62C64 46 72 34 84 32.5C91 31.7 96 33.5 100 37L211 128.5C222 137 226 150 220 160C217.5 164.5 213 167.5 206 167.5L157 167.5C147 168.5 140 172 134 179L105 217C100 222.5 93 224.5 86 223C78 221 74 217 72 212L64.5 62Z";
  /* Glue leftover under the sticker: pale, soft, no brand colour */
  var markSvg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="38 6 222 252" width="' + W + '" height="' + H + '">' +
    '<path d="' + d + '" fill="rgba(168,158,132,.55)" stroke="rgba(168,158,132,.35)" stroke-width="28" stroke-linejoin="round"/></svg>';
  var css =
    "body{position:relative}" +
    "html.sc-on,html.sc-on *{cursor:none!important}" +
    "#sc{position:fixed;left:0;top:0;width:" + W + "px;height:" + H + "px;pointer-events:none;z-index:2147483647;opacity:0;transition:opacity .15s;will-change:transform}" +
    "#sc .in{position:relative;width:" + W + "px;height:" + H + "px;transform-origin:" + HX + "px " + HY + "px;transition:transform .2s ease}" +
    "#sc.down .in{transform:scale(.94);transition-duration:.08s}" +
    "#sc svg{display:block;overflow:visible}" +
    "#sc .st{position:absolute;left:0;top:0}" +
    /* shadow: a mask wipes it away from top to bottom on press, and back up on release */
    "#sc .sh{position:absolute;left:-2px;top:2px;filter:blur(1.5px);opacity:.35;" +
    "-webkit-mask-image:" + G + ";mask-image:" + G + ";" +
    "-webkit-mask-size:100% 300%;mask-size:100% 300%;-webkit-mask-repeat:no-repeat;mask-repeat:no-repeat;" +
    "-webkit-mask-position:0 100%;mask-position:0 100%;" +
    "transition:-webkit-mask-position .16s ease-out,mask-position .16s ease-out}" +
    "#sc.down .sh{-webkit-mask-position:0 0;mask-position:0 0;transition-duration:.14s;transition-timing-function:linear}" +
    "#sc.reset .in,#sc.reset .sh{transition:none!important}" +
    /* residue lives in document space so it scrolls with the page */
    ".sc-mark{position:absolute;width:" + W + "px;height:" + H + "px;pointer-events:none;z-index:20}" +
    ".sc-mark__in{width:100%;height:100%;opacity:0;transform-origin:" + HX + "px " + HY + "px;will-change:transform,opacity}" +
    ".sc-mark svg{display:block;overflow:visible;filter:blur(1.1px)}" +
    "@keyframes sc-mark-in{0%{opacity:0;transform:scale(.96)}5%{opacity:.7;transform:scale(1)}16.67%{opacity:.7;transform:scale(1)}100%{opacity:0;transform:scale(1.02)}}" +
    "@keyframes sc-mark-in-reduce{0%{opacity:.4}16.67%{opacity:.4}100%{opacity:0}}" +
    ".sc-mark.is-on .sc-mark__in{animation:sc-mark-in " + MARK_MS + "ms " + EASE_OUT + " forwards}" +
    ".sc-mark.is-on-reduce .sc-mark__in{animation:sc-mark-in-reduce " + Math.round(MARK_MS * 0.55) + "ms " + EASE_OUT + " forwards}";
  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
  var el = document.createElement("div");
  el.id = "sc";
  el.innerHTML =
    '<div class="in">' +
    '<svg class="sh" xmlns="http://www.w3.org/2000/svg" viewBox="38 6 222 252" width="' + W + '" height="' + H + '">' +
    '<path d="' + d + '" fill="#001a52" stroke="#001a52" stroke-width="32" stroke-linejoin="round"/></svg>' +
    '<svg class="st" xmlns="http://www.w3.org/2000/svg" viewBox="38 6 222 252" width="' + W + '" height="' + H + '">' +
    '<path d="' + d + '" fill="#fff" stroke="#fff" stroke-width="32" stroke-linejoin="round"/>' +
    '<path d="' + d + '" fill="#0070c9"/></svg></div>';
  document.body.appendChild(el);
  var root = document.documentElement, downAt = 0, timer, marks = [];
  function release() {
    var wait = Math.max(0, MIN_DOWN - (Date.now() - downAt));
    clearTimeout(timer);
    timer = setTimeout(function () { el.classList.remove("down"); }, wait);
  }
  function stamp(x, y) {
    while (marks.length >= MARK_MAX) {
      var old = marks.shift();
      if (old && old.parentNode) old.parentNode.removeChild(old);
    }
    var mark = document.createElement("div");
    mark.className = "sc-mark";
    var rot = (Math.random() * 10 - 5).toFixed(1);
    mark.style.left = (x - HX) + "px";
    mark.style.top = (y - HY) + "px";
    mark.style.transform = "rotate(" + rot + "deg)";
    mark.innerHTML = '<div class="sc-mark__in">' + markSvg + "</div>";
    document.body.appendChild(mark);
    marks.push(mark);
    // next frame so the animation class actually runs
    requestAnimationFrame(function () {
      mark.classList.add(reduceMotion ? "is-on-reduce" : "is-on");
    });
    mark.addEventListener("animationend", function () {
      if (mark.parentNode) mark.parentNode.removeChild(mark);
      var i = marks.indexOf(mark);
      if (i >= 0) marks.splice(i, 1);
    });
  }
  addEventListener("pointermove", function (e) {
    if (e.pointerType === "touch") return;
    el.style.transform = "translate3d(" + (e.clientX - HX) + "px," + (e.clientY - HY) + "px,0)";
    el.style.opacity = 1;
    root.classList.add("sc-on");
  }, { passive: true });
  addEventListener("pointerdown", function (e) {
    if (e.pointerType === "touch" || e.button !== 0) return;
    clearTimeout(timer);
    if (el.classList.contains("down")) {   // fast repeat click: bring the shadow back instantly, then wipe again
      el.classList.add("reset"); el.classList.remove("down"); void el.offsetWidth; el.classList.remove("reset");
    }
    downAt = Date.now(); void el.offsetWidth; el.classList.add("down");
    stamp(e.pageX, e.pageY);
  }, true);
  ["pointerup", "pointercancel", "dragend", "contextmenu", "blur"].forEach(function (t) {
    addEventListener(t, release, true); // capture, so page scripts can't swallow the release
  });
  document.addEventListener("mouseleave", function () { el.style.opacity = 0; });
  document.addEventListener("mouseenter", function () { el.style.opacity = 1; });
})();
