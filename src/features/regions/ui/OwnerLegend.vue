<script setup lang="ts">
import type { Grid } from "../../../shared/document";
import { BASE_ID } from "../lib/assign";
defineProps<{ grid: Grid }>();
</script>
<template>
  <div class="owner-legend">
    <span class="mono legend-title">归属图例</span>
    <span
      v-for="entry in grid.assignments"
      :key="entry.id"
      class="legend-item mono"
      :class="{ zero: !entry.count }"
      :style="{ '--tint': entry.color }"
      :title="
        entry.id === BASE_ID
          ? '未落入任何启用区域'
          : `${entry.name} 决定 ${entry.count} 个字符`
      "
    >
      <i />{{ entry.name }} · {{ entry.count }}
    </span>
    <small class="muted legend-note"
      >点击画布任意字符，可查看该单元格由哪条规则决定。</small
    >
  </div>
</template>
