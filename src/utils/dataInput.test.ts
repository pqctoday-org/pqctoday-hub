import { describe, it, expect } from 'vitest'
import { asciiToHex, hexToAscii, isHex, bytesToHex, hexToBytes } from './dataInputUtils'

describe('DataInput Utils', () => {
  describe('asciiToHex', () => {
    it('should convert simple ASCII string to hex', () => {
      expect(asciiToHex('hello')).toBe('68656c6c6f')
    })

    it('should handle empty string', () => {
      expect(asciiToHex('')).toBe('')
    })
  })

  describe('hexToAscii', () => {
    it('should convert valid hex string to ASCII', () => {
      expect(hexToAscii('68656c6c6f')).toBe('hello')
    })

    it('should handle empty string', () => {
      expect(hexToAscii('')).toBe('')
    })
  })

  describe('isHex', () => {
    it('should return true for valid hex strings', () => {
      expect(isHex('1a2b3c')).toBe(true)
      expect(isHex('DEADBEEF')).toBe(true)
    })

    it('should return false for invalid characters', () => {
      expect(isHex('1a2z')).toBe(false)
    })

    it('should return false for odd length strings', () => {
      expect(isHex('123')).toBe(false)
    })
  })

  describe('bytesToHex & hexToBytes', () => {
    it('should round trip correctly', () => {
      const original = new Uint8Array([1, 2, 255])
      const hex = bytesToHex(original)
      expect(hex).toBe('0102ff')
      const result = hexToBytes(hex)
      expect(result).toEqual(original)
    })
  })
})
