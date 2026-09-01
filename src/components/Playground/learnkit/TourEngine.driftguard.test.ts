// SPDX-License-Identifier: GPL-3.0-only
//
// TourEngine.driftguard.test.ts — asserts every `data-tour` selector the two
// Developer-tab guided lessons (dev-tabs-pkcs11-kmip plan, G5) point at
// actually exists in the component they target, so a future refactor that
// renames/removes an anchor breaks the build instead of silently orphaning
// the tour (a spotlight step with no live target renders centered, with no
// visible error — see TourEngine.tsx's `rect === null` fallback). Parses
// SOURCE TEXT via regex, the same technique the shim-parity driftguards use
// (p11Parity.driftguard.test.ts, kmipParity.driftguard.test.ts) — no React
// render/DOM environment needed, and it stays honest about failing loudly
// rather than needing jsdom wiring just to check a string is present.
//
// Both extraction directions are read from the actual source, not
// hand-duplicated into this file: `extractTargets` finds every
// `target: '[data-tour="…"]'` the lesson steps reference (KmipPlayground
// View.tsx's 'developer-lifecycle' lesson, HsmPlayground.tsx's
// 'pkcs-dev-builder' lesson), and `extractAnchors` finds every literal
// `data-tour="…"` AND conditional `data-tour={cond ? '…' : undefined}`
// anchor the two pipeline builders actually render — so adding a step whose
// target nothing renders, or renaming an anchor without updating the step
// that points at it, both fail this test without either list being kept in
// sync by hand.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '../../../..')
const read = (relPath: string) => readFileSync(resolve(ROOT, relPath), 'utf8')

const KMIP_VIEW = 'src/components/Playground/kmip/KmipPlaygroundView.tsx'
const KMIP_BUILDER = 'src/components/Playground/dev/kmipPipeline/KmipPipelineBuilder.tsx'
// 2026-08-31 merge (feat/navigate-label-selection @ 417710f35): the KMIP Dev
// plane folded into KMIP3.0's own Dev sub-tab. 2026-09-01
// (kmip3-corpus-palette-plan-09012026.md): the OASIS conformance corpus
// folded again, from its own sibling "Corpus Replay" tab into a palette
// source switch inside KmipPipelineBuilder itself — KmipDevTab.tsx is now a
// thin wrapper with no anchors of its own, but stays in this lane's file
// list in case that changes again.
const KMIP_DEV_TAB = 'src/components/Playground/kmip/KmipDevTab.tsx'
const PKCS_VIEW = 'src/components/Playground/HsmPlayground.tsx'
const PKCS_BUILDER = 'src/components/Playground/dev/pipeline/PkcsPipelineBuilder.tsx'

/** Every `target: '[data-tour="…"]…'` a lesson step references, filtered to
 *  this lane's own G5 anchor namespace (both files' OLDER lessons target
 *  `data-tour` anchors in entirely different components — filtering by
 *  prefix keeps this focused on the anchors G5 actually introduced). */
function extractTargets(src: string, prefix: string): Set<string> {
  const re = /target:\s*'\[data-tour="([\w-]+)"\]/g
  const out = new Set<string>()
  let m: RegExpExecArray | null
  while ((m = re.exec(src))) {
    if (m[1].startsWith(prefix)) out.add(m[1])
  }
  return out
}

/** Every `data-tour="…"` (literal) and `data-tour={… ? '…' : undefined}`
 *  (conditional) anchor a builder component actually renders. The
 *  conditional form's ternary condition string (e.g. `'expect-deny'`,
 *  `'sign'`) is swept in too — harmless: it can never collide with this
 *  lane's namespaced anchor strings, and a false match would only ever
 *  hide a real gap, which extractTargets' prefix filter already guards
 *  against by construction (see above). */
function extractAnchors(src: string): Set<string> {
  const out = new Set<string>()
  const reDirect = /data-tour="([\w-]+)"/g
  let m: RegExpExecArray | null
  while ((m = reDirect.exec(src))) out.add(m[1])
  const reCond = /data-tour=\{([^}]*)\}/g
  while ((m = reCond.exec(src))) {
    const reStr = /'([\w-]+)'/g
    let m2: RegExpExecArray | null
    while ((m2 = reStr.exec(m[1]))) out.add(m2[1])
  }
  return out
}

describe('G5 guided-lesson anchor driftguard', () => {
  it('every KMIP Developer-tab lesson target exists in KmipPipelineBuilder', () => {
    const targets = extractTargets(read(KMIP_VIEW), 'kmip-dev-')
    expect(targets.size).toBeGreaterThan(0)
    const anchors = new Set([
      ...extractAnchors(read(KMIP_BUILDER)),
      ...extractAnchors(read(KMIP_DEV_TAB)),
    ])
    const missing = [...targets].filter((t) => !anchors.has(t))
    expect(missing).toEqual([])
  })

  it('every PKCS#11 Developer-tab lesson target exists in PkcsPipelineBuilder', () => {
    const targets = extractTargets(read(PKCS_VIEW), 'pkcs-dev-')
    expect(targets.size).toBeGreaterThan(0)
    const anchors = extractAnchors(read(PKCS_BUILDER))
    const missing = [...targets].filter((t) => !anchors.has(t))
    expect(missing).toEqual([])
  })
})
