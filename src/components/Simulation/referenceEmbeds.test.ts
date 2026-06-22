// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { REFERENCE_EMBED_IDS } from './embedContract'
import { SIM_REFERENCE_EMBEDS } from './referenceEmbeds'

describe('SIM_REFERENCE_EMBEDS', () => {
  it('the pure id set (REFERENCE_EMBED_IDS) and the widget registry agree (no drift)', () => {
    // canEmbedStep gates on REFERENCE_EMBED_IDS but the mount arm resolves the
    // widget from SIM_REFERENCE_EMBEDS — if they diverge, a reference can be
    // "embeddable" yet render nothing (or vice versa). Keep them identical.
    expect(Object.keys(SIM_REFERENCE_EMBEDS).sort()).toEqual([...REFERENCE_EMBED_IDS].sort())
  })

  it('every entry has a non-empty label and a component', () => {
    for (const [id, spec] of Object.entries(SIM_REFERENCE_EMBEDS)) {
      expect(spec.label, `${id}.label`).toBeTruthy()
      expect(typeof spec.Component, `${id}.Component`).toBe('function')
    }
  })
})
