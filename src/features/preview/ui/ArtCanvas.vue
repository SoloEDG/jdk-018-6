<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import type { Grid } from "../../../shared/document";
import { drawGrid } from "../lib/draw";
const props = defineProps<{
  grid: Grid;
  color: boolean;
  background: string;
  zoom: number;
  owners?: boolean;
  picked?: number | null;
}>();
const emit = defineEmits<{ pick: [index: number] }>();
const canvas = ref<HTMLCanvasElement>();
function draw() {
  if (canvas.value)
    drawGrid(canvas.value, props.grid, props.color, props.background, {
      owners: props.owners,
      picked: props.picked,
    });
}
function click(e: MouseEvent) {
  const el = canvas.value;
  if (!el) return;
  const b = el.getBoundingClientRect();
  const column = Math.min(
    props.grid.columns - 1,
    Math.max(0, Math.floor(((e.clientX - b.left) / b.width) * props.grid.columns)),
  );
  const row = Math.min(
    props.grid.rows - 1,
    Math.max(0, Math.floor(((e.clientY - b.top) / b.height) * props.grid.rows)),
  );
  emit("pick", row * props.grid.columns + column);
}
onMounted(draw);
watch(
  () => [props.grid, props.color, props.background, props.owners, props.picked],
  draw,
);
</script>
<template>
  <canvas
    ref="canvas"
    aria-label="字符画预览"
    @click="click"
    :style="{
      width: (grid.columns * 8 * zoom) / 100 + 'px',
      height: (grid.rows * 16 * zoom) / 100 + 'px',
    }"
  />
</template>
