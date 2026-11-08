// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../../embed/EmbedProvider'
import { SecretsManagementIntroduction } from './SecretsManagementIntroduction'

function sectionText(sectionId: string): string {
  render(
    <EmbedProvider>
      <MemoryRouter initialEntries={[`/learn/secrets-management-pqc?section=${sectionId}`]}>
        <SecretsManagementIntroduction onNavigateToWorkshop={() => {}} />
      </MemoryRouter>
    </EmbedProvider>
  )
  return document.body.textContent ?? ''
}

describe('SecretsManagementIntroduction envelope encryption', () => {
  it('separates symmetric KEK, asymmetric key transport, KEM-derived wrapping and transport to the key service', () => {
    const text = sectionText('secrets-vs-keys')
    expect(text).toMatch(/Symmetric KEK/)
    expect(text).toMatch(/Asymmetric key transport/)
    expect(text).toMatch(/KEM-derived wrapping key/)
    expect(text).toMatch(/Transport to the key service/)
    expect(text).toMatch(/Shor.s algorithm does not apply/)
  })

  it('does not tell readers to replace every KEK with ML-KEM or to seal a vault with ML-KEM', () => {
    const text = sectionText('secrets-vs-keys')
    expect(text).not.toMatch(/Migrating to\s*ML-KEM for the KEK protects all secrets/i)
    expect(text).not.toMatch(/ML-KEM vault seal/i)
    expect(text).not.toMatch(/master seal key to ML-KEM cascades/i)
    expect(text).not.toMatch(/RSA unsealed/i)
  })

  it('does not say the KEK is always the quantum-vulnerable component in every provider', () => {
    const text = sectionText('provider-roadmaps')
    expect(text).not.toMatch(/All cloud providers use envelope encryption/i)
    expect(text).not.toMatch(/Switching the KEK to ML-KEM protects all secrets/i)
    expect(text).toMatch(/symmetric/i)
  })
})

describe('SecretsManagementIntroduction TLS classification', () => {
  it('does not say recovering a signing key decrypts recorded sessions', () => {
    const text = sectionText('hndl-risk')
    expect(text).not.toMatch(/Immediate\s*—\s*session decryption/)
    expect(text).toMatch(/recovering the signing key does not decrypt recorded sessions/i)
  })

  it('tells key exchange from authentication', () => {
    const text = sectionText('hndl-risk')
    expect(text).toMatch(/decrypted by breaking its key exchange/i)
    expect(text).toMatch(/authenticates the handshake/i)
    expect(text).toMatch(/static RSA key transport/i)
    expect(text).toMatch(/neither substitutes for the other/i)
  })
})

describe('SecretsManagementIntroduction AWS provider row', () => {
  it('does not deny AWS KMS ML-KEM keys, and keeps Secrets Manager at-rest encryption symmetric', () => {
    const text = sectionText('provider-roadmaps')
    expect(text).not.toMatch(/No ML-KEM key spec/i)
    expect(text).not.toMatch(/There is no ML-KEM CMK key spec/i)
    expect(text).toMatch(/ML_KEM_512\/768\/1024/)
    expect(text).toMatch(/Encapsulate and Decapsulate/)
    expect(text).toMatch(/23 October 2026/)
    expect(text).toMatch(
      /not available in the China, Middle East \(UAE\) and Middle East \(Bahrain\) Regions/i
    )
    expect(text).toMatch(/imports key material only under an RSA wrapping key/)
    expect(text).toMatch(/supports only symmetric encryption KMS keys/i)
    expect(text).toMatch(/not ML-KEM-encrypted at rest/i)
  })
})

describe('SecretsManagementIntroduction Kubernetes secrets', () => {
  it('says an External Secrets Operator sync creates Kubernetes Secrets that live in etcd', () => {
    const text = sectionText('kubernetes-cicd')
    expect(text).not.toMatch(/Secret lives only in the external vault/i)
    expect(text).not.toMatch(/so they are not duplicated into etcd/i)
    expect(text).not.toMatch(/Secrets never duplicated into Kubernetes etcd/i)
    expect(text).toMatch(/creates Kubernetes Secret objects/i)
    expect(text).toMatch(/stored in etcd like any other Secret/i)
  })

  it('contrasts the sync pattern with direct volume or agent delivery', () => {
    const text = sectionText('kubernetes-cicd')
    expect(text).toMatch(/Vault Agent Injector renders secrets to a shared memory volume/i)
    expect(text).toMatch(/Secrets Store CSI Driver mounts them as a volume/i)
  })

  it('does not claim an ML-KEM etcd result that no plugin was checked for', () => {
    const text = sectionText('kubernetes-cicd')
    expect(text).not.toMatch(/all etcd secrets are ML-KEM protected/i)
    expect(text).toMatch(/not verified here/i)
    expect(text).toMatch(/KMS v1 is deprecated since Kubernetes 1\.28/)
  })
})
