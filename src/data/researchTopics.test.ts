// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  RESEARCH_TOPICS,
  isResearchTopicId,
  parseResearchTopics,
  parseResearchTopicsDetailed,
  researchTopicCounts,
  researchTopicLabel,
  unknownResearchTopicCount,
} from './researchTopics'

describe('research topic vocabulary', () => {
  it('has topics, each with a label and definition', () => {
    expect(RESEARCH_TOPICS.length).toBeGreaterThan(0)
    for (const t of RESEARCH_TOPICS) {
      expect(t.label.trim()).not.toBe('')
      expect(t.definition.trim()).not.toBe('')
      expect(Array.isArray(t.include)).toBe(true)
      expect(Array.isArray(t.exclude)).toBe(true)
    }
  })

  it('every id is kebab-case', () => {
    for (const t of RESEARCH_TOPICS) {
      // Lowercase letters/digits in hyphen-separated words: no empty word.
      expect(t.id).toMatch(/^[a-z0-9-]+$/)
      expect(t.id.split('-').every((word) => word.length > 0)).toBe(true)
    }
  })

  it('every id is unique', () => {
    const ids = RESEARCH_TOPICS.map((t) => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every "(use <id>)" exclude hint names an existing topic', () => {
    const hints: string[] = []
    for (const t of RESEARCH_TOPICS) {
      for (const ex of t.exclude) {
        for (const m of ex.matchAll(/\(use ([^)]+)\)/g)) hints.push(m[1].trim())
      }
    }
    expect(hints.length).toBeGreaterThan(0)
    for (const id of hints) expect(isResearchTopicId(id), `unknown hint id "${id}"`).toBe(true)
  })

  it('a hint never points a topic at itself', () => {
    for (const t of RESEARCH_TOPICS) {
      for (const ex of t.exclude) expect(ex).not.toContain(`(use ${t.id})`)
    }
  })
})

describe('researchTopicLabel', () => {
  it('returns the label for a known id and undefined otherwise', () => {
    const first = RESEARCH_TOPICS[0]
    expect(researchTopicLabel(first.id)).toBe(first.label)
    expect(researchTopicLabel('not-a-topic')).toBeUndefined()
  })
})

describe('parseResearchTopics', () => {
  it('returns no topics for blank or absent cells', () => {
    expect(parseResearchTopics(undefined)).toEqual([])
    expect(parseResearchTopics(null)).toEqual([])
    expect(parseResearchTopics('')).toEqual([])
    expect(parseResearchTopics(' ; ;')).toEqual([])
  })

  it('splits on ";", trims, lowercases and deduplicates', () => {
    expect(parseResearchTopics(' Cryptanalysis ;formal-analysis; cryptanalysis')).toEqual([
      'cryptanalysis',
      'formal-analysis',
    ])
  })

  it('drops unknown ids and counts them', () => {
    const before = unknownResearchTopicCount()
    expect(parseResearchTopics('cryptanalysis; quantum-gravity; foo')).toEqual(['cryptanalysis'])
    expect(unknownResearchTopicCount() - before).toBe(2)
    expect(parseResearchTopicsDetailed('foo;cryptanalysis')).toEqual({
      topics: ['cryptanalysis'],
      unknown: ['foo'],
    })
  })
})

describe('researchTopicCounts', () => {
  it('is empty when no item carries a topic', () => {
    expect(researchTopicCounts([{ researchTopics: [] }, {}])).toEqual([])
  })

  it('counts per topic in vocabulary order, skipping untagged topics', () => {
    const counts = researchTopicCounts([
      { researchTopics: ['quantum-threat', 'cryptanalysis'] },
      { researchTopics: ['cryptanalysis'] },
    ])
    expect(counts).toEqual([
      { id: 'cryptanalysis', label: 'Cryptanalysis', count: 2 },
      { id: 'quantum-threat', label: 'Quantum threat', count: 1 },
    ])
  })
})
