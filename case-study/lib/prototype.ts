export const PROTOTYPE_SRC = "/prototype-app/index.html";

/**
 * Files the prototype's map and animation screens load inside nested iframes.
 * Fetching them once up front puts them in the HTTP cache, so the first jump to
 * Campus map / Navigating / Arrived does not start from a blank, still-loading frame.
 */
export const PROTOTYPE_WARM_URLS = [
  "/animations/campus-map-loading.html?embed=1&v=6&dur=4.2&reduce=0",
  "/maps/ground-floor-map.html?embed=1&v=41",
  "/maps/first-floor-map.html?embed=1&v=41",
  "/maps/second-floor-map.html?embed=1&v=41",
  "/maps/nav/campus-map.css?v=20261119staff",
  "/maps/nav/campus-data.js?v=20261119start",
  "/maps/nav/campus-router.js?v=20261117v",
  "/maps/nav/campus-map.js?v=20261120notitle",
  "/maps/embed-bridge.js?v=20",
];

/** Google Fonts stylesheets the map pages block rendering on. */
export const PROTOTYPE_FONT_CSS = [
  "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700&display=swap",
  "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600&display=swap",
  "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;800&display=swap",
];
