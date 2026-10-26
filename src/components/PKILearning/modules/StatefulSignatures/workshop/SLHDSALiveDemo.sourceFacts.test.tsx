// SPDX-License-Identifier: AGPL-3.0-only
/**
 * What the SLH-DSA live demo prints must match FIPS 205 (August 2024):
 *  - the Hash card of each of the 12 parameter sets (Section 11, 11.1, 11.2.1, 11.2.2);
 *  - the pre-hash note (Section 10.2 and 10.2.2, Algorithm 23);
 *  - the explainer on why SLH-DSA keeps no counter (Section 3 and Section 8);
 *  - the CNSA 2.0 cell (NSA CNSA 2.0 FAQ v2.2, p. 11).
 *
 * The expected hash functions below are built from the standard's own rules, not from
 * the page's table: Section 11 says which of 11.1 / 11.2.1 / 11.2.2 applies to a set,
 * and each of those sections names the function behind H_msg, PRF, PRF_msg, F, H and T_l.
 * The test reads the label the page prints and checks every function it names.
 */
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, it, expect, vi } from 'vitest'
import '@testing-library/jest-dom'
import { SLHDSALiveDemo } from './SLHDSALiveDemo'

vi.mock('@/hooks/useHSM', () => ({
  useHSM: () => ({
    isReady: true,
    initialize: vi.fn(),
    moduleRef: { current: {} },
    hSessionRef: { current: 1 },
    keys: [],
    log: [],
    registerKey: vi.fn(),
    clearLog: vi.fn(),
  }),
}))
vi.mock('@/components/shared/LiveHSMToggle', () => ({ LiveHSMToggle: () => null }))
vi.mock('@/components/shared/Pkcs11LogPanel', () => ({ Pkcs11LogPanel: () => null }))
vi.mock('@/components/shared/KatValidationPanel', () => ({ KatValidationPanel: () => null }))

type Fn = 'H_msg' | 'PRF' | 'PRF_msg' | 'F' | 'H' | 'T_l'
const FUNCTIONS: Fn[] = ['H_msg', 'PRF', 'PRF_msg', 'F', 'H', 'T_l']

// FIPS 205 Section 11.1, all six SHAKE sets: each of the six functions is "= SHAKE256(...)".
const SHAKE_11_1: Record<Fn, string> = {
  H_msg: 'SHAKE256',
  PRF: 'SHAKE256',
  PRF_msg: 'SHAKE256',
  F: 'SHAKE256',
  H: 'SHAKE256',
  T_l: 'SHAKE256',
}
// Section 11.2.1 (SHA2-128s, SHA2-128f): MGF1-SHA-256 over SHA-256 for H_msg, HMAC-SHA-256
// for PRF_msg, and Trunc_n(SHA-256(...)) for PRF, F, H and T_l.
const SHA2_11_2_1: Record<Fn, string> = {
  H_msg: 'SHA-256',
  PRF: 'SHA-256',
  PRF_msg: 'SHA-256',
  F: 'SHA-256',
  H: 'SHA-256',
  T_l: 'SHA-256',
}
// Section 11.2.2 (SHA2-192s/f, SHA2-256s/f): H_msg = MGF1-SHA-512(... SHA-512(...)),
// PRF = Trunc_n(SHA-256(...)), PRF_msg = Trunc_n(HMAC-SHA-512(...)), F = Trunc_n(SHA-256(...)),
// H = Trunc_n(SHA-512(...)), T_l = Trunc_n(SHA-512(...)).
const SHA2_11_2_2: Record<Fn, string> = {
  H_msg: 'SHA-512',
  PRF: 'SHA-256',
  PRF_msg: 'SHA-512',
  F: 'SHA-256',
  H: 'SHA-512',
  T_l: 'SHA-512',
}

// FIPS 205 Table 2: n is 16, 24 and 32 for the 128, 192 and 256 sets. Section 11 says the SHA2
// sets follow 11.2.1 if n = 16 and 11.2.2 if n = 24 or n = 32.
const N_BY_SIZE: Record<string, number> = { '128': 16, '192': 24, '256': 32 }
const PARAMETER_SETS = ['128s', '128f', '192s', '192f', '256s', '256f'].flatMap((sz) => [
  `SHA2-${sz}`,
  `SHAKE-${sz}`,
])

const expectedFunctions = (label: string): Record<Fn, string> => {
  if (label.startsWith('SHAKE-')) return SHAKE_11_1
  const n = N_BY_SIZE[label.split('-')[1].slice(0, 3)]
  return n === 16 ? SHA2_11_2_1 : SHA2_11_2_2
}

