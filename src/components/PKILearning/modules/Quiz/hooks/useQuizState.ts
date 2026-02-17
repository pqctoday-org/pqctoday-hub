import { useReducer, useCallback, useRef } from 'react'
import type {
  QuizQuestion,
  QuizCategory,
  QuizSessionState,
  QuizScoreSummary,
  CategoryScore,
} from '../types'

type QuizAction =
  | { type: 'START_QUIZ'; questions: QuizQuestion[] }
  | { type: 'SELECT_ANSWER'; questionId: string; answer: string | string[] }
  | { type: 'SUBMIT_ANSWER' }
  | { type: 'NEXT_QUESTION' }
  | { type: 'PREV_QUESTION' }
  | { type: 'COMPLETE_QUIZ' }
  | { type: 'RESET' }

const initialState: QuizSessionState = {
  selectedCategories: [],
  questions: [],
  currentIndex: 0,
  answers: {},
  results: {},
  hasSubmittedCurrent: false,
  isComplete: false,
  startedAt: 0,
}

function checkAnswer(question: QuizQuestion, answer: string | string[]): boolean {
  if (question.type === 'multi-select') {
    const correct = [...(question.correctAnswer as string[])].sort()
    const given = [...(answer as string[])].sort()
    return correct.length === given.length && correct.every((v, i) => v === given[i])
  }
  return answer === question.correctAnswer
}

function quizReducer(state: QuizSessionState, action: QuizAction): QuizSessionState {
  switch (action.type) {
    case 'START_QUIZ':
      return {
        ...initialState,
        questions: action.questions,
        startedAt: Date.now(),
      }

    case 'SELECT_ANSWER': {
      return {
        ...state,
        answers: {
          ...state.answers,
          [action.questionId]: action.answer,
        },
      }
    }

    case 'SUBMIT_ANSWER': {
      const currentQuestion = state.questions[state.currentIndex]
      if (!currentQuestion) return state
      const answer = state.answers[currentQuestion.id]
      if (answer === undefined) return state

      return {
        ...state,
        hasSubmittedCurrent: true,
        results: {
          ...state.results,
          [currentQuestion.id]: checkAnswer(currentQuestion, answer),
        },
      }
    }

    case 'NEXT_QUESTION': {
      const nextIndex = state.currentIndex + 1
      if (nextIndex >= state.questions.length) {
        return { ...state, isComplete: true }
      }
      return {
        ...state,
        currentIndex: nextIndex,
        hasSubmittedCurrent: state.results[state.questions[nextIndex]?.id] !== undefined,
      }
    }

    case 'PREV_QUESTION': {
      const prevIndex = Math.max(0, state.currentIndex - 1)
      return {
        ...state,
        currentIndex: prevIndex,
        hasSubmittedCurrent: state.results[state.questions[prevIndex]?.id] !== undefined,
      }
    }

    case 'COMPLETE_QUIZ':
      return { ...state, isComplete: true }

    case 'RESET':
      return initialState

    default:
      return state
  }
}

function computeScoreSummary(state: QuizSessionState): QuizScoreSummary {
  const byCategory: Partial<Record<QuizCategory, CategoryScore>> = {}
  const byDifficulty: Record<string, CategoryScore> = {}
  let totalCorrect = 0

  for (const question of state.questions) {
    const isCorrect = state.results[question.id] ?? false
    if (isCorrect) totalCorrect++

    // Category scores
    if (!byCategory[question.category]) {
      byCategory[question.category] = { correct: 0, total: 0, percentage: 0 }
    }
    const cat = byCategory[question.category]!
    cat.total++
    if (isCorrect) cat.correct++

    // Difficulty scores
    if (!byDifficulty[question.difficulty]) {
      byDifficulty[question.difficulty] = { correct: 0, total: 0, percentage: 0 }
    }
    const diff = byDifficulty[question.difficulty]
    diff.total++
    if (isCorrect) diff.correct++
  }

  // Calculate percentages
  for (const score of Object.values(byCategory)) {
    if (score)
      score.percentage = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0
  }
  for (const score of Object.values(byDifficulty)) {
    score.percentage = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0
  }

  const total = state.questions.length
  return {
    overall: {
      correct: totalCorrect,
      total,
      percentage: total > 0 ? Math.round((totalCorrect / total) * 100) : 0,
    },
    byCategory,
    byDifficulty,
    timeSpentSeconds: Math.round((Date.now() - state.startedAt) / 1000),
  }
}

export function useQuizState() {
  const [state, dispatch] = useReducer(quizReducer, initialState)
  const startTimeRef = useRef(0)

  const startQuiz = useCallback((questions: QuizQuestion[]) => {
    startTimeRef.current = Date.now()
    dispatch({ type: 'START_QUIZ', questions })
  }, [])

  const selectAnswer = useCallback((questionId: string, answer: string | string[]) => {
    dispatch({ type: 'SELECT_ANSWER', questionId, answer })
  }, [])

  const submitAnswer = useCallback(() => {
    dispatch({ type: 'SUBMIT_ANSWER' })
  }, [])

  const nextQuestion = useCallback(() => {
    dispatch({ type: 'NEXT_QUESTION' })
  }, [])

  const prevQuestion = useCallback(() => {
    dispatch({ type: 'PREV_QUESTION' })
  }, [])

  const completeQuiz = useCallback(() => {
    dispatch({ type: 'COMPLETE_QUIZ' })
  }, [])

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' })
  }, [])

  const getScoreSummary = useCallback(() => {
    return computeScoreSummary(state)
  }, [state])

  const currentQuestion = state.questions[state.currentIndex] ?? null
  const currentAnswer = currentQuestion ? state.answers[currentQuestion.id] : undefined
  const hasAnswered = currentAnswer !== undefined
  const isLastQuestion = state.currentIndex === state.questions.length - 1

  return {
    state,
    currentQuestion,
    currentAnswer,
    hasAnswered,
    isLastQuestion,
    startQuiz,
    selectAnswer,
    submitAnswer,
    nextQuestion,
    prevQuestion,
    completeQuiz,
    reset,
    getScoreSummary,
  }
}
