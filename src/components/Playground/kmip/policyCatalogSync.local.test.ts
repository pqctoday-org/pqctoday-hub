// SPDX-License-Identifier: GPL-3.0-only
//
// Policy catalog ↔ files sync gate (WP2.4 / report gaps Y24, H5). Kept as a
// `*.local.test.ts` so it runs on the local gate, not in CI (directive
// 2026-07-01: new suites are local-only) — the hub↔source byte-match needs the
// sibling pqctoday-hsm checkout, which CI does not have.
/* eslint-disable security/detect-non-literal-fs-filename -- reads fixed repo dirs. */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import { POLICY_PRESETS } from '@/wasm/kmip/kmipMeta'

const POLICY_DIR = join(__dirname, '../../../../public/kmip-policies')
const HSM_SRC = join(__dirname, '../../../../../pqctoday-hsm/kmip/policies')
const shippedYamls = () => readdirSync(POLICY_DIR).filter((f) => f.endsWith('.yaml'))

describe('policy catalog ↔ files sync', () => {
  // Forward: every preset the UI shows must have a real YAML file behind it —
  // both its canonical `file` and every module in its `files` split, if any.
  it('every POLICY_PRESETS entry has a shipped YAML file', () => {
    const files = new Set(shippedYamls())
    for (const p of POLICY_PRESETS) {
      expect(files.has(p.file), `preset ${p.name} → missing file ${p.file}`).toBe(true)
      for (const f of p.files ?? []) {
        expect(files.has(f), `preset ${p.name} → missing module file ${f}`).toBe(true)
      }
    }
  })

  // Reverse: every shipped YAML must have a preset — otherwise a policy added to
  // public/kmip-policies/ would be INVISIBLE in the UI (the direction the
  // existing policyModel test lacked — report gaps Y24/H5).
  //
  // Modular-policy plan (2026-08-28): a split policy's per-scope module
  // files are visible via their preset's `files: [...]` list, not as their
  // own top-level `file` — they activate as a set (`activateModulePreset`),
  // not as an individually-selectable catalog card. Counting only `p.file`
  // here made every one of the 40 split files register as "invisible" the
  // moment they shipped; count both.
  it('every shipped policy YAML has a POLICY_PRESETS entry', () => {
    const presetFiles = new Set(POLICY_PRESETS.flatMap((p) => [p.file, ...(p.files ?? [])]))
    for (const f of shippedYamls()) {
      expect(presetFiles.has(f), `${f} has no POLICY_PRESETS entry (invisible in UI)`).toBe(true)
    }
  })

  // The hub copy under public/ must byte-match the engine's source of truth so
  // the UI never renders a policy that differs from what the server enforces.
  it('hub policy copies byte-match the engine source (kmip/policies)', () => {
    if (!existsSync(HSM_SRC)) return // sibling hsm checkout absent — skip
    for (const f of shippedYamls()) {
      // A policy born on a feature branch (e.g. migration-classical.yaml on
      // feat/kmip3-commands) has no counterpart in the sibling MAIN checkout
      // until that branch merges — skip it here rather than fail on worktree
      // topology; the byte-match resumes automatically once it lands.
      if (!existsSync(join(HSM_SRC, f))) continue
      const hub = readFileSync(join(POLICY_DIR, f), 'utf8')
      const src = readFileSync(join(HSM_SRC, f), 'utf8')
      expect(hub, `${f} diverges from kmip/policies/${f} — run scripts/build-kmip-wasm.sh`).toBe(
        src
      )
    }
  })
})
