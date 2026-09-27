// SPDX-License-Identifier: GPL-3.0-only
/**
 * Compound certificate names (plan §3.5, closed 2026-09-27).
 *
 * A certificate often names several products at once — "Microsoft Windows 11
 * …, Microsoft Azure Stack HCI …" — and single-token overlap cannot tell the
 * product it names from a neighbour that shares one word ("azure"). Classical
 * links already need two signals (ruling 7a) and the Windows 11 → Azure pairs
 * are pinned out. This covers the PQC links: every PQC link on a certificate
 * whose name lists several products was reviewed by hand (19, all correct:
 * the same vendor and the same product line). A new one fails here until
 * someone reads it and adds it to the list.
 */
import { describe, expect, it } from 'vitest'
import { certificationXrefs } from './certificationXrefData'

const COMPOUND = /,|\band\b|;| & /

const REVIEWED = new Set([
  'Cryptographic-library-NesLib-6-11-6-on-S cc-cryptographic-library-neslib-6-11-6-on-st33k1m5a-and-st33k1m5m-b04-version---6-11-6---b04--eucc-3090-2026-17--b3958173',
  'Cryptographic-library-NesLib-6-11-6-on-S-2 cc-cryptographic-library-neslib-6-11-6-on-st33k1m5c-and-st33k1m5t-c03-version---6-11-6---c03--eucc-3090-2026-16--0be153ac',
  'Infineon-IFX-CCI-00007Ah-8Fh-Crypto-Suit cc-ifx-cci-00007ah-8fh-a11--r11--m11-with-optional-crypto-suite-4873ba58',
  'apple-pq3-corecrypto A7637',
  'apple-pq3-corecrypto A7645',
  'apple-pq3-corecrypto A7649',
  'ios-26-macos-26 A7637',
  'ios-26-macos-26 A7645',
  'ios-26-macos-26 A7649',
  'neslib-cryptographic-library-incl-neslib-pqml cc-cryptographic-library-neslib-pqml-2-1-on-st33k1m5a-and-st33k1m5m-b04---b01--eucc-3090-2026-67--d48727ec',
  'neslib-cryptographic-library-incl-neslib-pqml cc-cryptographic-library-neslib-pqml-2-1-on-st33k1m5c-and-st33k1m5t-c03---a01--eucc-3090-2026-66--1d4a9254',
  'qualcomm-snapdragon-spu cc-qualcomm-secure-processor-unit-spu300--version--9-0--in-sm8850-soc--qualcomm--snapdragon--8-gen-5--with-symmetric-and-asymmetric-crypto-support-06398b46',
  'securosys-primus-hsm cc-primus-hsm-fw-3-1-0-series-e--series-e2--series-x--series-x2-18035ab4',
  'st33ktpm2x-stsafe-tpm cc-st33ktpm2xspi---st33ktpm2x-tpm-firmware-9-528--eucc-3090-2026-64--6c2e08dd',
  'stsafe-v100-tpm anssi-cc-2024-38',
  'stsafe-v100-tpm cc-stsafe-v100-tpm---st33ktpm2i--tpm-firmware-10-512---anssi-cc-2024-38--d47bfb78',
  'thales-multiapp-5-2-premium-pqc anssi-cc-2026-03',
  'thales-multiapp-5-2-premium-pqc cc-quantum-ias-v1-0-0-a-and-moc-server-v3-1-1-on-multiapp-v5-2-premium-pqcversions-1-0-0-a--q-ias--et-3-1-1--moc-server---anssi-cc-2026-03--c07da71b',
  'wisecure-crystal-library-ml-kem-and-ml-dsa A7326',
])

describe('PQC links on multi-product certificate names', () => {
  const live = certificationXrefs
    .filter((c) => !c.classicalOnly && c.status !== 'deprecated' && COMPOUND.test(c.certProduct))
    .filter((c) => c.pqcAlgorithms && c.pqcAlgorithms !== 'No PQC Mechanisms Detected')
    .map((c) => `${c.productId} ${c.certId}`)

  it('every one has been reviewed', () => {
    expect(live.filter((k) => !REVIEWED.has(k))).toEqual([])
  })

  it('the list still describes live links (positive control)', () => {
    expect(live.length).toBeGreaterThan(0)
  })
})
