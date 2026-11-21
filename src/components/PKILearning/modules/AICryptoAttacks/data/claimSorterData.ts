// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Twelve AI-and-cryptography claims for Workshop Step 4 (Claim & Rubric Sorter).
 * Every item resolves directly to a SOURCE_CLAIMS entry so learners inspect
 * the exact maturity, target scope, and Capability Rubric after answering.
 */
import { getBinanceIncidentStage } from '@/data/canonicalBinanceIncident'
import type { ClaimMaturity, SourceClaimId } from './sourceClaims'

const binanceStageC = getBinanceIncidentStage('internal-ai-tool-pivot')

export interface ClaimSortItem {
  readonly id: string
  readonly statement: string
  readonly expectedMaturity: ClaimMaturity
  readonly expectedTargetScope: 'full' | 'reduced'
  readonly claimId: SourceClaimId
  readonly rationale: string
}

export const CLAIM_SORTER_ITEMS: readonly ClaimSortItem[] = [
  {
    id: 'sort-hawk',
    statement:
      'Key recovery on the NIST Round-3 candidate HAWK was reduced to SVP in dimension n/2 + 1 (HAWK-256 recovered end-to-end in hours), leading its authors to withdraw HAWK on 29 Jul 2026.',
    expectedMaturity: 'demonstrated',
    expectedTargetScope: 'full',
    claimId: 'AI-6.0a',
    rationale:
      'End-to-end HAWK-256 recovery and the SVP dimension reduction are mathematically demonstrated and independently checked (Daniel Apon, pqc-forum), though HAWK was an unstandardised candidate with zero production deployment.',
  },
  {
    id: 'sort-aes-7r',
    statement:
      'An AI-discovered Möbius Bridge meet-in-the-middle attack achieves a 200–800× speedup on 7 of 10 rounds of AES-128 using 2^105 chosen plaintexts.',
    expectedMaturity: 'reported',
    expectedTargetScope: 'reduced',
    claimId: 'AI-6.0b',
    rationale:
      'Target scope is strictly reduced (7 of 10 rounds, 2^105 chosen plaintexts) and validated internally by Anthropic researchers rather than independently reproduced; full 10-round AES-128 is unbroken.',
  },
  {
    id: 'sort-wolfssl-cve',
    statement:
      'wolfSSL CVE-2026-5194 (>= 3.12.0, < 5.9.1) skips digest-size/OID checks in ECDSA/ECC verification when EdDSA or ML-DSA is also enabled.',
    expectedMaturity: 'demonstrated',
    expectedTargetScope: 'full',
    claimId: 'AI-3.1a',
    rationale:
      'The vulnerability and wolfSSL 5.9.1 patch in a full production library are demonstrated (while Mythos Preview’s detection attribution is vendor-reported by Anthropic and CISA SSVC lists Exploitation: none).',
  },
  {
    id: 'sort-openssl-cve',
    statement:
      'OpenSSL CVE-2026-45445 silently discards the IV on the one-shot EVP_Cipher() AES-OCB path; Anthropic footnote 1 links its discovery to Claude.',
    expectedMaturity: 'reported',
    expectedTargetScope: 'full',
    claimId: 'AI-3.1b',
    rationale:
      'While the CVE in production OpenSSL is patched, the AI attribution rests on Anthropic’s footnote 1 reporting (the CVE JSON itself credits Alex Gaynor without naming an AI model).',
  },
  {
    id: 'sort-gohr-speck',
    statement:
      'Deep residual neural distinguishers with Bayesian key search reduce the remaining security of 11-round Speck32/64 to roughly 38 bits.',
    expectedMaturity: 'demonstrated',
    expectedTargetScope: 'reduced',
    claimId: 'AI-6.1',
    rationale:
      'Demonstrated in Gohr (CRYPTO 2019, ePrint 2019/037 abstract) specifically on round-reduced Speck32/64 (9 and 11 rounds), not on full-round AES or PQC.',
  },
  {
    id: 'sort-salsa-lwe',
    statement:
      'Transformer-based LWE attacks (SALSA, PICANTE, VERDE, FRESCA, and ePrint 2024/1229) recover secrets in plain LWE or Kyber κ = 2 when secrets are sparse binary/ternary or Hamming weight 9–11.',
    expectedMaturity: 'demonstrated',
    expectedTargetScope: 'reduced',
    claimId: 'AI-6.6',
    rationale:
      'Demonstrated within weak/sparse-secret reduced parameters with heavy classical BKZ preprocessing; PICANTE and VERDE explicitly state they do not attack NIST-standardised dense Module-LWE.',
  },
  {
    id: 'sort-kyber-dl-sca',
    statement:
      'Profiled MLP power analysis broke 1st-, 2nd-, and 3rd-order bitsliced masked Kyber-768 (-O3) on STM32F415RGT6 using 5 profiling devices and 3 × k chosen ciphertexts targeting B2A.',
    expectedMaturity: 'demonstrated',
    expectedTargetScope: 'full',
    claimId: 'AI-4.2',
    rationale:
      'Demonstrated in lab on full Kyber-768 decapsulation code on Cortex-M4 evaluation hardware, conditioned on physical power capture and 5 identical profiling devices.',
  },
  {
    id: 'sort-kms-ai',
    statement:
      'AI agents autonomously discover novel PKCS #11 / KMIP API sequences to export non-extractable keys from modern FIPS 140-3 Level 3 HSMs.',
    expectedMaturity: 'hypothesised',
    expectedTargetScope: 'full',
    claimId: 'AI-5.4',
    rationale:
      'Hypothesised only as of 2026-11-21: no primary source demonstrates AI automating PKCS #11 / KMIP key export (Tookan in AI-5.1 used classical formal model checking, not AI).',
  },
  {
    id: 'sort-quietvault',
    statement:
      'In Cloud Threat Horizons H1 2026, QUIETVAULT malware prompted an on-endpoint LLM to attempt filesystem enumeration for *.env/*.conf/*.log files before stealing a GitHub PAT.',
    expectedMaturity: 'reported',
    expectedTargetScope: 'full',
    claimId: 'AI-2.5',
    rationale:
      'Reported by Google Cloud / Mandiant IR in production incident telemetry; note the distinction between headline LOTL framing and pp. 25–26 detail where malware stole the token.',
  },
  {
    id: 'sort-binance-pivot',
    statement: `Binance (${binanceStageC.dateDisplay}): ${binanceStageC.summary}`,
    expectedMaturity: 'reported',
    expectedTargetScope: 'full',
    claimId: 'AI-2.4c',
    rationale:
      'Reported in Binance’s initial findings report (causal role: tool-mediated; no AI model shown autonomously performing the attack).',
  },
  {
    id: 'sort-perry-study',
    statement:
      'Developers with access to code-davinci-002 wrote significantly less secure symmetric encryption code (p = 0.017) and fewer secure ECDSA signing solutions (3% vs 21%, p = 0.039) in a controlled study.',
    expectedMaturity: 'demonstrated',
    expectedTargetScope: 'reduced',
    claimId: 'AI-2.6b',
    rationale:
      'Demonstrated in Perry et al. (CCS ’23) on synthetic lab tasks using a 2022–23 model prior to FIPS 203–205 standardisation.',
  },
  {
    id: 'sort-fips-negative',
    statement:
      'Through 2026-11-21, no AI-based mathematical attack recovers keys, forges signatures, or decrypts ciphertexts at the standardised parameter sets of FIPS 203, FIPS 204, FIPS 205, or full-round AES.',
    expectedMaturity: 'demonstrated',
    expectedTargetScope: 'full',
    claimId: 'AI-6.4',
    rationale:
      'Bounded negative finding verified across IACR ePrint, arXiv, NIST pqc-forum, CRYPTO, CCS, NeurIPS, and IEEE S&P through 2026-11-21 under search protocol AI-6.7.',
  },
] as const
