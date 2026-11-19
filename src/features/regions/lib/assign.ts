import type {
  AssignmentStat,
  Crop,
  Grid,
  Region,
  RegionRule,
  RuleSnapshot,
  StudioDocument,
} from "../../../shared/document";
import { baseRule } from "../../../shared/defaults";
import { cellCenter, containsPoint } from "./geometry";
export const BASE_ID = "base";
export const BASE_NAME = "基础映射";
export const BASE_COLOR = "#8b9198";
export interface Resolved {
  id: string;
  name: string;
  color: string;
  /** 0 for the fallback mapping, 1 = highest region priority. */
  priority: number;
  rule: RegionRule;
}
/**
 * Regions are stored in priority order: index 0 wins every overlap.
 * A snapshot is frozen into the generated grid so the preview can
 * explain which rule produced each cell even after later edits.
 */
export function snapshots(regions: Region[]): RuleSnapshot[] {
  return regions.map((region, i) => ({
    id: region.id,
    name: region.name,
    color: region.color,
    rect: { ...region.rect },
    enabled: region.enabled,
    priority: i + 1,
    charset: region.rule.charset,
    custom: region.rule.custom,
    density: region.rule.density,
    contrast: region.rule.contrast,
    gamma: region.rule.gamma,
    invert: region.rule.invert,
  }));
}
export function resolved(snapshot: RuleSnapshot): Resolved {
  return {
    id: snapshot.id,
    name: snapshot.name,
    color: snapshot.color,
    priority: snapshot.priority,
    rule: {
      charset: snapshot.charset,
      custom: snapshot.custom,
      density: snapshot.density,
      contrast: snapshot.contrast,
      gamma: snapshot.gamma,
      invert: snapshot.invert,
    },
  };
}
export function observedAt(
  doc: StudioDocument,
  rules: RuleSnapshot[],
  x: number,
  y: number,
): Resolved {
  const hit = resolveAt(rules, x, y);
  return hit ? resolved(hit) : baseResolved(doc);
}
export function baseResolved(doc: StudioDocument): Resolved {
  return {
    id: BASE_ID,
    name: BASE_NAME,
    color: BASE_COLOR,
    priority: 0,
    rule: baseRule(doc),
  };
}
/**
 * Deterministic ownership: the cell's sampling centre (in original image
 * coordinates) is tested against each region's half-open rect, highest
 * priority first. A cell that straddles a border belongs to exactly one
 * rule — the one containing its centre — so repeated renders never flip it.
 */
