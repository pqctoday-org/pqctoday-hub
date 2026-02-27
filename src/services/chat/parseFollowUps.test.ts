import { describe, it, expect } from 'vitest'
import { parseFollowUps } from './parseFollowUps'

describe('parseFollowUps', () => {
  it('extracts follow-ups from a valid fenced block', () => {
    const input = `Here is the answer about ML-KEM.

\`\`\`followups
What are the performance benchmarks for ML-KEM-768?
How does this compare to classical RSA key exchange?
Which products support this algorithm today?
\`\`\``

    const { cleanContent, followUps } = parseFollowUps(input)
    expect(cleanContent).toBe('Here is the answer about ML-KEM.')
    expect(followUps).toEqual([
      'What are the performance benchmarks for ML-KEM-768?',
      'How does this compare to classical RSA key exchange?',
      'Which products support this algorithm today?',
    ])
  })

  it('strips optional numbering from follow-ups', () => {
    const input = `Answer text.

\`\`\`followups
1. First question?
2. Second question?
3. Third question?
\`\`\``

    const { followUps } = parseFollowUps(input)
    expect(followUps).toEqual(['First question?', 'Second question?', 'Third question?'])
  })

  it('limits to 3 follow-ups maximum', () => {
    const input = `Answer.

\`\`\`followups
Question 1
Question 2
Question 3
Question 4
Question 5
\`\`\``

    const { followUps } = parseFollowUps(input)
    expect(followUps).toHaveLength(3)
    expect(followUps).toEqual(['Question 1', 'Question 2', 'Question 3'])
  })

  it('returns empty followUps when no fenced block exists', () => {
    const input = 'Just normal content without follow-ups.'
    const { cleanContent, followUps } = parseFollowUps(input)
    expect(cleanContent).toBe(input)
    expect(followUps).toEqual([])
  })

  it('handles empty followups block gracefully', () => {
    const input = `Content here.

\`\`\`followups
\`\`\``

    const { cleanContent, followUps } = parseFollowUps(input)
    expect(cleanContent).toBe('Content here.')
    expect(followUps).toEqual([])
  })

  it('trims whitespace from extracted questions', () => {
    const input = `Answer.

\`\`\`followups
  Question with leading spaces?
  Another padded question?
\`\`\``

    const { followUps } = parseFollowUps(input)
    expect(followUps[0]).toBe('Question with leading spaces?')
    expect(followUps[1]).toBe('Another padded question?')
  })

  it('filters out blank lines between questions', () => {
    const input = `Answer.

\`\`\`followups
First question?

Second question?

Third question?
\`\`\``

    const { followUps } = parseFollowUps(input)
    expect(followUps).toEqual(['First question?', 'Second question?', 'Third question?'])
  })

  it('preserves markdown content before the fenced block exactly', () => {
    const input = `## Heading

Here is **bold** and [a link](/algorithms).

- List item 1
- List item 2

\`\`\`followups
Follow-up question?
\`\`\``

    const { cleanContent } = parseFollowUps(input)
    expect(cleanContent).toContain('## Heading')
    expect(cleanContent).toContain('**bold**')
    expect(cleanContent).toContain('[a link](/algorithms)')
    expect(cleanContent).toContain('- List item 1')
  })

  it('handles trailing whitespace after closing fence', () => {
    const input = `Answer text.

\`\`\`followups
Question here?
\`\`\`   `

    const { cleanContent, followUps } = parseFollowUps(input)
    expect(cleanContent).toBe('Answer text.')
    expect(followUps).toEqual(['Question here?'])
  })

  it('does NOT match partial fence tag (followup without s)', () => {
    const input = `Answer text.

\`\`\`followup
Not a real block
\`\`\``

    const { cleanContent, followUps } = parseFollowUps(input)
    expect(cleanContent).toBe(input)
    expect(followUps).toEqual([])
  })

  it('only matches the final followups block when content has other code blocks', () => {
    const input = `Here is some code:

\`\`\`python
print("hello")
\`\`\`

And the answer continues.

\`\`\`followups
What about performance?
How does this compare?
\`\`\``

    const { cleanContent, followUps } = parseFollowUps(input)
    expect(cleanContent).toContain('```python')
    expect(cleanContent).toContain('print("hello")')
    expect(cleanContent).toContain('And the answer continues.')
    expect(followUps).toEqual(['What about performance?', 'How does this compare?'])
  })

  it('returns original content unchanged when no match', () => {
    const original = 'Simple answer with no follow-ups at all.'
    const { cleanContent, followUps } = parseFollowUps(original)
    expect(cleanContent).toBe(original)
    expect(followUps).toEqual([])
  })
})
