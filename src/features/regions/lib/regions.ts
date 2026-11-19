import type { Region, Rect, StudioDocument } from "../../../shared/document";
import { createRegion } from "../../../shared/defaults";
import { normalizeRect } from "./geometry";
export function findRegion(doc: StudioDocument, id: string | null) {
  return id ? (doc.regions.find((r) => r.id === id) ?? null) : null;
}
export function addRegion(doc: StudioDocument, rect: Rect): Region {
  const region = createRegion(doc.regions.length, normalizeRect(rect));
  region.name = makeUniqueName(doc);
  // Newest regions sit on top so a fresh selection immediately takes effect.
  doc.regions.unshift(region);
  return region;
}
export function removeRegion(doc: StudioDocument, id: string) {
  doc.regions = doc.regions.filter((r) => r.id !== id);
}
export function moveRegion(
  doc: StudioDocument,
  id: string,
  direction: -1 | 1,
): boolean {
  const index = doc.regions.findIndex((r) => r.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= doc.regions.length) return false;
  const [region] = doc.regions.splice(index, 1);
  doc.regions.splice(target, 0, region!);
  return true;
}
export function makeUniqueName(doc: StudioDocument, base = "区域") {
  let n = 1;
  const names = new Set(doc.regions.map((r) => r.name));
  while (names.has(`${base} ${n}`)) n++;
  return `${base} ${n}`;
}
export function duplicateRegion(doc: StudioDocument, id: string): Region | null {
  const index = doc.regions.findIndex((r) => r.id === id);
  const source = doc.regions[index];
  if (!source) return null;
  // Offset the copy slightly so both stay individually selectable.
  const rect = normalizeRect({
    ...source.rect,
    x: Math.min(1 - source.rect.width, source.rect.x + 0.03),
    y: Math.min(1 - source.rect.height, source.rect.y + 0.03),
  });
  const base = source.name.replace(/\s*副本(\s\d+)?$/, "") + " 副本";
  let name = base;
  let n = 2;
  while (doc.regions.some((r) => r.name === name)) name = `${base} ${n++}`;
  const copy: Region = {
    ...source,
    id: `r${Date.now().toString(36)}${++duplicateSequence}`,
    name,
    rect,
    rule: { ...source.rule },
  };
  doc.regions.splice(index, 0, copy);
  return copy;
}
let duplicateSequence = 0;
