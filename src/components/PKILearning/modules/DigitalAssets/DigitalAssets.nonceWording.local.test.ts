// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import ragSummary from './rag-summary.md?raw'
import exercisesSource from './components/BlockchainExercises.tsx?raw'
import solanaSource from './flows/SolanaFlow.tsx?raw'
import { content } from './content'
import { CRYPTO_TOOLTIPS } from './utils/cryptoConstants'

const flat = (text: string) => text.replace(/\s+/g, ' ')
const ECDSA_NONCE =
  'needs a unique, unpredictable nonce per signature (random, or derived per RFC 6979; reuse leaks the key)'
const EDDSA_NONCE =
  'derives the nonce from the key and message (RFC 8032), so a weak RNG at signing cannot repeat a nonce, though implementations still need side-channel defences'
const OLD_CLAIMS = [
  'eliminating nonce-reuse',
  'no random number generator needed',
  'no random nonce is needed',
  'no random k value needed',
]

describe('ECDSA and EdDSA nonce wording', () => {
  it('the module summary states both nonce rules with their conditions', () => {
    const overview = JSON.stringify(content.narratives)
    for (const text of [overview, ragSummary]) {
      expect(text).toContain(`ECDSA, which ${ECDSA_NONCE}`)
      expect(text).toContain(`EdDSA, which ${EDDSA_NONCE}`)
    }
  })

  it('the exercise and the Solana walkthrough state them too', () => {
    expect(flat(exercisesSource)).toContain(`EdDSA ${EDDSA_NONCE}; ECDSA ${ECDSA_NONCE}`)
    const solana = flat(solanaSource)
    expect(solana).toContain(`EdDSA ${EDDSA_NONCE}`)
    expect(solana).toContain(`ECDSA ${ECDSA_NONCE}`)
    expect(solana).toContain(
      'derives its nonce from the key and message (RFC 8032), so a weak RNG at signing cannot repeat a nonce'
    )
  })

  it('the EdDSA tooltip no longer promises resistance to implementation errors', () => {
    expect(CRYPTO_TOOLTIPS.eddsa.description).toContain(`Faster than ECDSA. It ${EDDSA_NONCE}.`)
  })

  it('none of the old absolute claims remains', () => {
    const everything = [
      JSON.stringify(content.narratives),
      ragSummary,
      flat(exercisesSource),
      flat(solanaSource),
      JSON.stringify(CRYPTO_TOOLTIPS),
    ].join(' ')
    for (const claim of OLD_CLAIMS) expect(everything).not.toContain(claim)
  })
})
