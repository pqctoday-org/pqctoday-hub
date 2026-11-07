// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  MTINegotiator,
  isOutsidePosture,
  recommendMTI,
  renderMTIMarkdown,
  type MTIInputs,
} from './MTINegotiator'

// Mock the module store so the component renders without persistence setup.
vi.mock('@/store/useModuleStore', () => ({
  useModuleStore: (selector: (state: { addExecutiveDocument: () => void }) => unknown) =>
    selector({ addExecutiveDocument: () => undefined }),
}))

const baseInputs: MTIInputs = {
  protocol: 'TLS 1.3',
  audience: 'global-commercial',
  interopProfile: [],
  complianceDeadline: '2030',
  standardsPosture: 'nist-pqc-only',
  hardwareConstraints: [],
  signatureSizePreference: 'no-preference',
  localPolicyOverride: '',
}

describe('MTINegotiator — component', () => {
  it('renders without crashing', () => {
    expect(() => render(<MTINegotiator />)).not.toThrow()
  })

  it('renders the CSWP-39 §3.1.1 zone-banner heading', () => {
    render(<MTINegotiator />)
    expect(screen.getByText(/Mandatory-to-Implement \(MTI\) Negotiator/i)).toBeTruthy()
    expect(screen.getAllByText(/Section 3.1.1/i).length).toBeGreaterThan(0)
  })
})

describe('recommendMTI — decision tree', () => {
  it('US federal + 2030 deadline -> ML-DSA-87 + ML-KEM-1024 (CNSA 2.0, Cat 5)', () => {
    const rec = recommendMTI({
      ...baseInputs,
      audience: 'us-federal',
      complianceDeadline: '2030',
    })
    expect(rec.sigMTI).toMatch(/ML-DSA-87/)
    expect(rec.kemMTI).toMatch(/ML-KEM-1024/)
    // Cat-3 sets remain available as the non-NSS / NIST-track federal alternate
    expect(rec.sigAlternates.join(' ')).toMatch(/ML-DSA-65/)
    expect(rec.kemAlternates.join(' ')).toMatch(/ML-KEM-768/)
  })

  it('Embedded/IoT + low-RAM -> stateless SLH-DSA-SHAKE-128s signature', () => {
    const rec = recommendMTI({
      ...baseInputs,
      audience: 'embedded-iot',
      hardwareConstraints: ['low-ram'],
    })
    expect(rec.sigMTI).toMatch(/SLH-DSA-SHAKE-128s/)
  })

  it('Embedded/IoT + nist-alternates-permitted -> HQC-128 KEM MTI', () => {
    const rec = recommendMTI({
      ...baseInputs,
      audience: 'embedded-iot',
      standardsPosture: 'nist-alternates-permitted',
      hardwareConstraints: ['low-ram'],
    })
    expect(rec.kemMTI).toMatch(/HQC-128/)
  })

  it('Non-PQC peer interop required -> hybrid X25519MLKEM768 KEM MTI', () => {
    const rec = recommendMTI({
      ...baseInputs,
      interopProfile: ['non-pqc-peers'],
    })
    expect(rec.kemMTI).toMatch(/X25519MLKEM768/)
  })

  it('Post-CRQC greenfield + minimise-sig-size -> ML-DSA-44 Cat 2', () => {
    const rec = recommendMTI({
      ...baseInputs,
      audience: 'post-crqc-greenfield',
      signatureSizePreference: 'minimise-sig-size',
    })
    expect(rec.sigMTI).toMatch(/ML-DSA-44/)
  })

  it('Default profile -> ML-DSA-65 + ML-KEM-768 with HQC-128 KEM alternate', () => {
    const rec = recommendMTI(baseInputs)
    expect(rec.sigMTI).toMatch(/ML-DSA-65/)
    expect(rec.kemMTI).toMatch(/ML-KEM-768/)
    expect(rec.kemAlternates.join(' ')).toMatch(/HQC-128/)
  })

  it('US federal -> SHA-384 hash MTI (CNSA 2.0) with SHA-512 alternate', () => {
    const rec = recommendMTI({ ...baseInputs, audience: 'us-federal' })
    // CNSA 2.0 mandates SHA-384 for NSS — not SHA-256.
    expect(rec.hashMTI).toMatch(/SHA-384/)
    expect(rec.hashAlternates.join(' ')).toMatch(/SHA-512/)
  })

  it('Embedded -> SHAKE-128 hash MTI', () => {
    const rec = recommendMTI({ ...baseInputs, audience: 'embedded-iot' })
    expect(rec.hashMTI).toMatch(/SHAKE-128/)
  })

  it('emits non-PQC interop watch-out when KEM MTI is pure ML-KEM and peers include non-PQC', () => {
    // audience post-crqc-greenfield forces non-hybrid ML-KEM-768; even with
    // non-pqc-peers in interopProfile the early "non-pqc-peers -> hybrid" rule
    // takes precedence — so we use a profile that bypasses that early rule.
    const rec = recommendMTI({
      ...baseInputs,
      audience: 'post-crqc-greenfield',
      interopProfile: ['non-pqc-peers'],
    })
    // The non-pqc-peers branch picks X25519MLKEM768 even for greenfield audience,
    // so this case should NOT produce the warning.
    expect(rec.kemMTI).toMatch(/X25519MLKEM768/)
  })

  it('emits HSM watch-out when hsm-backed is required', () => {
    const rec = recommendMTI({
      ...baseInputs,
      hardwareConstraints: ['hsm-backed'],
    })
    expect(rec.watchOuts.join(' ')).toMatch(/HSM/)
  })

  it('always emits the local-policy-override reminder', () => {
    const rec = recommendMTI(baseInputs)
    expect(rec.watchOuts.join(' ')).toMatch(/Local policy/)
  })

  // RM-09: the `protocol` input now shapes a carriage note (was previously ignored).
  it('emits a protocol-specific carriage note driven by the protocol input', () => {
    expect(recommendMTI({ ...baseInputs, protocol: 'TLS 1.3' }).watchOuts.join(' ')).toMatch(
      /X25519MLKEM768 named group/
    )
    expect(recommendMTI({ ...baseInputs, protocol: 'IKEv2' }).watchOuts.join(' ')).toMatch(
      /RFC 9370/
    )
    expect(recommendMTI({ ...baseInputs, protocol: 'SSH' }).watchOuts.join(' ')).toMatch(
      /sntrup761x25519/
    )
  })
})

