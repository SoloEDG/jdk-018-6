import type { Region, Rect, StudioDocument } from "./document";
export const DEFAULT_CUSTOM = " .:-=+*#%@";
export const REGION_COLORS = [
  "#d8ee9d",
  "#f0b47a",
  "#8fc7ee",
  "#e59ac4",
  "#b8a6f0",
  "#7fd8bd",
  "#f0d778",
  "#d99a8f",
];
export function baseRule(doc: StudioDocument) {
  return {
    charset: doc.settings.charset,
    custom: doc.settings.custom,
    density: 0,
    contrast: doc.settings.contrast,
    gamma: doc.settings.gamma,
    invert: doc.settings.invert,
  };
}
let regionSequence = 0;
export function createRegion(index: number, rect: Rect): Region {
  regionSequence++;
  return {
    id: `r${Date.now().toString(36)}${regionSequence}`,
    name: `区域 ${index + 1}`,
    color: REGION_COLORS[index % REGION_COLORS.length]!,
    rect,
    enabled: true,
    rule: {
      charset: "detail",
      custom: DEFAULT_CUSTOM,
      density: 0,
      contrast: 1,
      gamma: 1,
      invert: false,
    },
  };
}
export function createDocument(): StudioDocument {
  return {
    asset: null,
    crop: { x: 0, y: 0, width: 1, height: 1 },
    settings: {
      columns: 100,
      charset: "standard",
      custom: DEFAULT_CUSTOM,
      contrast: 1,
      gamma: 1,
      invert: false,
      color: true,
      background: "#101216",
    },
    regions: [],
    grid: null,
    revision: 0,
  };
}
