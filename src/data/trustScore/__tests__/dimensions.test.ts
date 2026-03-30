// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { scoreSourceCredibility } from '../dimensions/sourceCredibility'
import { scorePeerReview } from '../dimensions/peerReview'
import { scoreOrgVetting } from '../dimensions/orgVetting'
import { scoreDocGrounding } from '../dimensions/docGrounding'
import { scoreCryptoSimulation } from '../dimensions/cryptoSimulation'
import { scoreTemporalFreshness } from '../dimensions/temporalFreshness'
import { scoreCrossRefDensity } from '../dimensions/crossRefDensity'
import { scoreEnrichmentCompleteness } from '../dimensions/enrichmentCompleteness'
import type { ScoringContext } from '../types'

function emptyContext(): ScoringContext {
  return {
    trustedSources: new Map(),
    xrefsByResource: new Map(),
    libraryEnrichments: {},
    timelineEnrichments: {},
    threatsEnrichments: {},
    manifestStatuses: new Map(),
    complianceLibraryRefs: new Map(),
    complianceTimelineRefs: new Map(),
    libraryDependencies: new Map(),
    threatModuleRefs: new Map(),
    demonstrableAlgorithms: new Set(['mlkem768', 'mldsa65']),
  }
}

describe('scoreSourceCredibility', () => {
  it('returns 10 when no xrefs exist', () => {
    const result = scoreSourceCredibility('unknown-id', emptyContext())
    expect(result.rawScore).toBe(10)
  })

  it('scores based on trust tier', () => {
    const ctx = emptyContext()
    ctx.trustedSources.set('nist', { trustTier: '1_Authoritative', sourceType: 'Government' })
    ctx.xrefsByResource.set('FIPS_203', [{ sourceId: 'nist', matchMethod: 'direct' }])
    const result = scoreSourceCredibility('FIPS_203', ctx)
    expect(result.rawScore).toBeGreaterThanOrEqual(100)
  })
})

describe('scorePeerReview', () => {
  it('scores 100 for yes', () => {
    expect(scorePeerReview('yes').rawScore).toBe(100)
  })

  it('scores 60 for partial', () => {
    expect(scorePeerReview('partial').rawScore).toBe(60)
  })

  it('scores 10 for no', () => {
    expect(scorePeerReview('no').rawScore).toBe(10)
  })

  it('scores 10 for undefined', () => {
    expect(scorePeerReview(undefined).rawScore).toBe(10)
  })

  it('applies document type bonus for FIPS', () => {
    const result = scorePeerReview('no', 'FIPS Standard')
    expect(result.rawScore).toBe(30) // 10 + 20
  })
})

describe('scoreOrgVetting', () => {
  it('scores 10 for empty vetting bodies', () => {
    expect(scoreOrgVetting([], 'library').rawScore).toBe(10)
  })

  it('scores higher with recognized bodies', () => {
    const result = scoreOrgVetting(['NIST'], 'library')
    expect(result.rawScore).toBe(70) // 60 base + 10 recognized
  })

  it('scores higher with multiple bodies', () => {
    const result = scoreOrgVetting(['NIST', 'IETF', 'ISO'], 'library')
    expect(result.rawScore).toBe(100) // 95 + 10 capped at 100
  })

  it('gives compliance resources a higher floor', () => {
    const result = scoreOrgVetting(['SomeOrg'], 'compliance')
    expect(result.rawScore).toBeGreaterThanOrEqual(70)
  })
})

describe('scoreDocGrounding', () => {
  it('returns notApplicable when no localFile', () => {
    const result = scoreDocGrounding('id', undefined, emptyContext())
    expect(result.notApplicable).toBe(true)
  })

  it('returns 100 for downloaded files', () => {
    const ctx = emptyContext()
    ctx.manifestStatuses.set('id', 'downloaded')
    expect(scoreDocGrounding('id', 'public/library/file.pdf', ctx).rawScore).toBe(100)
  })

  it('returns 50 for skipped files', () => {
    const ctx = emptyContext()
    ctx.manifestStatuses.set('id', 'skipped')
    expect(scoreDocGrounding('id', 'public/library/file.pdf', ctx).rawScore).toBe(50)
  })
})

describe('scoreCryptoSimulation', () => {
  it('returns notApplicable when no algorithm refs', () => {
    const result = scoreCryptoSimulation({}, emptyContext())
    expect(result.notApplicable).toBe(true)
  })

  it('scores 100 for demonstrable algorithm', () => {
    const result = scoreCryptoSimulation({ algorithmFamily: 'ML-KEM-768' }, emptyContext())
    expect(result.rawScore).toBe(100)
  })
})

describe('scoreTemporalFreshness', () => {
  it('returns notApplicable when no dates', () => {
    const result = scoreTemporalFreshness({})
    expect(result.notApplicable).toBe(true)
  })

  it('scores 100 for recent dates', () => {
    const today = new Date().toISOString().split('T')[0]
    expect(scoreTemporalFreshness({ lastUpdateDate: today }).rawScore).toBe(100)
  })
})

describe('scoreCrossRefDensity', () => {
  it('returns 10 when no refs', () => {
    expect(scoreCrossRefDensity('id', emptyContext()).rawScore).toBe(10)
  })
})

describe('scoreEnrichmentCompleteness', () => {
  it('returns 0 when no enrichment exists', () => {
    expect(scoreEnrichmentCompleteness('id', 'library', emptyContext()).rawScore).toBe(0)
  })

  it('scores based on populated count', () => {
    const ctx = emptyContext()
    ctx.libraryEnrichments['id'] = { populatedCount: 9, totalCount: 18 }
    expect(scoreEnrichmentCompleteness('id', 'library', ctx).rawScore).toBe(50)
  })
})
