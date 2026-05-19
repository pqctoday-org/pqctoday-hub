// SPDX-License-Identifier: GPL-3.0-only
/**
 * Mandatory-to-Implement (MTI) Negotiator (M6 / CSWP.39 §3.1.1)
 *
 * Protocol-designer and architect-facing tool that recommends MTI algorithms
 * (signature, KEM/KEX, hash) for a target protocol + audience + constraint
 * profile. Emits an editable recommendation markdown document grounded in NIST
 * CSWP 39 §3.1.1 (Mandatory-to-Implement Algorithms) and §3.1 (Algorithm
 * Identification).
 *
 * Local policy may select an algorithm other than the MTI (CSWP-39 §3.1.1).
 */
import React, { useCallback, useMemo } from 'react'
import { Scale, ShieldCheck, ArrowRight } from 'lucide-react'
import { ArtifactBuilder } from '@/components/PKILearning/common/executive'
import type { ArtifactSection } from '@/components/PKILearning/common/executive'
import { useModuleStore } from '@/store/useModuleStore'

// ─────────────────────────────────────────────────────────────────────────────
// Recommendation engine (pure function — testable in isolation)
// ─────────────────────────────────────────────────────────────────────────────

export interface MTIInputs {
  /** e.g. 'TLS 1.3', 'IKEv2', 'SSH', 'S/MIME', 'JOSE/COSE', 'custom-binary' */
  protocol: string
  /** 'us-federal' | 'eu-regulated' | 'global-commercial' | 'embedded-iot' | 'post-crqc-greenfield' */
  audience: string
  /** Bitmask-style flags: must-interop-with-non-pqc, must-interop-hybrid-only, must-interop-pure-pqc, vendor-controlled-only */
  interopProfile: string[]
  /** numeric year as a string, or 'none' */
  complianceDeadline: string
  /** 'fips-validated-only' | 'nist-pqc-only' | 'ietf-drafts-permitted' | 'nist-alternates-permitted' | 'all-of-the-above' */
  standardsPosture: string
  /** Multi-select: hsm-backed, tpm-backed, smartcard, low-ram, low-bandwidth, none */
  hardwareConstraints: string[]
  /** 'minimise-sig-size' | 'minimise-verifier-state' | 'no-preference' */
  signatureSizePreference: string
  /** Optional free-text local-policy note. */
  localPolicyOverride: string
}

export interface MTIRecommendation {
  sigMTI: string
  sigAlternates: string[]
  kemMTI: string
  kemAlternates: string[]
  hashMTI: string
  hashAlternates: string[]
  rationaleSig: string
  rationaleKem: string
  rationaleHash: string
  watchOuts: string[]
}

function isImmediateDeadline(deadline: string): boolean {
  if (deadline === 'none') return false
  const y = parseInt(deadline, 10)
  return Number.isFinite(y) && y <= 2030
}

function isEmbeddedAudience(audience: string, hardware: string[]): boolean {
  return audience === 'embedded-iot' || hardware.includes('low-ram')
}