describe('recommendMTI — standards posture applies to every recommendation', () => {
  const fipsOnly: MTIInputs = { ...baseInputs, standardsPosture: 'fips-validated-only' }

  it('marks the HQC KEM alternate as outside a FIPS-validated-only posture and says why', () => {
    const rec = recommendMTI(fipsOnly)
    const hqc = rec.kemAlternates.find((a) => /HQC/.test(a))
    expect(hqc).toBeDefined()
    expect(hqc).toMatch(/outside the chosen standards posture/)
    expect(rec.watchOuts.join(' ')).toMatch(/Marked as outside[^.]*HQC-128/)
    expect(rec.watchOuts.join(' ')).toMatch(/no final FIPS covers them/)
  })

  it('applies the same check under the NIST-PQC-only posture', () => {
    const rec = recommendMTI({ ...baseInputs, standardsPosture: 'nist-pqc-only' })
    expect(rec.kemAlternates.join(' ')).toMatch(/HQC-128[^;]*outside the chosen standards posture/)
  })

  it('does not mark HQC when the posture permits NIST alternates', () => {
    const rec = recommendMTI({ ...baseInputs, standardsPosture: 'nist-alternates-permitted' })
    expect(rec.kemAlternates.join(' ')).toMatch(/HQC-128/)
    expect(rec.kemAlternates.join(' ')).not.toMatch(/outside the chosen standards posture/)
    expect(rec.watchOuts.join(' ')).not.toMatch(/Marked as outside/)
  })

  it('separates the FIPS algorithm standards from a module certificate that covers them', () => {
    const text = recommendMTI(fipsOnly).watchOuts.join(' ')
    expect(text).toMatch(/standardize algorithms; they are not module certificates/)
    expect(text).toMatch(/Active CMVP certificate that lists the algorithm and parameter set/)
    expect(text).toMatch(/version and operating environment you deploy/)
  })

  it('applies the same check to signature and KEM algorithms', () => {
    // No recommendation path offers Falcon today, so test the check itself: a signature that no
    // final FIPS covers is outside the posture exactly like a KEM that no final FIPS covers.
    expect(isOutsidePosture(fipsOnly, 'Falcon-512 (selected by NIST, standard not final)')).toBe(
      true
    )
    expect(isOutsidePosture(fipsOnly, 'HQC-128 (code-based, NIST alternate)')).toBe(true)
    expect(isOutsidePosture(fipsOnly, 'ML-DSA-65 (FIPS 204, NIST Cat 3)')).toBe(false)
    expect(isOutsidePosture(fipsOnly, 'SLH-DSA-SHA2-128s (defence-in-depth)')).toBe(false)
    expect(isOutsidePosture(fipsOnly, 'ML-KEM-768 (FIPS 203, NIST Cat 3)')).toBe(false)
    expect(
      isOutsidePosture(
        { ...baseInputs, standardsPosture: 'nist-alternates-permitted' },
        'Falcon-512 (selected by NIST, standard not final)'
      )
    ).toBe(false)
  })

  it('keeps FIPS signature standards unmarked for a federal profile', () => {
    const rec = recommendMTI({ ...fipsOnly, audience: 'us-federal', complianceDeadline: '2030' })
    expect(rec.sigMTI).toMatch(/ML-DSA-87/)
    for (const alt of [rec.sigMTI, ...rec.sigAlternates]) {
      expect(alt).not.toMatch(/outside the chosen standards posture/)
    }
  })

  it('flags an SSH key exchange built on sntrup761 under a FIPS posture', () => {
    const text = recommendMTI({ ...fipsOnly, protocol: 'SSH' }).watchOuts.join(' ')
    expect(text).toMatch(/sntrup761, which no FIPS covers/)
    expect(text).not.toMatch(/use a hybrid KEX such as sntrup761x25519-sha512 today/)
    // without a FIPS posture the original carriage note stays
    const plain = recommendMTI({
      ...baseInputs,
      standardsPosture: 'ietf-drafts-permitted',
      protocol: 'SSH',
    })
    expect(plain.watchOuts.join(' ')).toMatch(/sntrup761x25519-sha512 today/)
  })

  it('keeps FIPS hash standards in every posture', () => {
    for (const standardsPosture of ['fips-validated-only', 'nist-pqc-only', 'all-of-the-above']) {
      const rec = recommendMTI({ ...baseInputs, standardsPosture })
      expect(rec.hashMTI).toMatch(/FIPS 180-4|FIPS 202/)
    }
  })
})

