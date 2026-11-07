// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { LEARN_CHAPTERS, content } from './content'

const chapter = (id: string) => {
  const found = LEARN_CHAPTERS.find((c) => c.id === id)
  if (!found) throw new Error(`missing chapter ${id}`)
  return found.body.join('\n')
}

describe('MLS lesson: recovery from a compromised member', () => {
  it('does not promise that any compromised epoch heals on any Commit', () => {
    const everything = JSON.stringify([LEARN_CHAPTERS, content.narratives])
    expect(everything).not.toMatch(/nothing before or after it leaks/i)
    expect(everything).not.toMatch(/advances with every Commit/i)
  })

  it('states the conditions for recovery: a fresh leaf key that is committed', () => {
    const text = chapter('treekem')
    expect(text).toMatch(/conditional/i)
    expect(text).toMatch(/replaces Bob.s leaf with a fresh key pair/i)
    expect(text).toMatch(/Update proposal has no effect until it is committed/i)
  })

  it('separates ordinary sends and other members Commits from recovery', () => {
    const text = chapter('treekem')
    expect(text).toMatch(/only steps a one-way hash ratchet and adds no fresh randomness/i)
    expect(text).toMatch(
      /Commit by another member encrypts its new path secrets to nodes whose private keys Bob/i
    )
    expect(text).toMatch(/all-zero vector/i)
  })

  it('names snapshot compromise versus persistent control and signature-key limits', () => {
    const text = chapter('treekem')
    expect(text).toMatch(/one-time snapshot/i)
    expect(text).toMatch(/keeps control of Bob.s device/i)
    expect(text).toMatch(/signature key/i)
  })
})

describe('MLS lesson: combiner and software-token custody', () => {
  it('describes the combiner as an architecture over two sessions, not a cipher suite', () => {
    const text = chapter('ciphersuites')
    expect(text).toMatch(/architecture, not a single cipher suite/i)
    expect(text).toMatch(/each session names its own cipher suite/i)
  })

  it('does not say key bytes never exist in the process', () => {
    const text = chapter('provider-architecture')
    expect(text).not.toMatch(/never exist in process memory/i)
    expect(text).toMatch(/not returned to OpenMLS through this interface/i)
    expect(text).toMatch(/still exist in that process/i)
  })
})
