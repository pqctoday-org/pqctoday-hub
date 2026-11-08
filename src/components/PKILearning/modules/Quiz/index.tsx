// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useCallback, useEffect, useRef, useMemo, type ReactNode } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { useModuleStore } from '@/store/useModuleStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { PERSONAS } from '@/data/learningPersonas'
import { QUIZ_QUESTIONS, quizMetadata, QUIZ_CATEGORIES } from '@/data/quizData'
import { QuizIntro } from './QuizIntro'
import { OTHER_ROLES_SCORE_NOTE } from './roleScope'
import { QuizWizard } from './QuizWizard'
import type { QuizCompletionData } from './QuizWizard'
import { QuizResults } from './QuizResults'
import type { QuizCategory, QuizMode, QuizQuestion } from './types'
import { logQuizSession } from '@/utils/analytics'
import { useIsMobileShell } from '@/hooks/useIsMobileShell'
import { MobileQuizWizard } from '@/components/Mobile/screens/MobileQuizWizard'
import { MobileQuizResults } from '@/components/Mobile/screens/MobileQuizResults'
import { Button } from '@/components/ui/button'

const MODULE_ID = 'quiz'
const SECONDS_PER_QUESTION = 45
const QUICK_POOL_THRESHOLD_MIN = 15
const DEFAULT_TIME_MIN = 15
const MIN_PER_CATEGORY = 2
/** The Quick pick size: the desktop's default 15-minute run (15 x 60 / 45 s). */
const QUICK_PICK_QUESTIONS = 20
const ALL_DIFFICULTIES = ['beginner', 'intermediate', 'advanced']

function categoryLabel(id: QuizCategory): string {
  return QUIZ_CATEGORIES.find((c) => c.id === id)?.label ?? id
}

function difficultyLabel(difficulty: string): string {
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
}

interface NoMatchingQuestionsProps {
  /** Topics that have no question under the current filters (empty: the whole selection). */
  topics: QuizCategory[]
  difficulties: string[]
  industry: string | null
  roleLabel?: string
  /** This quiz is already showing every role's questions. */
  allRoles?: boolean
  onBroadenDifficulty?: () => void
  onClearIndustry?: () => void
  /** Offered only when widening to all roles would give the requested topics a question. */
  onShowAllRoles?: () => void
  onBack?: () => void
}

/**
 * Says why a requested quiz cannot start and offers the ways to widen it, so a topic that the
 * difficulty, industry or role filters leave empty never opens as a blank quiz.
 */
function NoMatchingQuestions({
  topics,
  difficulties,
  industry,
  roleLabel,
  allRoles,
  onBroadenDifficulty,
  onClearIndustry,
  onShowAllRoles,
  onBack,
}: NoMatchingQuestionsProps) {
  const subject = topics.length > 0 ? topics.map(categoryLabel).join(', ') : 'Your selection'
  const verb = topics.length > 1 ? 'have' : 'has'
  const filters = [
    `difficulty: ${difficulties.map(difficultyLabel).join(', ')}`,
    ...(industry ? [`industry: ${industry}`] : []),
    ...(roleLabel ? [`role: ${allRoles ? 'all roles' : roleLabel}`] : []),
  ].join('; ')
  return (
    <div
      role="status"
      data-testid="quiz-no-match"
      className="flex flex-col gap-3 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-4"
    >
      <p className="text-sm font-semibold text-foreground">No matching questions</p>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {subject} {verb} no questions for the current filters ({filters}). Widen the filters or
        choose a different topic.
      </p>
      <div className="flex flex-wrap gap-2">
        {onBroadenDifficulty && (
          <Button variant="outline" onClick={onBroadenDifficulty}>
            Include all difficulty levels
          </Button>
        )}
        {onClearIndustry && (
          <Button variant="outline" onClick={onClearIndustry}>
            Clear the industry filter
          </Button>
        )}
        {onShowAllRoles && (
          // h-auto / whitespace-normal: the default button is one line high and never wraps, so
          // this longer label would run past a 320 px screen.
          <Button
            variant="outline"
            onClick={onShowAllRoles}
            aria-describedby="quiz-all-roles-note"
            className="h-auto min-h-11 whitespace-normal py-2 text-left"
          >
            Show questions for all roles
          </Button>
        )}
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Choose a different topic
          </Button>
        )}
      </div>
      {onShowAllRoles && (
        <p id="quiz-all-roles-note" className="text-xs leading-relaxed text-muted-foreground">
          This changes this quiz only, not your role on the rest of the site.{' '}
          {OTHER_ROLES_SCORE_NOTE}
        </p>
      )}
    </div>
  )
}

