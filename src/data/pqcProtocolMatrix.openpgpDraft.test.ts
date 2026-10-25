// SPDX-License-Identifier: AGPL-3.0-only
/**
 * "Persistent Symmetric Keys in OpenPGP" is an Internet-Draft (draft-ietf-openpgp-persistent-symmetric-keys),
 * not RFC 9581. RFC 9581 is "CBOR Tags for Time, Duration, and Period". The OpenPGP row must list the draft
 * under drafts, with the draft's own page, and must not list it among the released RFCs.
 */
import { describe, it, expect } from 'vitest'
import { PROTOCOL_MATRIX } from './pqcProtocolMatrix'

describe('Protocol Matrix, OpenPGP row: the persistent symmetric keys draft', () => {
  const openpgp = PROTOCOL_MATRIX.find((p) => p.id === 'openpgp')!

  it('is not listed among the latest released RFCs', () => {
    expect(openpgp.latestRelease.map((r) => r.id)).not.toContain('RFC-9581')
    expect(openpgp.latestRelease.map((r) => r.url).join(' ')).not.toContain('rfc9581')
  })

  it('is listed under drafts, labelled as an Internet-Draft, with the draft page as its link', () => {
    const d = openpgp.latestDraft.find((x) =>
      x.id.startsWith('draft-ietf-openpgp-persistent-symmetric-keys')
    )!
    expect(d.title).toContain('Internet-Draft, not an RFC')
    expect(d.url).toBe(
      'https://datatracker.ietf.org/doc/draft-ietf-openpgp-persistent-symmetric-keys/'
    )
  })
})