/** Reads the Hash card text into a function -> hash map; throws on any text it cannot read. */
const parseHashCard = (text: string): Record<Fn, string> => {
  const all = text.match(/^(SHA-256|SHA-512|SHAKE256), all functions$/)
  if (all) return Object.fromEntries(FUNCTIONS.map((f) => [f, all[1]])) as Record<Fn, string>
  const out: Partial<Record<Fn, string>> = {}
  for (const part of text.split('; ')) {
    const m = part.match(/^(SHA-256|SHA-512|SHAKE256) \(([^)]+)\)$/)
    if (!m) throw new Error(`Hash card text not understood: "${text}"`)
    for (const fn of m[2].split(', ')) {
      if (!FUNCTIONS.includes(fn as Fn) || out[fn as Fn]) {
        throw new Error(`Hash card names "${fn}" twice or unknown: "${text}"`)
      }
      out[fn as Fn] = m[1]
    }
  }
  for (const f of FUNCTIONS) if (!out[f]) throw new Error(`Hash card leaves out ${f}: "${text}"`)
  return out as Record<Fn, string>
}

const renderDemo = () =>
  render(
    <MemoryRouter>
      <SLHDSALiveDemo context="slh-dsa" />
    </MemoryRouter>
  )

const triggers = () => Array.from(document.querySelectorAll('button[aria-haspopup="listbox"]'))
const choose = (triggerIndex: number, optionName: string) => {
  fireEvent.click(triggers()[triggerIndex])
  fireEvent.click(screen.getByRole('option', { name: optionName }))
}
const hashCard = () =>
  screen.getByText('Hash', { selector: 'span' }).nextElementSibling!.textContent!

describe('SLH-DSA live demo: Hash card of each parameter set follows FIPS 205 Section 11', () => {
  it('covers exactly the 12 parameter sets of Table 2', () => {
    expect(PARAMETER_SETS).toHaveLength(12)
    expect(new Set(PARAMETER_SETS).size).toBe(12)
  })

  it.each(PARAMETER_SETS)('%s prints the function behind each of the six hash roles', (label) => {
    renderDemo()
    choose(0, label)
    expect(screen.getByText(label, { selector: 'span.font-mono.font-bold' })).toBeInTheDocument()
    expect(parseHashCard(hashCard())).toEqual(expectedFunctions(label))
  })

  it('never names SHAKE128 or SHAKE-128 as a hash of any parameter set', () => {
    renderDemo()
    for (const label of PARAMETER_SETS) {
      choose(0, label)
      expect(hashCard()).not.toMatch(/SHAKE-?128/)
    }
  })
})

describe('SLH-DSA live demo: the pre-hash note follows FIPS 205 Section 10.2 and 10.2.2', () => {
  const openPreHash = () => {
    renderDemo()
    fireEvent.click(screen.getByRole('button', { name: 'Show HashSLH-DSA variants' }))
  }
  const TAG = '(OID not listed in FIPS 205)'

  it('tags only the functions Algorithm 23 gives no OID for, and never says "Non-FIPS 205"', () => {
    openPreHash()
    fireEvent.click(triggers()[1])
    const names = screen.getAllByRole('option').map((o) => o.textContent ?? '')
    // Algorithm 23 lists OIDs for SHA-256, SHA-512, SHAKE128 and SHAKE256 only.
    const untagged = names.filter((n) => !n.includes(TAG) && n !== 'Pure (no pre-hash)')
    expect(untagged.sort()).toEqual(['SHA-256', 'SHA-512', 'SHAKE-128', 'SHAKE-256'])
    expect(names.filter((n) => n.includes(TAG)).sort()).toEqual(
      ['SHA-224', 'SHA-384', 'SHA3-224', 'SHA3-256', 'SHA3-384', 'SHA3-512']
        .map((n) => `${n} ${TAG}`)
        .sort()
    )
    expect(names.join(' ')).not.toContain('Non-FIPS 205')
  })

  it('says other approved functions are allowed, with at least 8n bits, and cites 10.2.2', () => {
    openPreHash()
    choose(1, `SHA3-256 ${TAG}`)
    const note = screen.getByText(/section 10\.2\.2 lists OIDs/).textContent!.replace(/\s+/g, ' ')
    // §10.2.2: "hash_slh_sign may be used with other hash functions or XOFs."
    expect(note).toContain('lists OIDs for SHA-256, SHA-512, SHAKE128 and SHAKE256')
    expect(note).toContain('allows other approved hash functions or XOFs')
    // §10.2: "at least 8n bits of classical security strength against both collision and
    // second preimage attacks"
    expect(note).toContain('at least 8n bits of classical security strength')
    expect(note).toMatch(/both collision and second-preimage attacks/)
    // §10.2.2: "SHA-256 and SHAKE128 are only appropriate for use with ... category 1"
    expect(note).toContain('SHA-256 and SHAKE128 are only appropriate for category 1')
    // the old claims
    expect(note).not.toMatch(/permits only/)
    expect(note).not.toMatch(/SHAKE-128/)
    expect(note).not.toMatch(/§11|section 11/i)
    expect(note).not.toMatch(/outside the FIPS 205/)
  })
})

