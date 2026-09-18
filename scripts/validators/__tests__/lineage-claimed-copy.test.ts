// SPDX-License-Identifier: GPL-3.0-only
// @vitest-environment node
import { describe, it, expect } from 'vitest'
import {
  CLAIMED_COPY_SOURCES,
  candidatePaths,
  claimVerdict,
  recordsFor,
  type ManifestRecord,
} from '../lineage-claimed-copy.js'

const admitted = (o: Partial<ManifestRecord>): ManifestRecord => ({
  artefact: 'SOURCE',
  identity: 'MATCH',
  unified: 'current',
  ...o,
})
const vr = CLAIMED_COPY_SOURCES.find((s) => s.source === 'vendor-roadmaps')!
const lib = CLAIMED_COPY_SOURCES.find((s) => s.source === 'library')!

describe('LN-3 claimVerdict', () => {
  it('L3 replay: a row claims a capture the door never recorded → no-record', () => {
    const records = [
      admitted({
        vendorId: 'VND-057',
        url: 'https://blog.cloudflare.com/post-quantum-roadmap/',
        file: 'vendor-roadmaps/VND-057_Cloudflare_Inc.html',
      }),
    ]
    const v = claimVerdict(
      records,
      vr,
      'VND-057',
      'vendor-roadmaps/VND-057_Cloudflare_Inc_blog_cloudflare_com_post_quantum_dnssec_.html'
    )
    // Same vendor key, but the claimed file matches no record: the narrowing
    // falls back to the key's records, none of which is the claimed capture…
    // …so the verdict must not be 'ok' on the strength of a DIFFERENT file.
    expect(v.state).not.toBe('ok')
  })

  it('a row whose record is admitted is ok', () => {
    const v = claimVerdict(
      [admitted({ refId: 'FIPS-203', file: 'library/FIPS-203.pdf' })],
      lib,
      'FIPS-203',
      'library/FIPS-203.pdf'
    )
    expect(v.state).toBe('ok')
  })

  it('an UNCONFIRMED record is admitted (the door admits by design); a CONTRADICTED one is not', () => {
    expect(
      claimVerdict([admitted({ refId: 'A', identity: 'UNCONFIRMED' })], lib, 'A', 'library/a.pdf')
        .state
    ).toBe('ok')
    expect(
      claimVerdict([admitted({ refId: 'B', identity: 'CONTRADICTED' })], lib, 'B', 'library/b.pdf')
        .state
    ).toBe('identity CONTRADICTED')
  })

  it('a record the door retired (ok:false) does not count', () => {
    expect(
      claimVerdict([admitted({ refId: 'A', ok: false })], lib, 'A', 'library/a.pdf').state
    ).toBe('no-record')
  })

  it('a record never stamped by the door reads as "not admitted", distinct from missing', () => {
    const v = claimVerdict([{ refId: 'A', status: 'downloaded' }], lib, 'A', 'library/a.pdf')
    expect(v.state).toMatch(/^not admitted/)
    expect(v.record).not.toBeNull()
  })

  it('with several records per key, the one matching the claimed url/file decides', () => {
    const records = [
      admitted({
        vendorId: 'V',
        url: 'https://x/old',
        file: 'vendor-roadmaps/V_old.html',
        artefact: 'PAYWALL',
      }),
      admitted({ vendorId: 'V', url: 'https://x/new', file: 'vendor-roadmaps/V_new.html' }),
    ]
    expect(claimVerdict(records, vr, 'V', 'vendor-roadmaps/V_new.html').state).toBe('ok')
    expect(claimVerdict(records, vr, 'V', 'https://x/old').state).toBe('artefact PAYWALL')
    expect(recordsFor(records, 'vendorId', 'V', 'vendor-roadmaps/V_new.html', true)).toHaveLength(1)
  })
})

describe('LN-3 recordsFor / candidatePaths', () => {
  it('without disambiguation every record for the key is returned', () => {
    const records = [admitted({ refId: 'A', file: 'x' }), admitted({ refId: 'A', file: 'y' })]
    expect(recordsFor(records, 'refId', 'A', 'x', false)).toHaveLength(2)
  })

  it('candidate paths try the record file, the claim, and basenames under every root', () => {
    const paths = candidatePaths(vr, 'vendor-roadmaps/VND-057_x.html', {
      file: 'vendor-roadmaps/VND-057_x.html',
    })
    expect(paths).toContain('../pqctoday-priv/local-evidence-cache/vendor-roadmaps/VND-057_x.html')
    expect(paths).toContain('../pqctoday-priv/local-evidence-cache/vendor/VND-057_x.html')
    expect(paths.some((p) => p.startsWith('public/'))).toBe(true)
  })

  it('a url claim is never treated as a path', () => {
    const paths = candidatePaths(vr, 'https://blog.cloudflare.com/post', {
      file: 'vendor-roadmaps/a.html',
    })
    expect(paths.every((p) => !p.includes('https:'))).toBe(true)
  })
})

describe('CLAIMED_COPY_SOURCES mirrors the priv profiles', () => {
  it('every source names the profile it mirrors and a manifest key', () => {
    for (const s of CLAIMED_COPY_SOURCES) {
      expect(s.profile).toMatch(/\.yaml$/)
      expect(s.manifest.keyField).toBeTruthy()
      expect(s.fileRoots.length).toBeGreaterThan(0)
    }
  })
})
