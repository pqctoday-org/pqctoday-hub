// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { threatsData } from '@/data/threatsData'
import { threatCountLabel, cryptoFieldDisplay, isCryptoTokenList } from './threatsHelper'

describe('threatCountLabel (UX-19)', () => {
  it('says "1 threat", never "1 threats"', () => {
    expect(threatCountLabel(1)).toBe('1 threat')
    expect(threatCountLabel(0)).toBe('0 threats')
    expect(threatCountLabel(5)).toBe('5 threats')
  })
})

describe('cryptoFieldDisplay — chips only for token lists, never for split prose', () => {
  it('turns a short comma list into capped chips', () => {
    expect(cryptoFieldDisplay('RSA-2048, ECDSA P-256, TLS 1.3 key exchange, AES-128/192')).toEqual({
      kind: 'chips',
      visible: ['RSA-2048', 'ECDSA P-256', 'TLS 1.3 key exchange'],
      hiddenCount: 1,
    })
  })

  it('keeps prose whole: parentheses, quotation marks and sentence punctuation', () => {
    for (const text of [
      'Cloud systems pool computing resources (storage, memory, processing, network bandwidth) to serve multiple consumers.',
      'Public-key cryptography (such as RSA and ECC) used in financial services systems, whose encrypted communications are exposed to “harvest now, decrypt later” attacks.',
      'Defense-in-depth protective strategies for detecting, responding to, and recovering from cyber attacks.',
      'RSA, ECDSA, EdDSA, and DH and MQV key establishment (all parameter sets at 112 bits of security or higher); deprecated after 2030 and disallowed after 2035',
    ]) {
      expect(cryptoFieldDisplay(text), text).toEqual({ kind: 'prose', text })
    }
  })

  it('reports an empty field as empty', () => {
    expect(cryptoFieldDisplay('   ')).toEqual({ kind: 'empty' })
  })

  it('no published row renders a chip that is a fragment of a sentence', () => {
    const fragments: string[] = []
    for (const t of threatsData) {
      for (const field of [t.cryptoAtRisk, t.pqcReplacement]) {
        const shown = cryptoFieldDisplay(field)
        if (shown.kind !== 'chips') continue
        for (const chip of shown.visible) {
          const open = (chip.match(/[([]/g) ?? []).length
          const close = (chip.match(/[)\]]/g) ?? []).length
          if (open !== close || /[.;“”"]$/.test(chip) || chip.split(/\s+/).length > 6)
            fragments.push(`${t.threatId}: ${chip}`)
        }
      }
    }
    expect(fragments).toEqual([])
  })

  it('isCryptoTokenList keeps version dots (TLS 1.2/1.3) as part of a token', () => {
    expect(isCryptoTokenList('RSA, ECC, TLS 1.2/1.3 key exchange, PKI certificates')).toBe(true)
  })
})
