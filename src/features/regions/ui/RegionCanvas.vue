<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted } from "vue";
import type { Asset, Crop, Region } from "../../../shared/document";
import { useRegions } from "../model/useRegions";
defineProps<{ asset: Asset; crop: Crop }>();
const r = useRegions();
const corners: ("nw" | "ne" | "sw" | "se")[] = ["nw", "ne", "sw", "se"];
// Lowest priority is drawn first so the highest-priority region sits on top.
const list = computed(() => [...r.doc.regions].reverse());
/** Rectangles are drawn in original-image space, so changing the crop never
 *  moves a region: the crop guide simply shows which part is being rendered. */
function rectStyle(region: Region) {
  return {
    left: region.rect.x * 100 + "%",
    top: region.rect.y * 100 + "%",
    width: region.rect.width * 100 + "%",
    height: region.rect.height * 100 + "%",
  };
}
function onKey(e: KeyboardEvent) {
  if (e.key === "Escape") {
    r.cancelDraw();
    r.select(null);
  }
}
onMounted(() => window.addEventListener("keydown", onKey));
onBeforeUnmount(() => window.removeEventListener("keydown", onKey));
function setStage(el: unknown) {
  r.stage.value = (el as HTMLElement | null) ?? null;
}
</script>
<template>
  <div
    :ref="setStage"
    class="region-stage"
    :class="{ drawing: r.mode.value === 'draw' }"
    @pointerdown="r.beginDraw"
    @pointermove="r.drag"
    @pointerup="r.end"
    @pointercancel="r.cancelDraw"
  >
    <img :src="asset.url" :alt="asset.name" draggable="false" />
    <div
      class="crop-guide"
      :style="{
        left: crop.x * 100 + '%',
        top: crop.y * 100 + '%',
        width: crop.width * 100 + '%',
        height: crop.height * 100 + '%',
      }"
    />
    <div
      v-for="region in list"
      :key="region.id"
      class="region-rect"
      :class="{
        selected: region.id === r.selectedId.value,
        disabled: !region.enabled,
        hovered: region.id === r.hoverId.value,
      }"
      :style="{ ...rectStyle(region), '--tint': region.color }"
      @pointerdown="r.beginMove($event, region.id)"
      @pointerenter="r.hoverId.value = region.id"
      @pointerleave="r.hoverId.value = null"
    >
      <span class="region-tag">{{ region.name }}</span>
      <template v-if="region.id === r.selectedId.value">
        <b
          v-for="corner in corners"
          :key="corner"
          class="region-handle"
          :class="corner"
          @pointerdown.stop="r.beginResize($event, region.id, corner)"
        />
      </template>
    </div>
    <div
      v-if="r.draft.value"
      class="region-rect drafting"
      :style="{
        left: r.draft.value.x * 100 + '%',
        top: r.draft.value.y * 100 + '%',
        width: r.draft.value.width * 100 + '%',
        height: r.draft.value.height * 100 + '%',
      }"
    >
      <span class="region-tag">新区域</span>
    </div>
  </div>
</template>
