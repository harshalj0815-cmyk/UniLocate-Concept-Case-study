/** Shell filter chips ↔ campus-map section / POI ids (campus-data.js). */

export type WingFilter = {
  label: string;
  id: string;
  kind: "section";
};

export type BuildingFilter = {
  label: string;
  id: string;
  kind: "section";
};

export type OtherFilter = {
  label: string;
  kind: "poi";
  /** campus-map focusPoi kind */
  poi: "exit" | "washroom" | "staff";
  /** Optional layer toggled on when the chip is active */
  layer?: "exits" | "washrooms";
};

export const WING_FILTERS: readonly WingFilter[] = [
  { label: "R-Wing", id: "wing-r", kind: "section" },
  { label: "J-Wing", id: "wing-j", kind: "section" },
  { label: "O-Wing", id: "wing-o", kind: "section" },
  { label: "P-Wing", id: "wing-p", kind: "section" },
  { label: "G-Wing", id: "wing-g", kind: "section" },
  { label: "T-Wing", id: "wing-t", kind: "section" },
  { label: "S-Wing", id: "wing-s", kind: "section" },
  { label: "L-Wing", id: "wing-l", kind: "section" },
] as const;

export const BUILDING_FILTERS: readonly BuildingFilter[] = [
  { label: "Pica", id: "bldg-pica", kind: "section" },
  { label: "Pimsr", id: "bldg-pimsr", kind: "section" },
  { label: "PCE", id: "bldg-pce", kind: "section" },
  { label: "PCACS", id: "bldg-pcacs", kind: "section" },
] as const;

export const OTHER_FILTERS: readonly OtherFilter[] = [
  { label: "Emergency Exits", kind: "poi", poi: "exit", layer: "exits" },
  { label: "Staff Room", kind: "poi", poi: "staff" },
  { label: "Restrooms", kind: "poi", poi: "washroom", layer: "washrooms" },
] as const;

export const SECTION_BY_LABEL: Record<string, string> = Object.fromEntries(
  [...WING_FILTERS, ...BUILDING_FILTERS].map((f) => [f.label, f.id]),
);

export const LABEL_BY_SECTION_ID: Record<string, string> = Object.fromEntries(
  [...WING_FILTERS, ...BUILDING_FILTERS].map((f) => [f.id, f.label]),
);
