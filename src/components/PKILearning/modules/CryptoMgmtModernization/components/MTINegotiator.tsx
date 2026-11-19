import { decisionModelToCsv } from '@/services/export/decisionModelCsv'
// SPDX-License-Identifier: AGPL-3.0-only
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
import { useSavedArtifactInputs } from '@/hooks/useSavedArtifactInputs'

// ─────────────────────────────────────────────────────────────────────────────
// Recommendation engine (pure function — testable in isolation)
// ─────────────────────────────────────────────────────────────────────────────

const CNSA_FAQ_SOURCE =
  'https://media.defense.gov/2022/Sep/07/2003071836/-1/-1/0/CSI_CNSA_2.0_FAQ_.PDF'

const TLS_GROUPS = ['X25519MLKEM768', 'SecP256r1MLKEM768', 'SecP384r1MLKEM1024', 'X25519'] as const
const TLS_GROUP_OPTIONS = TLS_GROUPS.map((group) => ({ value: group, label: group }))
const TLS_GROUP_SOURCE = 'https://www.rfc-editor.org/rfc/rfc10024.html#section-7'

export interface MTIInputs {
  /** e.g. 'TLS 1.3', 'IKEv2', 'SSH', 'S/MIME', 'JOSE/COSE', 'custom-binary' */
  protocol: string
  /** 'us-nss' | 'us-federal' | 'eu-regulated' | 'global-commercial' | 'embedded-iot' | 'post-crqc-greenfield' */
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
  clientGroups?: string[]
  serverGroups?: string[]
  peerPolicy?: string
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

function isEmbeddedAudience(audience: string, hardware: string[]): boolean {
  return audience === 'embedded-iot' || hardware.includes('low-ram')
}

function recommendSig(inputs: MTIInputs): { mti: string; alternates: string[]; rationale: string } {
  const { audience, signatureSizePreference, interopProfile } = inputs

  // Applicable NSS profile, independent of the learner's planning year.
  if (audience === 'us-nss') {
    return {
      mti: 'ML-DSA-87 (FIPS 204, NIST Cat 5)',
      alternates: [],
      rationale: 'CNSA 2.0 mandates ML-DSA-87 for US National Security Systems.',
    }
  }

  // EU regulated + minimise-sig-size -> ML-DSA-65 + SLH-DSA
  if (audience === 'eu-regulated' && signatureSizePreference === 'minimise-sig-size') {
    return {
      mti: 'ML-DSA-65 (FIPS 204, NIST Cat 3)',
      alternates: ['SLH-DSA-SHA2-128s'],
      rationale:
        'BSI TR-02102-1 recommends ML-DSA-65 and ML-DSA-87 in the "hedged" variant and "a quantum-safe signature scheme only in combination with a classic signature scheme", with one exception: hash-based signatures such as SLH-DSA can in principle also be used alone if implementation security is carefully considered. ANSSI PG-083 v3 states that ML-DSA used without hybridisation does not satisfy RègleSécuAsym at any parameter set, so in France pair it with a classical signature. SLH-DSA is the size-tolerant defence-in-depth alternate.',
    }
  }

  // Embedded/IoT + low-RAM -> stateless hash-based first
  if (isEmbeddedAudience(audience, inputs.hardwareConstraints)) {
    return {
      mti: 'SLH-DSA-SHAKE-128s (FIPS 205, stateless)',
      alternates: ['ML-DSA-44'],
      rationale:
        'Stateless hash-based signatures need no state tracking, so key reuse from mishandled state is not a risk; ML-DSA-44 is a lattice-based alternative.',
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
    alts.unshift(
      'RSA-PSS-3072 + ML-DSA-65 (RFC 10073 X.509 / RFC 10082 CMS composite, transition period)'
    )
  }
  return {
    mti: 'ML-DSA-65 (FIPS 204, NIST Cat 3)',
    alternates: alts,
    rationale:
      'ML-DSA-65 is the broadest-support PQC signature; SLH-DSA-SHA2-128s is the conservative hash-based defence-in-depth alternate.',
  }
}

function recommendKem(inputs: MTIInputs): { mti: string; alternates: string[]; rationale: string } {
  const { protocol, audience, interopProfile, standardsPosture, hardwareConstraints } = inputs

  if (protocol === 'TLS 1.2') {
    return {
      mti: 'Upgrade to TLS 1.3 for the RFC 10024 groups',
      alternates: [],
      rationale: 'TLS 1.2 requires a separately scoped migration plan.',
    }
  }

  if (audience === 'us-nss') {
    return {
      mti: 'ML-KEM-1024 (FIPS 203, NIST Cat 5)',
      alternates: [],
      rationale:
        'The applicable CNSA 2.0 NSS profile specifies ML-KEM-1024. A non-NSS profile must be evaluated separately; changing a planning year does not change this parameter set.',
    }
  }

  // Must interop with non-PQC peers -> hybrid KEM MTI
  if (protocol === 'TLS 1.3' && interopProfile.includes('non-pqc-peers')) {
    return {
      mti: 'X25519MLKEM768 (RFC 10024)',
      alternates: ['ML-KEM-768 (FIPS 203, pure PQC)'],
      rationale:
        'For deployments that must interoperate with non-PQC peers this module recommends the hybrid X25519MLKEM768 (RFC 10024): it combines X25519 with ML-KEM-768 so that the shared secret stays secure if either component is unbroken. That protection applies only to connections where both peers support the named group and the handshake selects it; a classical-only peer cannot negotiate it. For such a peer the connection uses a separately negotiated classical group (for example X25519) if the client offers one and local policy allows it, and then has no post-quantum protection; if policy forbids classical fallback, the handshake fails (RFC 9954 describes a hybrid-aware party falling back to a non-hybrid exchange only if it is willing to downgrade). Pure ML-KEM-768 is an option for deployments that require exclusively post-quantum key exchange and whose peers all support it.',
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
        'This module suggests ML-KEM-768 as the default for pure-PQC greenfield deployments, with ML-KEM-1024 as the step-up; CNSA 2.0 (national security systems) specifies ML-KEM-1024 for all classification levels.',
    }
  }

  // Default — ML-KEM-768 + HQC-128 (lattice + code-based families)
  return {
    mti: 'ML-KEM-768 (FIPS 203, NIST Cat 3)',
    alternates: ['HQC-128 (code-based, NIST alternate)'],
    rationale:
      protocol === 'TLS 1.3'
        ? 'Evaluate ML-KEM-768 in a TLS named group implemented by both endpoints.'
        : 'Evaluate the exact key-establishment profile for the selected protocol. The primitive name alone does not identify its wire format.',
  }
}

function recommendHash(inputs: MTIInputs): {
  mti: string
  alternates: string[]
  rationale: string
} {
  const { audience } = inputs

  if (audience === 'us-nss') {
    return {
      mti: 'SHA-384 (FIPS 180-4)',
      alternates: ['SHA-512 (FIPS 180-4)'],
      rationale:
        'CNSA 2.0 specifies SHA-384 or SHA-512 for US National Security Systems across all classification levels.',
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
    rationale: '',
  }
}

// How the chosen MTI is actually carried differs by protocol — the `protocol`
// input drives this note (it used to be collected but never affect the output).
const PROTOCOL_MTI_NOTES: Record<string, string> = {
  'TLS 1.3':
    'TLS 1.3 (RFC 9846): negotiate the hybrid KEM via the IANA-registered X25519MLKEM768 named group (0x11EC, RFC 10024) in supported_groups; PQC signatures via signature_algorithms once cert chains support them.',
  'TLS 1.2':
    'TLS 1.2 has no standardized PQC key-exchange path - upgrade to TLS 1.3 (RFC 9846) before adding a PQC KEM.',
  IKEv2:
    'IKEv2: carry ML-KEM via RFC 9370 (Multiple Key Exchanges) as an additional key-exchange transform alongside the classical DH group.',
  'IPsec ESP':
    'IPsec ESP protects data with symmetric crypto (AES-256 is quantum-resistant) - the PQC change lives in the IKEv2 key exchange that derives ESP keys, not ESP itself.',
  SSH: 'SSH: use a hybrid KEX such as sntrup761x25519-sha512 today, moving to mlkem768x25519 as it standardises.',
  'S/MIME':
    'S/MIME: signing uses the signature MTI (or RFC 10082 composite ML-DSA during hybrid transition); for encrypted mail carry the KEM via KEMRecipientInfo (RFC 9629).',
  CMS: 'CMS: use KEMRecipientInfo (RFC 9629) for KEM-based content encryption; signatures via the signature MTI (or RFC 10082 composite ML-DSA during hybrid transition).',
  'JOSE/COSE':
    'JOSE/COSE: ML-DSA / SLH-DSA algorithm registrations are still in progress - pin the MTI in your application profile until registered.',
  'custom-binary':
    'Custom protocol: you own negotiation - pin the MTI explicitly, version your cipher list, and integrity-protect negotiation to prevent downgrade.',
  'custom-text':
    'Custom protocol: you own negotiation - pin the MTI explicitly, version your cipher list, and integrity-protect negotiation to prevent downgrade.',
}

// Postures that limit the choice to algorithms standardized in FIPS 203, 204 and 205 (hashes come
// from FIPS 180-4 and 202 in every posture). NIST has selected HQC and Falcon for standardization,
// which is still in progress, so no final FIPS covers them; FrodoKEM, Classic McEliece and
// sntrup761 are not NIST standards. All of them sit outside these postures.
const FIPS_STANDARD_POSTURES = ['fips-validated-only', 'nist-pqc-only']
const OUTSIDE_FIPS_203_204_205 = /HQC|Falcon|FN-DSA|FrodoKEM|McEliece|sntrup/i

export function isOutsidePosture(inputs: MTIInputs, label: string): boolean {
  return (
    FIPS_STANDARD_POSTURES.includes(inputs.standardsPosture) && OUTSIDE_FIPS_203_204_205.test(label)
  )
}

function markForPosture(inputs: MTIInputs, label: string): string {
  return isOutsidePosture(inputs, label)
    ? `${label} [outside the chosen standards posture: no final FIPS covers it]`
    : label
}

function computeWatchOuts(
  inputs: MTIInputs,
  sig: { mti: string; alternates: string[] },
  kem: { mti: string; alternates: string[] }
): string[] {
  const out: string[] = []
  const inFipsPosture = FIPS_STANDARD_POSTURES.includes(inputs.standardsPosture)

  // Protocol-specific carriage note — the `protocol` input shapes HOW the MTI is negotiated.
  if (inputs.protocol === 'SSH' && inFipsPosture) {
    out.push(
      `SSH: sntrup761x25519-sha512 uses sntrup761, which no FIPS covers, so it is outside the "${postureLabel(inputs.standardsPosture)}" posture. Use an ML-KEM-based hybrid key exchange (mlkem768x25519) once your SSH implementation offers it, and check whether the certificate of the module that performs it covers the combination.`
    )
  } else {
    const protocolNote = PROTOCOL_MTI_NOTES[inputs.protocol]
    if (protocolNote) out.push(protocolNote)
  }

  if (inputs.audience === 'us-nss') {
    out.push(
      `Applicable profile: NSA CNSA 2.0 (FAQ v2.2) for the explicitly selected National Security System. Source: ${CNSA_FAQ_SOURCE}. Scope transition milestones to the system and use case; the completion-year input is a planning assumption.`
    )
  }
  if (inputs.audience === 'us-federal') {
    out.push(
      'US federal civilian scope: EO 14412 and OMB M-26-15 (plus the directed FAR contractor rule) set PQC transition deadlines for agency High Value Assets and high-impact systems (key establishment by 31 December 2030, digital signatures by 31 December 2031); NIST IR 8547 (final, October 2026) sets the NIST deprecation/disallowance schedule. Confirm which systems are in scope.'
    )
  }
  if (inputs.audience === 'us-nss' && inputs.interopProfile.includes('non-pqc-peers')) {
    out.push(
      'Requirement conflict: a classical-only peer cannot meet the selected CNSA 2.0 PQC key-establishment profile. Keep the NSS requirement visible; use compatible peers or revise the separately authorized system/profile scope. Do not substitute a smaller KEM because of the planning year or a fallback preference.'
    )
  }

  // Interop: a hybrid or pure-PQC group only works when both peers support it.
  if (inputs.protocol === 'TLS 1.3' && inputs.interopProfile.includes('non-pqc-peers')) {
    out.push(
      `Classical-only peers cannot negotiate "${kem.mti}": the group is used only when both peers support it. For those peers the connection uses a separately negotiated classical key exchange if your policy allows one, and then has no post-quantum protection; if policy forbids classical fallback, the handshake fails. State which classical groups stay allowed, which peers may fall back, and how fallbacks are logged.`
    )
  }

  // HSM availability
  if (inputs.hardwareConstraints.includes('hsm-backed')) {
    out.push(
      'HSM-backed required: major HSM vendors ship FIPS 203 / 204 (and SLH-DSA on some platforms), but verify exact firmware version, PKCS#11 v3.2 mechanism IDs, and Active FIPS 140-3 CMVP module certificate algorithm scope rather than relying on ACVP/CAVP-only listings or marketing sheets.'
    )
  }
  if (inputs.hardwareConstraints.includes('tpm-backed')) {
    out.push(
      'TPM-backed required: TCG published Trusted Platform Module 2.0 v185 (March 2026) with ML-KEM and ML-DSA support, but silicon and firmware adoption is still rolling out — confirm target-platform hardware and firmware availability before committing.'
    )
  }

  // Standards-posture mismatch: check the MTI and every alternate, signature and KEM alike.
  if (inFipsPosture) {
    const flagged = [sig.mti, ...sig.alternates, kem.mti, ...kem.alternates].filter((label) =>
      isOutsidePosture(inputs, label)
    )
    if (flagged.length > 0) {
      out.push(
        `Marked as outside the "${postureLabel(inputs.standardsPosture)}" posture: ${flagged.join('; ')}. NIST has selected HQC and Falcon for standardization, but that process is still in progress, so no final FIPS covers them, and the other flagged algorithms are not NIST standards. Keep them only if local policy changes the posture.`
      )
    }
  }
  if (inputs.standardsPosture === 'fips-validated-only') {
    out.push(
      'FIPS-validated-only: FIPS 203, 204 and 205 standardize algorithms; they are not module certificates. "Validated" means the cryptographic module that performs the operation holds an Active CMVP certificate that lists the algorithm and parameter set you chose, for the version and operating environment you deploy (FIPS 140-3 only — FIPS 140-2 modules moved to the CMVP Historical List in September 2026 and are not valid for new procurement). Algorithm validation (ACVP/CAVP) is a prerequisite for a module certificate, not a substitute. Read the certificate and Security Policy of the exact module, including how it covers any hybrid combination.'
    )
    if (/X25519MLKEM768/.test(kem.mti)) {
      out.push(
        'RFC 10024 says the ML-KEM implementation must be the certified part of X25519MLKEM768, and names SecP256r1MLKEM768 for use cases that need both shared secrets from FIPS-approved mechanisms (SecP384r1MLKEM1024 for high-security environments that need them with a larger margin).'
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

export function compareSampleTlsGroups(inputs: MTIInputs) {
  if (inputs.protocol !== 'TLS 1.3') return null
  const clientGroups = new Set(inputs.clientGroups)
  const serverGroups = new Set(inputs.serverGroups)
  const sharedGroups = TLS_GROUPS.filter(
    (group) => clientGroups.has(group) && serverGroups.has(group)
  )
  const permitsClassical = inputs.peerPolicy === 'hybrid-or-classical'
  const allowedGroups = sharedGroups.filter((group) => group !== 'X25519' || permitsClassical)
  const decision =
    clientGroups.size === 0 || serverGroups.size === 0
      ? 'Record at least one supported group for each sample peer.'
      : allowedGroups.length > 0
        ? 'The sample peers share at least one group allowed by the worksheet policy.'
        : 'No mutually supported group meets the worksheet policy.'
  return {
    sharedGroups,
    allowedGroups,
    decision,
    scope:
      'This compares configured TLS 1.3 key exchange groups. Test a handshake and check certificate authentication separately.',
  }
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
    sigMTI: markForPosture(inputs, sig.mti),
    sigAlternates: sig.alternates.map((a) => markForPosture(inputs, a)),
    kemMTI: markForPosture(inputs, kem.mti),
    kemAlternates: kem.alternates.map((a) => markForPosture(inputs, a)),
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

/**
 * National-guidance positions cited by the recommendations above, read from the
 * primary documents on 2026-08-12 (both are in this app's library).
 *
 * This tool previously said only "ANSSI/BSI guidance accepts ML-DSA at Cat 3",
 * with no document, section or URL behind it. Reading the sources showed the
 * claim was half right in the half that matters:
 *
 *  - BSI TR-02102-1, Table 5.3 and section 5.3.4: ML-DSA is a recommended
 *    signature algorithm, and the recommended parameter sets are ML-DSA-65 and
 *    ML-DSA-87 — "NIST Security Strength Categories 3 and 5" — in the "hedged"
 *    variant, and only together with a classical signature scheme; hash-based
 *    signatures (SLH-DSA, XMSS, LMS) can in principle also be used alone if
 *    implementation security is carefully considered. So the BSI half was
 *    correct on the parameter sets, not on standalone use.
 *  - ANSSI PG-083 v3 (2026): "Utilise sans hybridation et quel que soit le jeu
 *    de parametres utilise, le mecanisme de signature numerique ML-DSA ne
 *    respecte pas la regle RegleSecuAsym." ML-DSA alone fails ANSSI's rule at
 *    ANY parameter set; hybridisation with a classical mechanism is required.
 *    The old wording dropped the single most distinctive thing about the French
 *    position, in a tool whose whole job is choosing a mandatory-to-implement
 *    algorithm.
 *  - ANSSI PQC position paper: prefer NIST level 5, "ou le niveau 3" — Category
 *    3 is acceptable, Category 5 preferred.
 */
export const NATIONAL_GUIDANCE_SOURCES = {
  bsi: 'BSI TR-02102-1, Table 5.3 and section 5.3.4 (ML-DSA-65 / ML-DSA-87, hedged; only together with a classical signature, hash-based schemes excepted)',
  anssiRule:
    'ANSSI PG-083 v3 (2026), RegleSecuAsym & ReglePQSecuAsym — a product aiming at post-quantum security must satisfy both rules to ensure no security regression',
  anssiLevel: 'ANSSI PQC position paper — prefer NIST level 5, level 3 acceptable',
} as const

export const CSWP39_311_QUOTE =
  'To ensure that interoperation is possible for all implementations, an SDO will often choose at least one set of algorithms with properly selected security strengths based on state-of-the-art cryptanalysis results as mandatory-to-implement (i.e., to be supported by all implementations). Of course, local policy may select an algorithm other than the mandatory-to-implement one.'

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
          { value: 'us-federal', label: 'US federal, non-NSS (scope separately)' },
          { value: 'us-nss', label: 'US National Security System (CNSA 2.0 applies)' },
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
        id: 'clientGroups',
        label: 'Sample TLS 1.3 client groups',
        type: 'checklist',
        options: TLS_GROUP_OPTIONS.map((group) => ({
          ...group,
          label: `Client supports ${group.label}`,
        })),
        defaultValue: [],
      },
      {
        id: 'serverGroups',
        label: 'Sample TLS 1.3 server groups',
        type: 'checklist',
        options: TLS_GROUP_OPTIONS.map((group) => ({
          ...group,
          label: `Server supports ${group.label}`,
        })),
        defaultValue: [],
      },
      {
        id: 'peerPolicy',
        label: 'Sample TLS 1.3 policy',
        type: 'select',
        options: [
          { value: 'hybrid-only', label: 'Require a hybrid group' },
          { value: 'hybrid-or-classical', label: 'Allow classical key exchange' },
        ],
        defaultValue: 'hybrid-only',
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
      return 'US federal, non-NSS (scope separately)'
    case 'us-nss':
      return 'US National Security System (CNSA 2.0 applies)'
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

function mtiInputs(data: Record<string, Record<string, string | string[]>>) {
  const pa = data.protocolAudience ?? {}
  const sc = data.standardsConstraints ?? {}

  const inputs: MTIInputs = {
    protocol: (pa.protocol as string) || 'TLS 1.3',
    audience: (pa.audience as string) || 'global-commercial',
    interopProfile: Array.isArray(pa.interopProfile) ? (pa.interopProfile as string[]) : [],
    clientGroups: Array.isArray(pa.clientGroups) ? pa.clientGroups : [],
    serverGroups: Array.isArray(pa.serverGroups) ? pa.serverGroups : [],
    peerPolicy: typeof pa.peerPolicy === 'string' ? pa.peerPolicy : 'hybrid-only',
    complianceDeadline: (pa.complianceDeadline as string) || '2030',
    standardsPosture: (sc.standardsPosture as string) || 'nist-pqc-only',
    hardwareConstraints: Array.isArray(sc.hardwareConstraints)
      ? (sc.hardwareConstraints as string[])
      : [],
    signatureSizePreference: (sc.signatureSizePreference as string) || 'no-preference',
    localPolicyOverride: (sc.localPolicyOverride as string) || '',
  }

  return inputs
}

export function renderMTIMarkdown(data: Record<string, Record<string, string | string[]>>): string {
  const plan = data.plan ?? {}
  const inputs = mtiInputs(data)

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
  md += `*https://doi.org/10.6028/NIST.CSWP.39-upd1*\n\n`

  md += `## 1. Protocol & Audience\n\n`
  md += `- Protocol: ${inputs.protocol}\n`
  md += `- Audience: ${audienceLabel(inputs.audience)}\n`
  md += `- Interop profile: ${interopList}\n`
  md += `- Compliance deadline: ${inputs.complianceDeadline}\n\n`

  if (inputs.audience === 'us-nss') md += `- Applicable NSS profile source: ${CNSA_FAQ_SOURCE}\n\n`

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

  const peers = compareSampleTlsGroups(inputs)
  if (peers) {
    md += '### Sample TLS 1.3 peer compatibility\n\n'
    md += `- Client groups: ${inputs.clientGroups?.join(', ') || 'None recorded'}\n`
    md += `- Server groups: ${inputs.serverGroups?.join(', ') || 'None recorded'}\n`
    md += `- Policy allows: ${inputs.peerPolicy === 'hybrid-or-classical' ? 'hybrid or classical' : 'hybrid groups only'}\n`
    md += `- Common groups: ${peers.sharedGroups.join(', ') || 'None'}\n`
    md += `- Common groups allowed by policy: ${peers.allowedGroups.join(', ') || 'None'}\n`
    md += `- ${peers.decision} ${peers.scope}\n`
    md += `- Hybrid group definitions: ${TLS_GROUP_SOURCE}\n\n`
  }

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
  md += `*Generated by PQC Today Hub. Standards citations: NIST CSWP 39 Section 3.1.1, FIPS 203 / 204 / 205. https://doi.org/10.6028/NIST.CSWP.39-upd1*\n`

  return sanitiseAscii(md)
}

export function renderMTICsv(data: Record<string, Record<string, string | string[]>>) {
  const inputs = mtiInputs(data)
  return decisionModelToCsv({
    inputs,
    result: { ...recommendMTI(inputs), ...(compareSampleTlsGroups(inputs) ?? {}) },
    notes: data.plan ?? {},
    sources: [
      'NIST CSWP 39: https://doi.org/10.6028/NIST.CSWP.39-upd1',
      ...(inputs.protocol === 'TLS 1.3' ? [TLS_GROUP_SOURCE] : []),
      ...(inputs.audience === 'us-nss' ? [CNSA_FAQ_SOURCE] : []),
    ],
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

// Auto-run fictional NSS planning scenario: explicitly applicable CNSA profile, FIPS-validated
// posture and learner-selected 2030 completion target. Overrides the generic defaults only during a run
// (isAutoRunFillActive, via ArtifactBuilder); normal manual use is unchanged.
const MTI_DEMO_FILL: Record<string, Record<string, string | string[]>> = {
  protocolAudience: { audience: 'us-nss', complianceDeadline: '2030' },
  standardsConstraints: { standardsPosture: 'fips-validated-only' },
}

export const MTINegotiator: React.FC = () => {
  const addExecutiveDocument = useModuleStore((s) => s.addExecutiveDocument)

  // Read half of WS6's autosave: ArtifactBuilder now writes a draft on every
  // edit, so without this the draft is written and never read back. The type
  // is unique to this tool, so no `scope` is needed.
  const savedFormData =
    useSavedArtifactInputs<Record<string, Record<string, string | string[]>>>('mti-negotiator')

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
        // Persist the raw form so the draft is restorable on remount.
        inputs: data,
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
              A published MTI gives conforming implementations a common capability. Check the
              profiles and policy both peers actually enable.
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
        demoFill={MTI_DEMO_FILL}
        initialData={savedFormData}
        onExport={handleExport}
        exportFilename="mti-recommendation"
        renderPreview={renderMTIMarkdown}
        renderCsv={renderMTICsv}
        exportFormats={['markdown', 'csv', 'pdf']}
      />
    </div>
  )
}
