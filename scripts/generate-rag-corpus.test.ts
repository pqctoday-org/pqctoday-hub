// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  sanitize,
  encodeParam,
  algoSlug,
  extractTextFromTSX,
  extractTextFromDataFile,
} from './generate-rag-corpus'

describe('sanitize', () => {
  it('should trim whitespace', () => {
    expect(sanitize('  hello  ')).toBe('hello')
  })

  it('should coalesce null to empty string', () => {
    expect(sanitize(null)).toBe('')
  })

  it('should coalesce undefined to empty string', () => {
    expect(sanitize(undefined)).toBe('')
  })

  it('should handle empty string', () => {
    expect(sanitize('')).toBe('')
  })

  it('should preserve interior whitespace', () => {
    expect(sanitize('  hello world  ')).toBe('hello world')
  })
})

describe('encodeParam', () => {
  it('should encode special characters', () => {
    expect(encodeParam('hello world')).toBe('hello%20world')
  })

  it('should trim before encoding', () => {
    expect(encodeParam('  test  ')).toBe('test')
  })

  it('should encode slashes', () => {
    expect(encodeParam('foo/bar')).toBe('foo%2Fbar')
  })

  it('should encode ampersands', () => {
    expect(encodeParam('a&b')).toBe('a%26b')
  })

  it('should handle unicode', () => {
    expect(encodeParam('François')).toBe('Fran%C3%A7ois')
  })
})

describe('algoSlug', () => {
  it('should lowercase and slugify', () => {
    expect(algoSlug('ML-KEM-768')).toBe('ml-kem-768')
  })

  it('should replace non-alphanumeric with hyphens', () => {
    expect(algoSlug('RSA (2048)')).toBe('rsa-2048')
  })

  it('should trim leading/trailing hyphens', () => {
    expect(algoSlug('  ML-KEM  ')).toBe('ml-kem')
  })

  it('should handle complex algorithm names', () => {
    expect(algoSlug('SLH-DSA-SHA2-128s')).toBe('slh-dsa-sha2-128s')
  })

  it('should handle spaces and special chars', () => {
    expect(algoSlug('Classic McEliece 6960119')).toBe('classic-mceliece-6960119')
  })
})