describe('recommendMTI — hybrid group needs hybrid-capable peers', () => {
  const classicalPeers: MTIInputs = { ...baseInputs, interopProfile: ['non-pqc-peers'] }

  it('explains that the hybrid group works only when both peers support it', () => {
    const rec = recommendMTI(classicalPeers)
    expect(rec.kemMTI).toMatch(/X25519MLKEM768/)
    expect(rec.rationaleKem).toMatch(/both peers support the named group/)
    expect(rec.rationaleKem).toMatch(/classical-only peer cannot negotiate it/)
  })

  it('separates a negotiated classical fallback from running part of the hybrid group', () => {
    const rec = recommendMTI(classicalPeers)
    expect(rec.rationaleKem).toMatch(/separately negotiated classical group/)
    expect(rec.rationaleKem).toMatch(/no post-quantum protection/)
    expect(rec.rationaleKem).toMatch(/handshake fails/)
  })

  it('keeps the compatibility warning as a watch-out, naming the fallback policy to decide', () => {
    const text = recommendMTI(classicalPeers).watchOuts.join(' ')
    expect(text).toMatch(/Classical-only peers cannot negotiate "X25519MLKEM768 \(RFC 10024\)"/)
    expect(text).toMatch(/no post-quantum protection/)
    expect(text).toMatch(/State which classical groups stay allowed/)
  })

  it('does not emit the classical-peer warning when no classical peer is expected', () => {
    const text = recommendMTI({ ...baseInputs, interopProfile: ['hybrid-peers'] }).watchOuts.join(
      ' '
    )
    expect(text).not.toMatch(/Classical-only peers cannot negotiate/)
  })
})

/* renderMTIMarkdown is a pure markdown-string helper, not a React testing-library
 * render. Disable the plugin's render-result-naming convention for this block —
 * `markdown` is the natural variable name and the rule mis-fires on the prefix.
 */
/* eslint-disable testing-library/render-result-naming-convention */
describe('renderMTIMarkdown — export', () => {
  const data = {
    protocolAudience: {
      protocol: 'TLS 1.3',
      audience: 'us-federal',
      interopProfile: ['non-pqc-peers'],
      complianceDeadline: '2030',
    },
    standardsConstraints: {
      standardsPosture: 'nist-pqc-only',
      hardwareConstraints: ['hsm-backed'],
      signatureSizePreference: 'no-preference',
      localPolicyOverride: '',
    },
    plan: {
      summary: '',
      adoptionNotes: '- Codepoint allocation tracked in IANA',
    },
  }

  it('contains the CSWP-39 Section 3.1.1 citation', () => {
    const markdown = renderMTIMarkdown(data)
    expect(markdown).toMatch(/Section 3\.1\.1/)
    expect(markdown).toMatch(/Mandatory-to-Implement Algorithms/)
  })

  it('contains the DOI link to CSWP.39', () => {
    const markdown = renderMTIMarkdown(data)
    expect(markdown).toMatch(/doi\.org\/10\.6028\/NIST\.CSWP\.39/)
  })

  it('contains a verbatim CSWP-39 §3.1.1 quote', () => {
    const markdown = renderMTIMarkdown(data)
    expect(markdown).toMatch(
      /local policy may select an algorithm other than the mandatory-to-implement one/
    )
  })

  it('emits ASCII-only output (no em-dashes, smart quotes, or arrows)', () => {
    const markdown = renderMTIMarkdown(data)
    expect(markdown).not.toMatch(/[—–‘’“”→§]/)
  })

  it('lists per-role MTI rows in the recommendation table', () => {
    const markdown = renderMTIMarkdown(data)
    expect(markdown).toMatch(/\| Signature \|/)
    expect(markdown).toMatch(/\| KEM \/ KEX \|/)
    expect(markdown).toMatch(/\| Hash \|/)
  })

  it('emits a watch-outs block (always includes the local-policy reminder)', () => {
    const markdown = renderMTIMarkdown(data)
    expect(markdown).toMatch(/Watch-outs/)
    expect(markdown).toMatch(/Local policy/)
  })
})
/* eslint-enable testing-library/render-result-naming-convention */
