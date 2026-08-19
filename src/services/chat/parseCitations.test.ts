// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { parseCitations } from './parseCitations'

describe('parseCitations', () => {
  it('extracts citations from a valid fenced block', () => {
    const input = `ML-KEM-768 provides NIST security level 3.

\`\`\`citations
[{"claimExcerpt": "ML-KEM-768 provides NIST security level 3", "chunkId": "algo-ml-kem-768"}]
\`\`\`

\`\`\`followups
What about ML-KEM-1024?
\`\`\``

    const { cleanContent, citations } = parseCitations(input)
    expect(cleanContent).toBe(`ML-KEM-768 provides NIST security level 3.

\`\`\`followups
What about ML-KEM-1024?
\`\`\``)
    expect(citations).toEqual([
      { claimExcerpt: 'ML-KEM-768 provides NIST security level 3', chunkId: 'algo-ml-kem-768' },
    ])
  })

  it('extracts multiple citations', () => {
    const input = `Answer text.

\`\`\`citations
[
  {"claimExcerpt": "first claim", "chunkId": "chunk-a"},
  {"claimExcerpt": "second claim", "chunkId": "chunk-b"}
]
\`\`\``

    const { citations } = parseCitations(input)
    expect(citations).toEqual([
      { claimExcerpt: 'first claim', chunkId: 'chunk-a' },
      { claimExcerpt: 'second claim', chunkId: 'chunk-b' },
    ])
  })

  it('returns empty citations when no fenced block exists', () => {
    const input = 'Just normal content without citations.'
    const { cleanContent, citations } = parseCitations(input)
    expect(cleanContent).toBe(input)
    expect(citations).toEqual([])
  })

  it('degrades to empty citations on malformed JSON, without throwing', () => {
    const input = `Answer.

\`\`\`citations
this is not valid json {{{
\`\`\``

    expect(() => parseCitations(input)).not.toThrow()
    const { citations } = parseCitations(input)
    expect(citations).toEqual([])
  })

  it('drops entries missing claimExcerpt or chunkId rather than throwing', () => {
    const input = `Answer.

\`\`\`citations
[{"claimExcerpt": "valid one", "chunkId": "chunk-a"}, {"chunkId": "chunk-b"}, {"claimExcerpt": "no id"}, "not an object", 42]
\`\`\``

    const { citations } = parseCitations(input)
    expect(citations).toEqual([{ claimExcerpt: 'valid one', chunkId: 'chunk-a' }])
  })

  it('returns empty citations when the JSON is not an array', () => {
    const input = `Answer.

\`\`\`citations
{"claimExcerpt": "not wrapped in an array", "chunkId": "chunk-a"}
\`\`\``

    const { citations } = parseCitations(input)
    expect(citations).toEqual([])
  })

  it('strips an incomplete citations block truncated mid-stream', () => {
    const input = `Answer so far.

\`\`\`citations
[{"claimExcerpt": "partial claim`

    const { cleanContent, citations } = parseCitations(input)
    expect(cleanContent).toBe('Answer so far.')
    expect(citations).toEqual([])
  })

  it('leaves content before the block intact and trims surrounding whitespace', () => {
    const input = `First paragraph.

Second paragraph.

\`\`\`citations
[]
\`\`\``

    const { cleanContent } = parseCitations(input)
    expect(cleanContent).toBe('First paragraph.\n\nSecond paragraph.')
  })
})
