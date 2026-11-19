<script setup lang="ts">
import { computed } from "vue";
import { Crop, RotateCcw, SquareDashed, Move, Layers } from "lucide-vue-next";
import { useCrop } from "../model/useCrop";
import { useRegions } from "../../regions/model/useRegions";
import { cropMode } from "../../../shared/ui";
import CropImage from "./CropImage.vue";
import RegionCanvas from "../../regions/ui/RegionCanvas.vue";
const c = useCrop();
const r = useRegions();
const selection = computed(() => (c.start.value ? c.draft.value : c.doc.crop));
function toggleRegionMode() {
  if (cropMode.value === "region") {
    cropMode.value = "crop";
    r.cancelDraw();
  } else {
    cropMode.value = "region";
  }
}
</script>
<template>
  <section class="panel">
    <div class="section-title">
      <span>02 / CROP &amp; REGIONS</span><Crop :size="15" />
    </div>
    <div v-if="c.doc.asset" class="mode-switch">
      <button
        :class="{ active: cropMode === 'crop' }"
        @click="cropMode = 'crop'; r.cancelDraw()"
      >
        <Move :size="12" /> 裁剪
      </button>
      <button
        :class="{ active: cropMode === 'region' }"
        @click="toggleRegionMode"
      >
        <Layers :size="12" /> 区域规则
        <b v-if="r.doc.regions.length">{{ r.doc.regions.length }}</b>
      </button>
    </div>
    <template v-if="c.doc.asset && cropMode === 'crop'">
      <div
        class="crop-interaction"
        @pointerdown="c.down"
        @pointermove="c.move"
        @pointerup="c.up"
        @pointercancel="c.start.value = null"
      >
        <CropImage
          :asset="c.doc.asset"
          :crop="selection"
          :clip="c.doc.crop"
          :regions="r.doc.regions"
          :selected-id="r.selectedId.value"
        />
      </div>
      <div class="row hint">
        <span>拖动框选转换区域</span
        ><button class="icon-button" aria-label="重置裁剪" @click="c.reset">
          <RotateCcw :size="13" />
        </button>
      </div>
      <small class="mono muted"
        >{{ Math.round(selection.width * 100) }}% W ×
        {{ Math.round(selection.height * 100) }}% H</small
      >
    </template>
    <template v-else-if="c.doc.asset">
      <RegionCanvas :asset="c.doc.asset" :crop="c.doc.crop" />
      <div class="row hint">
        <span v-if="r.mode.value === 'draw'" class="draw-hint">
          拖动圈出新区域
        </span>
        <span v-else>点选/拖动区域，四角可缩放</span>
        <button
          class="icon-button"
          :class="{ lit: r.mode.value === 'draw' }"
          aria-label="新增区域"
          title="新增区域"
          @click="r.mode.value === 'draw' ? r.cancelDraw() : r.startDraw()"
        >
          <SquareDashed :size="13" />
        </button>
      </div>
      <small class="mono muted">
        区域锚定原图 {{ Math.round(c.doc.crop.width * 100) }}% ×
        {{ Math.round(c.doc.crop.height * 100) }}% 裁剪窗口
      </small>
    </template>
  </section>
</template>
