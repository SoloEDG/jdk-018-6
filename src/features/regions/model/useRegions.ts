import { computed, ref } from "vue";
import { useStudio } from "../../../shared/useStudio";
import type { Rect } from "../../../shared/document";
import { normalizeRect, MIN_REGION } from "../lib/geometry";
import {
  addRegion,
  duplicateRegion,
  findRegion,
  moveRegion,
  removeRegion,
} from "../lib/regions";
import {
  compareOwners,
  describeOwnershipChange,
  fallbackSummary,
  removalFallback,
  snapshots,
} from "../lib/assign";

export type RegionMode = "idle" | "draw" | "move" | "resize";
export type Corner = "nw" | "ne" | "sw" | "se";

/*
 * Region selection and drag state are shared across the crop overlay, the
 * rules panel and the preview, so they live at module scope (one studio per
 * page). Document data itself stays in the injected reactive document.
 */
const selectedId = ref<string | null>(null);
const mode = ref<RegionMode>("idle");
const draft = ref<Rect | null>(null);
const hoverId = ref<string | null>(null);
const stage = ref<HTMLElement | null>(null);

let origin: { x: number; y: number } | null = null;
let snapshot: Rect | null = null;
let corner: Corner = "se";
let activeId: string | null = null;

export function useRegions() {
  const { doc, invalidate, notice, ensureFresh } = useStudio();

  const selected = computed(() => findRegion(doc, selectedId.value));

  function select(id: string | null) {
    if (mode.value === "draw") return;
    selectedId.value = id;
  }

  function startDraw() {
    selectedId.value = null;
    mode.value = "draw";
    draft.value = null;
    notice.value = "在原图上拖动，圈出新的规则区域";
  }

  function cancelDraw() {
    // Works for draws and for interrupted move/resize gestures alike.
    if (origin && snapshot && mode.value !== "draw") {
      const region = findRegion(doc, activeId);
      if (region) region.rect = normalizeRect(snapshot);
      invalidate();
    }
    mode.value = "idle";
    draft.value = null;
    origin = null;
    snapshot = null;
    activeId = null;
  }

  function point(e: PointerEvent) {
    const el = stage.value;
    if (!el) return { x: 0, y: 0 };
    const b = el.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (e.clientX - b.left) / b.width)),
      y: Math.max(0, Math.min(1, (e.clientY - b.top) / b.height)),
    };
  }

  function beginDraw(e: PointerEvent) {
    if (mode.value !== "draw") return;
    e.preventDefault();
    origin = point(e);
    draft.value = { x: origin.x, y: origin.y, width: 0, height: 0 };
    stage.value?.setPointerCapture(e.pointerId);
  }

  function beginMove(e: PointerEvent, id: string) {
    if (mode.value === "draw") return;
    const region = findRegion(doc, id);
    if (!region) return;
    selectedId.value = id;
    activeId = id;
    origin = point(e);
    snapshot = { ...region.rect };
    corner = "se";
    mode.value = "move";
    // Capture on the stage so dragging keeps tracking outside the thumbnail.
    stage.value?.setPointerCapture(e.pointerId);
  }

  function beginResize(e: PointerEvent, id: string, which: Corner) {
    if (mode.value === "draw") return;
    const region = findRegion(doc, id);
    if (!region) return;
    selectedId.value = id;
    activeId = id;
    origin = point(e);
    snapshot = { ...region.rect };
    corner = which;
    mode.value = "resize";
    stage.value?.setPointerCapture(e.pointerId);
  }

  function drag(e: PointerEvent) {
    if (!origin) return;
    const p = point(e);
    if (mode.value === "draw") {
      draft.value = normalizeRect({
        x: Math.min(origin.x, p.x),
        y: Math.min(origin.y, p.y),
        width: Math.abs(p.x - origin.x),
        height: Math.abs(p.y - origin.y),
      });
      return;
    }
    const region = findRegion(doc, activeId);
    if (!region || !snapshot) return;
    const dx = p.x - origin.x;
    const dy = p.y - origin.y;
    if (mode.value === "move") {
      region.rect = normalizeRect({
        ...snapshot,
        x: snapshot.x + dx,
        y: snapshot.y + dy,
      });
      return;
    }
    // Resizing keeps the opposite corner fixed and re-clamps to the image.
    const left = snapshot.x;
    const top = snapshot.y;
    const right = snapshot.x + snapshot.width;
    const bottom = snapshot.y + snapshot.height;
    let x0 = corner === "nw" || corner === "sw" ? left + dx : left;
    let y0 = corner === "nw" || corner === "ne" ? top + dy : top;
    let x1 = corner === "ne" || corner === "se" ? right + dx : right;
    let y1 = corner === "sw" || corner === "se" ? bottom + dy : bottom;
    x0 = Math.max(0, Math.min(1 - MIN_REGION, x0));
    y0 = Math.max(0, Math.min(1 - MIN_REGION, y0));
    x1 = Math.max(MIN_REGION, Math.min(1, x1));
    y1 = Math.max(MIN_REGION, Math.min(1, y1));
    region.rect = normalizeRect({
      x: Math.min(x0, x1 - MIN_REGION),
      y: Math.min(y0, y1 - MIN_REGION),
      width: Math.abs(x1 - x0),
      height: Math.abs(y1 - y0),
    });
  }

  function end(e: PointerEvent) {
    if (!origin) return;
    if (mode.value === "draw") {
      drag(e);
      const rect = draft.value;
      origin = null;
      draft.value = null;
      mode.value = "idle";
      if (!rect || rect.width < 0.02 || rect.height < 0.02) {
        notice.value = "区域太小，已取消；请拖出更大的范围";
        return;
      }
      const region = addRegion(doc, rect);
      selectedId.value = region.id;
      notice.value = `已添加「${region.name}」`;
      invalidate();
      return;
    }
    origin = null;
    snapshot = null;
    activeId = null;
    mode.value = "idle";
    invalidate();
  }

  function remove(id: string) {
    const region = findRegion(doc, id);
    if (!region) return;
    // Explain the handoff before the region disappears, using a grid that
    // reflects the document as it is right now.
    const grid = ensureFresh();
    const fallback = grid ? fallbackSummary(removalFallback(doc, grid, id)) : "";
    removeRegion(doc, id);
    if (selectedId.value === id) selectedId.value = null;
    notice.value = `已删除「${region.name}」${fallback ? "：" + fallback : ""}`;
    invalidate();
  }

  function shift(id: string, direction: -1 | 1) {
    const grid = doc.grid ? ensureFresh() : null;
    const before = snapshots(doc.regions);
    if (!moveRegion(doc, id, direction)) return;
    const after = snapshots(doc.regions);
    notice.value = grid
      ? describeOwnershipChange(compareOwners(doc, grid, before, after))
      : "优先级已调整";
    invalidate();
  }

  function rename(id: string, name: string) {
    const region = findRegion(doc, id);
    if (!region) return;
    const next = name.trim();
    if (!next) {
      notice.value = "区域名称不能为空";
      return;
    }
    if (doc.regions.some((r) => r.id !== id && r.name === next)) {
      notice.value = "区域名称需要唯一";
      return;
    }
    region.name = next;
    invalidate();
  }

  function toggle(id: string) {
    const region = findRegion(doc, id);
    if (!region) return;
    region.enabled = !region.enabled;
    invalidate();
  }

  function edit() {
    invalidate();
  }

  function duplicate() {
    if (!selectedId.value) return;
    const copy = duplicateRegion(doc, selectedId.value);
    if (!copy) return;
    selectedId.value = copy.id;
    notice.value = `已复制为「${copy.name}」，可在列表中调整优先级`;
    invalidate();
  }

  return {
    doc,
    stage,
    selected,
    selectedId,
    mode,
    draft,
    hoverId,
    select,
    startDraw,
    cancelDraw,
    beginDraw,
    beginMove,
    beginResize,
    drag,
    end,
    remove,
    shift,
    rename,
    toggle,
    edit,
    duplicate,
  };
}
