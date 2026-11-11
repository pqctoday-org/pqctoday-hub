// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { ARCHITECTURES, type Architecture, type ProtocolEdge } from '@/data/simArchitecture'
import {
  deriveEdgePlanningProgress,
  isDeclaredPlanningEdge,
  isPlanningChoice,
  planningForArchitecture,
} from './edgePlanningProgress'

// Independent small case: two critical identities and two general identities.
// Same selection count can therefore have opposite critical planning outcomes.
const edges: ProtocolEdge[] = [
  {
    from: 'a',
    to: 'b',
    protocol: 'C',
    vulnerable: true,
    pqcPath: 'available',
    criticality: 'critical',
    requiredPurposes: ['confidentiality'],
  },
  {
    from: 'a',
    to: 'b',
    protocol: 'A',
    vulnerable: true,
    pqcPath: 'available',
    criticality: 'critical',
    requiredPurposes: ['authenticity'],
  },
  {
    from: 'a',
    to: 'b',
    protocol: 'CA',
    vulnerable: true,
    pqcPath: 'available',
    criticality: 'general',
    requiredPurposes: ['confidentiality', 'authenticity'],
  },
  {
    from: 'a',
    to: 'b',
    protocol: 'GC',
    vulnerable: true,
    pqcPath: 'available',
    criticality: 'general',
    requiredPurposes: ['confidentiality'],
  },
]
const keys = ['a-b-C', 'a-b-A', 'a-b-CA', 'a-b-GC']
const run = (raw: Record<string, unknown>, fraction = 1, eligible = keys) =>
  deriveEdgePlanningProgress(edges, eligible, raw, fraction)

