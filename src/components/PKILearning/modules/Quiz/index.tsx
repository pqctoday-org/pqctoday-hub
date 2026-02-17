import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useModuleStore } from '@/store/useModuleStore'
import { QUIZ_QUESTIONS } from '@/data/quizData'
import { QuizIntro } from './QuizIntro'
import { QuizWizard } from './QuizWizard'
import type { QuizCompletionData } from './QuizWizard'
import { QuizResults } from './QuizResults'
import type { QuizCategory, QuizMode, QuizQuestion } from './types'

const MODULE_ID = 'quiz'
const QUICK_QUIZ_COUNT = 20

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function sampleQuestions(questions: QuizQuestion[], count: number): QuizQuestion[] {
  const byCategory = new Map<QuizCategory, QuizQuestion[]>()
  for (const q of questions) {
    const group = byCategory.get(q.category) || []
    group.push(q)
    byCategory.set(q.category, group)
  }

  const totalQuestions = questions.length
  const sampled: QuizQuestion[] = []
  let remaining = count

  const entries = [...byCategory.entries()]
  for (let i = 0; i < entries.length; i++) {
    const [, categoryQuestions] = entries[i]
    const isLast = i === entries.length - 1
    const proportion = categoryQuestions.length / totalQuestions
    const toTake = isLast ? remaining : Math.max(1, Math.round(count * proportion))
    const shuffled = shuffleArray(categoryQuestions)
    sampled.push(...shuffled.slice(0, Math.min(toTake, remaining)))
    remaining -= Math.min(toTake, remaining)
    if (remaining <= 0) break
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
      selected = sampleQuestions(QUIZ_QUESTIONS, QUICK_QUIZ_COUNT)
    } else if (mode === 'full') {
      selected = shuffleArray(QUIZ_QUESTIONS)
    } else {
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
      {view === 'intro' && <QuizIntro previousScores={previousScores} onStart={handleStart} />}
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