function recommendSig(inputs: MTIInputs): { mti: string; alternates: string[]; rationale: string } {
  const { audience, signatureSizePreference, interopProfile, complianceDeadline } = inputs

  // US federal + ≤ 2030 deadline -> ML-DSA-65 (CNSA 2.0)
  if (audience === 'us-federal' && isImmediateDeadline(complianceDeadline)) {
    const alts = ['SLH-DSA-SHA2-128s (defence-in-depth)']
    if (interopProfile.includes('non-pqc-peers')) {
      alts.unshift('RSA-PSS-3072 + ML-DSA-65 (LAMPS composite, transition period)')
    }
    return {
      mti: 'ML-DSA-65 (FIPS 204, NIST Cat 3)',
      alternates: alts,
      rationale:
        'CNSA 2.0 names ML-DSA-65 as the primary signature for US federal use; SLH-DSA-SHA2-128s is the conservative hash-based alternate.',
    }
  }

  // EU regulated + minimise-sig-size -> ML-DSA-65 + SLH-DSA
  if (audience === 'eu-regulated' && signatureSizePreference === 'minimise-sig-size') {
    return {
      mti: 'ML-DSA-65 (FIPS 204, NIST Cat 3)',
      alternates: ['SLH-DSA-SHA2-128s'],
      rationale:
        'ANSSI/BSI guidance accepts ML-DSA at Cat 3; SLH-DSA is the size-tolerant defence-in-depth alternate.',
    }
  }

  // Embedded/IoT + low-RAM -> stateless hash-based first
  if (isEmbeddedAudience(audience, inputs.hardwareConstraints)) {
    return {
      mti: 'SLH-DSA-SHAKE-128s (FIPS 205, stateless)',
      alternates: ['ML-DSA-44'],
      rationale:
        'Stateless hash-based signatures avoid PRG-state management on constrained devices; ML-DSA-44 (Cat 2) is the lattice fallback.',
    }
  }

  // Post-CRQC greenfield + minimise-sig-size -> ML-DSA-44 Cat 2
  if (audience === 'post-crqc-greenfield' && signatureSizePreference === 'minimise-sig-size') {
    return {
      mti: 'ML-DSA-44 (FIPS 204, NIST Cat 2)',
      alternates: ['ML-DSA-65 (Cat 3 step-up)'],
      rationale:
        'Greenfield + size-sensitive deployments can pick Cat 2; promote to Cat 3 (ML-DSA-65) when threat model demands.',
    }
  }

  // Default — ML-DSA-65 + SLH-DSA defence-in-depth
  const alts = ['SLH-DSA-SHA2-128s (defence-in-depth)']
  if (interopProfile.includes('non-pqc-peers')) {
    alts.unshift('RSA-PSS-3072 + ML-DSA-65 (LAMPS composite, transition period)')
  }
  return {
    mti: 'ML-DSA-65 (FIPS 204, NIST Cat 3)',
    alternates: alts,
    rationale:
      'ML-DSA-65 is the broadest-support PQC signature; SLH-DSA-SHA2-128s is the conservative hash-based defence-in-depth alternate.',
  }
}

function recommendKem(inputs: MTIInputs): { mti: string; alternates: string[]; rationale: string } {
  const { audience, complianceDeadline, interopProfile, standardsPosture, hardwareConstraints } =
    inputs

  // Must interop with non-PQC peers -> hybrid KEM MTI
  if (interopProfile.includes('non-pqc-peers')) {
    return {
      mti: 'X25519MLKEM768 (IETF draft-ietf-tls-hybrid-design)',
      alternates: ['ML-KEM-768 (FIPS 203, pure-PQC fallback)'],
      rationale:
        'Hybrid KEM keeps the X25519 half for legacy interop while ML-KEM-768 provides the PQC half; pure ML-KEM-768 is the post-transition alternate.',
    }
  }

  // US federal + ≤ 2030 deadline -> ML-KEM-768
  if (audience === 'us-federal' && isImmediateDeadline(complianceDeadline)) {
    return {
      mti: 'ML-KEM-768 (FIPS 203, NIST Cat 3)',
      alternates: ['ML-KEM-1024 (Cat 5 step-up)'],
      rationale:
        'CNSA 2.0 names ML-KEM-768 as the primary KEM for US federal use; ML-KEM-1024 covers Cat 5 trust boundaries.',
    }
  }

  // NIST alternates permitted + embedded -> HQC-128 MTI for code-based diversity
  if (
    (standardsPosture === 'nist-alternates-permitted' || standardsPosture === 'all-of-the-above') &&
    (audience === 'embedded-iot' || hardwareConstraints.includes('low-ram'))
  ) {
    return {
      mti: 'HQC-128 (NIST alternate, code-based)',
      alternates: ['ML-KEM-768 (FIPS 203)'],
      rationale:
        'Code-based HQC-128 gives lattice-independent diversity on constrained chips; ML-KEM-768 is the lattice fallback.',
    }
  }

  // Post-CRQC greenfield -> ML-KEM-768 with ML-KEM-1024 alt
  if (audience === 'post-crqc-greenfield') {
    return {
      mti: 'ML-KEM-768 (FIPS 203, NIST Cat 3)',
      alternates: ['ML-KEM-1024 (Cat 5 step-up)'],
      rationale:
        'Pure-PQC greenfield deployments pick ML-KEM-768 as MTI; ML-KEM-1024 is the Cat 5 alternate.',
    }
  }

  // Default — ML-KEM-768 + HQC-128 (lattice + code-based families)
  return {
    mti: 'ML-KEM-768 (FIPS 203, NIST Cat 3)',
    alternates: ['HQC-128 (code-based, NIST alternate)'],
    rationale:
      'ML-KEM-768 is the broadest-support PQC KEM; HQC-128 is the code-based hedge against a lattice break.',
  }
}

