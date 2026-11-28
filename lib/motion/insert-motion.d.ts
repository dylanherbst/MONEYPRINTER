// Types for insert-motion.js (the canonical V2 engine, kept byte-for-byte as supplied in UI_Motion_Bible.md).
// Importing './insert-motion.js' runs the engine once and sets globalThis.InsertMotion.

export type MotionId =
  | 'A01' | 'A02' | 'A03' | 'A04' | 'A05' | 'A06' | 'A07' | 'A08' | 'A09'
  | 'B01' | 'B02' | 'B03' | 'B04' | 'B05' | 'B06' | 'B07' | 'B08' | 'B09' | 'B10' | 'B11' | 'B12'

export interface MotionDefinition {
  id: MotionId
  name: string
  /** 'Reference' (from the source video), 'Reference reconstruction' (A09) or 'Extension' (new). */
  source: string
  description: string
  /** Demo duration in ms. Product UI usually wants shorter, quieter versions. */
  duration: number
}

/** Bind only what the chosen preset needs. `layers` are ordered bottom to top. */
export interface MotionTargets {
  stage?: HTMLElement | null
  shell?: HTMLElement | null
  layers?: HTMLElement[]
  focus?: HTMLElement | null
  overlay?: HTMLElement | null
  nodes?: HTMLElement[]
  beam?: HTMLElement | null
  waveform?: HTMLElement[]
  counter?: HTMLElement | null
}

export interface MotionHandle {
  duration: number
  animations: Animation[]
  /** Deterministic: sets every track to `ms` (clamped to 0..duration). */
  seek(ms: number): void
  /** Cancels every track. Always call on unmount or when the preset changes. */
  destroy(): void
}

export interface InsertMotionApi {
  definitions: MotionDefinition[]
  createMotion(id: MotionId, targets: MotionTargets): MotionHandle
}

declare global {
  var InsertMotion: InsertMotionApi
}

export {}
