import type { Cell, Grid } from "../../../shared/document";
import { BASE_NAME } from "./assign";
export interface CellExplanation {
  owner: string;
  ownerId: string;
  color: string;
  priority: number;
  glyph: string;
  luminance: number;
  tone: number;
  reason: string;
}
/**
 * Explains a single output cell using the rule snapshot frozen into the grid,
 * so the answer stays accurate even after the live region list is edited.
 */
export function explainCell(grid: Grid, index: number): CellExplanation | null {
  const cell = grid.cells[index];
  if (!cell) return null;
  if (cell.ruleId === "base") {
    return {
      owner: BASE_NAME,
      ownerId: "base",
      color: "#8b9198",
      priority: 0,
      glyph: cell.glyph,
      luminance: cell.luminance,
      tone: cell.tone,
      reason: "未落入任何区域，使用全图基础映射",
    };
  }
  const rule = grid.rules.find((r) => r.id === cell.ruleId);
  if (!rule) return null;
  const covers = grid.rules.filter(
    (r) => r.enabled && pointInRect(r, cellCenterInCell(grid, index)),
  );
  return {
    owner: rule.name,
    ownerId: rule.id,
    color: rule.color,
    priority: rule.priority,
    glyph: cell.glyph,
    luminance: cell.luminance,
    tone: cell.tone,
    reason:
      covers.length > 1
        ? `${covers.length} 个区域覆盖此格，优先级 ${rule.priority} 最高`
        : `仅「${rule.name}」覆盖此格`,
  };
}
function pointInRect(
  rule: { rect: { x: number; y: number; width: number; height: number } },
  p: { x: number; y: number },
) {
  return (
    p.x >= rule.rect.x &&
    p.x < rule.rect.x + rule.rect.width &&
    p.y >= rule.rect.y &&
    p.y < rule.rect.y + rule.rect.height
  );
}
function cellCenterInCell(grid: Grid, index: number) {
  const column = index % grid.columns;
  const row = Math.floor(index / grid.columns);
  return {
    x: grid.crop.x + ((column + 0.5) / grid.columns) * grid.crop.width,
    y: grid.crop.y + ((row + 0.5) / grid.rows) * grid.crop.height,
  };
}
export function cellGlyph(cell: Cell) {
  return cell.glyph === " " ? "␠" : cell.glyph;
}
