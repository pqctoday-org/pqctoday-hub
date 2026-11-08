// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, afterEach, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useAwarenessScore } from './useAwarenessScore'
import { useModuleStore } from '@/store/useModuleStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { QUIZ_QUESTIONS } from '@/data/quizData'
import { quizPersonaCounts, quizPersonaQuestionIds } from '@/data/quizDataLoader'
import { MODULE_STEP_COUNTS } from '@/components/PKILearning/moduleData'
import { OTHER_ROLES_SCORE_NOTE } from '@/components/PKILearning/modules/Quiz/roleScope'

/**
 * The quiz tells a reader who widens it to all roles: "Answers to other roles' questions are saved
 * but do not count toward your role's awareness score." That sentence is a claim about this hook and
 * the mastery store, so it is proved here against them, not only shown on the page.
 */

const ROLE = 'executive'
const roleIds = quizPersonaQuestionIds[ROLE]
const ownIds = [...roleIds].slice(0, 60)
// Questions tagged for other roles and not for this one: the "other roles' questions".
const otherRolesIds = QUIZ_QUESTIONS.filter(
  (q) => q.personas.length > 0 && !q.personas.includes(ROLE)
)
  .slice(0, 60)
  .map((q) => q.id)

beforeEach(() => {
  usePersonaStore.getState().setPersona(ROLE)
  // The score only moves once the reader has started a module.
  const firstModule = Object.keys(MODULE_STEP_COUNTS)[0]
  useModuleStore.setState({ modules: {}, quizMastery: { correctQuestionIds: [] } })
  useModuleStore.getState().updateModuleProgress(firstModule, { status: 'in-progress' })
})

afterEach(() => {
  usePersonaStore.getState().setPersona(null)
  useModuleStore.setState({ modules: {}, quizMastery: { correctQuestionIds: [] } })
})

const knowledge = () => renderHook(() => useAwarenessScore()).result.current.breakdown.knowledge

describe('awareness score and answers to other roles questions', () => {
  it('the data has questions that belong to other roles and to this role', () => {
    expect(otherRolesIds.length).toBeGreaterThan(0)
    expect(ownIds.length).toBeGreaterThan(0)
    expect(otherRolesIds.some((id) => roleIds.has(id))).toBe(false)
    expect(quizPersonaCounts[ROLE]).toBeGreaterThan(ownIds.length)
  })

  it('saves correct answers to other roles questions but does not count them', () => {
    useModuleStore.getState().mergeCorrectQuestionIds(otherRolesIds)
    // Saved: every one of them is in the reader's mastery record.
    const saved = new Set(useModuleStore.getState().quizMastery.correctQuestionIds)
    expect(otherRolesIds.every((id) => saved.has(id))).toBe(true)
    // Not counted: the role's Knowledge dimension has not moved.
    expect(knowledge().raw).toBe(0)
    expect(knowledge().detail).toBe(`0 / ${quizPersonaCounts[ROLE]} questions mastered`)
  })

  it('counts correct answers to the role own questions', () => {
    useModuleStore.getState().mergeCorrectQuestionIds(ownIds)
    expect(knowledge().raw).toBeGreaterThan(0)
    expect(knowledge().detail).toBe(
      `${ownIds.length} / ${quizPersonaCounts[ROLE]} questions mastered`
    )
  })

  it('leaves the score where the own answers put it, however many other-role answers are added', () => {
    useModuleStore.getState().mergeCorrectQuestionIds(ownIds)
    const before = renderHook(() => useAwarenessScore()).result.current
    useModuleStore.getState().mergeCorrectQuestionIds(otherRolesIds)
    const after = renderHook(() => useAwarenessScore()).result.current
    expect(after.breakdown.knowledge.raw).toBe(before.breakdown.knowledge.raw)
    expect(after.breakdown.knowledge.detail).toBe(before.breakdown.knowledge.detail)
    expect(after.score).toBe(before.score)
  })

  it('says exactly what the quiz page says', () => {
    expect(OTHER_ROLES_SCORE_NOTE).toBe(
      "Answers to other roles' questions are saved but do not count toward your role's awareness score."
    )
  })
})
