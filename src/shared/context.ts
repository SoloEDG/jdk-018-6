import type { InjectionKey, Ref } from "vue";
import type { Grid, StudioDocument } from "./document";
export interface StudioContext {
  doc: StudioDocument;
  busy: Ref<boolean>;
  notice: Ref<string>;
  invalidate: () => void;
  /** Regenerate synchronously so explanations describe the current state. */
  ensureFresh: () => Grid | null;
}
export const studioKey: InjectionKey<StudioContext> = Symbol("studio");