describe('named edge planning progress', () => {
  it('accepts only the two literal planning choices', () => {
    expect(['hybrid', 'pure'].every(isPlanningChoice)).toBe(true)
    for (const value of [undefined, null, true, 1, '', 'Hybrid', 'pure ', {}, []]) {
      expect(isPlanningChoice(value)).toBe(false)
    }
  })

  it('distinguishes equal-count general and critical selections', () => {
    const general = run({ 'a-b-CA': 'hybrid', 'a-b-GC': 'pure' })
    const critical = run({ 'a-b-C': 'pure', 'a-b-A': 'hybrid' })
    expect(general.creditedKeys).toHaveLength(2)
    expect(critical.creditedKeys).toHaveLength(2)
    expect(general.criticalDone).toBe(false)
    expect(general.groups['hndl-critical']).toEqual({
      requiredKeys: ['a-b-C'],
      completedKeys: [],
      progress: 0,
      done: false,
    })
    expect(general.groups['tnfl-critical'].progress).toBe(0)
    expect(critical.criticalDone).toBe(true)
    expect(critical.groups['hndl-general'].progress).toBe(0)
    expect(critical.groups['tnfl-general'].progress).toBe(0)
  })

  it('does not let confidentiality substitute for authenticity on another identity', () => {
    const result = run({ 'a-b-C': 'hybrid' })
    expect(result.groups['hndl-critical'].done).toBe(true)
    expect(result.groups['tnfl-critical'].completedKeys).toEqual([])
    expect(result.criticalDone).toBe(false)
  })

  it('credits both explicitly declared planning purposes of the same C+A edge', () => {
    const result = run({ 'a-b-CA': 'pure' })
    expect(result.groups['hndl-general']).toEqual({
      requiredKeys: ['a-b-CA', 'a-b-GC'],
      completedKeys: ['a-b-CA'],
      progress: 0.5,
      done: false,
    })
    expect(result.groups['tnfl-general']).toEqual({
      requiredKeys: ['a-b-CA'],
      completedKeys: ['a-b-CA'],
      progress: 1,
      done: true,
    })
  })

  it('withholds the entire overcapacity set, then credits exactly what remains after Undo', () => {
    const choices = { 'a-b-C': 'hybrid', 'a-b-A': 'pure' }
    const before = JSON.stringify(choices)
    const over = run(choices, 0.25)
    expect(over.selectedKeys).toEqual(['a-b-A', 'a-b-C'])
    expect(over).toMatchObject({
      unlocked: 1,
      capacity: 0,
      overCapacity: true,
      creditedKeys: [],
      criticalDone: false,
    })
    const afterUndo = { ...choices }
    delete (afterUndo as Record<string, unknown>)['a-b-C']
    const fits = run(afterUndo, 0.25)
    expect(fits).toMatchObject({
      selectedKeys: ['a-b-A'],
      creditedKeys: ['a-b-A'],
      capacity: 0,
      overCapacity: false,
    })
    expect(fits.groups['tnfl-critical'].done).toBe(true)
    expect(fits.groups['hndl-critical'].done).toBe(false)
    expect(JSON.stringify(choices)).toBe(before)
  })

  it('withdraws and restores credit when effort changes without changing literal saved choices', () => {
    const choices = Object.freeze({ 'a-b-C': 'hybrid', 'a-b-CA': 'pure' })
    expect(run(choices, 1).creditedKeys).toEqual(['a-b-C', 'a-b-CA'])
    expect(run(choices, 0.25).creditedKeys).toEqual([])
    expect(run(JSON.parse(JSON.stringify(choices)), 1).creditedKeys).toEqual(['a-b-C', 'a-b-CA'])
    expect(choices).toEqual({ 'a-b-C': 'hybrid', 'a-b-CA': 'pure' })
  })

  it.each([NaN, Infinity, -Infinity, -1])('gives no effort credit for fraction %s', (fraction) => {
    expect(run({ 'a-b-C': 'hybrid' }, fraction)).toMatchObject({
      unlocked: 0,
      creditedKeys: [],
      overCapacity: true,
    })
  })

  it('clamps finite excess effort and floors fractional capacity', () => {
    expect(run({}, 2).unlocked).toBe(4)
    expect(run({}, 0.49).unlocked).toBe(1)
    expect(run({}, 0.5).unlocked).toBe(2)
  })

  it('ignores unknown eligible keys and duplicate eligibility entries when determining capacity', () => {
    const result = run({ 'a-b-C': 'hybrid', absent: 'pure' }, 1, ['a-b-C', 'a-b-C', 'absent'])
    expect(result).toMatchObject({
      eligibleKeys: ['a-b-C'],
      unlocked: 1,
      creditedKeys: ['a-b-C'],
      unknownKeys: ['absent'],
    })
  })

  it('preserves and diagnoses invalid, unknown and unavailable raw inputs without counting them', () => {
    const choices = Object.freeze({
      'a-b-C': 'hybrid',
      'a-b-A': 'unexpected',
      'a-b-CA': 'pure',
      old: 'pure',
      invalidOld: false,
    })
    const result = run(choices, 1, ['a-b-C', 'a-b-A'])
    expect(result.selectedKeys).toEqual(['a-b-C'])
    expect(result.invalidChoiceKeys).toEqual(['a-b-A', 'invalidOld'])
    expect(result.unknownKeys).toEqual(['invalidOld', 'old'])
    expect(result.unavailableKeys).toEqual(['a-b-CA'])
    expect(choices['a-b-CA']).toBe('pure')
    const inherited = Object.create({ 'a-b-C': 'hybrid' })
    expect(run(inherited).selectedKeys).toEqual([])
  })

  it('includes unavailable declared critical dependencies in the required denominator', () => {
    const result = run({ 'a-b-C': 'hybrid', 'a-b-A': 'pure' }, 1, ['a-b-C'])
    expect(result.groups['tnfl-critical']).toEqual({
      requiredKeys: ['a-b-A'],
      completedKeys: [],
      progress: 0,
      done: false,
    })
    expect(result.unavailableKeys).toEqual(['a-b-A'])
    expect(result.criticalDone).toBe(false)
  })

  it('does not depend on source, eligibility, purpose or saved-property order', () => {
    const forward = run({ 'a-b-C': 'hybrid', 'a-b-CA': 'pure' }, 0.25)
    const reversed = deriveEdgePlanningProgress(
      [...edges]
        .reverse()
        .map((e) => ({ ...e, requiredPurposes: [...e.requiredPurposes!].reverse() })),
      [...keys].reverse(),
      { 'a-b-CA': 'pure', 'a-b-C': 'hybrid' },
      0.25
    )
    expect(reversed).toEqual(forward)
  })

  it('uses actual confidentiality group fractions in the existing illustrative exposure weighting', () => {
    expect(run({ 'a-b-C': 'hybrid' }).hndlExposure).toBeCloseTo(0.3)
    expect(run({ 'a-b-GC': 'hybrid' }).hndlExposure).toBeCloseTo(0.85)
    expect(run({ 'a-b-A': 'pure' }).hndlExposure).toBe(1)
    expect(run(Object.fromEntries(keys.map((k) => [k, 'pure']))).hndlExposure).toBe(0)
  })
})

