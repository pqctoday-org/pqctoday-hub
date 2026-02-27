/**
 * Parse LLM-generated follow-up questions from a fenced ```followups block
 * at the end of an assistant response.
 *
 * Returns the cleaned content (block stripped) and extracted follow-up questions.
 */
export function parseFollowUps(content: string): {
  cleanContent: string
  followUps: string[]
} {
  const match = content.match(/```followups\n([\s\S]*?)```\s*$/)
  if (!match) return { cleanContent: content, followUps: [] }

  const followUps = match[1]
    .trim()
    .split('\n')
    .map((line) => line.replace(/^\d+\.\s*/, '').trim()) // strip optional numbering
    .filter(Boolean)
    .slice(0, 3)

  const cleanContent = content.slice(0, match.index).trimEnd()
  return { cleanContent, followUps }
}
