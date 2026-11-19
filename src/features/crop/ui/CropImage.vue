<script setup lang="ts">
import type { Asset, Crop, Region } from "../../../shared/document";
const props = withDefaults(
  defineProps<{
    asset: Asset;
    crop: Crop;
    /** Viewport for region peeks; defaults to the crop itself. */
    clip?: Crop;
    regions?: Region[];
    selectedId?: string | null;
  }>(),
  { clip: undefined, regions: () => [], selectedId: null },
);
const viewport = () => props.clip ?? props.crop;
function inside(crop: Crop, region: Region) {
  const x = Math.max(crop.x, region.rect.x);
  const y = Math.max(crop.y, region.rect.y);
  const ex = Math.min(crop.x + crop.width, region.rect.x + region.rect.width);
  const ey = Math.min(crop.y + crop.height, region.rect.y + region.rect.height);
  if (ex <= x || ey <= y) return null;
  return {
    left: ((x - crop.x) / crop.width) * 100 + "%",
    top: ((y - crop.y) / crop.height) * 100 + "%",
    width: ((ex - x) / crop.width) * 100 + "%",
    height: ((ey - y) / crop.height) * 100 + "%",
  };
}
</script>
<template>
  <div class="crop-image">
    <img :src="asset.url" :alt="asset.name" draggable="false" />
    <div
      class="crop-box"
      :style="{
        left: crop.x * 100 + '%',
        top: crop.y * 100 + '%',
        width: crop.width * 100 + '%',
        height: crop.height * 100 + '%',
      }"
    >
      <i /><i /><i /><i />
    </div>
    <template v-for="region in regions" :key="region.id">
      <div
        v-if="inside(viewport(), region)"
        class="region-peek"
        :class="{ selected: region.id === selectedId }"
        :style="{ ...inside(viewport(), region), '--tint': region.color }"
        :title="region.name"
      />
    </template>
  </div>
</template>
