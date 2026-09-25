// SPDX-License-Identifier: GPL-3.0-only
import type { Sp80090bResultRecord } from '@/wasm/entropy90b/resultRecord'

/** UI state of one estimator run (sequential or restart). */
export interface RunState {
  status: 'idle' | 'loading' | 'running' | 'done' | 'error' | 'cancelled'
  stage: string | null
  stagesSeen: string[]
  elapsedMs: number
  record: Sp80090bResultRecord | null
  error: string | null
}

export const IDLE_RUN: RunState = {
  status: 'idle',
  stage: null,
  stagesSeen: [],
  elapsedMs: 0,
  record: null,
  error: null,
}

/** Selected state for toggle buttons: primary outline, readable text in both themes. */
export const SELECTED = 'border-primary bg-primary/10 ring-1 ring-primary text-foreground'