describe('extractTextFromTSX', () => {
  it('should extract text between JSX tags', () => {
    const source = `
      <p>
        Post-quantum cryptography is the study of cryptographic algorithms that are thought to be
        secure against quantum computers. These algorithms are being standardized by NIST for future use.
      </p>
    `
    const results = extractTextFromTSX(source)
    expect(results.length).toBeGreaterThan(0)
    expect(results[0]).toContain('Post-quantum cryptography')
  })

  it('should filter out React hook code', () => {
    const source = `
      <p>
        This is educational content about cryptographic algorithms that should be extracted because
        it is longer than the minimum threshold and contains real educational content.
      </p>
      <div>{useRef(null)}</div>
      <span>{useState('')}</span>
    `
    const results = extractTextFromTSX(source)
    // Should contain the educational text
    expect(results.some((r) => r.includes('educational content'))).toBe(true)
    // Should NOT contain React hooks
    expect(results.some((r) => r.includes('useRef'))).toBe(false)
    expect(results.some((r) => r.includes('useState'))).toBe(false)
  })

  it('should filter out very short text', () => {
    const source = `
      <p>Short</p>
      <p>Also short text</p>
      <p>
        This is a sufficiently long piece of educational text about quantum computing and post-quantum
        cryptographic algorithms that should pass the minimum length filter.
      </p>
    `
    const results = extractTextFromTSX(source)
    // Only the long text should survive the 60-char min filter
    expect(results.every((r) => r.length >= 60)).toBe(true)
  })

  it('should decode HTML entities', () => {
    const source = `
      <p>
        The algorithm&apos;s performance characteristics are excellent and it&apos;s been adopted
        widely in the post-quantum cryptography community for key encapsulation mechanisms.
      </p>
    `
    const results = extractTextFromTSX(source)
    expect(results.length).toBeGreaterThan(0)
    // Should decode &apos; to '
    expect(results[0]).toContain("algorithm's")
  })

  it('should extract string properties from object literals', () => {
    const source = `
      const data = {
        title: 'This is a title for the quantum cryptography module component that is quite descriptive',
        description: 'A comprehensive overview of lattice-based cryptographic algorithms used in post-quantum security systems',
      }
    `
    const results = extractTextFromTSX(source)
    expect(results.some((r) => r.includes('lattice-based cryptographic'))).toBe(true)
  })

  it('should deduplicate extracted text', () => {
    const source = `
      <p>
        Post-quantum cryptography algorithms are designed to be secure against attacks from quantum computers running
        Shor's algorithm or Grover's algorithm. This represents a fundamental shift in cryptographic practice.
      </p>
      <p>
        Post-quantum cryptography algorithms are designed to be secure against attacks from quantum computers running
        Shor's algorithm or Grover's algorithm. This represents a fundamental shift in cryptographic practice.
      </p>
    `
    const results = extractTextFromTSX(source)
    // Should contain the text only once
    const pqcResults = results.filter((r) => r.includes('Post-quantum cryptography algorithms'))
    expect(pqcResults.length).toBeLessThanOrEqual(1)
  })

  it('should filter out CSS class fragments', () => {
    const source = `
      <div className="border-primary bg-muted/30 text-foreground p-4 rounded-lg shadow-lg">
        <p>
          ML-KEM (Module-Lattice Key Encapsulation Mechanism) was standardized as FIPS 203 and provides
          efficient key encapsulation for post-quantum secure key exchange in TLS and other protocols.
        </p>
      </div>
    `
    const results = extractTextFromTSX(source)
    // Should have ML-KEM text, not CSS classes
    expect(results.some((r) => r.includes('ML-KEM'))).toBe(true)
    expect(results.some((r) => r.includes('border-primary'))).toBe(false)
  })

  it('should return empty array for code-only content', () => {
    const source = `
      const [state, setState] = useState(false)
      useEffect(() => { doSomething() }, [])
      const ref = useRef<HTMLDivElement>(null)
    `
    const results = extractTextFromTSX(source)
    expect(results).toHaveLength(0)
  })
})

describe('extractTextFromDataFile', () => {
  it('should extract long string property values', () => {
    const source = `
      export const data = {
        description: 'A comprehensive analysis of post-quantum cryptographic algorithms and their applications',
        overview: 'Short',
      }
    `
    const results = extractTextFromDataFile(source)
    expect(results.some((r) => r.includes('comprehensive analysis'))).toBe(true)
    // Short strings (< 40 chars) should be filtered out
    expect(results.some((r) => r === 'Short')).toBe(false)
  })

  it('should handle template literals', () => {
    const source = `
      export const info = {
        detail: \`This is a longer template literal string that contains detailed information about quantum-safe algorithms\`,
      }
    `
    const results = extractTextFromDataFile(source)
    expect(results.some((r) => r.includes('quantum-safe algorithms'))).toBe(true)
  })

  it('should return empty array for non-string content', () => {
    const source = `
      export const config = {
        port: 3000,
        enabled: true,
        items: [1, 2, 3],
      }
    `
    const results = extractTextFromDataFile(source)
    expect(results).toHaveLength(0)
  })

  it('should deduplicate values', () => {
    const source = `
      const a = { desc: 'This is a repeated long string value that appears multiple times in the data' }
      const b = { desc: 'This is a repeated long string value that appears multiple times in the data' }
    `
    const results = extractTextFromDataFile(source)
    const repeatedCount = results.filter((r) => r.includes('repeated long string')).length
    expect(repeatedCount).toBeLessThanOrEqual(1)
  })
})

