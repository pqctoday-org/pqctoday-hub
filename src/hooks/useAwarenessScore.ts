/* eslint-disable security/detect-object-injection */
import { useMemo } from 'react'
import { useModuleStore } from '@/store/useModuleStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { PERSONAS } from '@/data/learningPersonas'
import { quizPersonaCounts, quizPersonaQuestionIds } from '@/data/quizDataLoader'
import { MODULE_STEP_COUNTS, MODULE_TRACKS } from '@/components/PKILearning/moduleData'

export interface BeltThresholds {
  minQuizPct: number
  minStepsPct: number
  minArtifacts: number
  minTimeMinutes: number
  minStreak: number
}

export interface BeltRank {
  name: string
  minScore: number
  maxScore: number
  color: string
  textColor: string
  tagline: string
  thresholds: BeltThresholds
}

export const BELT_RANKS: BeltRank[] = [
  {
    name: 'White Belt',
    minScore: 0,
    maxScore: 14,
    color: '#F5F5F5',
    textColor: '#374151',
    tagline: 'Beginning the journey',
    thresholds: { minQuizPct: 0, minStepsPct: 0, minArtifacts: 0, minTimeMinutes: 0, minStreak: 0 },
  },
  {
    name: 'Yellow Belt',
    minScore: 15,
    maxScore: 29,
    color: '#EAB308',
    textColor: '#1C1917',
    tagline: 'Learning the basics',
    thresholds: {
      minQuizPct: 15,
      minStepsPct: 10,
      minArtifacts: 0,
      minTimeMinutes: 15,
      minStreak: 0,
    },
  },
  {
    name: 'Orange Belt',
    minScore: 30,
    maxScore: 44,
    color: '#F97316',
    textColor: '#1C1917',
    tagline: 'Exploring foundations',
    thresholds: {
      minQuizPct: 30,
      minStepsPct: 25,
      minArtifacts: 2,
      minTimeMinutes: 45,
      minStreak: 0,
    },
  },
  {
    name: 'Green Belt',
    minScore: 45,
    maxScore: 59,
    color: '#16A34A',
    textColor: '#F0FDF4',
    tagline: 'Solid fundamentals developing',
    thresholds: {
      minQuizPct: 45,
      minStepsPct: 40,
      minArtifacts: 3,
      minTimeMinutes: 90,
      minStreak: 3,
    },
  },
  {
    name: 'Blue Belt',
    minScore: 60,
    maxScore: 74,
    color: '#1D4ED8',
    textColor: '#EFF6FF',
    tagline: 'Building depth consistently',
    thresholds: {
      minQuizPct: 60,
      minStepsPct: 60,
      minArtifacts: 5,
      minTimeMinutes: 180,
      minStreak: 4,
    },
  },
  {
    name: 'Brown Belt',
    minScore: 75,
    maxScore: 87,
    color: '#78350F',
    textColor: '#FEF3C7',
    tagline: 'Strong practitioner',
    thresholds: {
      minQuizPct: 75,
      minStepsPct: 80,
      minArtifacts: 7,
      minTimeMinutes: 300,
      minStreak: 5,
    },
  },
  {
    name: 'Black Belt',
    minScore: 88,
    maxScore: 100,
    color: '#111827',
    textColor: '#F9FAFB',
    tagline: 'PQC mastery achieved',
    thresholds: {
      minQuizPct: 90,
      minStepsPct: 95,
      minArtifacts: 10,
      minTimeMinutes: 600,
      minStreak: 7,
    },
  },
]

export interface DimensionScore {
  raw: number
  weighted: number
  weight: number
  label: string
  detail: string
}

export interface TrackProgress {
  track: string
  completedModules: number
  totalModules: number
  completedSteps: number
  totalSteps: number
  percentComplete: number
}

export interface AwarenessScoreResult {
  hasStarted: boolean
  score: number
  belt: BeltRank
  nextBelt: BeltRank | null
  pointsToNextBelt: number
  cappedByThreshold: string | null
  breakdown: {
    knowledge: DimensionScore
    breadth: DimensionScore
    practice: DimensionScore
    timeConsistency: DimensionScore
  }
  trackProgress: TrackProgress[]
  streak: {
    current: number
    longest: number
    totalSessions: number
  }
  totalMinutes: number
  artifactCount: number
  totalPersonaSteps: number
  totalPersonaQuestions: number
}

