import { reactive, ref, provide, watch } from "vue";
import { createDocument } from "../shared/defaults";
import { studioKey } from "../shared/context";
import { generate } from "../features/mapping";
export function useWorkspace() {
  const doc = reactive(createDocument());
  const busy = ref(false),
    notice = ref("所有处理均在你的浏览器中完成");
  let timer: ReturnType<typeof setTimeout>;
  function rebuild() {
    try {
      doc.grid = generate(doc);
    } catch (e) {
      notice.value = e instanceof Error ? e.message : "生成失败";
    }
  }
  function invalidate() {
    doc.revision++;
    busy.value = true;
    clearTimeout(timer);
    timer = setTimeout(() => {
      try {
        rebuild();
      } finally {
        busy.value = false;
      }
    }, 60);
  }
  /**
   * Explanations and exports must describe the document as it is now, not the
   * debounced snapshot that may still be pending, so this rebuilds eagerly.
   */
  function ensureFresh() {
    clearTimeout(timer);
    if (doc.grid?.revision === doc.revision && !busy.value) return doc.grid;
    rebuild();
    busy.value = false;
    return doc.grid;
  }
  watch(() => doc.settings.background, invalidate);
  provide(studioKey, { doc, busy, notice, invalidate, ensureFresh });
  return { doc, busy, notice };
}
