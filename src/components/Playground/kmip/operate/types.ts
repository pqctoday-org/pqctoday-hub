// SPDX-License-Identifier: GPL-3.0-only
//
// Shared context for the Operate tab's "Plane 2 · KMIP Lifecycle" section
// (K4b, gaps-closeout WP-4.2) — one bundled object rather than positional
// props, so KeyConfigPanel and GuidedLifecyclePanel each take a single
// `operate` prop instead of the ~15-handler/10-state-value prop list this
// extraction was deferred over the first time (see IMPLEMENTATION-PLAN-
// 2026-09-02.md's "Deviations from the plan").
//
// Every field here is owned by KmipPlaygroundView, not by these child
// components: onCreate/onSelectAlgo/onActivate/onSign in particular are
// called DIRECTLY (not via simulated DOM events) from the `lessons` tour
// array, which lives in KmipPlaygroundView and renders independently of
// this JSX subtree — so the state and handlers below must stay defined in
// the parent. This type exists only to bundle references to them.
import type { AlgoChoice } from '@/wasm/kmip/kmipMeta'
import type { OpResult, OpSpec } from '@/wasm/kmip/kmipEngine'

export interface OperateContext {
  // ── key config ──────────────────────────────────────────────────────────
  algo: string
  onSelectAlgo: (value: string) => void
  chosen: AlgoChoice | undefined
  isSpecOnly: boolean
  isKem: boolean
  isSymmetric: boolean
  keyLength: number | undefined
  setKeyLength: (length: number) => void
  govAttrsText: string
  setGovAttrsText: (text: string) => void

  // ── lifecycle state ─────────────────────────────────────────────────────
  busy: boolean
  priv: string | null
  pub: string | null
  sigHex: string | null
  ctHex: string | null
  encIvHex: string | null
  message: string
  setMessage: (message: string) => void
  expert: boolean

  // ── lifecycle actions ───────────────────────────────────────────────────
  onCreate: () => void
  onActivate: () => void
  onSign: () => void
  onVerify: () => void
  onEncapsulate: () => void
  onDecapsulate: () => void
  onEncrypt: () => void
  onDecrypt: () => void
  onGet: () => void
  onRevoke: () => void
  onRevokeThenRetrySign: () => void
  run: (spec: OpSpec) => Promise<OpResult | null>
}
