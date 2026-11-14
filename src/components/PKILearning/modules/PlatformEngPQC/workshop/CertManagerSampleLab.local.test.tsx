// SPDX-License-Identifier: AGPL-3.0-only
import { createHash } from 'node:crypto'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { parseAllDocuments } from 'yaml'
import { CertManagerSampleLab } from './CertManagerSampleLab'
import {
  CERT_MANAGER_MLDSA_MANIFESTS,
  CERT_MANAGER_CI_MLDSA_MANIFESTS,
  CERT_MANAGER_MLDSA_POLICY,
  CERT_MANAGER_ALPHA_GATE_VALUES,
} from '../data/certManagerAlphaSample'
import { POLICY_RULES } from '../data/policyRulesData'
import { IAC_PATTERNS } from '../data/iacCryptoData'

const sha256 = (text: string) => createHash('sha256').update(text).digest('hex')

describe('Pinned certificate sample', () => {
  it('uses the exact manifest and Rego bytes that passed the native acceptance matrix', () => {
    expect(sha256(CERT_MANAGER_MLDSA_MANIFESTS)).toBe(
      'ffa7b1232986e99113e6d042f3ef65efed63ab36fd7c5c2e6a49cb4d8df0c44a'
    )
    expect(sha256(POLICY_RULES.find((r) => r.id === 'opa-cert-algo')!.rule)).toBe(
      '2cfb0e60d180c47c5295bbf294a3ad0cd5f530ec3ecbb4dd906b5bcf973c8d78'
    )
    expect(IAC_PATTERNS.find((p) => p.id === 'cert-manager-issuer')!.pqcConfig).toBe(
      CERT_MANAGER_MLDSA_MANIFESTS
    )
    expect(sha256(CERT_MANAGER_CI_MLDSA_MANIFESTS)).toBe(
      'a8e9bf4fde70535f345c90647565d980a5999113a7c11c96d98b8a2c2177ebcd'
    )
    expect(IAC_PATTERNS.find((p) => p.id === 'kubernetes-kubeconfig')!.pqcConfig).toBe(
      CERT_MANAGER_CI_MLDSA_MANIFESTS
    )
    const docs = parseAllDocuments(CERT_MANAGER_MLDSA_MANIFESTS).map((doc) => doc.toJSON())
    expect(docs.map((doc) => doc.kind)).toEqual(['Namespace', 'Issuer', 'Certificate'])
    expect(docs[2].spec.privateKey).toEqual({
      algorithm: 'MLDSA',
      size: 65,
      encoding: 'PKCS8',
      rotationPolicy: 'Always',
    })
    expect(docs[2].spec).not.toHaveProperty('signatureAlgorithm')
    expect(docs[2].spec.privateKey).not.toHaveProperty('hybridAlgorithm')
  })
  it('exposes the snapshot boundary and the exact tested files without a browser verification claim', () => {
    render(<CertManagerSampleLab />)
    expect(screen.getByText(/Released cert-manager v1.21.3 does not support/)).toBeVisible()
    for (const [name, content] of Object.entries({
      'fictional-certificates.yaml': CERT_MANAGER_MLDSA_MANIFESTS,
      'snapshot-gates.yaml': CERT_MANAGER_ALPHA_GATE_VALUES,
      'sample-certificate-policy.rego': CERT_MANAGER_MLDSA_POLICY,
    })) {
      const link = screen.getByRole('link', { name: `Download ${name}` })
      const href = link.getAttribute('href')!
      expect(decodeURIComponent(href.slice(href.indexOf(',') + 1))).toBe(content)
    }
    expect(screen.queryByText('Certificate verified', { exact: true })).not.toBeInTheDocument()
  })
})
