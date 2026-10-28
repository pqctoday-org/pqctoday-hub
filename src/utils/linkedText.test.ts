// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { splitLinkedText } from './linkedText'

describe('splitLinkedText', () => {
  it('returns one plain part when there is no link', () => {
    expect(splitLinkedText('Nothing to link here.')).toEqual([
      { text: 'Nothing to link here.', to: null },
    ])
  })

  it('splits a sentence around an in-app link and keeps the words of the link', () => {
    expect(
      splitLinkedText(
        'Use the [Validation tab on the Algorithms page](/algorithms?tab=validation).'
      )
    ).toEqual([
      { text: 'Use the ', to: null },
      { text: 'Validation tab on the Algorithms page', to: '/algorithms?tab=validation' },
      { text: '.', to: null },
    ])
  })

  it('leaves outside addresses and stray brackets as plain text', () => {
    const text = 'See [a site](https://example.com) and [a note](//evil.example) or [this].'
    expect(splitLinkedText(text)).toEqual([{ text, to: null }])
  })
})
