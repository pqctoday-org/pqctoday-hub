// SPDX-License-Identifier: GPL-3.0-only
/**
 * The cross-target matrix every WS-H evidence run must account for (plan §11
 * Q3, decided 24 Sep 2026): WASM C++/Rust + native macOS + Linux x86-64 +
 * Linux Arm64 + i.MX95 + KV260, each for both engines. A run directory's
 * targets.json must list EVERY id here with status "run" or "not run" + a
 * reason — the comparator refuses a run that silently omits one, so a missing
 * platform can never read as "nothing to report".
 */
export type XplatEngine = 'cpp' | 'rust'
export type XplatClass = 'wasm' | 'native' | 'board'

export interface XplatTarget {
  id: string
  label: string
  class: XplatClass
  engine: XplatEngine
}

const both = (prefix: string, label: string, cls: XplatClass): [XplatTarget, XplatTarget] => [
  { id: `${prefix}-cpp`, label: `${label} — C++ engine`, class: cls, engine: 'cpp' },
  { id: `${prefix}-rust`, label: `${label} — Rust engine`, class: cls, engine: 'rust' },
]

export const XPLAT_TARGETS: readonly XplatTarget[] = [
  ...both('wasm', 'WebAssembly (Node 22, host V8)', 'wasm'),
  ...both('macos-arm64', 'Native macOS arm64', 'native'),
  ...both('linux-x86_64', 'Native Linux x86-64', 'native'),
  ...both('linux-arm64', 'Native Linux Arm64', 'native'),
  ...both('imx95', 'NXP i.MX95 (CACP Yocto)', 'board'),
  ...both('kv260', 'AMD KV260 (CACP Yocto)', 'board'),
]

/** The target whose environment divergences are diffed against (H-5). */
export const BASELINE_TARGET_ID = 'wasm-cpp'

export interface DeclaredTarget {
  id: string
  status: 'run' | 'not run'
  /** Required for "not run"; optional context for "run". */
  reason?: string
}