function recommendHash(inputs: MTIInputs): {
  mti: string
  alternates: string[]
  rationale: string
} {
  const { audience } = inputs

  if (audience === 'us-federal') {
    return {
      mti: 'SHA-256 (FIPS 180-4)',
      alternates: ['SHA-512 (FIPS 180-4)'],
      rationale:
        'CNSA 2.0 names SHA-256 as the primary hash; SHA-512 is the higher-strength alternate.',
    }
  }
  if (audience === 'eu-regulated') {
    return {
      mti: 'SHA-256 (FIPS 180-4)',
      alternates: ['SHA3-256 (FIPS 202)'],
      rationale:
        'EU regulated profiles accept SHA-256; SHA3-256 is the sponge-construction alternate.',
    }
  }
  if (isEmbeddedAudience(audience, inputs.hardwareConstraints)) {
    return {
      mti: 'SHAKE-128 (FIPS 202, XOF)',
      alternates: ['SHA-256 (FIPS 180-4)'],
      rationale:
        'SHAKE-128 is the extendable-output function used by SLH-DSA-SHAKE and ML-KEM internals; SHA-256 is the universal fallback.',
    }
  }
  return {
    mti: 'SHA-256 (FIPS 180-4)',
    alternates: ['SHA-512 (FIPS 180-4)'],
    rationale: 'SHA-256 has the broadest interop; SHA-512 is the higher-strength alternate.',
  }
}

function computeWatchOuts(
  inputs: MTIInputs,
  sig: { mti: string; alternates: string[] },
  kem: { mti: string }
): string[] {
  const out: string[] = []

  // Interop break risk
  if (inputs.interopProfile.includes('pure-pqc-peers') && /X25519MLKEM768|MLKEM768/.test(kem.mti)) {
    // pure-pqc peers and hybrid MTI: ok
  }
  if (inputs.interopProfile.includes('non-pqc-peers') && !/X25519MLKEM768/.test(kem.mti)) {
    out.push(
      `MTI KEM "${kem.mti}" will not interop with non-PQC peers - confirm peer matrix or pick a hybrid KEM.`
    )
  }

  // HSM availability
  if (inputs.hardwareConstraints.includes('hsm-backed')) {
    out.push(
      'HSM-backed required: FIPS 203 / 204 are still rolling out across HSM vendors (2025-2027). ML-KEM-768 + ML-DSA-65 are the safest HSM bets today; SLH-DSA support is thinner.'
    )
  }
  if (inputs.hardwareConstraints.includes('tpm-backed')) {
    out.push(
      'TPM-backed required: TCG PQC profiles are draft as of 2025; expect a 2026-2028 firmware refresh window.'
    )
  }

  // Standards-posture mismatch
  if (inputs.standardsPosture === 'fips-validated-only') {
    const alternatesLooseHQC = sig.alternates.join(' ').match(/HQC|Falcon|FrodoKEM/)
    if (alternatesLooseHQC) {
      out.push(
        'Standards posture is FIPS-validated-only, but an alternate uses a NIST alternate / IETF draft - downgrade or revisit posture.'
      )
    }
  }

  // Low-bandwidth + ML-DSA-65
  if (inputs.hardwareConstraints.includes('low-bandwidth') && /ML-DSA-65/.test(sig.mti)) {
    out.push(
      'Low-bandwidth radio link + ML-DSA-65 (3309-byte signature) may exceed your link budget - measure handshake size before committing.'
    )
  }

  // Local-policy override reminder (always emitted)
  out.push(
    'Local policy can limit the allowable combinations and may select an algorithm other than the MTI (CSWP-39 Section 3.1.1).'
  )

  return out
}

