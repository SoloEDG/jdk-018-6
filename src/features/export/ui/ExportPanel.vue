<script setup lang="ts">
import { computed } from "vue";
import { Download, Copy, ArrowUpRight, FileJson, Info } from "lucide-vue-next";
import { useExport } from "../model/useExport";
import { useStudio } from "../../../shared/useStudio";
const e = useExport();
const { notice } = useStudio();
const stats = computed(() => e.doc.grid?.assignments ?? []);
function say(text: string) {
  notice.value = text;
}
</script>
<template>
  <section class="export-bar">
    <div class="export-copy">
      <span class="eyebrow">READY TO SHARE</span>
      <h3>带走你的字符作品</h3>
      <small>单一网格输出：区域共享行列，不会因密度不同而错位。</small>
      <template v-if="stats.length">
        <div class="export-legend">
          <span
            v-for="s in stats"
            :key="s.id"
            class="legend-item mono"
            :class="{ zero: !s.count }"
            :style="{ '--tint': s.color }"
          >
            <i />{{ s.name }} · {{ s.count }}
          </span>
        </div>
      </template>
      <p v-if="e.doc.regions.length" class="export-note">
        <Info :size="11" /> TXT 与复制内容只含字符网格，行列严格对齐；点“规则”可导出逐行归属清单，
        说明每个字符由哪条规则决定。PNG 同样只包含字符本身，归属着色仅用于屏幕预览。
      </p>
    </div>
    <div class="export-actions">
      <button class="secondary" :disabled="!e.ready()" @click="e.copy">
        <Copy :size="15" /> 复制字符</button
      ><button class="secondary" :disabled="!e.ready()" @click="e.png">
        PNG <ArrowUpRight :size="15" /></button
      ><button class="secondary" :disabled="!e.ready()" @click="e.saveRules">
        <FileJson :size="15" /> 规则
      </button>
      <button class="primary" :disabled="!e.ready()" @click="e.saveText">
        <Download :size="16" /> 导出 .TXT
      </button>
    </div>
  </section>
</template>
