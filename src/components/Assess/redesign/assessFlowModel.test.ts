// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  LEGACY_ORDER,
  RENDER_ORDER_FULL,
  RENDER_ORDER_QUICK,
  STEP_META,
  STEP_VALIDATORS,
  TRACK_INFO,
  legacyIndexOf,
  keyAtLegacyIndex,
  storeIndexOf,
  keyAtStoreIndex,
  renderOrderFor,
  hasAnswer,
  isStepAnswered,
  firstIncompleteStepStoreIndex,
  resumePosition,
  type AssessAnswerState,
  type AssessValidatorState,
} from './assessFlowModel'
import { FULL_LOCKED_SECTIONS, FAST_REPORT_SECTIONS } from './reportContract'

const emptyState = (): AssessValidatorState => ({
  industry: '',
  country: '',
  currentCryptoCategories: [],
  cryptoUnknown: false,
  dataSensitivity: [],
  sensitivityUnknown: false,
  migrationStatus: '',
  migrationUnknown: false,
  dataRetention: [],
  retentionUnknown: false,
  credentialLifetime: [],
  credentialLifetimeUnknown: false,
  systemCount: '',
  teamSize: '',
  scaleUnknown: false,
  cryptoAgility: '',
  agilityUnknown: false,
  timelinePressure: '',
  timelineUnknown: false,
})

describe('assess flow model — orders', () => {
  it('legacy order is the canonical 13 with migration at index 5', () => {
    expect(LEGACY_ORDER).toHaveLength(13)
    expect(LEGACY_ORDER[5]).toBe('migration')
  })

  it('full render order moves migration after credential-lifetime', () => {
    expect(RENDER_ORDER_FULL).toHaveLength(13)
    const credIdx = RENDER_ORDER_FULL.indexOf('credential-lifetime')
    const migIdx = RENDER_ORDER_FULL.indexOf('migration')
    expect(migIdx).toBe(credIdx + 1)
    // same set of keys, just reordered
    expect([...RENDER_ORDER_FULL].sort()).toEqual([...LEGACY_ORDER].sort())
  })

  it('quick render order is the 6-step fast track, free of every hasExtendedInput field', () => {
    expect(RENDER_ORDER_QUICK).toHaveLength(6)
    expect(RENDER_ORDER_QUICK).toEqual([
      'industry',
      'country',
      'crypto',
      'sensitivity',
      'compliance',
      'migration',
    ])
    // These flip hasExtendedInput true and must stay out of the quick track so
    // the quick report keeps the per-domain breakdown + progress locked.
    for (const extended of [
      'use-cases',
      'retention',
      'credential-lifetime',
      'scale',
      'agility',
      'infra',
      'timeline',
    ] as const) {
      expect(RENDER_ORDER_QUICK).not.toContain(extended)
    }
  })

  it('renderOrderFor maps modes', () => {
    expect(renderOrderFor('quick')).toBe(RENDER_ORDER_QUICK)
    expect(renderOrderFor('comprehensive')).toBe(RENDER_ORDER_FULL)
  })

  it('domains are contiguous in the full render order', () => {
    const domains = RENDER_ORDER_FULL.map((k) => STEP_META[k].domain)
    // each domain appears as a single contiguous run
    const runs = domains.filter((d, i) => d !== domains[i - 1])
    expect(runs).toEqual(['profile', 'exposure', 'readiness'])
  })
})

describe('assess flow model — index translation', () => {
  it('legacyIndexOf / keyAtLegacyIndex round-trip', () => {
    LEGACY_ORDER.forEach((key, i) => {
      expect(legacyIndexOf(key)).toBe(i)
      expect(keyAtLegacyIndex(i)).toBe(key)
    })
  })

  it('store index is track-relative and round-trips for both tracks', () => {
    // quick: store index == position in the 8-step quick array
    RENDER_ORDER_QUICK.forEach((key) => {
      expect(keyAtStoreIndex('quick', storeIndexOf('quick', key))).toBe(key)
    })
    // comprehensive: store index == position in LEGACY_ORDER
    LEGACY_ORDER.forEach((key) => {
      expect(keyAtStoreIndex('comprehensive', storeIndexOf('comprehensive', key))).toBe(key)
    })
  })

  it('store index differs from render position where migration moved', () => {
    // migration: store index 5 (legacy), but render position 8 (after credential)
    expect(storeIndexOf('comprehensive', 'migration')).toBe(5)
    expect(RENDER_ORDER_FULL.indexOf('migration')).toBe(8)
    // credential-lifetime sits at legacy store index 8 — what the OLD wizard
    // would render at index 8 — proving the two interpret currentStep consistently.
    expect(keyAtStoreIndex('comprehensive', 8)).toBe('credential-lifetime')
  })
})