describe('corpus integration', () => {
  it('should have generated a valid corpus file', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const corpusPath = path.join(process.cwd(), 'public', 'data', 'rag-corpus.json')

    // Corpus should exist
    expect(fs.existsSync(corpusPath)).toBe(true)

    // rag-corpus.json is now { generatedAt, chunkCount, chunks: [...] }
    const parsed = JSON.parse(fs.readFileSync(corpusPath, 'utf-8'))
    const corpus = parsed.chunks ?? parsed

    // Should have chunks
    expect(corpus.length).toBeGreaterThan(100)

    // Every chunk should have required fields
    for (const chunk of corpus) {
      expect(chunk).toHaveProperty('id')
      expect(chunk).toHaveProperty('source')
      expect(chunk).toHaveProperty('title')
      expect(chunk).toHaveProperty('content')
      expect(chunk.id).toBeTruthy()
      expect(chunk.source).toBeTruthy()
      expect(chunk.title).toBeTruthy()
      expect(chunk.content).toBeTruthy()
    }

    // All IDs should be unique
    const ids = corpus.map((c: { id: string }) => c.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })

  it('should have no undefined glossary definitions', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const corpusPath = path.join(process.cwd(), 'public', 'data', 'rag-corpus.json')
    const parsed = JSON.parse(fs.readFileSync(corpusPath, 'utf-8'))
    const corpus = parsed.chunks ?? parsed

    const glossaryChunks = corpus.filter((c: { source: string }) => c.source === 'glossary')
    expect(glossaryChunks.length).toBeGreaterThan(200)

    const undefinedCount = glossaryChunks.filter((c: { content: string }) =>
      c.content.includes('Definition: undefined')
    ).length
    expect(undefinedCount).toBe(0)
  })

  it('should have no module-content noise chunks (React code)', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const corpusPath = path.join(process.cwd(), 'public', 'data', 'rag-corpus.json')
    const parsed = JSON.parse(fs.readFileSync(corpusPath, 'utf-8'))
    const corpus = parsed.chunks ?? parsed

    const moduleContent = corpus.filter((c: { source: string }) => c.source === 'module-content')
    const noiseChunks = moduleContent.filter(
      (c: { content: string }) =>
        /useRef|useState|useEffect|useCallback|useMemo/.test(c.content) ||
        /^\)/.test(c.content.trim())
    )
    expect(noiseChunks.length).toBe(0)
  })

  it('should cover all expected source types', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const corpusPath = path.join(process.cwd(), 'public', 'data', 'rag-corpus.json')
    const parsed = JSON.parse(fs.readFileSync(corpusPath, 'utf-8'))
    const corpus = parsed.chunks ?? parsed

    const sources = new Set(corpus.map((c: { source: string }) => c.source))
    const expectedSources = [
      'glossary',
      'timeline',
      'library',
      'algorithms',
      'transitions',
      'threats',
      'compliance',
      'migrate',
      'leaders',
      'modules',
      'module-content',
      'certifications',
      'assessment',
      'priority-matrix',
    ]

    for (const src of expectedSources) {
      expect(sources.has(src)).toBe(true)
    }
  })

  it('should have deep links on navigable chunks', async () => {
    const fs = await import('fs')
    const path = await import('path')
    const corpusPath = path.join(process.cwd(), 'public', 'data', 'rag-corpus.json')
    const parsed = JSON.parse(fs.readFileSync(corpusPath, 'utf-8'))
    const corpus = parsed.chunks ?? parsed

    // Algorithm chunks should have deep links
    const algoChunks = corpus.filter((c: { source: string }) => c.source === 'algorithms')
    const algoWithLinks = algoChunks.filter((c: { deepLink?: string }) => c.deepLink)
    expect(algoWithLinks.length).toBeGreaterThan(0)

    // Timeline chunks should have deep links
    const timelineChunks = corpus.filter((c: { source: string }) => c.source === 'timeline')
    const timelineWithLinks = timelineChunks.filter((c: { deepLink?: string }) => c.deepLink)
    expect(timelineWithLinks.length).toBeGreaterThan(0)
  })
})
