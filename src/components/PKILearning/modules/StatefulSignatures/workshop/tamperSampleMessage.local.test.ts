// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { tamperSampleMessage } from './tamperSampleMessage'
describe('sample message tampering changes the supplied bytes', () => {
  it.each(['', 'a', 'ab', 'abc', 'abcd', 'abcde', 'é', '€', '😀', 'aé'])(
    'changes %j without mutating the original UTF-8 input',
    (message) => {
      const original = new TextEncoder().encode(message)
      const snapshot = new Uint8Array(original)
      const changed = tamperSampleMessage(original)
      expect(Array.from(changed)).not.toEqual(Array.from(original))
      expect(Array.from(original)).toEqual(Array.from(snapshot))
      expect(changed).not.toBe(original)
      if (original.length) {
        expect(changed.length).toBe(original.length)
        expect(changed[0]).toBe(original[0] ^ 1)
        expect(Array.from(changed.slice(1))).toEqual(Array.from(original.slice(1)))
      } else expect(Array.from(changed)).toEqual([1])
    }
  )
})
