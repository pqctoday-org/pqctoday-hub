// SPDX-License-Identifier: AGPL-3.0-only
import { webcrypto } from 'node:crypto'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { FiveGService } from '../FiveGService'
import { createAuthenticationSample } from './AuthOps'
vi.mock('@/services/crypto/OpenSSLService', () => ({
  openSSLService: { execute: vi.fn(), deleteFile: vi.fn() },
}))
const originalCrypto = Object.getOwnPropertyDescriptor(window, 'crypto')
beforeEach(() => Object.defineProperty(window, 'crypto', { configurable: true, value: webcrypto }))
afterEach(() => {
  if (originalCrypto) Object.defineProperty(window, 'crypto', originalCrypto)
})

it('creates separate fixed subscriber/network computations without adopting or changing legacy service state', async () => {
  const facade = new FiveGService()
  const originalK = new Uint8Array(16).fill(0x99)
  facade.authState.K = originalK
  const sample = facade.createAuthenticationSample()
  const result = await sample.execute('retrieve_creds')
  expect(result.snapshot.networkKHex).toBe('33'.repeat(16))
  expect(result.snapshot.subscriberKHex).toBe('33'.repeat(16))
  expect(result.snapshot.networkOPcHex).toHaveLength(32)
  expect(result.snapshot.subscriberOPcHex).toBe(result.snapshot.networkOPcHex)
  expect(result.output).toContain('No subscriber database or HSM was accessed')
  expect(facade.authState.K).toBe(originalK)
})

it('does not share counters, credentials readiness or reset state across factory instances', async () => {
  const a = createAuthenticationSample(),
    b = createAuthenticationSample()
  await a.execute('retrieve_creds')
  a.setChallengeSqn('010101010102')
  expect(b.getSnapshot()).toMatchObject({ networkSqnHex: '010101010101', networkOPcHex: '' })
  await b.execute('retrieve_creds')
  a.reset()
  expect(a.getSnapshot().stageComplete.retrieve_creds).toBe(false)
  expect(b.getSnapshot().stageComplete.retrieve_creds).toBe(true)
  b.dispose()
  await expect(b.execute('gen_rand')).rejects.toMatchObject({ kind: 'stale' })
  await expect(a.execute('retrieve_creds')).resolves.toHaveProperty(
    'snapshot.stageComplete.retrieve_creds',
    true
  )
})