export function resolveAt(
  rules: RuleSnapshot[],
  x: number,
  y: number,
): RuleSnapshot | null {
  for (const rule of rules) {
    if (rule.enabled && containsPoint(rule.rect, x, y)) return rule;
  }
  return null;
}
export function ownerAt(
  doc: StudioDocument,
  rules: RuleSnapshot[],
  crop: Crop,
  columns: number,
  rows: number,
  column: number,
  row: number,
): Resolved {
  const p = cellCenter(crop, columns, rows, column, row);
  return observedAt(doc, rules, p.x, p.y);
}
export function assignmentStats(
  cells: Grid["cells"],
  rules: RuleSnapshot[],
  base: Resolved,
): AssignmentStat[] {
  const counts = new Map<string, number>();
  for (const cell of cells)
    counts.set(cell.ruleId, (counts.get(cell.ruleId) ?? 0) + 1);
  const stats: AssignmentStat[] = [
    { id: BASE_ID, name: base.name, color: base.color, count: counts.get(BASE_ID) ?? 0 },
    ...rules.map((rule) => ({
      id: rule.id,
      name: rule.name,
      color: rule.color,
      count: counts.get(rule.id) ?? 0,
    })),
  ];
  return stats;
}
/** What would own each cell currently owned by `id` if it were removed? */
export function removalFallback(
  doc: StudioDocument,
  grid: Grid,
  id: string,
): { total: number; fallback: { name: string; count: number }[] } {
  const remaining = snapshots(doc.regions.filter((r) => r.id !== id));
  const counts = new Map<string, number>();
  let total = 0;
  for (let i = 0; i < grid.cells.length; i++) {
    if (grid.cells[i]!.ruleId !== id) continue;
    total++;
    const column = i % grid.columns;
    const row = Math.floor(i / grid.columns);
    const owner = ownerAt(
      doc,
      remaining,
      grid.crop,
      grid.columns,
      grid.rows,
      column,
      row,
    );
    const key = owner.id === BASE_ID ? BASE_NAME : owner.name;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return {
    total,
    fallback: [...counts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
  };
}
export function fallbackSummary(
  result: { total: number; fallback: { name: string; count: number }[] },
): string {
  if (!result.total) return "该区域当前没有覆盖任何字符";
  const parts = result.fallback
    .slice(0, 3)
    .map((f) => (f.name === BASE_NAME ? `${f.count} 个回落到基础映射` : `${f.count} 个改由「${f.name}」决定`));
  return `${result.total} 个字符受影响：${parts.join("，")}${
    result.fallback.length > 3 ? " 等" : ""
  }`;
}
export interface ClaimBreakdown {
  owned: number;
  byHigher: { name: string; count: number }[];
  lowerCovered: { name: string; count: number }[];
  enabled: boolean;
}
/**
 * Explains the live configuration for one region: how many cells it owns,
 * which cells inside its rect are taken by higher-priority rules, and which
 * lower-priority regions it is currently eclipsing.
 */
export function claimBreakdown(
  doc: StudioDocument,
  grid: Grid,
  id: string,
): ClaimBreakdown {
  const region = doc.regions.find((r) => r.id === id);
  const result: ClaimBreakdown = {
    owned: 0,
    byHigher: [],
    lowerCovered: [],
    enabled: region?.enabled ?? false,
  };
  if (!region) return result;
  // A disabled region owns nothing and eclipses nothing.
  if (!region.enabled) return result;
  const rules = snapshots(doc.regions);
  const index = doc.regions.findIndex((r) => r.id === id);
  const higher = new Set(doc.regions.slice(0, index).map((r) => r.id));
  const lower = new Set(doc.regions.slice(index + 1).map((r) => r.id));
  const higherCounts = new Map<string, number>();
  const lowerCounts = new Map<string, number>();
  for (let i = 0; i < grid.cells.length; i++) {
    const cell = grid.cells[i]!;
    if (cell.ruleId === id) {
      result.owned++;
      continue;
    }
    const column = i % grid.columns;
    const row = Math.floor(i / grid.columns);
    const p = cellCenter(grid.crop, grid.columns, grid.rows, column, row);
    if (!containsPoint(region.rect, p.x, p.y)) continue;
    const owner = resolveAt(rules, p.x, p.y);
    if (!owner) continue;
    if (higher.has(owner.id))
      higherCounts.set(owner.name, (higherCounts.get(owner.name) ?? 0) + 1);
    else if (lower.has(owner.id))
      lowerCounts.set(owner.name, (lowerCounts.get(owner.name) ?? 0) + 1);
  }
  result.byHigher = [...higherCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  result.lowerCovered = [...lowerCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  return result;
}
/** Compare two priority orderings cell by cell to explain what a move changed. */
export function compareOwners(
  doc: StudioDocument,
  grid: Grid,
  before: RuleSnapshot[],
  after: RuleSnapshot[],
): { from: string; to: string; count: number }[] {
  const changes = new Map<string, { from: string; to: string; count: number }>();
  const label = (rules: RuleSnapshot[], id: string) =>
    id === BASE_ID ? BASE_NAME : (rules.find((r) => r.id === id)?.name ?? id);
  for (let i = 0; i < grid.cells.length; i++) {
    const column = i % grid.columns;
    const row = Math.floor(i / grid.columns);
    const p = cellCenter(grid.crop, grid.columns, grid.rows, column, row);
    const a = resolveAt(before, p.x, p.y)?.id ?? BASE_ID;
    const b = resolveAt(after, p.x, p.y)?.id ?? BASE_ID;
    if (a === b) continue;
    const key = `${a}->${b}`;
    const entry = changes.get(key);
    if (entry) entry.count++;
    else changes.set(key, { from: label(before, a), to: label(after, b), count: 1 });
  }
  return [...changes.values()].sort((a, b) => b.count - a.count);
}
export function describeOwnershipChange(
  changes: { from: string; to: string; count: number }[],
): string {
  if (!changes.length) return "优先级已调整；字符归属保持不变";
  const parts = changes
    .slice(0, 3)
    .map((c) => `${c.count} 个字符由「${c.from}」改由「${c.to}」决定`);
  return `优先级已调整：${parts.join("，")}${changes.length > 3 ? " 等" : ""}`;
}
