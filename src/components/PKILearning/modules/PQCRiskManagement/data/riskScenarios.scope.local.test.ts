// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { RISK_SCENARIO_SETS } from './riskScenarios'

function entry(id: string) {
  const found = RISK_SCENARIO_SETS.flatMap((scenario) => scenario.entries).find(
    (item) => item.id === id
  )
  if (!found) throw new Error(`Missing risk scenario ${id}`)
  return found
}

describe('seed examples scope the cryptographic operation before assigning a quantum threat', () => {
  it.each(['fin-001', 'hc-001'])('%s identifies its HNDL key-transport assumption', (id) => {
    const item = entry(id)
    expect(item.threatVector).toBe('hndl')
    expect(item.assetName.toLowerCase()).toContain('tls 1.2')
    expect(item.assetName.toLowerCase()).toMatch(/key[- ]transport/)
    expect(item.mitigation).toContain('TLS 1.3')
  })

  it('does not classify application signing as HNDL', () => {
    expect(entry('fin-002').threatVector).toBe('forgery')
    expect(entry('fin-002').mitigation).toContain('historical signed messages')
  })

  it('declares RSA archive key wrapping as an explicit fictional HNDL case', () => {
    const item = entry('gov-002')
    expect(item.threatVector).toBe('hndl')
    expect(item.assetName.toLowerCase()).toContain('dek wrapping')
    expect(item.assetName.toLowerCase()).toContain('fictional')
  })
})
