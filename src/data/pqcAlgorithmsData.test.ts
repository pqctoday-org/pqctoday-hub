import { describe, it, expect } from 'vitest'
import { getDateFromFilename } from './pqcAlgorithmsData'

describe('pqcAlgorithmsData', () => {
  describe('getDateFromFilename', () => {
    it('should correctly parse valid date from filename', () => {
      const filename = './pqc_complete_algorithm_reference_12112025.csv'
      const date = getDateFromFilename(filename)
      expect(date).not.toBeNull()
      expect(date?.getFullYear()).toBe(2025)
      expect(date?.getMonth()).toBe(11) // December is 11 (0-indexed)
      expect(date?.getDate()).toBe(11)
    })

    it('should correct parse another valid date', () => {
      const filename = 'some/path/pqc_complete_algorithm_reference_01022026.csv'
      const date = getDateFromFilename(filename)
      expect(date).not.toBeNull()
      expect(date?.getFullYear()).toBe(2026)
      expect(date?.getMonth()).toBe(0) // January
      expect(date?.getDate()).toBe(2)
    })

    it('should return null for invalid date (wrong month)', () => {
      const filename = './pqc_complete_algorithm_reference_13112025.csv'
      expect(getDateFromFilename(filename)).toBeNull()
    })

    it('should return null for invalid date (wrong day)', () => {
      const filename = './pqc_complete_algorithm_reference_02302025.csv' // Feb 30th
      expect(getDateFromFilename(filename)).toBeNull()
    })

    it('should return null for filename without date', () => {
      const filename = './pqc_complete_algorithm_reference.csv'
      expect(getDateFromFilename(filename)).toBeNull()
    })

    it('should return null for malformed filename', () => {
      const filename = 'random_file.csv'
      expect(getDateFromFilename(filename)).toBeNull()
    })
  })
})
