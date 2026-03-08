// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { parseQuizCSV, quizQuestions, quizMetadata, quizCategories } from './quizDataLoader'

// ─────────────────────────────────────────────────────────────────────────────
// parseQuizCSV — CSV content → QuizQuestion[]
// ─────────────────────────────────────────────────────────────────────────────

// Convenience: build a 15-column CSV row (indices 0-14)
function makeRow(fields: (string | undefined)[]): string {
  const padded = [...fields]
  while (padded.length < 15) padded.push('')
  return padded.map((f) => f ?? '').join(',')
}

const HEADER =
  'id,category,type,difficulty,quiz_mode,question,option_a,option_b,option_c,option_d,correct_answer,explanation,learn_more_path,personas,industries'

function buildCSV(...rows: string[]): string {
  return [HEADER, ...rows].join('\n')
}

describe('parseQuizCSV', () => {
  it('skips the header row', () => {
    const csv = buildCSV(
      makeRow([
        'q1',
        'pqc-fundamentals',
        'multiple-choice',
        'beginner',
        'both',
        'Question?',
        'True',
        'False',
        '',
        '',
        'a',
        'Explanation.',
      ])
    )
    const result = parseQuizCSV(csv)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('q1')
  })

  it('skips rows with fewer than 13 columns', () => {
    const shortRow = 'q-short,pqc-fundamentals,multiple-choice,beginner,both,Question?'
    const csv = buildCSV(shortRow)
    expect(parseQuizCSV(csv)).toHaveLength(0)
  })

  it('accepts a row with exactly 13 columns', () => {
    const row = [
      'q-exact',
      'pqc-fundamentals',
      'multiple-choice',
      'beginner',
      'both',
      'Question?',
      'Option A',
      'Option B',
      '',
      '',
      'a',
      'Explanation.',
      '',
    ].join(',')
    const csv = buildCSV(row)
    const result = parseQuizCSV(csv)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('q-exact')
  })

  describe('true-false questions', () => {
    it('assigns id "true" to option_a and id "false" to option_b (not "a"/"b")', () => {
      const csv = buildCSV(
        makeRow([
          'tf-1',
          'pqc-fundamentals',
          'true-false',
          'beginner',
          'both',
          'Is ML-KEM PQC?',
          'True',
          'False',
          '',
          '',
          'true',
          'Yes it is.',
        ])
      )
      const [q] = parseQuizCSV(csv)
      expect(q.options).toHaveLength(2)
      expect(q.options[0]).toEqual({ id: 'true', text: 'True' })
      expect(q.options[1]).toEqual({ id: 'false', text: 'False' })
    })

    it('omits option_a when empty for true-false', () => {
      const csv = buildCSV(
        makeRow([
          'tf-2',
          'pqc-fundamentals',
          'true-false',
          'beginner',
          'both',
          'Question?',
          '',
          'False',
          '',
          '',
          'false',
          'Explanation.',
        ])
      )
      const [q] = parseQuizCSV(csv)
      expect(q.options).toHaveLength(1)
      expect(q.options[0].id).toBe('false')
    })

    it('correctAnswer is a plain string for true-false', () => {
      const csv = buildCSV(
        makeRow([
          'tf-3',
          'pqc-fundamentals',
          'true-false',
          'beginner',
          'both',
          'Question?',
          'True',
          'False',
          '',
          '',
          'true',
          'Explanation.',
        ])
      )
      const [q] = parseQuizCSV(csv)
      expect(typeof q.correctAnswer).toBe('string')
      expect(q.correctAnswer).toBe('true')
    })
  })

  describe('multiple-choice questions', () => {
    it('assigns ids a/b/c/d to the four options', () => {
      const csv = buildCSV(
        makeRow([
          'mc-1',
          'pqc-fundamentals',
          'multiple-choice',
          'beginner',
          'both',
          'Question?',
          'Alpha',
          'Beta',
          'Gamma',
          'Delta',
          'c',
          'Explanation.',
        ])
      )
      const [q] = parseQuizCSV(csv)
      expect(q.options.map((o) => o.id)).toEqual(['a', 'b', 'c', 'd'])
    })

    it('skips options with empty text', () => {
      const csv = buildCSV(
        makeRow([
          'mc-2',
          'pqc-fundamentals',
          'multiple-choice',
          'beginner',
          'both',
          'Question?',
          'Alpha',
          'Beta',
          '',
          '',
          'a',
          'Explanation.',
        ])
      )
      const [q] = parseQuizCSV(csv)
      expect(q.options).toHaveLength(2)
      expect(q.options.map((o) => o.id)).toEqual(['a', 'b'])
    })

    it('correctAnswer is a plain string for multiple-choice', () => {
      const csv = buildCSV(
        makeRow([
          'mc-3',
          'pqc-fundamentals',
          'multiple-choice',
          'beginner',
          'both',
          'Question?',
          'A',
          'B',
          'C',
          '',
          'b',
          'Explanation.',
        ])
      )
      const [q] = parseQuizCSV(csv)
      expect(typeof q.correctAnswer).toBe('string')
      expect(q.correctAnswer).toBe('b')
    })
  })

  describe('multi-select questions', () => {
    it('splits correctAnswer by | into an array', () => {
      const csv = buildCSV(
        makeRow([
          'ms-1',
          'pqc-fundamentals',
          'multi-select',
          'intermediate',
          'both',
          'Select all that apply.',
          'Alpha',
          'Beta',
          'Gamma',
          'Delta',
          'a|c',
          'Explanation.',
        ])
      )
      const [q] = parseQuizCSV(csv)
      expect(Array.isArray(q.correctAnswer)).toBe(true)
      expect(q.correctAnswer).toEqual(['a', 'c'])
    })

    it('single-item multi-select produces a one-element array', () => {
      const csv = buildCSV(
        makeRow([
          'ms-2',
          'pqc-fundamentals',
          'multi-select',
          'intermediate',
          'both',
          'Select all.',
          'Alpha',
          'Beta',
          '',
          '',
          'b',
          'Explanation.',
        ])
      )
      const [q] = parseQuizCSV(csv)
      expect(Array.isArray(q.correctAnswer)).toBe(true)
      expect(q.correctAnswer).toEqual(['b'])
    })
  })

  describe('optional and persona/industry fields', () => {
    it('sets learnMorePath when column 12 is non-empty', () => {
      const csv = buildCSV(
        makeRow([
          'lm-1',
          'pqc-fundamentals',
          'multiple-choice',
          'beginner',
          'both',
          'Q?',
          'A',
          'B',
          '',
          '',
          'a',
          'Explanation.',
          '/learn/pqc-101',
        ])
      )
      const [q] = parseQuizCSV(csv)
      expect(q.learnMorePath).toBe('/learn/pqc-101')
    })

    it('does NOT set learnMorePath when column 12 is empty', () => {
      const csv = buildCSV(
        makeRow([
          'lm-2',
          'pqc-fundamentals',
          'multiple-choice',
          'beginner',
          'both',
          'Q?',
          'A',
          'B',
          '',
          '',
          'a',
          'Explanation.',
          '',
        ])
      )
      const [q] = parseQuizCSV(csv)
      expect(q.learnMorePath).toBeUndefined()
    })

    it('splits personas by | and returns array', () => {
      const csv = buildCSV(
        makeRow([
          'p-1',
          'pqc-fundamentals',
          'multiple-choice',
          'beginner',
          'both',
          'Q?',
          'A',
          'B',
          '',
          '',
          'a',
          'Exp.',
          '',
          'executive|developer',
        ])
      )
      const [q] = parseQuizCSV(csv)
      expect(q.personas).toEqual(['executive', 'developer'])
    })

    it('returns empty personas array when column 13 is absent', () => {
      // Only 13 columns (0-12) — personas col absent
      const row = [
        'p-2',
        'pqc-fundamentals',
        'multiple-choice',
        'beginner',
        'both',
        'Q?',
        'A',
        'B',
        '',
        '',
        'a',
        'Exp.',
        '',
      ].join(',')
      const [q] = parseQuizCSV(buildCSV(row))
      expect(q.personas).toEqual([])
    })

    it('returns empty industries array when column 14 is absent', () => {
      const csv = buildCSV(
        makeRow([
          'i-1',
          'pqc-fundamentals',
          'multiple-choice',
          'beginner',
          'both',
          'Q?',
          'A',
          'B',
          '',
          '',
          'a',
          'Exp.',
          '',
          'developer',
          '',
        ])
      )
      const [q] = parseQuizCSV(csv)
      expect(q.industries).toEqual([])
    })

    it('splits industries by | into an array', () => {
      const csv = buildCSV(
        makeRow([
          'i-2',
          'pqc-fundamentals',
          'multiple-choice',
          'beginner',
          'both',
          'Q?',
          'A',
          'B',
          '',
          '',
          'a',
          'Exp.',
          '',
          '',
          'Finance|Healthcare',
        ])
      )
      const [q] = parseQuizCSV(csv)
      expect(q.industries).toEqual(['Finance', 'Healthcare'])
    })
  })

  it('returns an empty array for CSV with only a header row', () => {
    expect(parseQuizCSV(HEADER)).toEqual([])
  })

  it('parses a quoted question field containing a comma', () => {
    const csv = buildCSV(
      [
        'q-quoted',
        'pqc-fundamentals',
        'multiple-choice',
        'beginner',
        'both',
        '"Which algorithms, if any, are PQC?"',
        'ML-KEM',
        'RSA',
        '',
        '',
        'a',
        'Explanation.',
        '',
        '',
        '',
      ].join(',')
    )
    const [q] = parseQuizCSV(csv)
    expect(q.question).toBe('Which algorithms, if any, are PQC?')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Integration — loaded quizQuestions shape & invariants
// ─────────────────────────────────────────────────────────────────────────────

describe('quizQuestions (loaded CSV)', () => {
  it('loads a non-empty array of questions', () => {
    expect(quizQuestions.length).toBeGreaterThan(0)
  })

  it('quizMetadata is available', () => {
    expect(quizMetadata).not.toBeNull()
    expect(quizMetadata?.filename).toMatch(/pqcquiz_\d{8}/)
    expect(quizMetadata?.lastUpdate).toBeInstanceOf(Date)
  })

  it('every question has required fields', () => {
    for (const q of quizQuestions) {
      expect(q.id, `question missing id`).toBeTruthy()
      expect(q.category, `${q.id} missing category`).toBeTruthy()
      expect(q.type, `${q.id} missing type`).toBeTruthy()
      expect(q.difficulty, `${q.id} missing difficulty`).toBeTruthy()
      expect(q.question, `${q.id} missing question text`).toBeTruthy()
      expect(q.options.length, `${q.id} has no options`).toBeGreaterThan(0)
      expect(q.explanation, `${q.id} missing explanation`).toBeTruthy()
      expect(Array.isArray(q.personas), `${q.id} personas not array`).toBe(true)
      expect(Array.isArray(q.industries), `${q.id} industries not array`).toBe(true)
    }
  })

  it('has no duplicate question IDs', () => {
    const ids = quizQuestions.map((q) => q.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  it('all true-false questions use ids "true" and "false" (not "a"/"b")', () => {
    const trueFalseQuestions = quizQuestions.filter((q) => q.type === 'true-false')
    expect(trueFalseQuestions.length).toBeGreaterThan(0)
    for (const q of trueFalseQuestions) {
      const optionIds = q.options.map((o) => o.id)
      expect(optionIds, `${q.id} true-false options should use "true"/"false" ids`).not.toContain(
        'a'
      )
      expect(optionIds, `${q.id} true-false options should use "true"/"false" ids`).not.toContain(
        'b'
      )
      for (const id of optionIds) {
        expect(['true', 'false'], `${q.id} has unexpected option id "${id}"`).toContain(id)
      }
    }
  })

  it('all multi-select questions have correctAnswer as an array', () => {
    const multiSelect = quizQuestions.filter((q) => q.type === 'multi-select')
    for (const q of multiSelect) {
      expect(Array.isArray(q.correctAnswer), `${q.id} correctAnswer should be array`).toBe(true)
    }
  })

  it('all multiple-choice questions have correctAnswer as a string', () => {
    const multipleChoice = quizQuestions.filter((q) => q.type === 'multiple-choice')
    for (const q of multipleChoice) {
      expect(typeof q.correctAnswer, `${q.id} correctAnswer should be string`).toBe('string')
    }
  })

  it('all true-false correctAnswers are "true" or "false" (not "a" or "b")', () => {
    const trueFalse = quizQuestions.filter((q) => q.type === 'true-false')
    for (const q of trueFalse) {
      expect(
        ['true', 'false'],
        `${q.id} true-false correctAnswer "${q.correctAnswer}" is not "true"/"false"`
      ).toContain(q.correctAnswer)
    }
  })

  it('quizCategories has entries for all major categories', () => {
    const ids = quizCategories.map((c) => c.id)
    expect(ids).toContain('pqc-fundamentals')
    expect(ids).toContain('algorithm-families')
    expect(ids).toContain('nist-standards')
    expect(ids).toContain('quantum-threats')
  })

  it('quizCategories entries have required meta fields', () => {
    for (const cat of quizCategories) {
      expect(cat.id).toBeTruthy()
      expect(cat.label).toBeTruthy()
      expect(cat.description).toBeTruthy()
      expect(cat.icon).toBeTruthy()
      expect(typeof cat.questionCount).toBe('number')
    }
  })
})
