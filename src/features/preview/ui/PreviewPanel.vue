<script setup lang="ts">
import { computed } from "vue";
import {
  Code2,
  Scan,
  Minus,
  Plus,
  Layers,
  Crosshair,
  X,
} from "lucide-vue-next";
import { usePreview } from "../model/usePreview";
import { gridRows } from "../lib/rows";
import ArtCanvas from "./ArtCanvas.vue";
import OwnerLegend from "../../regions/ui/OwnerLegend.vue";
import { explainCell } from "../../regions/lib/explain";
import { cellGlyph } from "../../regions/lib/explain";
import { previewTab, showOwners, pickedCell } from "../../../shared/ui";
import { useStudio } from "../../../shared/useStudio";
const p = usePreview();
const { invalidate } = useStudio();
const text = computed(() =>
  p.doc.grid ? gridRows(p.doc.grid).join("\n") : "",
);
const explanation = computed(() => {
  const grid = p.doc.grid;
  if (!grid || pickedCell.value == null) return null;
  return explainCell(grid, pickedCell.value);
});
function pick(index: number) {
  pickedCell.value = pickedCell.value === index ? null : index;
}
function setTab(tab: "art" | "text" | "regions") {
  previewTab.value = tab;
}
function toggleOwners() {
  showOwners.value = !showOwners.value;
  if (showOwners.value && previewTab.value === "text") previewTab.value = "art";
}
</script>
<template>
  <main class="workspace">
    <div class="preview-toolbar">
      <div class="tabs">
        <button
          :class="{ active: previewTab === 'art' }"
          @click="setTab('art')"
        >
          <Scan :size="14" /> 字符预览</button
        ><button
          :class="{ active: previewTab === 'text' }"
          @click="setTab('text')"
        >
          <Code2 :size="14" /> 纯文本</button
        ><button
          :class="{ active: previewTab === 'regions' }"
          @click="setTab('regions')"
        >
          <Layers :size="14" /> 区域规则
        </button>
      </div>
      <div class="toolbar-right">
        <button
          class="owner-toggle"
          :class="{ active: showOwners }"
          :disabled="!p.doc.grid"
          @click="toggleOwners"
        >
          <Crosshair :size="13" /> 归属着色
        </button>
        <label class="color-toggle"
          ><span class="color-dot" /> 彩色<input
            aria-label="彩色预览"
            type="checkbox"
            v-model="p.doc.settings.color"
        /></label>
      </div>
    </div>
    <div class="art-stage">
      <div class="stage-label">
        OUTPUT / LIVE RENDER <span>●</span>
        <i v-if="showOwners">· 归属着色仅用于预览</i>
      </div>
      <div class="art-scroll">
        <ArtCanvas
          v-if="p.doc.grid && previewTab !== 'text'"
          :grid="p.doc.grid"
          :color="p.doc.settings.color"
          :background="p.doc.settings.background"
          :zoom="p.zoom.value"
          :owners="showOwners"
          :picked="pickedCell"
          @pick="pick"
        />
        <pre
          v-else-if="p.doc.grid"
          data-testid="text-preview"
          :style="{
            fontSize: (14 * p.zoom.value) / 100 + 'px',
            lineHeight: (16 * p.zoom.value) / 100 + 'px',
          }"
          >{{ text }}</pre>
        <span v-else>正在准备字符画…</span>
      </div>
      <div v-if="explanation" class="cell-inspector">
        <button
          class="icon-button close"
          aria-label="关闭单元格解释"
          @click="pickedCell = null"
        >
          <X :size="12" />
        </button>
        <span class="mono">单元格 #{{ pickedCell }}</span>
        <b class="mono glyph-sample">{{ cellGlyph(p.doc.grid!.cells[pickedCell!]!) }}</b>
        <span class="mono" :style="{ color: explanation.color }">
          ← {{ explanation.owner }}
          <template v-if="explanation.priority">（P{{ explanation.priority }}）</template>
        </span>
        <small>{{ explanation.reason }}</small>
        <small class="mono">
          亮度 {{ Math.round(explanation.luminance) }} · 字符位
          {{ explanation.tone.toFixed(2) }}
        </small>
      </div>
      <OwnerLegend v-if="previewTab === 'regions' && p.doc.grid" :grid="p.doc.grid" />
      <div class="stage-corner">
        {{ p.doc.grid?.columns }} COL × {{ p.doc.grid?.rows }} ROW
        <template v-if="p.doc.regions.length">
          · 单一网格 · {{ p.doc.regions.length }} 条区域规则
        </template>
      </div>
    </div>
    <div class="preview-bottom">
      <span class="mono"
        ><i class="status-dot" />{{
          p.busy.value
            ? "生成中"
            : p.doc.grid?.revision === p.doc.revision
              ? "已同步"
              : "待重新生成"
        }}
        <span class="muted">/ {{ p.count.value }} 个字符</span></span
      >
      <div class="zoom">
        <button
          aria-label="缩小"
          @click="p.zoom.value = Math.max(25, p.zoom.value - 25)"
        >
          <Minus :size="14" /></button
        ><span>{{ p.zoom.value }}%</span
        ><button
          aria-label="放大"
          @click="p.zoom.value = Math.min(200, p.zoom.value + 25)"
        >
          <Plus :size="14" />
        </button>
      </div>
    </div>
    <div class="workspace-note">
      <span>从像素，到字符。</span
      ><small>每一个符号，都是光影的另一种表达。</small
      ><span class="note-symbol">{ Aa }</span>
    </div>
  </main>
</template>
