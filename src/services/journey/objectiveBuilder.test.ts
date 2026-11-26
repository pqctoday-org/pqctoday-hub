// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { buildPreview, contentWords, objectiveIdFor, stepsFromPreview } from './objectiveBuilder'
import { TREE_LESSONS, lessonByTag } from './lessons'
import type { Objective } from './types'

const base = { persona: 'architect' as const, existing: [] as Objective[], isDone: () => false }

describe('the new-objective preview', () => {
  it('says "too broad" for a goal made only of subject words', () => {
    for (const goal of [
      'quantum',
      'post-quantum cryptography',
      'I want to learn everything about security',
      '  ',
    ]) {
      expect(buildPreview({ ...base, goal }).state).toBe('broad')
    }
  })

  it('previews a specific goal: required steps in order, then optional ones, nothing saved', () => {
    const p = buildPreview({ ...base, goal: 'Review our TLS migration design' })
    expect(p.state).toBe('ready')
    const required = p.steps.filter((s) => s.required)
    expect(required.length).toBeGreaterThan(0)
    expect(required.length).toBeLessThanOrEqual(7)
    expect(p.mapped.length).toBeGreaterThan(0)
    expect(p.mapped.every((t) => lessonByTag(t))).toBe(true)
  })

  it('puts a lesson after the lessons it names in take-first (prerequisites come only from take_first)', () => {
    const p = buildPreview({ ...base, goal: 'Review our TLS migration design' })
    const order = p.steps.filter((s) => s.required).map((s) => s.tag)
    for (const tag of order) {
      const lesson = lessonByTag(tag)!
      for (const pre of lesson.takeFirst) {
        const preTag = TREE_LESSONS.find((l) => l.id === pre)?.lmId
        if (preTag && order.includes(preTag)) {
          expect(order.indexOf(preTag)).toBeLessThan(order.indexOf(tag))
        }
      }
    }
    for (const s of p.steps) {
      if (s.origin.type === 'take-first') {
        const owner = lessonByTag(s.origin.for)!
        const pre = lessonByTag(s.tag)!
        expect(owner.takeFirst).toContain(pre.id)
      }
    }
  })

  it('names what is already done and counts it as done in the preview', () => {
    const first = buildPreview({ ...base, goal: 'Review our TLS migration design' })
    const doneTag = first.steps.find((s) => s.required)!.tag
    const p = buildPreview({
      ...base,
      goal: 'Review our TLS migration design',
      isDone: (t) => t === doneTag,
    })
    expect(p.alreadyDone).toEqual([doneTag])
    expect(p.steps.find((s) => s.tag === doneTag)!.alreadyDone).toBe(true)
  })

  it('reports a coverage gap with the words the Hub does not cover', () => {
    const p = buildPreview({ ...base, goal: 'xyzzy plugh frobnicate' })
    expect(p.state).toBe('gap')
    expect(p.notCovered).toContain('xyzzy')
    expect(p.steps).toHaveLength(0)
  })

  it('reports a partial gap with mapped topics and not-covered words', () => {
    const p = buildPreview({ ...base, goal: 'TLS banana smoothie recipe' })
    expect(p.state).toBe('gap')
    expect(p.mapped.length).toBeGreaterThan(0)
    expect(p.notCovered).toEqual(expect.arrayContaining(['banana', 'smoothie']))
  })

  it('finds a duplicate of an open objective of the same role, and not of a completed one or another role', () => {
    const p = buildPreview({ ...base, goal: 'Review our TLS migration design' })
    const id = objectiveIdFor('architect', 'Review our TLS migration design')
    const existing: Objective = {
      id,
      role: 'architect',
      goal: 'Review the TLS migration design',
      state: 'active',
      steps: stepsFromPreview(id, p),
      checkpoint: { path: [], stepId: null },
      createdAt: 1,
      updatedAt: 1,
    }
    const again = buildPreview({
      ...base,
      goal: 'Review our TLS migration design',
      existing: [existing],
    })
    expect(again.state).toBe('duplicate')
    expect(again.duplicateOf).toBe(id)
    expect(
      buildPreview({
        ...base,
        goal: 'Review our TLS migration design',
        existing: [{ ...existing, state: 'completed' }],
      }).state
    ).toBe('ready')
    expect(
      buildPreview({
        ...base,
        goal: 'Review our TLS migration design',
        existing: [{ ...existing, role: 'executive' }],
      }).state
    ).toBe('ready')
  })

  describe('a goal that names a standard: PKCS#11', () => {
    const tagOnly = ['LM-083', 'LM-084', 'LM-085', 'LM-087']
    for (const goal of ['learn pkcs11', 'learn PKCS#11']) {
      it(`requires the lessons that name it in their text, not the ones only tagged with it ("${goal}")`, () => {
        const p = buildPreview({ ...base, goal })
        const required = p.steps.filter((s) => s.required).map((s) => s.tag)
        expect(required).toContain('LM-015') // HSM & PQC Operations: names it in the description
        expect(required).toContain('LM-021') // Cryptographic APIs & Developer Languages: same
        for (const tag of tagOnly) expect(required).not.toContain(tag)
        // no prerequisite is added on behalf of a lesson that is only tagged
        for (const s of p.steps) {
          if (s.origin.type === 'take-first') expect(tagOnly).not.toContain(s.origin.for)
        }
        // the required lessons are the two matches and their own take-first lessons
        const matchTags = p.steps.filter((s) => s.required && s.origin.type === 'match')
        expect(matchTags.map((s) => s.tag).sort()).toEqual(['LM-015', 'LM-021'])
        for (const s of p.steps) {
          if (s.required && s.origin.type === 'take-first') {
            expect(['LM-015', 'LM-021']).toContain(s.origin.for)
          }
        }
      })
    }

    it('lists tag-only lessons at most as optional, after the lessons that name it', () => {
      const p = buildPreview({ ...base, goal: 'learn pkcs11' })
      const optional = p.steps.filter((s) => !s.required).map((s) => s.tag)
      // a lesson that only mentions it in a long description comes before a tag-only one
      for (const tag of tagOnly) {
        if (optional.includes(tag)) {
          const namers = optional.filter((t) => !tagOnly.includes(t))
          expect(namers.every((t) => optional.indexOf(t) < optional.indexOf(tag))).toBe(true)
        }
      }
    })
  })

  it('keeps "mapped" and the required steps telling the same story', () => {
    const goals = [
      'learn pkcs11',
      'understand ML-KEM',
      'migrate TLS to hybrid key exchange',
      'FIPS 140-3 validation for my HSM',
      'prepare for CNSA 2.0',
      'KMIP key management',
      'Review our TLS migration design',
    ]
    for (const goal of goals) {
      const p = buildPreview({ ...base, goal })
      const required = p.steps.filter((s) => s.required).map((s) => s.tag)
      for (const tag of p.mapped) expect(required, `${goal}: ${tag}`).toContain(tag)
    }
  })

  it('does not call a standard named only in lesson tags "too broad"', () => {
    expect(buildPreview({ ...base, goal: 'prepare for CNSA 2.0' }).state).toBe('ready')
  })

  it('does not let subject words such as "secure" and "PQC" choose the lessons when the goal names a subject', () => {
    const p = buildPreview({ ...base, persona: null, goal: 'secure 5G with PQC' })
    expect(p.state).toBe('ready')
    expect(p.mapped.map((t) => lessonByTag(t)?.id)).toEqual(['5g-security'])
  })

  it("reads a lesson's longer page title: X.509 certificates lead to the PKI lesson", () => {
    const p = buildPreview({ ...base, persona: null, goal: 'X.509 certificates with PQC' })
    expect(p.mapped.map((t) => lessonByTag(t)?.id)).toContain('pki-workshop')
    const matches = p.steps.filter((s) => s.required && s.origin.type === 'match')
    expect(matches.map((s) => lessonByTag(s.tag)?.id)).toEqual(['pki-workshop'])
  })

  it('keeps a goal about digital assets on its own lesson', () => {
    const p = buildPreview({
      ...base,
      persona: null,
      goal: 'digital assets and blockchain wallets',
    })
    expect(p.mapped.map((t) => lessonByTag(t)?.id)).toEqual(['digital-assets'])
  })

  it('is deterministic: the same inputs give the same preview', () => {
    const a = buildPreview({ ...base, goal: 'Secure boot and firmware signing for our devices' })
    const b = buildPreview({ ...base, goal: 'Secure boot and firmware signing for our devices' })
    expect(a).toEqual(b)
  })

  it('builds the saved steps from the preview: required lessons, the self-assessed last step, then optional', () => {
    const p = buildPreview({ ...base, goal: 'Review our TLS migration design' })
    const id = objectiveIdFor('architect', p.goal)
    const steps = stepsFromPreview(id, p)
    const required = steps.filter((s) => s.required)
    expect(required.slice(0, -1).map((s) => s.resourceTag)).toEqual(
      p.steps.filter((s) => s.required).map((s) => s.tag)
    )
    expect(required[required.length - 1].kind).toBe('self-assessed')
    expect(steps.map((s) => s.position)).toEqual(steps.map((_, i) => i + 1))
    expect(new Set(steps.map((s) => s.id)).size).toBe(steps.length)
  })

  it('gives the same id for the same role and words, and a different id for another role', () => {
    expect(objectiveIdFor('architect', 'TLS review')).toBe(
      objectiveIdFor('architect', 'tls  Review ')
    )
    expect(objectiveIdFor('architect', 'TLS review')).not.toBe(
      objectiveIdFor('executive', 'TLS review')
    )
  })

  it('reads the content words without function words', () => {
    expect(contentWords('What do I want to learn about the TLS handshake?')).toEqual([
      'tls',
      'handshake',
    ])
  })
})
