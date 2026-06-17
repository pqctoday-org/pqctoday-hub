// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { SIM_ALGORITHM_TABS } from './algorithmTabs'
import { ALGORITHM_TAB_REF_IDS } from './embedContract'

describe('SIM_ALGORITHM_TABS', () => {
  it('stays in sync with the contract refId set (every embeddable tab is registered)', () => {
    expect(Object.keys(SIM_ALGORITHM_TABS).sort()).toEqual([...ALGORITHM_TAB_REF_IDS].sort())
  })

  it('every tab has a component and a valid completion model', () => {
    for (const [refId, spec] of Object.entries(SIM_ALGORITHM_TABS)) {
      expect(spec.Component, `${refId} component`).toBeTruthy()
      if (spec.completion !== 'review') {
        // "choice that counts" tabs must carry an artifact type + distinct provenance.
        expect(spec.completion.artifactType, `${refId} artifactType`).toBeTruthy()
        expect(spec.completion.moduleId, `${refId} moduleId`).toBeTruthy()
        expect(spec.completion.title, `${refId} title`).toBeTruthy()
      }
    }
  })
})
