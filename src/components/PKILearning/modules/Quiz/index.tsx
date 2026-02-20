import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useModuleStore } from '@/store/useModuleStore'
import { QUIZ_QUESTIONS, quizMetadata } from '@/data/quizData'
import { QuizIntro } from './QuizIntro'
import { QuizWizard } from './QuizWizard'
import type { QuizCompletionData } from './QuizWizard'
import { QuizResults } from './QuizResults'
import type { QuizCategory, QuizMode, QuizQuestion } from './types'

const MODULE_ID = 'quiz'
const QUICK_QUIZ_COUNT = 20
const FULL_QUIZ_COUNT = 80
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
 * Sample questions with guaranteed coverage of all categories.
 * Takes at least MIN_PER_CATEGORY from each category, fills remaining slots randomly.
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

  // Phase 1: Guarantee minimum coverage per category
  for (const [, categoryQuestions] of byCategory.entries()) {
    const shuffled = shuffleArray(categoryQuestions)
    const toTake = Math.min(MIN_PER_CATEGORY, shuffled.length)
    for (let i = 0; i < toTake; i++) {
      sampled.push(shuffled[i])
      usedIds.add(shuffled[i].id)
    }
  }

  // Phase 2: Fill remaining slots randomly from unused questions
  const remaining = count - sampled.length
  if (remaining > 0) {
    const unused = shuffleArray(questions.filter((q) => !usedIds.has(q.id)))
    sampled.push(...unused.slice(0, remaining))
  }

  return shuffleArray(sampled)
}

export const QuizModule: React.FC = () => {
  const { updateModuleProgress, markStepComplete, modules } = useModuleStore()
  const [view, setView] = useState<'intro' | 'quiz' | 'results'>('intro')
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([])
  const [completionData, setCompletionData] = useState<QuizCompletionData | null>(null)
  const [lastMode, setLastMode] = useState<QuizMode>('quick')
  const [lastCategories, setLastCategories] = useState<QuizCategory[]>([])
  const startTimeRef = useRef(0)

  // Time tracking
  useEffect(() => {
    startTimeRef.current = Date.now()
    updateModuleProgress(MODULE_ID, { status: 'in-progress' })

    return () => {
      const elapsed = Math.round((Date.now() - startTimeRef.current) / 60000)
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

  const handleStart = useCallback((mode: QuizMode, categories: QuizCategory[]) => {
    setLastMode(mode)
    setLastCategories(categories)

    let selected: QuizQuestion[]
    if (mode === 'quick') {
      // Quick quiz: draw from 'quick' + 'both' pool, sample with guaranteed category coverage
      const pool = QUIZ_QUESTIONS.filter((q) => q.quizMode === 'quick' || q.quizMode === 'both')
      selected = sampleQuestions(pool, QUICK_QUIZ_COUNT)
    } else if (mode === 'full') {
      // Full assessment: sample 80 randomly from all 162 questions with guaranteed category coverage
      selected = sampleQuestions(QUIZ_QUESTIONS, FULL_QUIZ_COUNT)
    } else {
      // Category mode: filter by selected categories, use all questions
      const filtered = QUIZ_QUESTIONS.filter((q) => categories.includes(q.category))
      selected = shuffleArray(filtered)
    }

    setQuizQuestions(selected)
    setView('quiz')
  }, [])

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

      updateModuleProgress(MODULE_ID, { quizScores: scores })
      markStepComplete(MODULE_ID, 'quiz-completed')
    },
    [updateModuleProgress, markStepComplete, previousScores]
  )

  const handleRetake = useCallback(() => {
    handleStart(lastMode, lastCategories)
  }, [handleStart, lastMode, lastCategories])

  const handleChangeTopics = useCallback(() => {
    setView('intro')
    setCompletionData(null)
  }, [])

  const handleExitQuiz = useCallback(() => {
    setView('intro')
  }, [])

  return (
    <div className="max-w-4xl mx-auto">
      {view === 'intro' && (
        <QuizIntro
          previousScores={previousScores}
          onStart={handleStart}
          quizMetadata={quizMetadata}
          totalQuestions={FULL_QUIZ_COUNT}
          quickPoolSize={
            QUIZ_QUESTIONS.filter((q) => q.quizMode === 'quick' || q.quizMode === 'both').length
          }
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
