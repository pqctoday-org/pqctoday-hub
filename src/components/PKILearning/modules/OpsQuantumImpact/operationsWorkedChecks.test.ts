// SPDX-License-Identifier: AGPL-3.0-only
import { createElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { KmsMigrationRunbook } from '../KmsPqc/workshop/KmsMigrationRunbook'
import {
  REWRAP_INVENTORY,
  applyRewrapObservation,
  evaluateModeledKeyGeneration,
  rewrapCounts,
} from './data/operationsWorkedChecks'

vi.mock('@/components/PKILearning/common/OpsConfigGenerator', () => ({
  OpsConfigGenerator: ({
    generateConfig,
  }: {
    generateConfig: (input: Record<string, string>) => string
  }) =>
    createElement(
      'pre',
      { 'data-testid': 'maintained-rewrap-command' },
      generateConfig({ provider: 'vault', operation: 're-encrypt' })
    ),
}))
vi.mock('@/components/PKILearning/common/OpsChecklist', () => ({ OpsChecklist: () => null }))

// The maintained Vite raw loader reads the exact canonical retrieval source, not a copied paragraph.
import summary from './rag-summary.md?raw'

const response = { data: { ciphertext: 'vault:v2:abcdefgh' } }
const observation = {
  itemId: 'A',
  requestKeyName: 'sample-app',
  outcome: 'success' as const,
  response,
}

describe('Worked operations outcome accounting', () => {
  it('counts distinct items and preserves failed work until a valid retry', () => {
    expect(rewrapCounts(REWRAP_INVENTORY)).toEqual({ confirmed: 1, remaining: 2 })
    const a = applyRewrapObservation(REWRAP_INVENTORY, observation).inventory
    const failedB = applyRewrapObservation(a, {
      ...observation,
      itemId: 'B',
      outcome: 'failure',
    }).inventory
    expect(rewrapCounts(failedB)).toEqual({ confirmed: 2, remaining: 1 })
    expect(failedB.find((item) => item.id === 'B')?.version).toBe(1)
    const duplicate = applyRewrapObservation(failedB, observation)
    expect(duplicate.inventory).toBe(failedB)
    expect(duplicate.message).toContain('duplicate')
    expect(
      rewrapCounts(applyRewrapObservation(failedB, { ...observation, itemId: 'B' }).inventory)
    ).toEqual({ confirmed: 3, remaining: 0 })
    expect(REWRAP_INVENTORY.map((item) => item.version)).toEqual([1, 1, 2])
  })

  it.each([
    undefined,
    null,
    {},
    { ciphertext: 'vault:v2:abcdefgh' },
    { data: null },
    { data: { ciphertext: '' } },
    { data: { ciphertext: 'vault:v2:' } },
    { data: { ciphertext: 'vault:v1:abcdefgh' } },
    { data: { ciphertext: 'vault:v3:abcdefgh' } },
    { data: { ciphertext: 'vault:v2:has spaces' } },
    { data: { ciphertext: 'vault:v9007199254740993:abcdefgh' } },
  ])('refuses missing, malformed or unexpected observation data %j', (badResponse) => {
    expect(
      applyRewrapObservation(REWRAP_INVENTORY, { ...observation, response: badResponse }).inventory
    ).toBe(REWRAP_INVENTORY)
  })

  it('requires caller correlation and never treats a failed operation as success from its prefix', () => {
    for (const invalid of [
      { ...observation, itemId: 'unknown' },
      { ...observation, requestKeyName: 'another-key' },
      { ...observation, outcome: 'failure' as const },
    ])
      expect(applyRewrapObservation(REWRAP_INVENTORY, invalid).inventory).toBe(REWRAP_INVENTORY)
  })

  it('keeps errors, software substitutes and audit-only events from completing an HSM-required request', () => {
    expect(
      evaluateModeledKeyGeneration({ result: 'error', custody: 'hsm', privateKeyHandle: 257 }).state
    ).toBe('pending')
    expect(
      evaluateModeledKeyGeneration({
        result: 'success',
        custody: 'software',
        privateKeyHandle: 257,
        auditRecorded: true,
      }).state
    ).toBe('refused')
    expect(evaluateModeledKeyGeneration({ result: 'success', auditRecorded: true }).state).toBe(
      'pending'
    )
    for (const handle of [undefined, 0, -1, 1.5, NaN, Infinity]) {
      expect(
        evaluateModeledKeyGeneration({
          result: 'success',
          custody: 'hsm',
          privateKeyHandle: handle,
        }).state
      ).toBe('pending')
    }
    const positive = evaluateModeledKeyGeneration({
      result: 'success',
      custody: 'hsm',
      privateKeyHandle: 257,
    })
    expect(positive.state).toBe('complete')
    expect(positive.reason).toContain('new-key request')
    expect(positive.reason).toContain('does not recover an old key')
  })

  it('uses the actual maintained same-key runbook rather than a second Vault recipe', () => {
    render(createElement(KmsMigrationRunbook))
    const generated = screen
      .getByTestId('maintained-rewrap-command')
      .textContent!.split('\n')
      .filter((line) => !line.startsWith('#'))
      .join(' ')
      .replace(/\\\s*/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    expect(generated).toBe('vault write transit/rewrap/<name> ciphertext=<ct>')
    expect(summary).toContain(`\`${generated}\``)
    expect(summary).toContain('same named AES-256-GCM96 key')
    expect(summary).not.toContain('vault_transit_reencrpyt_duration_seconds')
    expect(summary).not.toContain('fallback: software key with audit trail')
    expect(summary).toContain('2 of 3 recorded at target version; 1 remaining')
    expect(summary).toContain('an audit trail cannot make a software substitute equivalent')
    expect(summary).toContain('not responses from a running Vault server')
    expect(summary).toContain('No server or HSM operation executes in this decision check')
  })
})
