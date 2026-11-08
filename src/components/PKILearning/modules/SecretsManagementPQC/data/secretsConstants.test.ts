// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  CLOUD_SECRETS_PROVIDERS,
  PIPELINE_INTEGRATION_PATTERNS,
  ROTATION_POLICIES,
  SECRET_CATEGORIES,
  getProviderPqcStatus,
} from './secretsConstants'
import { isInCatalog, getCatalogStatus } from '@/data/catalogStatus'

// Single-source guardrail: cloud secrets providers must NOT store their own
// headline PQC status — it is derived from the central catalog via `catalogName`.
describe('Secrets providers derive PQC status from the central catalog', () => {
  it('every catalogName resolves in the product catalog (no typos, no drift)', () => {
    for (const p of CLOUD_SECRETS_PROVIDERS) {
      expect(isInCatalog(p.catalogName), `${p.name} → "${p.catalogName}" not in catalog`).toBe(true)
    }
  })

  it('getProviderPqcStatus tracks catalog availability', () => {
    for (const p of CLOUD_SECRETS_PROVIDERS) {
      const avail = getCatalogStatus(p.catalogName)?.availability
      const status = getProviderPqcStatus(p)
      expect(['ga', 'preview', 'planned', 'none']).toContain(status)
      if (avail === 'available') expect(status).toBe('ga')
      if (avail === 'partial') expect(status).toBe('preview')
      if (avail === 'roadmap') expect(status).toBe('planned')
      if (avail === 'none') expect(status).toBe('none')
    }
  })

  it('no provider reintroduces a hard-coded pqcStatus literal', () => {
    for (const p of CLOUD_SECRETS_PROVIDERS) {
      expect(p).not.toHaveProperty('pqcStatus')
    }
  })
})

const category = (id: string) => {
  const found = SECRET_CATEGORIES.find((c) => c.id === id)
  if (!found) throw new Error(`missing category ${id}`)
  return found
}

describe('secret classification: TLS authentication versus key exchange', () => {
  it('does not claim a recovered ECDSA signing key decrypts recorded sessions', () => {
    const everything = JSON.stringify(SECRET_CATEGORIES)
    expect(everything).not.toMatch(
      /Recorded TLS sessions can be decrypted once the server private key/i
    )
    expect(everything).not.toMatch(/RSA or ECDSA key exchange/i)
    expect(everything).not.toMatch(/TLS session uses RSA\/ECDSA/i)
  })

  it('classifies the certificate signing key as authentication risk with no harvest-now-decrypt-later exposure', () => {
    const tls = category('tls-certs')
    expect(tls.hndlExposure).toBe('none')
    expect(tls.pqcRisk).toBe('critical')
    expect(tls.transitRisk).toMatch(/key exchange/i)
    expect(tls.transitRisk).toMatch(/impersonate/i)
    expect(tls.transitRisk).toMatch(/past session keys stay out of reach/i)
  })

  it('keeps the harvested-session exposure on the categories whose secrets travel over TLS', () => {
    expect(category('db-credentials').transitRisk).toMatch(/key exchange/i)
    expect(category('db-credentials').transitRisk).toMatch(/does not decrypt recorded traffic/i)
    expect(category('db-credentials').hndlExposure).toBe('immediate')
  })
})

describe('secret classification: key-protection boundaries', () => {
  it('does not prescribe ML-KEM for every KEK', () => {
    const everything = JSON.stringify([SECRET_CATEGORIES, ROTATION_POLICIES])
    expect(everything).not.toMatch(/KEK wrapping the DEK must be ML-KEM protected/i)
    expect(everything).not.toMatch(/Re-key all DEKs under ML-KEM-1024/i)
    expect(everything).not.toMatch(/Ensure vault KEK uses ML-KEM-768/i)
    expect(everything).not.toMatch(/their KEK wrappers need ML-KEM/i)
  })

  it('says only the asymmetric step needs replacing and symmetric KEKs stay', () => {
    const dek = category('encryption-keys')
    expect(dek.atRestRisk).toMatch(/symmetric AES KEK are not broken by Shor/i)
    expect(dek.mitigationStrategy).toMatch(/leave symmetric KEKs as they are/i)
    const rotation = ROTATION_POLICIES.find((p) => p.id === 'dek-rotation')
    expect(rotation?.pqcConsideration).toMatch(
      /rotating the DEK itself means re-encrypting the data/i
    )
  })
})

describe('CI/CD integration patterns: External Secrets Operator', () => {
  it('does not present the External Secrets Operator as keeping secrets out of etcd', () => {
    const k8s = PIPELINE_INTEGRATION_PATTERNS.find((p) => p.id === 'kubernetes-vault-agent')
    expect(k8s?.recommendation).not.toMatch(/KMS provider with ML-KEM support/i)
    expect(k8s?.recommendation).toMatch(/creates Kubernetes Secrets that are stored in etcd/i)
    expect(k8s?.recommendation).toMatch(/shared memory volume/i)
  })
})
