// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { generateKeyPairSync, sign } from 'node:crypto'
import { AsnConvert, OctetString } from '@peculiar/asn1-schema'
import { Certificate, Extension, SubjectPublicKeyInfo, Time } from '@peculiar/asn1-x509'
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js'
import { useOpenSSLStore } from '@/components/OpenSSLStudio/store'
import { hybridCryptoService, type FormatOutput } from '../services/HybridCryptoService'
import {
  buildWorkshopCA,
  issueCertificate,
  buildCertDiscoveryExtension,
  CERT_DISCOVERY_PLACEHOLDER_OIDS,
  ML_DSA_65_OID_STR,
  EC_PUBLIC_KEY_OID_STR,
  ECDSA_SHA256_OID_STR,
  ecP256SpkiAlgId,
} from '../services/certBuilder'
import { verifyCertDiscovery } from '../services/certVerifier'
import { derToPem } from '../data/ietfTestVectors'
import { HybridCertFormats } from './HybridCertFormats'

const hsm = vi.hoisted(() => ({
  isReady: true,
  moduleRef: { current: {} },
  hSessionRef: { current: 1 },
  log: [],
  clearLog: vi.fn(),
  keys: [],
  addKey: vi.fn(),
  removeKey: vi.fn(),
  registerKey: vi.fn(),
}))
vi.mock('@/hooks/useHSM', () => ({ useHSM: () => hsm }))

async function fixture(
  mode: 'valid' | 'expired-critical' | 'bad-signature' | 'wrong-advertisement' | 'unresolved'
): Promise<FormatOutput> {
  // Real existing builders and verifier; Node signs primary ECDSA, Noble verifies it.
  // Secondary/CA use actual ML-DSA. The HSM UI transport alone is controlled below.
  const caKey = ml_dsa65.keygen(new Uint8Array(32).fill(11))
  const secondaryKey = ml_dsa65.keygen(new Uint8Array(32).fill(22))
  const ca = await buildWorkshopCA({
    subject: '/CN=Sample CA',
    keyOid: ML_DSA_65_OID_STR,
    publicKey: caKey.publicKey,
    signerFn: async (tbs) => ml_dsa65.sign(tbs, caKey.secretKey),
  })
  const secondary = await issueCertificate({
    subject: '/CN=Actual Secondary',
    subjectKeyOid: ML_DSA_65_OID_STR,
    subjectPublicKey: secondaryKey.publicKey,
    issuer: ca,
    isCA: false,
    keyUsage: ['digitalSignature'],
  })
  const ec = generateKeyPairSync('ec', { namedCurve: 'prime256v1' })
  const spki = AsnConvert.parse(
    ec.publicKey.export({ format: 'der', type: 'spki' }),
    SubjectPublicKeyInfo
  )
  const primary = await issueCertificate({
    subject: '/CN=Actual Primary',
    subjectKeyOid: EC_PUBLIC_KEY_OID_STR,
    subjectAlgId: ecP256SpkiAlgId(),
    subjectPublicKey: new Uint8Array(spki.subjectPublicKey),
    issuer: null,
    selfSigner: {
      signatureOid: ECDSA_SHA256_OID_STR,
      signerFn: async (tbs) => new Uint8Array(sign('sha256', tbs, ec.privateKey)),
    },
    isCA: false,
    keyUsage: ['digitalSignature'],
    extraExtensions: [
      buildCertDiscoveryExtension({
        uri: 'https://pqctoday.invalid/sample.der',
        signatureOid: mode === 'wrong-advertisement' ? ECDSA_SHA256_OID_STR : ML_DSA_65_OID_STR,
        publicKeyOid: ML_DSA_65_OID_STR,
      }),
    ],
  })
  const parsed = AsnConvert.parse(primary.der, Certificate)
  if (mode === 'expired-critical') {
    parsed.tbsCertificate.validity.notBefore = new Time({
      utcTime: new Date('1999-01-01T00:00:00Z'),
    })
    parsed.tbsCertificate.validity.notAfter = new Time({
      utcTime: new Date('2000-01-01T00:00:00Z'),
    })
    parsed.tbsCertificate.extensions!.push(
      new Extension({
        extnID: '1.2.3.4',
        critical: true,
        extnValue: new OctetString(new Uint8Array([5, 0]).buffer),
      })
    )
    parsed.signatureValue = Uint8Array.from(
      sign('sha256', Buffer.from(AsnConvert.serialize(parsed.tbsCertificate)), ec.privateKey)
    ).buffer
  }
  if (mode === 'bad-signature') {
    const sig = new Uint8Array(parsed.signatureValue)
    sig[sig.length - 1] ^= 1
  }
  const checks = verifyCertDiscovery(
    parsed,
    CERT_DISCOVERY_PLACEHOLDER_OIDS,
    () => (mode === 'unresolved' ? undefined : secondary.der),
    AsnConvert.parse(ca.certDer, Certificate)
  )
  return {
    certs: [
      {
        label: 'Actual primary',
        pem: derToPem(new Uint8Array(AsnConvert.serialize(parsed))),
        parsed: '',
        type: 'classical',
        role: 'existing',
      },
    ],
    checks,
    timingMs: 1,
  }
}

beforeEach(() => {
  vi.restoreAllMocks()
  useOpenSSLStore.setState({ files: [] })
})

describe('Discovery reports exactly its actual selected checks', () => {
  it.each(['valid', 'expired-critical'] as const)(
    'renders %s actual checks without claiming full path validation',
    async (mode) => {
      const output = await fixture(mode)
      expect(output.checks.length).toBeGreaterThan(6)
      expect(output.checks.every((check) => check.ok)).toBe(true)
      vi.spyOn(hybridCryptoService, 'generateCertDiscovery').mockResolvedValue(output)
      render(<HybridCertFormats />)
      const card = screen.getByRole('region', { name: /^Certificate Discovery/ })
      expect(card).toBeTruthy()
      fireEvent.click(within(card).getByRole('button', { name: /^Generate$/ }))
      expect(await within(card).findByText(/Selected discovery checks —/)).toHaveTextContent(
        `${output.checks.length}/${output.checks.length} passed`
      )
      expect(within(card).getByText(/not full PKIX validation/)).toHaveTextContent(
        'Validity time, revocation, trust anchors/path policy'
      )
      expect(within(card).queryByText(/^Verified —/)).not.toBeInTheDocument()
    }
  )

  it.each(['bad-signature', 'wrong-advertisement', 'unresolved'] as const)(
    'keeps actual %s checks failed',
    async (mode) => {
      const output = await fixture(mode)
      expect(output.checks.some((check) => !check.ok)).toBe(true)
      vi.spyOn(hybridCryptoService, 'generateCertDiscovery').mockResolvedValue(output)
      render(<HybridCertFormats />)
      const card = screen.getByRole('region', { name: /^Certificate Discovery/ })
      fireEvent.click(within(card).getByRole('button', { name: /^Generate$/ }))
      expect(await within(card).findByText(/of .* checks failed/)).toBeInTheDocument()
      expect(within(card).queryByText(/Selected discovery checks —/)).not.toBeInTheDocument()
    }
  )
})
