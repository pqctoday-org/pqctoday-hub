// SPDX-License-Identifier: AGPL-3.0-only
import { it, expect } from 'vitest'
import { getAlgorithmLaunch } from '@/data/algorithmLaunch'
import { generateOpenSSLConfig } from '@/components/PKILearning/modules/TLSBasics/utils/configGenerator'
import type { TLSConfig } from '@/store/tls-learning.store'
import { exactTlsLaunchConfig } from './tlsLaunch'

it('the generated configuration honours the requested group after a saved raw session', () => {
  const saved: TLSConfig = {
    mode: 'raw',
    rawConfig: 'OLD-RAW-X25519-CONFIG',
    groups: ['X25519'],
    cipherSuites: ['TLS_AES_128_GCM_SHA256'],
    signatureAlgorithms: [],
    certificates: {},
  }
  const config = { ...saved, ...exactTlsLaunchConfig(getAlgorithmLaunch('SecP384r1MLKEM1024')) }
  const text = generateOpenSSLConfig(config, 'client')
  expect(text).toContain('SecP384r1MLKEM1024')
  expect(text).not.toContain('OLD-RAW-X25519-CONFIG')
  expect(exactTlsLaunchConfig(getAlgorithmLaunch('X-Wing'))).toBeUndefined()
})