describe('assess flow model — validators (parity with legacy ALL_STEPS)', () => {
  it('required scalars need a value', () => {
    const s = emptyState()
    expect(STEP_VALIDATORS.industry(s)).toBe(false)
    s.industry = 'Finance & Banking'
    expect(STEP_VALIDATORS.industry(s)).toBe(true)
  })

  it('freely-optional steps (compliance/use-cases/infra) always pass', () => {
    const s = emptyState()
    expect(STEP_VALIDATORS.compliance(s)).toBe(true)
    expect(STEP_VALIDATORS['use-cases'](s)).toBe(true)
    expect(STEP_VALIDATORS.infra(s)).toBe(true)
  })

  it('retention / credential / scale require a value OR the unknown flag', () => {
    const s = emptyState()
    expect(STEP_VALIDATORS.retention(s)).toBe(false)
    s.retentionUnknown = true
    expect(STEP_VALIDATORS.retention(s)).toBe(true)

    expect(STEP_VALIDATORS.scale(s)).toBe(false)
    s.systemCount = '11-50'
    expect(STEP_VALIDATORS.scale(s)).toBe(false) // needs both
    s.teamSize = '11-50'
    expect(STEP_VALIDATORS.scale(s)).toBe(true)
  })

  it('freelyOptional flag matches the constant-true validators exactly', () => {
    const freelyOptional = LEGACY_ORDER.filter((k) => STEP_META[k].freelyOptional)
    expect(new Set(freelyOptional)).toEqual(new Set(['compliance', 'use-cases', 'infra']))
  })
})

describe('assess flow model — track info matches the report contract', () => {
  it('counts line up', () => {
    expect(TRACK_INFO.quick.count).toBe(RENDER_ORDER_QUICK.length)
    expect(TRACK_INFO.comprehensive.count).toBe(RENDER_ORDER_FULL.length)
  })

  it('report contract has 6 fast summary rows + 2 hard-locked sections', () => {
    expect(FAST_REPORT_SECTIONS).toHaveLength(6)
    // Only the per-domain breakdown and progress-over-time are truly gated
    // behind ReportLockedOverlay; the algorithm map and roadmap render on both
    // tracks, so advertising them as locked was misleading.
    expect(FULL_LOCKED_SECTIONS).toHaveLength(2)
    expect(FULL_LOCKED_SECTIONS).toEqual(['Per-domain risk breakdown', 'Progress over time'])
  })
})

describe('assess flow model — use-case ordering guidance', () => {
  it('explains the roadmap order from consequences and dependencies, not a fixed TLS/VPN-first rule', () => {
    const why = STEP_META['use-cases'].why
    // A storage-urgent or signing-dependent estate must not be told that TLS/VPN always goes first.
    expect(why).not.toMatch(/(TLS|VPN)[^.]*move first/i)
    expect(why).not.toMatch(/niche use cases later/i)
    // The teaching order is tied to what the order depends on.
    expect(why).toMatch(/consequences/i)
    expect(why).toMatch(/dependenc/i)
    expect(why).toMatch(/storage/i)
    expect(why).toMatch(/signing/i)
  })
})

// A fast-track answer set: everything the quick track asks, nothing it does not.
const quickAnswered = (): AssessAnswerState => ({
  ...emptyState(),
  industry: 'Finance & Banking',
  country: 'United States',
  currentCryptoCategories: ['key-exchange'],
  dataSensitivity: ['high'],
  migrationStatus: 'planning',
})

