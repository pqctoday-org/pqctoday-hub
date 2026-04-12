// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { useModuleStore } from '@/store/useModuleStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { PERSONAS } from '@/data/learningPersonas'
import { QUIZ_QUESTIONS, quizMetadata, QUIZ_CATEGORIES } from '@/data/quizData'
import { QuizIntro } from './QuizIntro'
import { QuizWizard } from './QuizWizard'
import type { QuizCompletionData } from './QuizWizard'
import { QuizResults } from './QuizResults'
import type { QuizCategory, QuizMode, QuizQuestion } from './types'

const MODULE_ID = 'quiz'
const SECONDS_PER_QUESTION = 45
const QUICK_POOL_THRESHOLD_MIN = 15
const DEFAULT_TIME_MIN = 15
const MIN_PER_CATEGORY = 2

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Sample questions with adaptive category spread.
 * Phase 1: Take 1 per category (shuffled) for maximum breadth — works even for small counts.
 * Phase 2: If room and count allows, add a second question per category.
 * Phase 3: Fill remaining slots randomly.
 */
function sampleQuestions(questions: QuizQuestion[], count: number): QuizQuestion[] {
  const byCategory = new Map<QuizCategory, QuizQuestion[]>()
  for (const q of questions) {
    const group = byCategory.get(q.category) || []
    group.push(q)
    byCategory.set(q.category, group)
  }

  const sampled: QuizQuestion[] = []
  const usedIds = new Set<string>()

  // Phase 1: Take 1 per category for breadth (shuffled category order)
  const shuffledCategories = shuffleArray([...byCategory.entries()])
  for (const [, categoryQuestions] of shuffledCategories) {
    if (sampled.length >= count) break
    const shuffled = shuffleArray(categoryQuestions)
    sampled.push(shuffled[0])
    usedIds.add(shuffled[0].id)
  }

  // Phase 2: If room, add up to MIN_PER_CATEGORY per category
  if (sampled.length < count) {
    const minPerCat = Math.min(MIN_PER_CATEGORY, Math.floor(count / byCategory.size))
    if (minPerCat >= 2) {
      for (const [, categoryQuestions] of shuffledCategories) {
        if (sampled.length >= count) break
        const unused = shuffleArray(categoryQuestions.filter((q) => !usedIds.has(q.id)))
        const toTake = Math.min(minPerCat - 1, unused.length, count - sampled.length)
        for (let i = 0; i < toTake; i++) {
          sampled.push(unused[i])
          usedIds.add(unused[i].id)
        }
      }
    }
  }

  // Phase 3: Fill remaining slots randomly from unused questions
  const remaining = count - sampled.length
  if (remaining > 0) {
    const unused = shuffleArray(questions.filter((q) => !usedIds.has(q.id)))
    sampled.push(...unused.slice(0, remaining))
  }

  return shuffleArray(sampled)
}

/** Parse and validate ?category= comma-separated URL param */
function parseCategoryParam(param: string | null): QuizCategory[] | null {
  if (!param) return null
  const validIds = new Set<string>(QUIZ_CATEGORIES.map((c) => c.id))
  const parsed = param
    .split(',')
    .map((s) => s.trim())
    .filter((s) => validIds.has(s)) as QuizCategory[]
  return parsed.length > 0 ? parsed : null
}

