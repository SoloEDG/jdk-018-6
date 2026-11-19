<script setup lang="ts">
import { computed } from "vue";
import { X, Copy, Radar } from "lucide-vue-next";
import { useRegions } from "../model/useRegions";
import { charsets } from "../../mapping/lib/charsets";
import {
  claimBreakdown,
  snapshots,
  compareOwners,
  describeOwnershipChange,
  fallbackSummary,
  removalFallback,
} from "../lib/assign";
const r = useRegions();
const region = computed(() => r.selected.value);
const grid = computed(() => r.doc.grid);
const priority = computed(() =>
  region.value ? r.doc.regions.findIndex((x) => x.id === region.value!.id) + 1 : 0,
);
const claim = computed(() =>
  region.value && grid.value
    ? claimBreakdown(r.doc, grid.value, region.value.id)
    : null,
);
const deleteImpact = computed(() => {
  if (!region.value || !grid.value) return "";
  return fallbackSummary(removalFallback(r.doc, grid.value, region.value.id));
});
function glyphPreview(id: string, custom: string) {
  return id === "custom"
    ? custom
    : (charsets.find((c) => c.id === id)?.value ?? "");
}
/** Explain what moving this region one step up/down would change. */
function previewShift(direction: -1 | 1) {
  const source = region.value;
  if (!source || !grid.value) return "";
  const index = r.doc.regions.findIndex((x) => x.id === source.id);
  const target = index + direction;
  if (target < 0 || target >= r.doc.regions.length) return "";
  const next = [...r.doc.regions];
  const [moved] = next.splice(index, 1);
  next.splice(target, 0, moved!);
  const before = snapshots(r.doc.regions);
  const after = snapshots(next);
  return describeOwnershipChange(compareOwners(r.doc, grid.value, before, after));
}
const shiftNotice = computed(() => {
  if (!region.value) return "";
  const up = previewShift(-1);
  const down = previewShift(1);
  const parts: string[] = [];
  if (up) parts.push("上移：" + up.replace("优先级已调整：", ""));
  if (down) parts.push("下移：" + down.replace("优先级已调整：", ""));
  return parts.join("；");
});
</script>
<template>
  <section v-if="region" class="panel region-editor">
    <div class="section-title">
      <span>REGION / {{ region.name }}</span>
      <span class="editor-head-actions">
        <button class="icon-button" aria-label="复制规则到新区域" @click="r.duplicate">
          <Copy :size="13" />
        </button>
        <button class="icon-button" aria-label="取消选中" @click="r.select(null)">
          <X :size="13" />
        </button>
      </span>
    </div>
    <div class="chips">
      <span class="chip mono" :style="{ borderColor: region.color }">
        优先级 {{ priority }}
      </span>
      <span class="chip mono"
        >{{ Math.round(region.rect.width * 100) }}% ×
        {{ Math.round(region.rect.height * 100) }}%</span
      >
      <span class="chip mono">锚定原图</span>
    </div>
    <label class="field"
      >区域字符集<select
        aria-label="区域字符集"
        v-model="region.rule.charset"
        @change="r.edit"
      >
        <option v-for="c in charsets" :key="c.id" :value="c.id">
          {{ c.name }}
        </option>
        <option value="custom">自定义字符集</option>
      </select></label
    >
    <input
      v-if="region.rule.charset === 'custom'"
      aria-label="区域自定义字符"
      class="custom"
      maxlength="100"
      v-model="region.rule.custom"
      @input="r.edit"
    />
    <div class="glyph-strip small">
      {{ glyphPreview(region.rule.charset, region.rule.custom) }}
    </div>
    <label class="field"
      >密度倾向
      <b>{{
        region.rule.density === 0
          ? "中性"
          : region.rule.density < 0
            ? "留白 " + Math.round(-region.rule.density * 100) + "%"
            : "浓墨 " + Math.round(region.rule.density * 100) + "%"
      }}</b
      ><input
        aria-label="区域密度倾向"
        type="range"
        min="-1"
        max="1"
        step="0.05"
        v-model.number="region.rule.density"
        @input="r.edit" /></label
    ><label class="field"
      >明暗对比 <b>{{ region.rule.contrast.toFixed(2) }}</b
      ><input
        aria-label="区域对比度"
        type="range"
        min="0.3"
        max="2.5"
        step="0.05"
        v-model.number="region.rule.contrast"
        @input="r.edit" /></label
    ><label class="field"
      >明暗伽马 <b>{{ region.rule.gamma.toFixed(2) }}</b
      ><input
        aria-label="区域伽马"
        type="range"
        min="0.3"
        max="2.5"
        step="0.05"
        v-model.number="region.rule.gamma"
        @input="r.edit" /></label
    ><label class="toggle-row"
      ><span>反转明暗</span
      ><input
        aria-label="区域反转明暗"
        type="checkbox"
        v-model="region.rule.invert"
        @change="r.edit"
    /></label>
    <div v-if="claim" class="claim-box">
      <div class="row"><span class="mono"><Radar :size="12" /> 归属解释</span></div>
      <p v-if="!claim.enabled" class="muted">该区域已停用，字符回落至其他规则或基础映射。</p>
      <p v-else>当前决定 {{ claim.owned }} 个字符。</p>
      <p v-if="claim.byHigher.length" class="muted">
        其中
        {{ claim.byHigher.reduce((n, x) => n + x.count, 0) }}
        个落在本区域内，但因优先级更高被
        {{ claim.byHigher.map((x) => `${x.name}（${x.count}）`).join("、") }}
        接管。
      </p>
      <p v-if="claim.lowerCovered.length" class="muted">
        本区域同时遮蔽了
        {{ claim.lowerCovered.map((x) => `${x.name}（${x.count}）`).join("、") }}
        的覆盖范围。
      </p>
      <p v-if="shiftNotice" class="muted shift-preview">{{ shiftNotice }}</p>
      <p v-if="deleteImpact" class="muted delete-preview">
        若删除本区域：{{ deleteImpact }}
      </p>
    </div>
  </section>
</template>
