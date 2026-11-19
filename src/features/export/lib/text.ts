import type { Grid } from "../../../shared/document";
import { BASE_ID, BASE_NAME } from "../../regions/lib/assign";
export function textContent(grid: Grid): string {
  return Array.from({ length: grid.rows }, (_, y) =>
    grid.cells
      .slice(y * grid.columns, (y + 1) * grid.columns)
      .map((c) => c.glyph)
      .join(""),
  ).join("\n");
}
function pct(n: number) {
  return (Math.round(n * 1000) / 10).toString() + "%";
}
/**
 * A human/machine readable manifest that explains the final grid: which rule
 * owns each run of cells, and why. Runs are emitted per row so ownership can
 * be audited without shipping one record per character.
 */
export function rulesManifest(grid: Grid): string {
  const name = (id: string) => {
    if (id === BASE_ID) return BASE_NAME;
    return grid.rules.find((r) => r.id === id)?.name ?? `已删除区域(${id})`;
  };
  const lines: string[] = [
    "# GLYPH / ASCII STUDIO — 区域规则清单",
    `# 网格 ${grid.columns} 列 × ${grid.rows} 行（单一网格，区域不改行列）`,
    `# 裁剪窗口 x=${pct(grid.crop.x)} y=${pct(grid.crop.y)} w=${pct(
      grid.crop.width,
    )} h=${pct(grid.crop.height)}（原图坐标）`,
    `# 基础映射: charset=${grid.base.charset} density=${grid.base.density} contrast=${grid.base.contrast} gamma=${grid.base.gamma} invert=${grid.base.invert}`,
  ];
  for (const rule of grid.rules) {
    const glyphs =
      rule.charset === "custom" ? `custom "${rule.custom}"` : rule.charset;
    lines.push(
      `# P${rule.priority} ${rule.name}: rect=(${pct(rule.rect.x)},${pct(
        rule.rect.y,
      )}) ${pct(rule.rect.width)}×${pct(rule.rect.height)} charset=${glyphs} density=${
        rule.density
      } contrast=${rule.contrast} gamma=${rule.gamma} invert=${rule.invert} ${
        rule.enabled ? "enabled" : "disabled"
      }`,
    );
  }
  const used = grid.assignments.filter((a) => a.count > 0);
  lines.push(
    "# 归属统计: " +
      used.map((a) => `${a.name}=${a.count}`).join(" · "),
  );
  lines.push(
    "# 规则：单元格按采样中心落在半开区间 [x, x+w) 内判定；重叠时优先级数字小者胜出；",
    "# 未命中任何启用区域时使用基础映射。因此跨边界的单元格只有一个确定归属。",
    "# 行号从 0 开始；区间为半开 [start,end)。",
  );
  for (let row = 0; row < grid.rows; row++) {
    const runs: string[] = [];
    let start = 0;
    let owner = grid.cells[row * grid.columns]!.ruleId;
    for (let column = 1; column <= grid.columns; column++) {
      const next =
        column === grid.columns
          ? null
          : grid.cells[row * grid.columns + column]!.ruleId;
      if (next !== owner) {
        runs.push(`[${start},${column}) ${name(owner)}`);
        start = column;
        if (next) owner = next;
      }
    }
    lines.push(`row ${row}: ${runs.join(" | ")}`);
  }
  lines.push("# 仅当区域停用或删除后重新生成时，归属才可能改变。");
  return lines.join("\n");
}