/**
 * Recommend MTI algorithms from protocol + audience + constraint inputs.
 * Pure function — no React, no state, no I/O. Unit-tested directly.
 */
export function recommendMTI(inputs: MTIInputs): MTIRecommendation {
  const sig = recommendSig(inputs)
  const kem = recommendKem(inputs)
  const hash = recommendHash(inputs)
  const watchOuts = computeWatchOuts(inputs, sig, kem)

  return {
    sigMTI: sig.mti,
    sigAlternates: sig.alternates,
    kemMTI: kem.mti,
    kemAlternates: kem.alternates,
    hashMTI: hash.mti,
    hashAlternates: hash.alternates,
    rationaleSig: sig.rationale,
    rationaleKem: kem.rationale,
    rationaleHash: hash.rationale,
    watchOuts,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CSWP-39 §3.1.1 verbatim quote (sanitised to ASCII)
// ─────────────────────────────────────────────────────────────────────────────

const CSWP39_311_QUOTE =
  'To ensure that interoperation is possible for all implementations, an SDO will often choose at least one set of algorithms with properly selected security strengths based on state-of-the-art cryptanalysis results as mandatory-to-implement. Of course, local policy may select an algorithm other than the mandatory-to-implement one.'

// ─────────────────────────────────────────────────────────────────────────────
// Wizard section definitions
// ─────────────────────────────────────────────────────────────────────────────

const SECTIONS: ArtifactSection[] = [
  {
    id: 'protocolAudience',
    title: 'Step 1 - Protocol & audience',
    description: 'Which protocol and audience is this MTI recommendation for?',
    fields: [
      {
        id: 'protocol',
        label: 'Protocol',
        type: 'select',
        options: [
          { value: 'TLS 1.3', label: 'TLS 1.3' },
          { value: 'TLS 1.2', label: 'TLS 1.2' },
          { value: 'IKEv2', label: 'IKEv2' },
          { value: 'IPsec ESP', label: 'IPsec ESP' },
          { value: 'SSH', label: 'SSH' },
          { value: 'S/MIME', label: 'S/MIME' },
          { value: 'CMS', label: 'CMS' },
          { value: 'JOSE/COSE', label: 'JOSE / COSE' },
          { value: 'custom-binary', label: 'Custom binary protocol' },
          { value: 'custom-text', label: 'Custom text protocol' },
        ],
        defaultValue: 'TLS 1.3',
      },
      {
        id: 'audience',
        label: 'Audience',
        type: 'select',
        options: [
          { value: 'us-federal', label: 'US federal (CNSA 2.0-aligned)' },
          { value: 'eu-regulated', label: 'EU regulated (ANSSI / BSI / ENISA)' },
          { value: 'global-commercial', label: 'Global commercial' },
          { value: 'embedded-iot', label: 'Embedded / IoT (constrained)' },
          { value: 'post-crqc-greenfield', label: 'Post-CRQC greenfield' },
        ],
        defaultValue: 'global-commercial',
      },
      {
        id: 'interopProfile',
        label: 'Interoperability profile',
        type: 'checklist',
        options: [
          { value: 'non-pqc-peers', label: 'Must interop with non-PQC peers' },
          { value: 'hybrid-peers', label: 'Must interop with hybrid-only peers' },
          { value: 'pure-pqc-peers', label: 'Must interop with pure-PQC peers' },
          { value: 'vendor-controlled', label: 'Vendor-controlled-only (no third-party peers)' },
        ],
        defaultValue: ['non-pqc-peers'],
      },
      {
        id: 'complianceDeadline',
        label: 'Compliance deadline',
        type: 'select',
        options: [
          { value: '2025', label: '2025' },
          { value: '2027', label: '2027' },
          { value: '2030', label: '2030' },
          { value: '2033', label: '2033' },
          { value: '2035', label: '2035' },
          { value: 'none', label: 'No fixed deadline' },
        ],
        defaultValue: '2030',
      },
    ],
  },
  {
    id: 'standardsConstraints',
    title: 'Step 2 - Standards tracking & constraints',
    description: 'What standards posture and hardware limits constrain your MTI pick?',
    fields: [
      {
        id: 'standardsPosture',
        label: 'Standards posture',
        type: 'select',
        options: [
          { value: 'fips-validated-only', label: 'FIPS-validated only' },
          { value: 'nist-pqc-only', label: 'NIST PQC only (FIPS 203 / 204 / 205)' },
          { value: 'ietf-drafts-permitted', label: 'IETF drafts permitted' },
          {
            value: 'nist-alternates-permitted',
            label: 'NIST alternates permitted (FrodoKEM / HQC / Falcon)',
          },
          { value: 'all-of-the-above', label: 'All of the above' },
        ],
        defaultValue: 'nist-pqc-only',
      },
      {
        id: 'hardwareConstraints',
        label: 'Hardware constraints',
        type: 'checklist',
        options: [
          { value: 'hsm-backed', label: 'HSM-backed required' },
          { value: 'tpm-backed', label: 'TPM-backed required' },
          { value: 'smartcard', label: 'Smartcard footprint' },
          { value: 'low-ram', label: 'Low-RAM (< 64 KB)' },
          { value: 'low-bandwidth', label: 'Low-bandwidth (sub-GHz radio)' },
          { value: 'none', label: 'None' },
        ],
        defaultValue: ['none'],
      },
      {
        id: 'signatureSizePreference',
        label: 'Signature size preference',
        type: 'select',
        options: [
          { value: 'minimise-sig-size', label: 'Minimise signature size (favours ML-DSA)' },
          {
            value: 'minimise-verifier-state',
            label: 'Minimise verifier state (favours stateless hash-based)',
          },
          { value: 'no-preference', label: 'No preference' },
        ],
        defaultValue: 'no-preference',
      },
      {
        id: 'localPolicyOverride',
        label: 'Local-policy override (optional)',
        type: 'textarea',
        placeholder:
          'e.g., Our compliance policy mandates SLH-DSA for all code-signing certificates regardless of MTI; pin ML-DSA-65 alongside as the agile-swap candidate. Local policy can override the MTI per CSWP-39 Section 3.1.1.',
      },
    ],
  },
  {
    id: 'plan',
    title: 'Step 3 - Plan narrative (editable)',
    description:
      'Edit the narrative, watch-outs, and adoption notes that will appear in the exported recommendation.',
    fields: [
      {
        id: 'summary',
        label: 'Recommendation narrative',
        type: 'textarea',
        placeholder:
          'e.g., For our TLS 1.3 server fleet we will adopt ML-KEM-768 as the KEM MTI and ML-DSA-65 as the signature MTI; SLH-DSA-SHA2-128s stays on the shelf as a defence-in-depth alternate.',
      },
      {
        id: 'adoptionNotes',
        label: 'Adoption notes',
        type: 'textarea',
        defaultValue: [
          '- Cipher-suite negotiation must be integrity-protected to prevent downgrade attacks',
          '- MTI changes require an SDO cycle - plan a 12-18 month overlap with the prior MTI',
          '- Surface alternates in the negotiation menu, not just the MTI - keep the agility window open',
          '- Document the algorithm identifier IANA codepoint(s) used for each MTI / alternate',
        ].join('\n'),
      },
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Markdown preview
// ─────────────────────────────────────────────────────────────────────────────

function audienceLabel(v: string): string {
  switch (v) {
    case 'us-federal':
      return 'US federal (CNSA 2.0-aligned)'
    case 'eu-regulated':
      return 'EU regulated (ANSSI / BSI / ENISA)'
    case 'global-commercial':
      return 'Global commercial'
    case 'embedded-iot':
      return 'Embedded / IoT (constrained)'
    case 'post-crqc-greenfield':
      return 'Post-CRQC greenfield'
    default:
      return v || 'Unspecified'
  }
}

function postureLabel(v: string): string {
  switch (v) {
    case 'fips-validated-only':
      return 'FIPS-validated only'
    case 'nist-pqc-only':
      return 'NIST PQC only (FIPS 203 / 204 / 205)'
    case 'ietf-drafts-permitted':
      return 'IETF drafts permitted'
    case 'nist-alternates-permitted':
      return 'NIST alternates permitted'
    case 'all-of-the-above':
      return 'All of the above'
    default:
      return v || 'Unspecified'
  }
}

function sigPrefLabel(v: string): string {
  switch (v) {
    case 'minimise-sig-size':
      return 'Minimise signature size'
    case 'minimise-verifier-state':
      return 'Minimise verifier state (stateless)'
    case 'no-preference':
      return 'No preference'
    default:
      return v || 'Unspecified'
  }
}

const INTEROP_LABELS: Record<string, string> = {
  'non-pqc-peers': 'Must interop with non-PQC peers',
  'hybrid-peers': 'Must interop with hybrid-only peers',
  'pure-pqc-peers': 'Must interop with pure-PQC peers',
  'vendor-controlled': 'Vendor-controlled-only (no third-party peers)',
}

const HARDWARE_LABELS: Record<string, string> = {
  'hsm-backed': 'HSM-backed required',
  'tpm-backed': 'TPM-backed required',
  smartcard: 'Smartcard footprint',
  'low-ram': 'Low-RAM (< 64 KB)',
  'low-bandwidth': 'Low-bandwidth (sub-GHz radio)',
  none: 'None',
}

function sanitiseAscii(md: string): string {
  return md
    .replace(/—/g, '-')
    .replace(/–/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/→/g, '->')
    .replace(/§/g, 'Section ')
}

export function renderMTIMarkdown(data: Record<string, Record<string, string | string[]>>): string {
  const pa = data.protocolAudience ?? {}
  const sc = data.standardsConstraints ?? {}
  const plan = data.plan ?? {}

  const inputs: MTIInputs = {
    protocol: (pa.protocol as string) || 'TLS 1.3',
    audience: (pa.audience as string) || 'global-commercial',
    interopProfile: Array.isArray(pa.interopProfile) ? (pa.interopProfile as string[]) : [],
    complianceDeadline: (pa.complianceDeadline as string) || '2030',
    standardsPosture: (sc.standardsPosture as string) || 'nist-pqc-only',
    hardwareConstraints: Array.isArray(sc.hardwareConstraints)
      ? (sc.hardwareConstraints as string[])
      : [],
    signatureSizePreference: (sc.signatureSizePreference as string) || 'no-preference',
    localPolicyOverride: (sc.localPolicyOverride as string) || '',
  }

  const rec = recommendMTI(inputs)

  const interopList =
    inputs.interopProfile.length === 0
      ? 'None specified'
      : inputs.interopProfile.map((k) => INTEROP_LABELS[k] ?? k).join('; ')

  const hardwareList =
    inputs.hardwareConstraints.length === 0
      ? 'None specified'
      : inputs.hardwareConstraints.map((k) => HARDWARE_LABELS[k] ?? k).join('; ')

  let md = `# Mandatory-to-Implement Algorithm Recommendation - ${inputs.protocol}\n\n`
  md += `*Aligned to NIST CSWP 39 Section 3.1.1 (Mandatory-to-Implement Algorithms) and Section 3.1 (Algorithm Identification).*\n`
  md += `*https://doi.org/10.6028/NIST.CSWP.39*\n\n`

  md += `## 1. Protocol & Audience\n\n`
  md += `- Protocol: ${inputs.protocol}\n`
  md += `- Audience: ${audienceLabel(inputs.audience)}\n`
  md += `- Interop profile: ${interopList}\n`
  md += `- Compliance deadline: ${inputs.complianceDeadline}\n\n`

  md += `## 2. Standards & Constraints\n\n`
  md += `- Standards posture: ${postureLabel(inputs.standardsPosture)}\n`
  md += `- Hardware constraints: ${hardwareList}\n`
  md += `- Signature size preference: ${sigPrefLabel(inputs.signatureSizePreference)}\n\n`

  md += `## 3. Recommended MTI Algorithms\n\n`
  md += `| Role | MTI | Alternate(s) | Rationale |\n`
  md += `|---|---|---|---|\n`
  md += `| Signature | ${rec.sigMTI} | ${rec.sigAlternates.join('; ') || '-'} | ${rec.rationaleSig} |\n`
  md += `| KEM / KEX | ${rec.kemMTI} | ${rec.kemAlternates.join('; ') || '-'} | ${rec.rationaleKem} |\n`
  md += `| Hash | ${rec.hashMTI} | ${rec.hashAlternates.join('; ') || '-'} | ${rec.rationaleHash} |\n\n`

  md += `## 4. Watch-outs\n\n`
  for (const w of rec.watchOuts) md += `- ${w}\n`
  md += `\n`

  md += `## 5. Local-Policy Override\n\n`
  if (inputs.localPolicyOverride.trim().length > 0) {
    md += `${inputs.localPolicyOverride.trim()}\n\n`
  } else {
    md += `(No local-policy override recorded.)\n\n`
  }
  md += `> "${CSWP39_311_QUOTE}"\n`
  md += `> -- NIST CSWP 39 Section 3.1.1\n\n`

  md += `## 6. Narrative & Adoption Notes\n\n`
  const userSummary = (plan.summary as string) || ''
  if (userSummary) md += `${userSummary}\n\n`
  md += `### Adoption notes\n\n`
  md += `${(plan.adoptionNotes as string) || '- (none specified)'}\n\n`

  md += `---\n\n`
  md += `*Generated by PQC Today Hub. Standards citations: NIST CSWP 39 Section 3.1.1, FIPS 203 / 204 / 205. https://doi.org/10.6028/NIST.CSWP.39*\n`

  return sanitiseAscii(md)
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export const MTINegotiator: React.FC = () => {
  const addExecutiveDocument = useModuleStore((s) => s.addExecutiveDocument)

  const sections = useMemo(() => SECTIONS, [])

  const handleExport = useCallback(
    (data: Record<string, Record<string, string | string[]>>) => {
      const protocol = (data.protocolAudience?.protocol as string) || 'TLS 1.3'
      const markdown = renderMTIMarkdown(data)
      addExecutiveDocument({
        id: `mti-negotiator-${Date.now()}`,
        moduleId: 'crypto-mgmt-modernization',
        type: 'mti-negotiator',
        title: `MTI Recommendation - ${protocol}`,
        data: markdown,
        createdAt: Date.now(),
      })
    },
    [addExecutiveDocument]
  )

  return (
    <div className="space-y-6">
      <div className="glass-panel p-4 border-l-4 border-status-info flex items-start gap-3">
        <Scale size={20} className="text-status-info mt-0.5 shrink-0" />
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Mandatory-to-Implement (MTI) Negotiator
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Protocol-designer + architect decision tool from NIST CSWP 39 Section 3.1.1 -
            Mandatory-to-Implement Algorithms. Picks a balanced MTI per cryptographic role
            (signature / KEM / hash) and emits an editable recommendation document.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        <div className="glass-panel p-3 flex items-start gap-2">
          <Scale size={16} className="text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-foreground">MTI = interop floor</p>
            <p className="text-muted-foreground">
              Every implementation must support the MTI - it is the basic-interop guarantee.
            </p>
          </div>
        </div>
        <div className="glass-panel p-3 flex items-start gap-2">
          <ArrowRight size={16} className="text-status-info shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-foreground">Alternates negotiate up</p>
            <p className="text-muted-foreground">
              Stronger / more efficient alternates can be selected when both peers support them.
            </p>
          </div>
        </div>
        <div className="glass-panel p-3 flex items-start gap-2">
          <ShieldCheck size={16} className="text-status-success shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-foreground">Local policy may override</p>
            <p className="text-muted-foreground">
              CSWP-39 Section 3.1.1 confirms local policy may select an algorithm other than the
              MTI.
            </p>
          </div>
        </div>
      </div>

      <ArtifactBuilder
        title="Mandatory-to-Implement Algorithm Recommendation"
        description="Fill in the protocol / audience / constraint sections; the engine returns a per-role MTI plus alternates."
        sections={sections}
        onExport={handleExport}
        exportFilename="mti-recommendation"
        renderPreview={renderMTIMarkdown}
        exportFormats={['markdown', 'pdf']}
      />
    </div>
  )
}
