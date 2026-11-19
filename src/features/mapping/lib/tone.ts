import type { RegionRule } from "../../../shared/document";
import { glyphs } from "./charsets";
export function tone(
  value: number,
  contrast: number,
  gamma: number,
  invert: boolean,
): number {
  let t = Math.max(0, Math.min(1, (value / 255 - 0.5) * contrast + 0.5));
  t = Math.pow(t, 1 / gamma);
  return invert ? 1 - t : t;
}
export function luminance(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
/**
 * Density shifts the ramp position before glyph lookup. It only reaches the
 * ends of the current charset, so a region can lean finer or sparser without
 * breaking the single continuous grid.
 */
export function inkLevel(t: number, density: number): number {
  return Math.max(0, Math.min(1, t + density * 0.35));
}
export interface MappedGlyph {
  glyph: string;
  tone: number;
  luminance: number;
}
export function mapGlyph(
  rule: RegionRule,
  value: number,
  cellLuminance: number,
): MappedGlyph {
  const chars = glyphs(rule.charset, rule.custom);
  const t = tone(value, rule.contrast, rule.gamma, rule.invert);
  const level = inkLevel(t, rule.density);
  return {
    glyph: chars[Math.round(level * (chars.length - 1))] ?? chars[0]!,
    tone: level,
    luminance: cellLuminance,
  };
}
