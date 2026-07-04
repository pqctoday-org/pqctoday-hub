// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  buildMarkdown,
  normalizeState,
  type ScopingState,
  type ScopedSystem,
} from './InitialScopingAssessment'

function makeState(overrides: Partial<ScopingState> = {}): ScopingState {
  const sys: ScopedSystem = {
    name: 'TLS gateway',
    priority: 'A',
    ownership: 'Vendor',
    notes: 'RSA-2048',
  }
  return {
    systems: [sys],
    vendors: ['OpenSSL'],
    estateInstances: '2400',
    estate: {
      tlsEndpoints: '',
      certificates: '',
      vpnTunnels: '',
      hsmKeys: '',
      codeSigningPipelines: '',
    },
    seeded: false,
    ...overrides,
  }
}

describe('InitialScopingAssessment buildMarkdown', () => {
  it('renders the per-system triage table with priority + owner + notes', () => {
    const md = buildMarkdown(makeState(), 'Finance & Banking')
    expect(md).toContain('| # | System | Priority | Owner | Notes (if known) |')
    expect(md).toContain('| 1 | TLS gateway | A | Vendor | RSA-2048 |')
    expect(md).toContain('Industry context: Finance & Banking')
  })

  it('shows an untriaged marker when priority/notes are unset', () => {
    const md = buildMarkdown(
      makeState({ systems: [{ name: 'X', priority: '—', ownership: 'Internal', notes: '' }] }),
      ''
    )
    expect(md).toContain('| 1 | X | — | Internal | — |')
  })

  it('renders the estate breakdown only when a category is filled', () => {
    expect(buildMarkdown(makeState(), '')).not.toContain('| Category | Count |')
    const some = buildMarkdown(
      makeState({
        estate: {
          tlsEndpoints: '1200',
          certificates: '',
          vpnTunnels: '',
          hsmKeys: '',
          codeSigningPipelines: '',
        },
      }),
      ''
    )
    expect(some).toContain('| Category | Count |')
    expect(some).toContain('| TLS endpoints | 1200 |')
  })

  it('lists vendors and the estate aggregate', () => {
    const md = buildMarkdown(makeState(), '')
    expect(md).toContain('1. OpenSSL')
    expect(md).toContain('2400')
  })
})

describe('normalizeState (back-compat)', () => {
  it('migrates an old string[] scope to the new per-system shape', () => {
    const migrated = normalizeState({
      systems: ['Old system A', 'Old system B'],
      vendors: ['V1'],
      estateInstances: '100',
    })
    expect(migrated).not.toBeNull()
    expect(migrated!.systems).toHaveLength(2)
    expect(migrated!.systems[0]).toEqual({
      name: 'Old system A',
      priority: '—',
      ownership: 'Internal',
      notes: '',
    })
    expect(migrated!.estate).toBeDefined()
  })

  it('preserves an already-new-shape scope', () => {
    const s = makeState()
    expect(normalizeState(s)).toEqual(s)
  })

  it('returns null for junk', () => {
    expect(normalizeState(null)).toBeNull()
    expect(normalizeState({ nope: true })).toBeNull()
  })
})