// Exclude quiz and assess — they are not learning-track modules and would
// create a hidden 2-step gap between the breadth display and track breakdown.
const BREADTH_EXCLUDED = new Set(['quiz', 'assess'])
const TIME_CAP = 600
const STREAK_CAP = 7

export function useAwarenessScore(): AwarenessScoreResult {
  const modules = useModuleStore((s) => s.modules)
  const artifacts = useModuleStore((s) => s.artifacts)
  const sessionTracking = useModuleStore((s) => s.sessionTracking)
  const quizMastery = useModuleStore((s) => s.quizMastery)
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)

  return useMemo(() => {
    const allModuleIds = Object.keys(MODULE_STEP_COUNTS)

    // ── Persona-scoped module IDs and step total ────────────────────────────
    const personaModuleIds = selectedPersona
      ? PERSONAS[selectedPersona].pathItems
          .filter((item): item is { type: 'module'; moduleId: string } => item.type === 'module')
          .map((item) => item.moduleId)
          .filter((id) => !BREADTH_EXCLUDED.has(id))
      : allModuleIds.filter((id) => !BREADTH_EXCLUDED.has(id))

    const personaTotalSteps = personaModuleIds.reduce(
      (sum, id) => sum + (MODULE_STEP_COUNTS[id] ?? 0),
      0
    )

    // ── Persona-scoped quiz question total ──────────────────────────────────
    const personaKey = selectedPersona ?? 'all'
    const totalPersonaQuestions = quizPersonaCounts[personaKey] ?? 0
    const personaIdSet = quizPersonaQuestionIds[personaKey]

    const personaModuleIdSet = new Set(personaModuleIds)

    const hasStarted = allModuleIds.some(
      (id) => modules[id]?.status === 'in-progress' || modules[id]?.status === 'completed'
    )

    if (!hasStarted) {
      return {
        hasStarted: false,
        score: 0,
        belt: BELT_RANKS[0],
        nextBelt: BELT_RANKS[1],
        pointsToNextBelt: BELT_RANKS[1].minScore,
        cappedByThreshold: null,
        breakdown: {
          knowledge: {
            raw: 0,
            weighted: 0,
            weight: 0.4,
            label: 'Knowledge',
            detail: 'Take the quiz to measure your knowledge',
          },
          breadth: {
            raw: 0,
            weighted: 0,
            weight: 0.3,
            label: 'Breadth',
            detail: 'Complete module steps to build breadth',
          },
          practice: {
            raw: 0,
            weighted: 0,
            weight: 0.2,
            label: 'Practice',
            detail: 'Generate keys and certificates in modules',
          },
          timeConsistency: {
            raw: 0,
            weighted: 0,
            weight: 0.1,
            label: 'Time & Consistency',
            detail: 'Spend time learning and return daily',
          },
        },
        trackProgress: MODULE_TRACKS.map((t) => {
          const relevantModules = t.modules.filter((m) => personaModuleIdSet.has(m.id))
          if (relevantModules.length === 0) return null
          return {
            track: t.track,
            completedModules: 0,
            totalModules: relevantModules.length,
            completedSteps: 0,
            totalSteps: relevantModules.reduce((s, m) => s + (MODULE_STEP_COUNTS[m.id] ?? 0), 0),
            percentComplete: 0,
          }
        }).filter((t): t is TrackProgress => t !== null),
        streak: { current: 0, longest: 0, totalSessions: 0 },
        totalMinutes: 0,
        artifactCount: 0,
        totalPersonaSteps: personaTotalSteps,
        totalPersonaQuestions,
      }
    }

    // ── Knowledge (40%) — cumulative mastery or legacy fallback ──────────────
    const correctIds = quizMastery?.correctQuestionIds ?? []
    const hasCumulative = correctIds.length > 0
    const personaCorrectCount = personaIdSet
      ? correctIds.filter((id) => personaIdSet.has(id)).length
      : correctIds.length

    // Legacy per-session fallback values
    const quizMod = modules['quiz']
    const quizOverall = quizMod?.quizScores?.['overall'] ?? 0
    const categoryCount = Object.keys(quizMod?.quizScores ?? {}).filter(
      (k) => k !== 'overall'
    ).length
    const categoryBonus = Math.min(20, categoryCount * 1.5)

    let knowledgeRaw: number
    let knowledgeDetail: string

    if (hasCumulative) {
      knowledgeRaw =
        totalPersonaQuestions > 0
          ? Math.round((personaCorrectCount / totalPersonaQuestions) * 100)
          : 0
      knowledgeDetail = `${personaCorrectCount} / ${totalPersonaQuestions} questions mastered`
    } else if (quizOverall === 0) {
      knowledgeRaw = 0
      knowledgeDetail = 'Take the quiz to measure your knowledge'
    } else {
      knowledgeRaw = Math.min(100, quizOverall * 0.8 + categoryBonus)
      knowledgeDetail = `${Math.round(quizOverall)}% overall${categoryCount > 0 ? ` · ${categoryCount} categor${categoryCount === 1 ? 'y' : 'ies'}` : ''}`
    }

    // Quiz metric for threshold gates (cumulative mastery or legacy per-session)
    const quizMetric = hasCumulative
      ? totalPersonaQuestions > 0
        ? (personaCorrectCount / totalPersonaQuestions) * 100
        : 0
      : quizOverall

    // ── Breadth (30%) — persona-scoped ──────────────────────────────────────
    let totalCompletedSteps = 0
    for (const id of personaModuleIds) {
      const mod = modules[id]
      if (mod) {
        totalCompletedSteps += Math.min(mod.completedSteps.length, MODULE_STEP_COUNTS[id] ?? 0)
      }
    }
    const breadthRaw =
      personaTotalSteps > 0 ? Math.round((totalCompletedSteps / personaTotalSteps) * 100) : 0
    const breadthDetail = `${totalCompletedSteps} / ${personaTotalSteps} steps`

    // ── Practice (20%) ───────────────────────────────────────────────────────
    const keyCount = artifacts.keys.length
    const certCount = artifacts.certificates.length
    const csrCount = artifacts.csrs.length
    const artifactCount = keyCount + certCount + csrCount
    const keyScore = Math.min(40, keyCount * 8)
    const certScore = Math.min(35, certCount * 7)
    const csrScore = Math.min(25, csrCount * 5)
    const practiceRaw = Math.min(100, keyScore + certScore + csrScore)

    let practiceDetail: string
    if (artifactCount === 0) {
      practiceDetail = 'Generate keys and certificates in modules'
    } else {
      const parts: string[] = []
      if (keyCount > 0) parts.push(`${keyCount} key${keyCount > 1 ? 's' : ''}`)
      if (certCount > 0) parts.push(`${certCount} cert${certCount > 1 ? 's' : ''}`)
      if (csrCount > 0) parts.push(`${csrCount} CSR${csrCount > 1 ? 's' : ''}`)
      practiceDetail = parts.join(' · ')
    }

    // ── Time + Consistency (10%) ─────────────────────────────────────────────
    let totalMinutes = 0
    for (const id of allModuleIds) {
      totalMinutes += modules[id]?.timeSpent ?? 0
    }
    // Guard against corrupted large values
    totalMinutes = Math.min(totalMinutes, TIME_CAP * 10)

    const currentStreak = sessionTracking?.currentStreak ?? 0
    const longestStreak = sessionTracking?.longestStreak ?? 0
    const totalSessions = sessionTracking?.totalSessions ?? 0

    const timeScore = Math.min(100, (totalMinutes / TIME_CAP) * 100)
    const streakScore = Math.min(100, (currentStreak / STREAK_CAP) * 100)
    const timeConsistencyRaw = Math.round(timeScore * 0.6 + streakScore * 0.4)

    const timeParts: string[] = []
    if (totalMinutes > 0) timeParts.push(`${Math.round(totalMinutes)} min`)
    if (currentStreak >= 2) timeParts.push(`${currentStreak}-day streak`)
    const timeDetail =
      timeParts.length > 0 ? timeParts.join(' · ') : 'Spend time learning and return daily'

    // ── Composite Score ──────────────────────────────────────────────────────
    const score = Math.round(
      knowledgeRaw * 0.4 + breadthRaw * 0.3 + practiceRaw * 0.2 + timeConsistencyRaw * 0.1
    )

    // ── Belt Assignment (with threshold gating) ───────────────────────────────
    const stepsPct = personaTotalSteps > 0 ? (totalCompletedSteps / personaTotalSteps) * 100 : 0

    let earnedBelt = BELT_RANKS[0]
    let cappedByThreshold: string | null = null

    for (const belt of BELT_RANKS) {
      if (score < belt.minScore) break

      const t = belt.thresholds
      const quizOk = quizMetric >= t.minQuizPct
      const stepsOk = stepsPct >= t.minStepsPct
      const artifactsOk = artifactCount >= t.minArtifacts
      const timeOk = totalMinutes >= t.minTimeMinutes
      const streakOk = currentStreak >= t.minStreak

      if (quizOk && stepsOk && artifactsOk && timeOk && streakOk) {
        earnedBelt = belt
      } else {
        // Identify the first unmet threshold for the next belt
        if (!cappedByThreshold) {
          if (!quizOk) {
            const needed = hasCumulative
              ? Math.ceil((t.minQuizPct / 100) * totalPersonaQuestions) - personaCorrectCount
              : Math.ceil(t.minQuizPct - quizOverall)
            cappedByThreshold = hasCumulative
              ? `Need ${needed} more correct question${needed > 1 ? 's' : ''} for ${belt.name}`
              : `Need ${needed}% more on the quiz for ${belt.name}`
          } else if (!stepsOk)
            cappedByThreshold = `Need ${Math.ceil((t.minStepsPct / 100) * personaTotalSteps) - totalCompletedSteps} more steps for ${belt.name}`
          else if (!artifactsOk)
            cappedByThreshold = `Need ${t.minArtifacts - artifactCount} more artifact${t.minArtifacts - artifactCount > 1 ? 's' : ''} for ${belt.name}`
          else if (!timeOk)
            cappedByThreshold = `Need ${Math.ceil(t.minTimeMinutes - totalMinutes)} more min learning for ${belt.name}`
          else if (!streakOk)
            cappedByThreshold = `Need a ${t.minStreak}-day streak for ${belt.name}`
        }
        break
      }
    }

    const nextBeltIdx = BELT_RANKS.indexOf(earnedBelt) + 1
    const nextBelt = nextBeltIdx < BELT_RANKS.length ? BELT_RANKS[nextBeltIdx] : null
    const pointsToNextBelt = nextBelt ? Math.max(0, nextBelt.minScore - score) : 0

    // ── Track Progress (persona-scoped) ────────────────────────────────────────
    const trackProgress: TrackProgress[] = MODULE_TRACKS.map((t) => {
      const relevantModules = t.modules.filter((m) => personaModuleIdSet.has(m.id))
      if (relevantModules.length === 0) return null

      const trackStepTotal = relevantModules.reduce(
        (s, m) => s + (MODULE_STEP_COUNTS[m.id] ?? 0),
        0
      )
      let trackStepsDone = 0
      let completedModules = 0

      for (const m of relevantModules) {
        const mod = modules[m.id]
        if (mod) {
          trackStepsDone += Math.min(mod.completedSteps.length, MODULE_STEP_COUNTS[m.id] ?? 0)
          if (mod.status === 'completed') completedModules++
        }
      }

      return {
        track: t.track,
        completedModules,
        totalModules: relevantModules.length,
        completedSteps: trackStepsDone,
        totalSteps: trackStepTotal,
        percentComplete:
          trackStepTotal > 0 ? Math.round((trackStepsDone / trackStepTotal) * 100) : 0,
      }
    }).filter((t): t is TrackProgress => t !== null)

    return {
      hasStarted,
      score,
      belt: earnedBelt,
      nextBelt,
      pointsToNextBelt,
      cappedByThreshold,
      breakdown: {
        knowledge: {
          raw: Math.round(knowledgeRaw),
          weighted: Math.round(knowledgeRaw * 0.4),
          weight: 0.4,
          label: 'Knowledge',
          detail: knowledgeDetail,
        },
        breadth: {
          raw: Math.round(breadthRaw),
          weighted: Math.round(breadthRaw * 0.3),
          weight: 0.3,
          label: 'Breadth',
          detail: breadthDetail,
        },
        practice: {
          raw: Math.round(practiceRaw),
          weighted: Math.round(practiceRaw * 0.2),
          weight: 0.2,
          label: 'Practice',
          detail: practiceDetail,
        },
        timeConsistency: {
          raw: Math.round(timeConsistencyRaw),
          weighted: Math.round(timeConsistencyRaw * 0.1),
          weight: 0.1,
          label: 'Time & Consistency',
          detail: timeDetail,
        },
      },
      trackProgress,
      streak: { current: currentStreak, longest: longestStreak, totalSessions },
      totalMinutes,
      artifactCount,
      totalPersonaSteps: personaTotalSteps,
      totalPersonaQuestions,
    }
  }, [modules, artifacts, sessionTracking, quizMastery, selectedPersona])
}
