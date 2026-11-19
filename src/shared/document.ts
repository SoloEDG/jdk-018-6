export interface Crop {
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface Asset {
  name: string;
  url: string;
  width: number;
  height: number;
  image: HTMLImageElement;
}
export interface Settings {
  columns: number;
  charset: string;
  custom: string;
  contrast: number;
  gamma: number;
  invert: boolean;
  color: boolean;
  background: string;
}
export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}
export interface RegionRule {
  charset: string;
  custom: string;
  /** Signed ink bias along the glyph ramp: -1 favours blank, +1 favours full ink. */
  density: number;
  contrast: number;
  gamma: number;
  invert: boolean;
}
export interface Region {
  id: string;
  name: string;
  color: string;
  /** Normalised to the original image, independent of the crop. */
  rect: Rect;
  enabled: boolean;
  rule: RegionRule;
}
export interface Cell {
  glyph: string;
  color: string;
  /** "base" or the id of the region that won this cell. */
  ruleId: string;
  luminance: number;
  /** Final position along the owner's glyph ramp, 0 = first glyph. */
  tone: number;
}
export interface RuleSnapshot extends RegionRule {
  id: string;
  name: string;
  color: string;
  rect: Rect;
  enabled: boolean;
  /** 1 = highest priority. */
  priority: number;
}
export interface AssignmentStat {
  id: string;
  name: string;
  color: string;
  count: number;
}
export interface Grid {
  columns: number;
  rows: number;
  cells: Cell[];
  revision: number;
  crop: Crop;
  base: RegionRule;
  /** Region rules in priority order (highest first). */
  rules: RuleSnapshot[];
  assignments: AssignmentStat[];
}
export interface StudioDocument {
  asset: Asset | null;
  crop: Crop;
  settings: Settings;
  regions: Region[];
  grid: Grid | null;
  revision: number;
}
