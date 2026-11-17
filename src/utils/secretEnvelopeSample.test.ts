// SPDX-License-Identifier: AGPL-3.0-only
import { it, expect } from 'vitest'
import { runSecretEnvelopeSample } from './secretEnvelopeSample'
it.each(['Fictional portal token', '', 'résumé 🔑'])(
  'encrypts and recovers actual UTF-8, rejects KEM and tag mutations, then recovers (%s)',
  (message) => {
    const r = runSecretEnvelopeSample(message)
    expect(r).toMatchObject({
      messageRecovered: true,
      changedKemRejected: true,
      changedDataRejected: true,
      restored: true,
    })
    expect(r.sizes).toMatchObject({
      encapsulationKey: 1184,
      kemCiphertext: 1088,
      dataWithTag: new TextEncoder().encode(message).length + 16,
    })
    expect(JSON.stringify(r.envelope)).not.toContain('secretKey')
  }
)
