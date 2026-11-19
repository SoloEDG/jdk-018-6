import type { Grid } from "../../../shared/document";
import { BASE_COLOR, BASE_ID } from "../../regions/lib/assign";
export interface DrawOptions {
  /** Paint a translucent tint per owning rule (screen only, never exported). */
  owners?: boolean;
  /** Cell index to outline. */
  picked?: number | null;
  /** Cells are 8×16 px in the source canvas. */
  cellWidth?: number;
  cellHeight?: number;
}
export function ownerColors(grid: Grid): Map<string, string> {
  const map = new Map<string, string>([[BASE_ID, BASE_COLOR]]);
  for (const rule of grid.rules) map.set(rule.id, rule.color);
  return map;
}
export function drawGrid(
  canvas: HTMLCanvasElement,
  grid: Grid,
  color: boolean,
  background: string,
  options: DrawOptions = {},
) {
  const cw = options.cellWidth ?? 8;
  const ch = options.cellHeight ?? 16;
  canvas.width = grid.columns * cw;
  canvas.height = grid.rows * ch;
  const g = canvas.getContext("2d")!;
  g.fillStyle = background;
  g.fillRect(0, 0, canvas.width, canvas.height);
  if (options.owners) {
    const colors = ownerColors(grid);
    g.globalAlpha = 0.24;
    for (let i = 0; i < grid.cells.length; i++) {
      const cell = grid.cells[i]!;
      g.fillStyle = colors.get(cell.ruleId) ?? BASE_COLOR;
      g.fillRect(
        (i % grid.columns) * cw,
        Math.floor(i / grid.columns) * ch,
        cw,
        ch,
      );
    }
    g.globalAlpha = 1;
  }
  if (options.picked != null && grid.cells[options.picked]) {
    const x = (options.picked % grid.columns) * cw;
    const y = Math.floor(options.picked / grid.columns) * ch;
    g.strokeStyle = "#ffffff";
    g.lineWidth = Math.max(1, cw / 8);
    g.strokeRect(x + 0.5, y + 0.5, cw - 1, ch - 1);
  }
  g.font = `${Math.round(ch * 0.875)}px monospace`;
  g.textBaseline = "middle";
  g.textAlign = "center";
  for (let i = 0; i < grid.cells.length; i++) {
    const cell = grid.cells[i]!;
    g.fillStyle = color ? cell.color : "#e9eceb";
    g.fillText(cell.glyph, (i % grid.columns) * cw + cw / 2, Math.floor(i / grid.columns) * ch + ch / 2);
  }
}