describe('declarations must establish the purpose groups', () => {
  it('recognizes complete per-edge declarations for safe presentation', () => {
    expect(edges.every(isDeclaredPlanningEdge)).toBe(true)
  })
  const malformed: Array<[string, unknown]> = [
    ['missing criticality', { ...edges[0], criticality: undefined }],
    ['unknown criticality', { ...edges[0], criticality: 'urgent' }],
    ['missing purposes', { ...edges[0], requiredPurposes: undefined }],
    ['empty purposes', { ...edges[0], requiredPurposes: [] }],
    [
      'duplicate purposes',
      { ...edges[0], requiredPurposes: ['confidentiality', 'confidentiality'] },
    ],
    ['unknown purpose', { ...edges[0], requiredPurposes: ['integrity'] }],
    ['malformed purposes', { ...edges[0], requiredPurposes: 'confidentiality' }],
    ['null purposes', { ...edges[0], requiredPurposes: null }],
    ['sparse purposes', { ...edges[0], requiredPurposes: new Array(1) }],
    ['empty identity component', { ...edges[0], protocol: '' }],
  ]
  it.each(malformed)('leaves every group unassessed for %s', (_label, edge) => {
    expect(isDeclaredPlanningEdge(edge as ProtocolEdge)).toBe(false)
    const result = deriveEdgePlanningProgress(
      [edge as ProtocolEdge, ...edges.slice(1)],
      keys,
      { 'a-b-C': 'hybrid' },
      1
    )
    expect(result.declarationsValid).toBe(false)
    expect(result.criticalDone).toBe(false)
    expect(result.hndlExposure).toBeNull()
    for (const group of Object.values(result.groups)) {
      expect(group).toMatchObject({ progress: null, completedKeys: [], done: false })
    }
  })

  it.each([{ input: [] }, { input: [...edges, edges[0]] }])(
    'does not assess empty or duplicate-identity declarations',
    ({ input }) => {
      const result = deriveEdgePlanningProgress(input, keys, {}, 1)
      expect(result.declarationsValid).toBe(false)
      expect(result.criticalDone).toBe(false)
      expect(result.hndlExposure).toBeNull()
    }
  )

  it('never vacuously completes a group that has no declarations', () => {
    const result = deriveEdgePlanningProgress([edges[0]], ['a-b-C'], { 'a-b-C': 'hybrid' }, 1)
    expect(result.declarationsValid).toBe(true)
    expect(result.groups['hndl-critical'].done).toBe(true)
    expect(result.groups['tnfl-critical']).toEqual({
      requiredKeys: [],
      completedKeys: [],
      progress: null,
      done: false,
    })
    expect(result.criticalDone).toBe(false)
    expect(result.hndlExposure).toBeNull()
  })
})

describe('current architecture adapter', () => {
  it('uses unchanged edgeState and excludes safe, vendor, monitor and blocked choices from credit', () => {
    const arch: Architecture = {
      size: 'small',
      nodes: [
        { id: 'a', label: 'A', layer: 'Actor', pqcStatus: 'available' },
        { id: 'b', label: 'B', layer: 'AppServers', pqcStatus: 'available' },
      ],
      edges: [
        edges[0],
        { ...edges[1], pqcPath: 'vendor' },
        { ...edges[2], monitorOnly: true },
        { ...edges[3], vulnerable: false },
      ],
    }
    const choices = Object.fromEntries(keys.map((k) => [k, 'hybrid']))
    expect(planningForArchitecture(arch, 1, choices)).toMatchObject({
      eligibleKeys: ['a-b-C'],
      selectedKeys: ['a-b-C'],
      creditedKeys: ['a-b-C'],
      unavailableKeys: ['a-b-A', 'a-b-CA', 'a-b-GC'],
    })
    expect(
      planningForArchitecture(
        { ...arch, nodes: arch.nodes.map((n) => ({ ...n, pqcStatus: 'none' })) },
        1,
        choices
      ).creditedKeys
    ).toEqual([])
  })

  it('assesses every exact current preset declaration without treating its residual critical edges as complete', () => {
    const expected = {
      small: { 'hndl-critical': 2, 'tnfl-critical': 3, 'hndl-general': 2, 'tnfl-general': 1 },
      mid: { 'hndl-critical': 3, 'tnfl-critical': 5, 'hndl-general': 3, 'tnfl-general': 1 },
      large: { 'hndl-critical': 3, 'tnfl-critical': 5, 'hndl-general': 3, 'tnfl-general': 2 },
      global: { 'hndl-critical': 2, 'tnfl-critical': 6, 'hndl-general': 3, 'tnfl-general': 2 },
    }
    for (const size of ['small', 'mid', 'large', 'global'] as const) {
      const arch = ARCHITECTURES[size]
      const choices = Object.fromEntries(
        arch.edges.map((e) => [`${e.from}-${e.to}-${e.protocol}`, 'hybrid'])
      )
      const result = planningForArchitecture(arch, 1, choices)
      expect(result.declarationsValid, size).toBe(true)
      for (const group of [
        'hndl-critical',
        'tnfl-critical',
        'hndl-general',
        'tnfl-general',
      ] as const) {
        expect(result.groups[group].requiredKeys.length, `${size}:${group}`).toBe(
          expected[size][group]
        )
      }
      expect(result.criticalDone, size).toBe(false)
    }
  })
})
