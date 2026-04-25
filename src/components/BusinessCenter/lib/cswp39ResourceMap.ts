// SPDX-License-Identifier: GPL-3.0-only
import type { CSWP39StepId } from './cswp39Tier'
import type { AuthoritativeSource } from '@/data/authoritativeSourcesData'

export interface ResourceLink {
  label: string
  href: string
  external?: boolean
  hint?: string
}

export interface PlaygroundLink {
  toolId: string
  label: string
  hint?: string
}

export interface StepResources {
  inApp: ResourceLink[]
  external: ResourceLink[]
  playground: PlaygroundLink[]
  authoritativeSourceFilter?: (s: AuthoritativeSource) => boolean
}

export const CSWP39_RESOURCE_MAP: Record<CSWP39StepId, StepResources> = {
  govern: {
    inApp: [
      {
        label: '/assess — compliance frameworks step',
        href: '/assess',
        hint: 'Step 5 captures policy + framework registry',
      },
      { label: '/compliance — framework explorer', href: '/compliance' },
      { label: '/leaders — stakeholder ecosystem', href: '/leaders' },
      { label: '/library — policy & governance docs', href: '/library' },
    ],
    external: [
      {
        label: 'NIST CSWP.39 — Considerations for Achieving Crypto Agility (Dec 2025)',
        href: 'https://nvlpubs.nist.gov/nistpubs/CSWP/NIST.CSWP.39.pdf',
        external: true,
      },
      {
        label: 'NIST IR 8547 — Transition to PQC Standards',
        href: 'https://nvlpubs.nist.gov/nistpubs/ir/2024/NIST.IR.8547.ipd.pdf',
        external: true,
      },
      {
        label: 'ENISA — Post-Quantum Cryptography Integration Study',
        href: 'https://www.enisa.europa.eu/publications/post-quantum-cryptography-integration-study',
        external: true,
      },
    ],
    playground: [
      { toolId: 'pki-workshop', label: 'PKI Workshop', hint: 'Governance over CA practice' },
    ],
    authoritativeSourceFilter: (s) =>
      s.sourceType === 'Government' || s.sourceType === 'Industry Workgroup',
  },

  inventory: {
    inApp: [
      { label: '/migrate — full product catalog', href: '/migrate' },
      {
        label: '/assess — crypto inventory step',
        href: '/assess',
        hint: 'Step 3 — current crypto in use',
      },
      {
        label: '/assess — data sensitivity step',
        href: '/assess',
        hint: 'Step 4 — criticality + sensitivity',
      },
      { label: '/library — CBOM specifications', href: '/library' },
    ],
    external: [
      {
        label: 'CycloneDX — SBOM/CBOM specification',
        href: 'https://cyclonedx.org/',
        external: true,
      },
      { label: 'SPDX — Software Package Data Exchange', href: 'https://spdx.dev/', external: true },
      {
        label: 'NIST SP 800-90B — Entropy Source Validation',
        href: 'https://csrc.nist.gov/pubs/sp/800/90/b/final',
        external: true,
      },
      {
        label: 'NIST FIPS 140-3 — Cryptographic Module Validation',
        href: 'https://csrc.nist.gov/projects/cryptographic-module-validation-program',
        external: true,
      },
    ],
    playground: [
      { toolId: 'entropy-test', label: 'Entropy Test', hint: 'SP 800-90B entropy estimation' },
      { toolId: 'qrng-demo', label: 'QRNG Demo', hint: 'Quantum random number generator' },
      { toolId: 'drbg-demo', label: 'DRBG Demo', hint: 'Deterministic RBG construction' },
      {
        toolId: 'source-combining',
        label: 'Source Combining',
        hint: 'Multi-source entropy aggregation',
      },
      { toolId: 'cert-capacity', label: 'Cert Capacity Calculator' },
      { toolId: 'hsm-capacity', label: 'HSM Capacity Calculator' },
    ],
  },

  'identify-gaps': {
    inApp: [
      {
        label: '/migrate — Cryptographic Discovery Platforms',
        href: '/migrate?cat=Cryptographic%20Discovery%20Platforms',
      },
      { label: '/migrate — SASE & Zero Trust', href: '/migrate?cat=SASE%20%26%20Zero%20Trust' },
      { label: '/threats — quantum threat landscape', href: '/threats' },
      {
        label: '/assess — data classification step',
        href: '/assess',
        hint: 'Step 4 — sensitivity tags',
      },
    ],
    external: [
      {
        label: 'NIST NVD — National Vulnerability Database',
        href: 'https://nvd.nist.gov/',
        external: true,
      },
      {
        label: 'CISA KEV — Known Exploited Vulnerabilities',
        href: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog',
        external: true,
      },
      {
        label: 'CISA — PQC Migration Framework',
        href: 'https://www.cisa.gov/quantum',
        external: true,
      },
      {
        label: 'OPA — Open Policy Agent (policy-as-code)',
        href: 'https://www.openpolicyagent.org/',
        external: true,
      },
    ],
    playground: [
      {
        toolId: 'tls-simulator',
        label: 'TLS 1.3 Simulator',
        hint: 'Inspect cipher-suite negotiation',
      },
      { toolId: 'vpn-sim', label: 'VPN Simulator', hint: 'IPsec/IKEv2 PQC handshake' },
      { toolId: 'pqc-ssh-sim', label: 'PQC SSH Simulator', hint: 'SSH PQC integration' },
    ],
    authoritativeSourceFilter: (s) => s.threatsCsv,
  },

  prioritise: {
    inApp: [
      { label: '/report — risk score + composite scoring', href: '/report' },
      { label: '/report — recommended actions queue', href: '/report' },
      { label: '/report — KPI trending', href: '/report' },
      { label: '/algorithms — algorithm reference', href: '/algorithms' },
    ],
    external: [
      {
        label: 'NIST IR 8547 — PQC Migration Timing',
        href: 'https://nvlpubs.nist.gov/nistpubs/ir/2024/NIST.IR.8547.ipd.pdf',
        external: true,
      },
      {
        label: 'CISA — Quantum-Readiness Migration Roadmap',
        href: 'https://www.cisa.gov/sites/default/files/2023-08/Quantum%20Readiness_Final_CLEAR_508c%20%283%29.pdf',
        external: true,
      },
    ],
    playground: [
      {
        toolId: 'cert-capacity',
        label: 'Cert Capacity Calculator',
        hint: 'Capacity-driven prioritization',
      },
      { toolId: 'hsm-capacity', label: 'HSM Capacity Calculator' },
      { toolId: 'hybrid-sigs', label: 'Hybrid Signature Spectrums' },
    ],
    authoritativeSourceFilter: (s) => s.complianceCsv,
  },

  implement: {
    inApp: [
      { label: '/report — algorithm migration priority', href: '/report' },
      { label: '/report — migration roadmap', href: '/report' },
      { label: '/algorithms — ML-KEM, ML-DSA, SLH-DSA', href: '/algorithms' },
      { label: '/migrate — PQC TLS Gateway products', href: '/migrate?cat=PQC%20TLS%20Gateway' },
      {
        label: '/migrate — Cloud Encryption Gateways',
        href: '/migrate?cat=Cloud%20Encryption%20Gateways',
      },
    ],
    external: [
      {
        label: 'NIST CMVP — Cryptographic Module Validation',
        href: 'https://csrc.nist.gov/projects/cryptographic-module-validation-program/validated-modules/search',
        external: true,
      },
      {
        label: 'NIST ACVP — Automated Crypto Validation Protocol',
        href: 'https://github.com/usnistgov/ACVP',
        external: true,
      },
      {
        label: 'NIST FIPS 203 — ML-KEM',
        href: 'https://csrc.nist.gov/pubs/fips/203/final',
        external: true,
      },
      {
        label: 'NIST FIPS 204 — ML-DSA',
        href: 'https://csrc.nist.gov/pubs/fips/204/final',
        external: true,
      },
      {
        label: 'NIST FIPS 205 — SLH-DSA',
        href: 'https://csrc.nist.gov/pubs/fips/205/final',
        external: true,
      },
    ],
    playground: [
      { toolId: 'hybrid-encrypt', label: 'Hybrid Encrypt', hint: 'Classical + PQC composite' },
      { toolId: 'hybrid-certs', label: 'Hybrid Certificates' },
      { toolId: 'hybrid-sigs', label: 'Hybrid Signature Spectrums' },
      { toolId: 'slh-dsa', label: 'SLH-DSA Demo', hint: 'FIPS 205 stateless hash sigs' },
      { toolId: 'lms-hss', label: 'LMS / HSS', hint: 'Stateful hash sigs (firmware)' },
      { toolId: 'firmware-signing', label: 'Firmware Signing' },
      { toolId: 'kdf-derivation', label: 'KDF Derivation' },
      { toolId: 'openssl-studio', label: 'OpenSSL Studio' },
    ],
    authoritativeSourceFilter: (s) => s.algorithmCsv,
  },
}
