// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { conversationToMarkdown } from './exportConversation'
import type { ChatMessage, Conversation } from '@/types/ChatTypes'
const message: ChatMessage = {
  id: 'message',
  role: 'assistant',
  content: 'A sample answer with its original wording.',
  timestamp: 0,
  sourceRefs: [
    {
      title: 'PQC standard',
      source: 'library-203',
      deepLink: 'https://csrc.nist.gov/pubs/fips/203/final',
      trustTier: 'Authoritative',
    },
    {
      title: 'PQC standard',
      source: 'hub-lesson',
      deepLink: '/learn/pqc-101?tab=learn',
      trustTier: 'Moderate',
    },
  ],
  sources: ['original-source-id'],
}
const conversation = (messages: ChatMessage[]): Conversation => ({
  id: 'conversation',
  title: 'Sample',
  messages,
  createdAt: 0,
  updatedAt: 0,
})

describe('Conversation Markdown retains recorded provenance', () => {
  it('keeps every source identity, link and trust tier alongside the original answer', () => {
    const markdown = conversationToMarkdown(conversation([message]))
    expect(markdown).toContain(message.content)
    expect(markdown).toContain('PQC standard [Authoritative] — source: library-203')
    expect(markdown).toContain('PQC standard [Moderate] — source: hub-lesson')
    expect(markdown).toContain('<https://csrc.nist.gov/pubs/fips/203/final>')
    expect(markdown).toContain('<https://www.pqctoday.com/learn/pqc-101?tab=learn>')
    expect(markdown).toContain('original-source-id')
    expect(markdown).toContain('own assessment')
  })
  it('does not manufacture trust tiers or public links for historical or non-URL references', () => {
    const markdown = conversationToMarkdown(
      conversation([
        {
          ...message,
          sourceRefs: [
            { title: 'Older source', source: 'record', deepLink: 'private-cache/source.pdf' },
          ],
          sources: ['older-id'],
        },
      ])
    )
    expect(markdown).toContain('Trust tier not recorded')
    expect(markdown).toContain('private-cache/source.pdf')
    expect(markdown).not.toContain('https://www.pqctoday.comprivate-cache')
    expect(markdown).toContain('older-id')
  })
  it('keeps sources attributed to their own message and does not create an empty section for unsourced replies', () => {
    const markdown = conversationToMarkdown(
      conversation([
        { id: 'user', role: 'user', content: 'My question', timestamp: 0 },
        message,
        { id: 'last', role: 'assistant', content: 'Second answer', timestamp: 1 },
      ])
    )
    expect(markdown.match(/Recorded sources for this message/g)).toHaveLength(1)
    expect(markdown.indexOf('Recorded sources')).toBeGreaterThan(markdown.indexOf(message.content))
    expect(markdown.indexOf('Recorded sources')).toBeLessThan(markdown.indexOf('Second answer'))
  })
})
