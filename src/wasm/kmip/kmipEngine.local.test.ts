// SPDX-License-Identifier: GPL-3.0-only
//
// Unit tests for the PURE decision-extraction layer of the CACP engine wrapper
// (WP2.5 / report gap T3). These functions sit between the wasm boundary and
// the UI and had zero coverage — `decisionOf` / `strongestDecision` decide what
// verdict the playground shows, so a regression here silently mislabels every
// policy result. No wasm module is loaded: we feed synthetic audit events.
//
// Venue: `*.local.test.ts` — excluded from the CI vitest globs, run by the
// local gate (project directive 2026-07-01: new suites are local-only).

import { describe, it, expect } from 'vitest'
import { decisionOf, strongestDecision, type AuditEvent, type OpResult } from './kmipEngine'

const p1 = (type: string, extra: Record<string, unknown> = {}): AuditEvent => ({
  plane: 'p1',
  event: { type: 'PolicyDecided', outcome: { type, ...extra } },
} as unknown as AuditEvent)

const other = (): AuditEvent =>
  ({ plane: 'p2', event: { type: 'KmipDispatched' } } as unknown as AuditEvent)

describe('decisionOf', () => {
  it('pulls the Plane-1 PolicyDecided outcome from an op result', () => {
    const r = { audit: [other(), p1('Allow', { algorithm_override: 'ML-DSA-87' })] } as OpResult
    expect(decisionOf(r)).toEqual({ kind: 'Allow', algorithm: 'ML-DSA-87' })
  })

  it('reads a Rekey new_algorithm', () => {
    const r = { audit: [p1('Rekey', { new_algorithm: 'ML-KEM-1024' })] } as OpResult
    expect(decisionOf(r)).toEqual({ kind: 'Rekey', algorithm: 'ML-KEM-1024' })
  })

  it('returns Unknown when there is no Plane-1 decision', () => {
    const r = { audit: [other()] } as OpResult
    expect(decisionOf(r)).toEqual({ kind: 'Unknown' })
  })

  it('maps a Deny outcome', () => {
    const r = { audit: [p1('Deny')] } as OpResult
    expect(decisionOf(r).kind).toBe('Deny')
  })
})

describe('strongestDecision', () => {
  it('picks Deny over Rekey over Allow across a batch (Deny > Rekey > Allow)', () => {
    const audit = [p1('Allow'), p1('Rekey', { new_algorithm: 'ML-DSA-65' }), p1('Deny')]
    expect(strongestDecision(audit).kind).toBe('Deny')
  })

  it('picks Rekey when there is no Deny', () => {
    const audit = [p1('Allow'), p1('Rekey', { new_algorithm: 'ML-DSA-65' })]
    expect(strongestDecision(audit)).toEqual({ kind: 'Rekey', algorithm: 'ML-DSA-65' })
  })

  it('is Allow when every decision is Allow', () => {
    expect(strongestDecision([p1('Allow'), p1('Allow')]).kind).toBe('Allow')
  })

  it('ignores non-Plane-1 and non-PolicyDecided events', () => {
    const audit = [
      other(),
      { plane: 'p1', event: { type: 'SomethingElse' } } as unknown as AuditEvent,
    ]
    expect(strongestDecision(audit).kind).toBe('Unknown')
  })

  it('is Unknown for an empty audit', () => {
    expect(strongestDecision([]).kind).toBe('Unknown')
  })
})
