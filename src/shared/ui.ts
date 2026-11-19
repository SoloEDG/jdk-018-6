import { ref } from "vue";
export type PreviewTab = "art" | "text" | "regions";
/** Cross-panel view state (not document data). */
export const previewTab = ref<PreviewTab>("art");
/** Whether the crop panel is selecting the crop or drawing region rules. */
export const cropMode = ref<"crop" | "region">("crop");
export const showOwners = ref(false);
/** Cell index whose rule is being inspected, if any. */
export const pickedCell = ref<number | null>(null);