export const QuizModule: React.FC = () => {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const checkpointState = location.state as {
    checkpointCategories?: QuizCategory[]
    checkpointLabel?: string
  } | null
  const urlCategories = useMemo(
    () => parseCategoryParam(searchParams.get('category')),
    [searchParams]
  )

  const { updateModuleProgress, markStepComplete, mergeCorrectQuestionIds, modules } =
    useModuleStore()
  const {
    selectedPersona,
    selectedIndustry: storeIndustry,
    selectedIndustries,
    experienceLevel,
  } = usePersonaStore()
  // Only pre-filter by industry when exactly one industry is active (truly restricted).
  // When multiple industries are allowed (e.g. embed cert grants all), start unfiltered.
  const initialIndustryFilter = selectedIndustries.length === 1 ? storeIndustry : null
  const [industryFilter, setIndustryFilter] = useState<string | null>(initialIndustryFilter)
  // Sync when the store's single-industry selection changes (user switches via persona picker).
  // This is a valid sync pattern: external Zustand store → local derived state.
  const userClearedFilter = useRef(false)
  useEffect(() => {
    if (!userClearedFilter.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from external Zustand store, not a cascading render
      setIndustryFilter(selectedIndustries.length === 1 ? storeIndustry : null)
    }
  }, [storeIndustry, selectedIndustries.length])
  const persona = selectedPersona ? PERSONAS[selectedPersona] : null
  const [view, setView] = useState<'intro' | 'quiz' | 'results'>('intro')
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [completionData, setCompletionData] = useState<QuizCompletionData | null>(null)
  const [lastMode, setLastMode] = useState<QuizMode>('timed')
  const [lastTimeMin, setLastTimeMin] = useState(DEFAULT_TIME_MIN)
  const [lastCategories, setLastCategories] = useState<QuizCategory[]>([])
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>(() => {
    if (experienceLevel === 'curious') return ['beginner']
    if (experienceLevel === 'basics') return ['beginner', 'intermediate']
    return ['beginner', 'intermediate', 'advanced']
  })
  const startTimeRef = useRef(0)

  const filteredQuestions = useMemo(() => {
    let pool = QUIZ_QUESTIONS
    if (selectedPersona) {
      pool = pool.filter((q) => q.personas.length === 0 || q.personas.includes(selectedPersona))
    }
    pool = pool.filter((q) => selectedDifficulties.includes(q.difficulty))
    if (industryFilter) {
      pool = pool.filter((q) => q.industries.length === 0 || q.industries.includes(industryFilter))
    }
    return pool
  }, [selectedPersona, selectedDifficulties, industryFilter])

  const filteredCategories = useMemo(() => {
    const counts = new Map<QuizCategory, number>()
    for (const q of filteredQuestions) {
      counts.set(q.category, (counts.get(q.category) || 0) + 1)
    }

    return QUIZ_CATEGORIES.map((c) => ({
      ...c,
      questionCount: counts.get(c.id) || 0,
    })).filter((c) => c.questionCount > 0)
  }, [filteredQuestions])

  // Time tracking
  useEffect(() => {
    startTimeRef.current = Date.now()
    updateModuleProgress(MODULE_ID, { status: 'in-progress' })

    return () => {
      const elapsed = (Date.now() - startTimeRef.current) / 60000
      if (elapsed > 0) {
        const currentSpent = useModuleStore.getState().modules[MODULE_ID]?.timeSpent || 0
        updateModuleProgress(MODULE_ID, { timeSpent: currentSpent + elapsed })
      }
    }
  }, [updateModuleProgress])

  const previousScores = useMemo(() => {
    const moduleData = modules[MODULE_ID]
    return moduleData?.quizScores ?? undefined
  }, [modules])

  const handleStart = useCallback(
    (mode: QuizMode, categories: QuizCategory[], timeMinutes?: number) => {
      setLastMode(mode)
      setLastCategories(categories)
      const time = timeMinutes ?? DEFAULT_TIME_MIN
      setLastTimeMin(time)

      let selected: QuizQuestion[]
      if (mode === 'timed') {
        const questionCount = Math.round((time * 60) / SECONDS_PER_QUESTION)
        const useQuickPool = time <= QUICK_POOL_THRESHOLD_MIN
        const pool = useQuickPool
          ? filteredQuestions.filter((q) => q.quizMode === 'quick' || q.quizMode === 'both')
          : filteredQuestions
        selected = sampleQuestions(pool, Math.min(questionCount, pool.length))
      } else {
        // Category mode: filter by selected categories, use all questions
        const filtered = filteredQuestions.filter((q) => categories.includes(q.category))
        selected = shuffleArray(filtered)
      }

      setQuizQuestions(selected)
      setView('quiz')
    },
    [filteredQuestions]
  )

  const handleComplete = useCallback(
    (data: QuizCompletionData) => {
      setCompletionData(data)
      setView('results')

      const { summary } = data
      const scores: Record<string, number> = { overall: summary.overall.percentage }
      for (const [cat, catData] of Object.entries(summary.byCategory)) {
        if (catData) {
          const prev = previousScores?.[cat] ?? 0
          scores[cat] = Math.max(prev, catData.percentage)
        }
      }
      const prevOverall = previousScores?.['overall'] ?? 0
      scores.overall = Math.max(prevOverall, summary.overall.percentage)

      updateModuleProgress(MODULE_ID, { quizScores: scores, status: 'completed' })
      markStepComplete(MODULE_ID, 'quiz-completed')

      // Merge correctly-answered question IDs into cumulative mastery
      const correctIds = Object.entries(data.results)
        .filter(([, isCorrect]) => isCorrect)
        .map(([questionId]) => questionId)
      if (correctIds.length > 0) mergeCorrectQuestionIds(correctIds)
    },
    [updateModuleProgress, markStepComplete, mergeCorrectQuestionIds, previousScores]
  )

  const handleRetake = useCallback(() => {
    handleStart(lastMode, lastCategories, lastTimeMin)
  }, [handleStart, lastMode, lastCategories, lastTimeMin])

  const handleChangeTopics = useCallback(() => {
    setView('intro')
    setCompletionData(null)
  }, [])

  const handleExitQuiz = useCallback(() => {
    setView('intro')
  }, [])

  return (
    <div className="w-full">
      {view === 'intro' && (
        <QuizIntro
          previousScores={previousScores}
          onStart={handleStart}
          quizMetadata={quizMetadata}
          totalPoolSize={filteredQuestions.length}
          quickPoolSize={
            filteredQuestions.filter((q) => q.quizMode === 'quick' || q.quizMode === 'both').length
          }
          categories={filteredCategories}
          initialCategories={
            urlCategories ??
            checkpointState?.checkpointCategories ??
            (persona && persona.quizCategories.length > 0
              ? (persona.quizCategories as QuizCategory[])
              : undefined)
          }
          personaLabel={checkpointState?.checkpointLabel ?? persona?.label}
          industryFilter={industryFilter}
          onClearIndustryFilter={() => {
            userClearedFilter.current = true
            setIndustryFilter(null)
          }}
          selectedDifficulties={selectedDifficulties}
          onToggleDifficulty={(diff: string) => {
            setSelectedDifficulties((prev) =>
              prev.includes(diff)
                ? prev.length > 1
                  ? prev.filter((d) => d !== diff)
                  : prev
                : [...prev, diff]
            )
          }}
        />
      )}
      {view === 'quiz' && (
        <QuizWizard questions={quizQuestions} onComplete={handleComplete} onExit={handleExitQuiz} />
      )}
      {view === 'results' && completionData && (
        <QuizResults
          summary={completionData.summary}
          questions={quizQuestions}
          answers={completionData.answers}
          results={completionData.results}
          onRetake={handleRetake}
          onChangeTopics={handleChangeTopics}
        />
      )}
    </div>
  )
}
