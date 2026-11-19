<script setup lang="ts">
import { computed } from "vue";
import {
  SquareDashed,
  MousePointer2,
  Trash2,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Layers,
} from "lucide-vue-next";
import { useRegions } from "../model/useRegions";
import { claimBreakdown } from "../lib/assign";
const r = useRegions();
const rows = computed(() =>
  r.doc.regions.map((region, index) => {
    const grid = r.doc.grid;
    const stat = grid?.assignments.find((a) => a.id === region.id);
    const claim = grid ? claimBreakdown(r.doc, grid, region.id) : null;
    return { region, rank: index + 1, count: stat?.count ?? 0, claim };
  }),
);
/** Deletion runs through the shared model so the notice explains the handoff. */
function confirmRemove(id: string) {
  r.remove(id);
}
</script>
<template>
  <section class="panel region-panel">
    <div class="section-title">
      <span>04 / REGION RULES</span><Layers :size="15" />
    </div>
    <div class="region-toolbar">
      <button
        class="tool"
        :class="{ active: r.mode.value === 'draw' }"
        @click="r.mode.value === 'draw' ? r.cancelDraw() : r.startDraw()"
      >
        <SquareDashed :size="14" />
        {{ r.mode.value === "draw" ? "拖动圈选…" : "新增区域" }}
      </button>
      <span class="mono muted">{{ r.doc.regions.length }} 个区域</span>
    </div>
    <p v-if="!r.doc.regions.length" class="hint">
      在左侧原图上圈出区域，为它单独指定字符集、密度与明暗。未圈选的部分继续使用基础映射。
    </p>
    <ol v-else class="region-list">
      <li
        v-for="row in rows"
        :key="row.region.id"
        :class="{ selected: row.region.id === r.selectedId.value }"
        @click="r.select(row.region.id)"
        @pointerenter="r.hoverId.value = row.region.id"
        @pointerleave="r.hoverId.value = null"
      >
        <div class="region-main">
          <i class="swatch" :style="{ background: row.region.color }" />
          <div class="region-meta">
            <input
              class="region-name"
              :value="row.region.name"
              aria-label="区域名称"
              @click.stop
              @change="r.rename(row.region.id, ($event.target as HTMLInputElement).value)"
            />
            <small class="mono">
              {{ row.region.enabled ? "P" + row.rank : "停用" }} ·
              {{ row.count }} 字符
              <template v-if="row.claim?.byHigher.length">
                · 被高优先级占用
                {{ row.claim.byHigher.reduce((n, x) => n + x.count, 0) }}
              </template>
            </small>
          </div>
        </div>
        <div class="region-actions">
          <button
            class="icon-button"
            :aria-label="row.region.enabled ? '停用区域' : '启用区域'"
            :title="row.region.enabled ? '停用' : '启用'"
            @click.stop="r.toggle(row.region.id)"
          >
            <EyeOff v-if="row.region.enabled" :size="13" />
            <Eye v-else :size="13" />
          </button>
          <button
            class="icon-button"
            aria-label="提高优先级"
            title="提高优先级"
            :disabled="row.rank === 1"
            @click.stop="r.shift(row.region.id, -1)"
          >
            <ChevronUp :size="13" />
          </button>
          <button
            class="icon-button"
            aria-label="降低优先级"
            title="降低优先级"
            :disabled="row.rank === rows.length"
            @click.stop="r.shift(row.region.id, 1)"
          >
            <ChevronDown :size="13" />
          </button>
          <button
            class="icon-button danger"
            aria-label="删除区域"
            title="删除区域"
            @click.stop="confirmRemove(row.region.id)"
          >
            <Trash2 :size="13" />
          </button>
        </div>
        <p v-if="row.region.enabled && row.claim?.byHigher.length" class="region-note">
          <MousePointer2 :size="11" />
          重叠部分让位给
          {{ row.claim.byHigher.map((x) => `${x.name}（${x.count}）`).join("、") }}
        </p>
        <p v-else-if="row.claim?.lowerCovered.length" class="region-note">
          <MousePointer2 :size="11" />
          正覆盖
          {{ row.claim.lowerCovered.map((x) => `${x.name}（${x.count}）`).join("、") }}
        </p>
      </li>
    </ol>
    <p v-if="r.doc.regions.length" class="hint">
      列表顺序即优先级：越靠上越先决定重叠处的字符。删除时会提示受影响的字符改由哪条规则接管。
    </p>
    <div class="base-rule">
      <span class="mono">基础映射</span>
      <small>未覆盖区域 · 优先级 0</small>
    </div>
  </section>
</template>
