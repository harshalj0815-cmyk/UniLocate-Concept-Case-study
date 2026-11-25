/* Sticker cursor: drop-in. Load this file with a script tag. */
(function () {
  if (!matchMedia("(pointer: fine)").matches) return; // skip touch devices
  var W = 22, H = 25;   // cursor size in px (make both bigger or smaller together)
  var HX = 4, HY = 4;   // hotspot: tip of the arrow inside the box
  var MIN_DOWN = 150;   // ms the pressed look stays, so even a quick click shows the effect
  var G = "linear-gradient(to bottom,transparent 0,transparent 33.3%,#000 58%,#000 100%)";
  var css =
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
    "#sc.reset .in,#sc.reset .sh{transition:none!important}";
  var d = "M64.5 62C64 46 72 34 84 32.5C91 31.7 96 33.5 100 37L211 128.5C222 137 226 150 220 160C217.5 164.5 213 167.5 206 167.5L157 167.5C147 168.5 140 172 134 179L105 217C100 222.5 93 224.5 86 223C78 221 74 217 72 212L64.5 62Z";
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
  var root = document.documentElement, downAt = 0, timer;
  function release() {
    var wait = Math.max(0, MIN_DOWN - (Date.now() - downAt));
    clearTimeout(timer);
    timer = setTimeout(function () { el.classList.remove("down"); }, wait);
  }
  addEventListener("pointermove", function (e) {
    if (e.pointerType === "touch") return;
    el.style.transform = "translate3d(" + (e.clientX - HX) + "px," + (e.clientY - HY) + "px,0)";
    el.style.opacity = 1;
    root.classList.add("sc-on");
  }, { passive: true });
  addEventListener("pointerdown", function () {
    clearTimeout(timer);
    if (el.classList.contains("down")) {   // fast repeat click: bring the shadow back instantly, then wipe again
      el.classList.add("reset"); el.classList.remove("down"); void el.offsetWidth; el.classList.remove("reset");
    }
    downAt = Date.now(); void el.offsetWidth; el.classList.add("down");
  }, true);
  ["pointerup", "pointercancel", "dragend", "contextmenu", "blur"].forEach(function (t) {
    addEventListener(t, release, true); // capture, so page scripts can't swallow the release
  });
  document.addEventListener("mouseleave", function () { el.style.opacity = 0; });
  document.addEventListener("mouseenter", function () { el.style.opacity = 1; });
})();
