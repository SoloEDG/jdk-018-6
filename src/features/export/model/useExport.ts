import { useStudio } from "../../../shared/useStudio";
import { textContent, rulesManifest } from "../lib/text";
import { download, exportName } from "../lib/download";
import { drawGrid } from "../../preview";
export function useExport() {
  const { doc, notice, busy, ensureFresh } = useStudio();
  function ready() {
    return !!doc.grid && doc.grid.revision === doc.revision && !busy.value;
  }
  function current() {
    return ensureFresh();
  }
  function saveText() {
    const grid = current();
    if (!grid) return;
    download(
      new Blob([textContent(grid)], { type: "text/plain;charset=utf-8" }),
      exportName(doc.asset?.name ?? "art", "txt"),
    );
    notice.value = "文本已导出（单一网格，行列对齐）";
  }
  async function copy() {
    const grid = current();
    if (!grid) return;
    try {
      await navigator.clipboard.writeText(textContent(grid));
      notice.value = "字符画已复制";
    } catch {
      notice.value = "无法访问剪贴板，请使用文本导出";
    }
  }
  function png() {
    const grid = current();
    if (!grid) return;
    const c = document.createElement("canvas");
    // The exported PNG renders only glyphs: ownership tints stay on screen.
    drawGrid(c, grid, doc.settings.color, doc.settings.background);
    c.toBlob((b) => {
      if (b) download(b, exportName(doc.asset?.name ?? "art", "png"));
    }, "image/png");
  }
  function saveRules() {
    const grid = current();
    if (!grid) return;
    download(
      new Blob([rulesManifest(grid)], { type: "text/plain;charset=utf-8" }),
      exportName(doc.asset?.name ?? "art", "rules.txt"),
    );
    notice.value = "规则清单已导出";
  }
  return { doc, busy, ready, saveText, copy, png, saveRules };
}