/** The time a run of `questions` takes at the quiz's pace, to the nearest 5 minutes. */
function aboutMinutes(questions: number): number {
  return Math.max(5, Math.round((questions * SECONDS_PER_QUESTION) / 60 / 5) * 5)
}

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
  const navigate = useNavigate()
  const isMobileShell = useIsMobileShell()
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
  const [lastLimit, setLastLimit] = useState<number | undefined>(undefined)
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>(() => {
    if (experienceLevel === 'curious') return ['beginner']
    if (experienceLevel === 'basics') return ['beginner', 'intermediate']
    return ['beginner', 'intermediate', 'advanced']
  })
  // The topics of a start that the filters left with no question; null when no start came up empty.
  const [emptyRunTopics, setEmptyRunTopics] = useState<QuizCategory[] | null>(null)
  const startTimeRef = useRef(0)

  // Every role's questions for this quiz only. It is never written to the persona store, so the rest
  // of the site keeps the reader's role, and it is not stored: a new visit starts with the role on.
  const [allRoles, setAllRoles] = useState(false)
  const allRolesRadioRef = useRef<HTMLInputElement>(null)
  const focusRoleScopeAfterWiden = useRef(false)

  // The difficulty and industry filters, before the role filter narrows it.
  const unscopedPool = useMemo(() => {
    let pool = QUIZ_QUESTIONS.filter((q) => selectedDifficulties.includes(q.difficulty))
    if (industryFilter) {
      pool = pool.filter((q) => q.industries.length === 0 || q.industries.includes(industryFilter))
    }
    return pool
  }, [selectedDifficulties, industryFilter])

  const filteredQuestions = useMemo(() => {
    if (!selectedPersona || allRoles) return unscopedPool
    return unscopedPool.filter(
      (q) => q.personas.length === 0 || q.personas.includes(selectedPersona)
    )
  }, [selectedPersona, allRoles, unscopedPool])

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

  // Topics asked for in the link or by a checkpoint that the filters leave with no question. The
  // topic list hides them, so without this the reader would start a quiz that has nothing in it.
  const requestedTopics = urlCategories ?? checkpointState?.checkpointCategories
  const unavailableTopics = useMemo(() => {
    const available = new Set<string>(filteredCategories.map((c) => c.id))
    return (requestedTopics ?? []).filter((id) => !available.has(id))
  }, [requestedTopics, filteredCategories])

  const handleBroadenDifficulty = useCallback(() => {
    setSelectedDifficulties(ALL_DIFFICULTIES)
    setEmptyRunTopics(null)
  }, [])

  const handleClearIndustry = useCallback(() => {
    userClearedFilter.current = true
    setIndustryFilter(null)
    setEmptyRunTopics(null)
  }, [])

  const handleAllRolesChange = useCallback((all: boolean) => {
    setAllRoles(all)
    setEmptyRunTopics(null)
  }, [])

  // The notice button leaves the page when it is used, so focus would fall back to the document;
  // on the desktop intro hand it to the role switch, which is where the reader can undo the change.
  // The phone has no switch (the view changes to the quiz or the length choice), so there it is a no-op.
  const handleShowAllRoles = useCallback(() => {
    focusRoleScopeAfterWiden.current = true
    handleAllRolesChange(true)
  }, [handleAllRolesChange])

  useEffect(() => {
    if (allRoles && focusRoleScopeAfterWiden.current) {
      focusRoleScopeAfterWiden.current = false
      allRolesRadioRef.current?.focus()
    }
  }, [allRoles])

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

  const initialCategories = useMemo(
    () =>
      urlCategories ??
      checkpointState?.checkpointCategories ??
      (persona && persona.quizCategories.length > 0
        ? (persona.quizCategories as QuizCategory[])
        : undefined),
    [urlCategories, checkpointState?.checkpointCategories, persona]
  )

  const handleStart = useCallback(
    (mode: QuizMode, categories: QuizCategory[], timeMinutes?: number, limit?: number) => {
      setLastMode(mode)
      setLastCategories(categories)
      setLastLimit(limit)
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
        // Category mode: filter by selected categories, use all questions (or a Quick pick sample)
        const filtered = filteredQuestions.filter((q) => categories.includes(q.category))
        selected = limit
          ? sampleQuestions(filtered, Math.min(limit, filtered.length))
          : shuffleArray(filtered)
      }

      // Never open a quiz with nothing in it: stay on the intro and say why.
      if (selected.length === 0) {
        setEmptyRunTopics(categories)
        return
      }
      setEmptyRunTopics(null)
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

      logQuizSession(correctIds.length, Object.keys(data.results).length)
    },
    [updateModuleProgress, markStepComplete, mergeCorrectQuestionIds, previousScores]
  )

  const handleRetake = useCallback(() => {
    handleStart(lastMode, lastCategories, lastTimeMin, lastLimit)
  }, [handleStart, lastMode, lastCategories, lastTimeMin, lastLimit])

  const handleChangeTopics = useCallback(() => {
    setView('intro')
    setCompletionData(null)
  }, [])

  const handleExitQuiz = useCallback(() => {
    setView('intro')
  }, [])

  // Mobile checkpoint quiz — the handoff's quiz screen has no topic/mode/
  // difficulty picker at all ("One question per screen"), so this skips
  // QuizIntro entirely and auto-starts in category mode the moment real
  // categories resolve (the same ?category=/checkpointState/persona
  // priority QuizIntro's own initialCategories prop already uses). A bare
  // /learn/quiz visit with no resolvable categories has no real mobile
  // entry point today (every mobile CTA — MobileMyPathView's checkpoint and
  // capstone buttons — always passes ?category=), so that case renders a
  // stated placeholder below rather than a mobile topic picker nobody can
  // reach without deep-linking manually.
  //
  // The final quiz (a plain visit, or the capstone button: no checkpoint state) is
  // different: it can hold well over a hundred questions, so a phone reader first
  // picks Quick pick (20 questions) or the full run, as the desktop offers. Checkpoint
  // quizzes still start at once.
  const mobileAutoStarted = useRef(false)
  const isCheckpointVisit = !!checkpointState?.checkpointCategories?.length
  const mobilePoolSize = useMemo(
    () =>
      initialCategories
        ? filteredQuestions.filter((q) => initialCategories.includes(q.category)).length
        : 0,
    [filteredQuestions, initialCategories]
  )
  const offerLengthChoice = !isCheckpointVisit && mobilePoolSize > QUICK_PICK_QUESTIONS
  // The topics of the link that still have a question under the filters; the rest are left out.
  const mobileTopicCount = useMemo(() => {
    const available = new Set<string>(filteredCategories.map((c) => c.id))
    return (initialCategories ?? []).filter((id) => available.has(id)).length
  }, [filteredCategories, initialCategories])
  // The link names topics and the filters leave none of them with a question: say so, do not start.
  const mobileNoMatch = !!initialCategories?.length && mobilePoolSize === 0
  const noMatchTopics = useMemo(() => {
    const available = new Set<string>(filteredCategories.map((c) => c.id))
    const ids = [
      ...(requestedTopics ?? []),
      ...(emptyRunTopics ?? []),
      ...(isMobileShell && mobileNoMatch ? (initialCategories ?? []) : []),
    ]
    return [...new Set(ids)].filter((id) => !available.has(id))
  }, [
    filteredCategories,
    requestedTopics,
    emptyRunTopics,
    isMobileShell,
    mobileNoMatch,
    initialCategories,
  ])
  const showNoMatch =
    emptyRunTopics !== null || (isMobileShell ? mobileNoMatch : unavailableTopics.length > 0)
  // Offer every role's questions only when they would give the requested topics something to ask
  // under the current difficulty and industry filters; a role that already has them gets no button.
  const widenToAllRolesHelps = useMemo(() => {
    if (!selectedPersona || allRoles) return false
    if (noMatchTopics.length === 0) return unscopedPool.length > filteredQuestions.length
    const wanted = new Set<string>(noMatchTopics)
    return unscopedPool.some((q) => wanted.has(q.category))
  }, [selectedPersona, allRoles, noMatchTopics, unscopedPool, filteredQuestions.length])
  useEffect(() => {
    if (
      isMobileShell &&
      view === 'intro' &&
      !mobileAutoStarted.current &&
      !offerLengthChoice &&
      !mobileNoMatch &&
      initialCategories &&
      initialCategories.length > 0
    ) {
      mobileAutoStarted.current = true
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: the mobile checkpoint quiz has no intro/Start button to click, so this is the one-time auto-start in place of that user action, guarded by the ref above
      handleStart('category', initialCategories)
    }
  }, [isMobileShell, view, initialCategories, offerLengthChoice, mobileNoMatch, handleStart])

  const noMatchNotice = showNoMatch ? (
    <NoMatchingQuestions
      topics={noMatchTopics}
      difficulties={selectedDifficulties}
      industry={industryFilter}
      roleLabel={persona?.label}
      allRoles={allRoles}
      onBroadenDifficulty={
        selectedDifficulties.length < ALL_DIFFICULTIES.length ? handleBroadenDifficulty : undefined
      }
      onClearIndustry={industryFilter ? handleClearIndustry : undefined}
      onShowAllRoles={widenToAllRolesHelps ? handleShowAllRoles : undefined}
      onBack={isMobileShell ? () => navigate(-1) : undefined}
    />
  ) : null

  if (isMobileShell) {
    const baseTitle = checkpointState?.checkpointLabel ?? persona?.label ?? 'Quiz'
    const title = allRoles ? `${baseTitle} · all roles` : baseTitle
    let body: ReactNode
    if (view === 'quiz') {
      body = (
        <MobileQuizWizard
          questions={quizQuestions}
          title={title}
          onComplete={handleComplete}
          onExit={() => navigate(-1)}
        />
      )
    } else if (view === 'results' && completionData) {
      body = (
        <MobileQuizResults
          summary={completionData.summary}
          onRetake={handleRetake}
          onExit={() => navigate(-1)}
        />
      )
    } else if (view === 'intro' && offerLengthChoice && initialCategories) {
      body = (
        // px-4 pb-4 pt-4: the same 16 px side gutter the quiz and its results screen use.
        <div className="flex flex-col gap-3 px-4 pb-4 pt-4" data-testid="quiz-length-choice">
          <p className="text-[12.5px] leading-relaxed text-muted-foreground">
            {mobilePoolSize} questions across {mobileTopicCount}{' '}
            {mobileTopicCount === 1 ? 'topic' : 'topics'}.
            {allRoles && ` From all roles, for this quiz only. ${OTHER_ROLES_SCORE_NOTE}`}
          </p>
          {allRoles && persona && (
            // The phone has no switch; this is its way back to the reader's own role.
            <Button
              variant="outline"
              onClick={() => handleAllRolesChange(false)}
              className="h-auto min-h-11 whitespace-normal py-2 text-left"
            >
              Back to {persona.label} only
            </Button>
          )}
          <Button
            variant="gradient"
            onClick={() => {
              mobileAutoStarted.current = true
              handleStart('category', initialCategories, undefined, QUICK_PICK_QUESTIONS)
            }}
          >
            Quick pick ({QUICK_PICK_QUESTIONS} questions, about {aboutMinutes(QUICK_PICK_QUESTIONS)}{' '}
            min)
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              mobileAutoStarted.current = true
              handleStart('category', initialCategories)
            }}
          >
            Full quiz ({mobilePoolSize} questions, about {aboutMinutes(mobilePoolSize)} min)
          </Button>
        </div>
      )
    } else if (view === 'intro' && noMatchNotice) {
      body = <div className="mx-4 mt-4">{noMatchNotice}</div>
    } else {
      body = (
        <div className="mx-4 mt-4 flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-6 text-center">
          <p className="text-[12.5px] font-semibold text-foreground">Nothing to quiz here yet</p>
          <p className="text-[11.5px] leading-relaxed text-muted-foreground">
            Open a checkpoint from a phase in Learn to take its quiz.
          </p>
        </div>
      )
    }
    // The phone header title is plain text, so the page names itself, whichever view shows.
    return (
      <>
        <h1 className="sr-only">PQC Quiz</h1>
        {body}
      </>
    )
  }

  return (
    <div className="w-full">
      {view === 'intro' && noMatchNotice && <div className="mb-6">{noMatchNotice}</div>}
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
          initialCategories={initialCategories}
          personaLabel={checkpointState?.checkpointLabel ?? persona?.label}
          roleLabel={persona?.label}
          allRoles={allRoles}
          onAllRolesChange={handleAllRolesChange}
          allRolesRadioRef={allRolesRadioRef}
          industryFilter={industryFilter}
          onClearIndustryFilter={() => {
            userClearedFilter.current = true
            setIndustryFilter(null)
          }}
          selectedDifficulties={selectedDifficulties}
          onToggleDifficulty={(diff: string) => {
            setEmptyRunTopics(null)
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
