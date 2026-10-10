// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { libraryData } from './libraryData'
import { getLibraryStartPicks } from './libraryStartPicks'
import { LIBRARY_CERT_ENGINEER_PICKS } from './libraryCertEngineerPicks'
import { LIBRARY_CURIOUS_PICKS } from './libraryCuriousPicks'
import { LIBRARY_EXECUTIVE_PICKS } from './libraryExecutivePicks'
import { LIBRARY_OPS_PICKS } from './libraryOpsPicks'
import { PERSONA_IDS } from './personaIds'

const activeIds = new Set(libraryData.map((i) => i.referenceId))

describe('Library "Start here" picks', () => {
  it('the certification engineer gets exactly the three curated documents, in order', () => {
    expect(getLibraryStartPicks('cert-engineer').map((p) => p.referenceId)).toEqual([
      'NIST-FIPS140-3-IG-PQC',
      'CMVP-MGMT-MANUAL',
      'usnistgov-ACVP-Server-Public-Reference-Sample-Vector-Sets',
    ])
  })

  it('every curated certification pick resolves to a real Library document', () => {
    for (const pick of LIBRARY_CERT_ENGINEER_PICKS) {
      expect(activeIds.has(pick.referenceId), pick.referenceId).toBe(true)
    }
  })

  it('every pick has a label and a blurb', () => {
    for (const pick of LIBRARY_CERT_ENGINEER_PICKS) {
      expect(pick.label.length).toBeGreaterThan(0)
      expect(pick.blurb.length).toBeGreaterThan(0)
    }
  })

  it('leaves the other curated sets unchanged', () => {
    expect(getLibraryStartPicks('curious')).toEqual(LIBRARY_CURIOUS_PICKS.slice(0, 3))
    expect(getLibraryStartPicks('executive')).toEqual(LIBRARY_EXECUTIVE_PICKS.slice(0, 3))
    expect(getLibraryStartPicks('ops')).toEqual(LIBRARY_OPS_PICKS.slice(0, 3))
  })

  it('returns three picks for every persona, and none without one', () => {
    expect(getLibraryStartPicks(null)).toEqual([])
    for (const id of PERSONA_IDS) {
      expect(getLibraryStartPicks(id).length, id).toBe(3)
    }
  })
})
