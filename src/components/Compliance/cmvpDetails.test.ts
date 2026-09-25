// SPDX-License-Identifier: GPL-3.0-only
import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect } from 'vitest'
import {
  CMVP_DETAIL_FIELDS,
  hasCmvpDetails,
  normalizeCmvpDetails,
  readCmvpDetails,
} from './cmvpDetails'
import type { ComplianceRecord } from './types'

/**
 * KAT for the CMVP certificate-page fields (WS-4b, 2026-09-24).
 *
 * The expected-value blocks are the exact values the private parser
 * (pqctoday-priv scripts/enrich-cmvp-certificate-details.py) extracts from
 * real CMVP certificate pages saved 2026-09-24; its own KAT
 * (test_enrich_cmvp_certificate_details.py) pins them from the HTML. Here they
 * pin the Hub side: the loader must carry every value through unchanged.
 *
 *   #5300  Active FIPS 140-3 L3; approved PQC = LMS only (negative: not
 *          Falcon / ML-DSA / ML-KEM); no Tested Configuration(s) field
 *   #5502  Active FIPS 140-3 L3; NO approved PQC (negative)
 *   #3963  a FIPS 140-2 certificate; OE stated N/A; legacy algorithm table
 *
 * cmvpApprovedAlgorithms is abbreviated to its first entry, every PQC entry
 * and its last entry — enough to pin shape, order and the PQC verdict.
 */
const KAT: Record<string, Partial<ComplianceRecord>> = {
  '5300': {
    sunsetDate: '2031-06-02',
    overallLevel: 3,
    caveat:
      'When operated in approved mode. The module generates SSPs (e.g., keys) whose strengths are modified by available entropy. No assurance of minimum security of SSPs (e.g., keys, bit strings) that are externally loaded, or of SSPs established with externally loaded SSPs.',
    embodiment: 'MultiChipEmbed',
    moduleType: 'Hardware',
    operationalEnvironments: null,
    cmvpStandard: 'FIPS 140-3',
    cmvpStatus: 'Active',
    cmvpHistoricalReason: null,
    cmvpApprovedAlgorithms: [
      { name: 'AES-CBC', cavpRefs: ['A5021', 'A5022'] },
      { name: 'LMS KeyGen', cavpRefs: ['A5021', 'A5022'] },
      { name: 'LMS SigGen', cavpRefs: ['A5021', 'A5022'] },
      { name: 'LMS SigVer', cavpRefs: ['A5021', 'A5022'] },
      { name: 'TDES-CBC', cavpRefs: ['A5021', 'A5022'] },
    ],
    cmvpDetailsFetchedAt: '2026-09-25T02:37:40+00:00',
  },
  '5502': {
    sunsetDate: '2031-08-24',
    overallLevel: 3,
    embodiment: 'MultiChipEmbed',
    moduleType: 'Hardware',
    operationalEnvironments: null,
    cmvpStandard: 'FIPS 140-3',
    cmvpStatus: 'Active',
    cmvpHistoricalReason: null,
    cmvpApprovedAlgorithms: [
      { name: 'AES-CBC', cavpRefs: ['A1948', 'A7544'] },
      { name: 'TLS v1.2 KDF RFC7627', cavpRefs: ['A1948', 'A7544'] },
    ],
    cmvpDetailsFetchedAt: '2026-09-25T02:41:34+00:00',
  },
  '3963': {
    sunsetDate: null,
    overallLevel: 3,
    caveat: 'None',
    embodiment: 'Multi-Chip Embedded',
    moduleType: 'Hardware',
    operationalEnvironments: [],
    cmvpStandard: 'FIPS 140-2',
    cmvpStatus: 'Historical',
    cmvpHistoricalReason: 'Moved to historical list due to sunsetting',
    cmvpApprovedAlgorithms: [
      { name: 'AES', cavpRefs: ['2958', 'C893'] },
      { name: 'CKG', cavpRefs: [] },
    ],
    cmvpDetailsFetchedAt: '2026-09-25T02:37:40+00:00',
  },
}

const PQC = /\b(ML-KEM|ML-DSA|SLH-DSA|FN-DSA|LMS|HSS|XMSS)\b/

