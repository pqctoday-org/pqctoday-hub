import { describe, expect, it } from 'vitest'
import { algorithmSlug } from './algorithmLinks'
import { algorithmIdFromName, loadPQCAlgorithmsData } from '@/data/pqcAlgorithmsData'

describe('algorithmSlug', () => {
  it('matches the reference CSV algorithm_id for every algorithm', async () => {
    const algorithms = await loadPQCAlgorithmsData()
    expect(algorithms.length).toBeGreaterThan(100)
    for (const a of algorithms) {
      expect(algorithmSlug(a.name)).toBe(a.id)
      expect(algorithmSlug(a.name)).toBe(algorithmIdFromName(a.name))
    }
  })
})