describe('SLH-DSA live demo: SHA-256 and SHAKE128 pre-hash are category 1 only (FIPS 205 Section 10.2.2)', () => {
  const openPreHash = () => {
    renderDemo()
    fireEvent.click(screen.getByRole('button', { name: 'Show HashSLH-DSA variants' }))
  }
  // §10.2.2: "SHA-256 and SHAKE128 are only appropriate for use with SLH-DSA parameter sets that
  // are claimed to be in security category 1 (see Section 11)."
  const WARNING = /SHA-256 and SHAKE128 are only appropriate for use with SLH-DSA parameter sets/

  it.each([
    ['SHA2-192s', 'SHA-256', 3],
    ['SHAKE-192f', 'SHAKE-128', 3],
    ['SHA2-256s', 'SHA-256', 5],
    ['SHAKE-256f', 'SHAKE-128', 5],
  ] as const)('warns for %s with %s pre-hash (category %i)', (paramSet, hash, category) => {
    openPreHash()
    choose(0, paramSet)
    expect(screen.queryByTestId('prehash-category-warning')).not.toBeInTheDocument()
    choose(1, hash)
    const warning = screen.getByTestId('prehash-category-warning')
    const text = warning.textContent!.replace(/\s+/g, ' ')
    expect(text).toMatch(WARNING)
    expect(text).toContain('claimed to be in security category 1')
    expect(text).toContain('FIPS 205 section 10.2.2')
    expect(text).toContain(`${paramSet} is a category ${category} parameter set`)
  })

  it.each([
    ['SHA2-128s', 'SHA-256'],
    ['SHAKE-128f', 'SHAKE-128'],
  ])('does not warn for the category 1 set %s with %s', (paramSet, hash) => {
    openPreHash()
    choose(0, paramSet)
    choose(1, hash)
    expect(screen.queryByTestId('prehash-category-warning')).not.toBeInTheDocument()
  })

  it.each([
    ['SHA2-192s', 'SHA-512'],
    ['SHAKE-256s', 'SHAKE-256'],
  ])('does not warn for %s with %s, which the rule does not name', (paramSet, hash) => {
    openPreHash()
    choose(0, paramSet)
    choose(1, hash)
    expect(screen.queryByTestId('prehash-category-warning')).not.toBeInTheDocument()
  })

  it('leaves the existing note for hashes without an OID in place and adds nothing to it', () => {
    openPreHash()
    choose(0, 'SHA2-192s')
    choose(1, `SHA3-256 ${'(OID not listed in FIPS 205)'}`)
    expect(screen.getByText(/section 10\.2\.2 lists OIDs/)).toBeInTheDocument()
    expect(screen.queryByTestId('prehash-category-warning')).not.toBeInTheDocument()
  })
})

describe('SLH-DSA live demo: the explainer follows FIPS 205 Section 3 and Section 8', () => {
  it('describes the few-time FORS keys, not a fresh WOTS+ key per signature', () => {
    renderDemo()
    const p = screen
      .getByText('Why is SLH-DSA stateless?', { selector: 'strong' })
      .closest('p')!.textContent!
    const text = p.replace(/\s+/g, ' ')
    // Section 3: "an SLH-DSA key pair consists of a very large set of FORS key pairs ...
    // computing a randomized hash of the message, using part of the resulting message digest
    // to pseudorandomly select a FORS key"; Section 8: the security of a FORS key "degrades
    // gradually as the number of signatures increases"; Section 11: at most 2^64 messages.
    expect(text).toContain('A key pair is a very large set of few-time FORS keys')
    expect(text).toContain('uses part of the digest to select one of them')
    expect(text).toContain('its security degrades gradually')
    expect(text).toContain('up to 2^64 signatures per key')
    expect(text).not.toMatch(/ephemeral|fresh .*WOTS|drawn from the private key seed/)
  })

  it('says what copies of the key can and cannot do, and that FIPS 205 is silent on backup', () => {
    renderDemo()
    const text = screen
      .getByText('Why is SLH-DSA stateless?', { selector: 'strong' })
      .closest('p')!
      .textContent!.replace(/\s+/g, ' ')
    // NIST SP 800-208 section 9.1: "the state of the private key must be updated each time a
    // signature is generated" (the LMS/XMSS danger a copy would create); FIPS 205 section 11:
    // up to 2^64 messages per key pair.
    expect(text).toContain(
      'a copy of the private key cannot cause the one-time key reuse that NIST SP 800-208 section 9.1 warns about for LMS and XMSS'
    )
    expect(text).toContain(
      'Signatures made by all copies of a key still count towards the same limit of 2^64 signatures per key (FIPS 205 section 11)'
    )
    expect(text).toContain('FIPS 205 gives no rules for backing up or replicating keys')
    expect(text).not.toMatch(/safely backed up|distributed across HSM replicas/)
  })
})

describe('SLH-DSA live demo: the CNSA 2.0 cell names only the multi-tree schemes as barred', () => {
  it('uses the FAQ wording, "multi-tree ... HSS and XMSSMT ... not allowed"', () => {
    renderDemo()
    const cell = screen.getByRole('cell', { name: 'CNSA 2.0' }).closest('tr')!.textContent!
    // NSA CNSA 2.0 FAQ v2.2, p. 11: "The multi-tree algorithms HSS and XMSSMT are not allowed."
    expect(cell).toContain('multi-tree HSS and XMSSMT not allowed (CNSA 2.0 FAQ)')
    expect(cell).not.toMatch(/; HSS not allowed/)
  })
})