describe('assess flow model — optional-step answers', () => {
  it('an untouched optional step is not answered, though its validator passes', () => {
    const s = emptyState()
    expect(STEP_VALIDATORS.compliance(s)).toBe(true)
    expect(hasAnswer('compliance', s)).toBe(false)
    expect(hasAnswer('use-cases', s)).toBe(false)
    expect(hasAnswer('infra', s)).toBe(false)
  })

  it('a selection or the not-sure flag answers an optional step', () => {
    expect(hasAnswer('compliance', { ...emptyState(), complianceRequirements: ['nist'] })).toBe(
      true
    )
    expect(hasAnswer('use-cases', { ...emptyState(), useCasesUnknown: true })).toBe(true)
    expect(hasAnswer('infra', { ...emptyState(), infrastructure: ['hsm'] })).toBe(true)
  })

  it('any of the infrastructure step parts answers it, as the review summary does', () => {
    expect(hasAnswer('infra', { ...emptyState(), cryptoLibraries: ['OpenSSL'] })).toBe(true)
    expect(hasAnswer('infra', { ...emptyState(), infraAutomation: ['None'] })).toBe(true)
    expect(hasAnswer('infra', { ...emptyState(), vendorDependency: 'mixed' })).toBe(true)
    expect(hasAnswer('infra', { ...emptyState(), vendorUnknown: true })).toBe(true)
    expect(hasAnswer('infra', { ...emptyState(), cryptoLibraries: [], vendorDependency: '' })).toBe(
      false
    )
  })

  it('hasAnswer on a required step is the validator', () => {
    expect(hasAnswer('industry', emptyState())).toBe(false)
    expect(hasAnswer('industry', { ...emptyState(), industry: 'Healthcare' })).toBe(true)
  })

  it('an optional step the reader moved past counts; a required one still needs an answer', () => {
    expect(isStepAnswered('infra', emptyState(), true)).toBe(true)
    expect(isStepAnswered('infra', emptyState(), false)).toBe(false)
    expect(isStepAnswered('industry', emptyState(), true)).toBe(false)
  })
})

describe('assess flow model — fast to full upgrade landing', () => {
  it('a finished fast track lands on use-cases, not on migration', () => {
    const landing = firstIncompleteStepStoreIndex(
      'comprehensive',
      quickAnswered(),
      RENDER_ORDER_QUICK
    )
    expect(keyAtStoreIndex('comprehensive', landing as number)).toBe('use-cases')
    // The old step (migration, store index 5) is exactly what the upgrade must NOT keep.
    expect(landing).not.toBe(storeIndexOf('comprehensive', 'migration'))
  })

  it('skips the optional steps already answered and lands on the first required gap', () => {
    const s = { ...quickAnswered(), cryptoUseCases: ['tls'] }
    const landing = firstIncompleteStepStoreIndex('comprehensive', s, RENDER_ORDER_QUICK)
    expect(keyAtStoreIndex('comprehensive', landing as number)).toBe('retention')
  })

  it('does not send the reader back to an optional step the fast track already showed', () => {
    // compliance was shown on the fast track and left blank; it is not outstanding.
    const landing = firstIncompleteStepStoreIndex(
      'comprehensive',
      quickAnswered(),
      RENDER_ORDER_QUICK
    )
    expect(keyAtStoreIndex('comprehensive', landing as number)).not.toBe('compliance')
  })

  it('returns null when nothing is outstanding', () => {
    const all: AssessAnswerState = {
      ...quickAnswered(),
      complianceUnknown: true,
      useCasesUnknown: true,
      infrastructureUnknown: true,
      retentionUnknown: true,
      credentialLifetimeUnknown: true,
      scaleUnknown: true,
      agilityUnknown: true,
      timelineUnknown: true,
    }
    expect(firstIncompleteStepStoreIndex('comprehensive', all)).toBeNull()
  })
})

describe('assess flow model — resume position', () => {
  it('reports the rail position and label, not the legacy number', () => {
    // store index 5 is migration: legacy "step 6", but step 9 of 13 on the full rail.
    expect(resumePosition('comprehensive', 5)).toEqual({
      position: 9,
      total: 13,
      label: STEP_META.migration.label,
    })
    expect(resumePosition('quick', 5)).toEqual({
      position: 6,
      total: 6,
      label: STEP_META.migration.label,
    })
  })

  it('is null for a step outside the track', () => {
    expect(resumePosition('quick', 9)).toBeNull()
  })
})
