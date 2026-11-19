import type { Grid, StudioDocument } from "../../../shared/document";
import {
  assignmentStats,
  BASE_ID,
  baseResolved,
  observedAt,
  snapshots,
} from "../../regions/lib/assign";
import { cellCenter } from "../../regions/lib/geometry";
import { gridSize } from "../lib/gridSize";
import { sample } from "../lib/sample";
import { luminance, mapGlyph, tone } from "../lib/tone";
/**
 * One sampling grid for the whole image. Regions never change the row/column
 * count — they only decide which rule interprets a cell — so every row stays
 * the same width and the output remains a single copyable character grid.
 */
export function generate(doc: StudioDocument): Grid | null {
  if (!doc.asset) return null;
  const s = doc.settings;
  const crop = doc.crop;
  const size = gridSize(
    doc.asset.width * crop.width,
    doc.asset.height * crop.height,
    s.columns,
  );
  const pixels = sample(doc.asset, crop, size.columns, size.rows, s.background);
  const rules = snapshots(doc.regions);
  const base = baseResolved(doc);
  const cells: Grid["cells"] = [];
  for (let i = 0, cell = 0; i < pixels.length; i += 4, cell++) {
    const r = pixels[i]!,
      g = pixels[i + 1]!,
      b = pixels[i + 2]!;
    const column = cell % size.columns;
    const row = Math.floor(cell / size.columns);
    // The cell's sampling centre anchors it to one rule, even across borders.
    const centre = cellCenter(crop, size.columns, size.rows, column, row);
    const owner = observedAt(doc, rules, centre.x, centre.y);
    const luma = luminance(r, g, b);
    const mapped = mapGlyph(owner.rule, luma, luma);
    cells.push({
      glyph: mapped.glyph,
      color:
        "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join(""),
      ruleId: owner.id,
      luminance: mapped.luminance,
      tone: mapped.tone,
    });
  }
  return {
    ...size,
    cells,
    revision: doc.revision,
    crop: { ...crop },
    base: base.rule,
    rules,
    assignments: assignmentStats(cells, rules, base),
  };
}
/** Kept exported for callers that want the pre-region tone curve. */
export { tone };
