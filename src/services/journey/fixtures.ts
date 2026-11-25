// SPDX-License-Identifier: AGPL-3.0-only
/** Test fixtures: a small objective made of real lessons, so the rules are tested against the real tags. */
import type { Objective, Step } from './types'

export function makeObjective(overrides: Partial<Objective> = {}): Objective {
  const steps: Step[] = [
    {
      id: 's1',
      position: 1,
      kind: 'module',
      resourceTag: 'LM-001',
      required: true,
      origin: { type: 'match' },
    },
    {
      id: 's2',
      position: 2,
      kind: 'module',
      resourceTag: 'LM-008',
      required: true,
      origin: { type: 'match' },
    },
    {
      id: 's3',
      position: 3,
      kind: 'module',
      resourceTag: 'LM-012',
      required: true,
      origin: { type: 'match' },
    },
    {
      id: 's4',
      position: 4,
      kind: 'self-assessed',
      resourceTag: 'obj-t/outcome',
      required: true,
      origin: { type: 'match' },
    },
    {
      id: 's5',
      position: 5,
      kind: 'module',
      resourceTag: 'LM-009',
      required: false,
      origin: { type: 'match' },
    },
  ]
  return {
    id: 'obj-t',
    role: 'architect',
    goal: 'Review our TLS migration design',
    state: 'active',
    steps,
    checkpoint: { path: ['journey', 'objectives'], stepId: 's1' },
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  }
}

/** Introduction, a protocol, a design lesson, an executive lesson, a hardware lesson and a business lesson. */
export const MATRIX_MODULES = [
  'pqc-101',
  'tls-basics',
  'hybrid-crypto',
  'exec-quantum-impact',
  'hsm-pqc',
  'pqc-business-case',
] as const