const base: ComplianceRecord = {
  id: '5300',
  source: 'NIST',
  date: '2026-06-03',
  link: 'https://csrc.nist.gov/projects/cryptographic-module-validation-program/certificate/5300',
  type: 'FIPS 140-3',
  status: 'Active',
  pqcCoverage: false,
  productName: 'Luna M7 Cryptographic Module',
  productCategory: 'Cryptographic Module',
  vendor: 'Thales Trusted Cyber Technologies',
}

describe('CMVP certificate-page fields — loader KAT', () => {
  for (const [num, fields] of Object.entries(KAT)) {
    it(`certificate #${num}: every parsed value survives the loader exactly`, () => {
      const rec = { ...base, id: num, ...fields }
      const out = normalizeCmvpDetails(rec)
      for (const f of CMVP_DETAIL_FIELDS) {
        // eslint-disable-next-line security/detect-object-injection -- f comes from CMVP_DETAIL_FIELDS
        expect(out[f], `#${num}.${f}`).toEqual(fields[f] ?? null)
      }
      expect(out.cmvpDetailsFetchedAt).toBe(fields.cmvpDetailsFetchedAt)
    })
  }

  it('#5300 negative: approved PQC is LMS only', () => {
    const d = readCmvpDetails({ ...base, ...KAT['5300'] })
    const pqc = (d?.cmvpApprovedAlgorithms ?? []).filter((a) => PQC.test(a.name)).map((a) => a.name)
    expect(pqc).toEqual(['LMS KeyGen', 'LMS SigGen', 'LMS SigVer'])
  })

  it('#5502 negative: no approved PQC', () => {
    const d = readCmvpDetails({ ...base, id: '5502', ...KAT['5502'] })
    expect(d?.cmvpApprovedAlgorithms).not.toBeNull()
    expect((d?.cmvpApprovedAlgorithms ?? []).filter((a) => PQC.test(a.name))).toEqual([])
  })

  it('a record without the fields is returned unchanged (backward compatible)', () => {
    expect(hasCmvpDetails(base)).toBe(false)
    expect(normalizeCmvpDetails(base)).toBe(base)
    expect(readCmvpDetails(base)).toBeNull()
  })

  it('malformed values read as null, never as a guess', () => {
    const d = readCmvpDetails({
      ...base,
      sunsetDate: '6/2/2031',
      overallLevel: 5,
      caveat: '   ',
      embodiment: 42 as unknown as string,
      operationalEnvironments: ['ok', ''],
      cmvpApprovedAlgorithms: [{ name: 'AES', cavpRefs: 'A1' as unknown as string[] }],
      cmvpDetailsFetchedAt: 'yesterday',
    })
    expect(d).toEqual({
      sunsetDate: null,
      overallLevel: null,
      caveat: null,
      embodiment: null,
      moduleType: null,
      operationalEnvironments: null,
      cmvpStandard: null,
      cmvpStatus: null,
      cmvpHistoricalReason: null,
      cmvpApprovedAlgorithms: null,
      fetchedAt: null,
    })
  })

  it('fields without a fetch stamp are still normalized; the stamp is not invented', () => {
    const out = normalizeCmvpDetails({ ...base, sunsetDate: '2031-06-02' })
    expect(out.sunsetDate).toBe('2031-06-02')
    expect(out.overallLevel).toBeNull()
    expect('cmvpDetailsFetchedAt' in out).toBe(false)
  })
})

describe('CMVP certificate-page fields — committed compliance-data.json', () => {
  const file = path.join(process.cwd(), 'public', 'data', 'compliance-data.json')
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- fixed repo path
  const records = JSON.parse(fs.readFileSync(file, 'utf-8')) as ComplianceRecord[]
  const carrying = records.filter(hasCmvpDetails)

  it('every record carrying the fields holds well-formed values (the loader changes nothing)', () => {
    for (const r of carrying) {
      const d = readCmvpDetails(r)
      for (const f of CMVP_DETAIL_FIELDS) {
        // eslint-disable-next-line security/detect-object-injection -- f comes from CMVP_DETAIL_FIELDS
        if (r[f] !== undefined) expect(d?.[f], `${r.id}.${f}`).toEqual(r[f])
      }
    }
  })

  it('only FIPS (CMVP) records carry the fields', () => {
    const stray = carrying.filter((r) => !String(r.type).startsWith('FIPS 140-'))
    expect(stray.map((r) => r.id)).toEqual([])
  })
})
