// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo } from 'react'
import { Award, Key, FileCheck, FileText, Zap, ClipboardCheck } from 'lucide-react'
import { useAwarenessScore } from '@/hooks/useAwarenessScore'
import { useModuleStore } from '@/store/useModuleStore'
import { useAssessmentStore } from '@/store/useAssessmentStore'

export const ProgressDashboard: React.FC = () => {
  const {
    hasStarted,
    score,
    belt,
    nextBelt,
    pointsToNextBelt,
    trackProgress,
    streak,
    totalMinutes,
  } = useAwarenessScore()
  const sessionTracking = useModuleStore((s) => s.sessionTracking)
  const artifacts = useModuleStore((s) => s.artifacts)
  const assessmentStatus = useAssessmentStore((s) => s.assessmentStatus)
  const currentStep = useAssessmentStore((s) => s.currentStep)
  const lastResult = useAssessmentStore((s) => s.lastResult)

  if (!hasStarted) {
    return (
      <div className="px-4 py-6 text-center">
        <p className="text-sm text-muted-foreground">Start exploring to see your progress here.</p>
      </div>
    )
  }

  return (
    <div className="px-4 py-3 space-y-3 border-b border-border">
      {/* Belt + Score */}
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-full border-2 border-border shrink-0"
          style={{ backgroundColor: belt.color }}
          title={belt.name}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-foreground">{belt.name}</span>
            <span className="text-xs text-muted-foreground">Score: {score}/100</span>
          </div>
          {nextBelt && (
            <div className="mt-1">
              <div className="flex justify-between text-xs text-muted-foreground mb-0.5">
                <span>
                  {pointsToNextBelt} pts to {nextBelt.name}
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, ((score - belt.minScore) / (nextBelt.minScore - belt.minScore)) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Track progress pills */}
      <div className="flex flex-wrap gap-1.5">
        {trackProgress.map((tp) => (
          <div
            key={tp.track}
            className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/30 border border-border text-xs"
          >
            <span className="text-muted-foreground">{tp.track}</span>
            <span className="font-medium text-foreground">
              {tp.completedModules}/{tp.totalModules}
            </span>
          </div>
        ))}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-5 gap-2 text-center">
        <StatCell
          icon={<Zap size={12} className="text-status-warning" />}
          value={streak.current}
          label="Streak"
        />
        <StatCell
          icon={<Award size={12} className="text-primary" />}
          value={`${Math.round(totalMinutes)}m`}
          label="Time"
        />
        <StatCell
          icon={<Key size={12} className="text-accent" />}
          value={artifacts.keys.length}
          label="Keys"
        />
        <StatCell
          icon={<FileCheck size={12} className="text-accent" />}
          value={artifacts.certificates.length + artifacts.csrs.length}
          label="Certs"
        />
        <StatCell
          icon={<FileText size={12} className="text-primary" />}
          value={artifacts.executiveDocuments?.length ?? 0}
          label="Docs"
        />
      </div>

      {/* Assessment status */}
      {assessmentStatus !== 'not-started' && (
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/20 text-xs">
          <ClipboardCheck size={12} className="text-primary shrink-0" />
          {assessmentStatus === 'complete' ? (
            <span className="text-foreground">
              Assessment complete{lastResult ? ` — Risk score: ${lastResult.riskScore}` : ''}
            </span>
          ) : (
            <span className="text-muted-foreground">
              Assessment in progress (step {currentStep + 1}/13)
            </span>
          )}
        </div>
      )}

      {/* Streak calendar — 30 day dot grid */}
      {sessionTracking?.visitDates && sessionTracking.visitDates.length > 0 && (
        <StreakCalendar visitDates={sessionTracking.visitDates} />
      )}
    </div>
  )
}

function StatCell({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode
  value: string | number
  label: string
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      {icon}
      <span className="text-sm font-semibold text-foreground">{value}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  )
}

function buildLast30Days(visitDates: string[]): { date: string; visited: boolean }[] {
  const visitSet = new Set(visitDates)
  const now = Date.now()
  const result: { date: string; visited: boolean }[] = []

  for (let i = 29; i >= 0; i--) {
    const d = new Date(now - i * 86400000)
    const key = d.toISOString().split('T')[0]
    result.push({ date: key, visited: visitSet.has(key) })
  }
  return result
}

function StreakCalendar({ visitDates }: { visitDates: string[] }) {
  const days = useMemo(() => buildLast30Days(visitDates), [visitDates])

  return (
    <div>
      <p className="text-[10px] text-muted-foreground mb-1">Last 30 days</p>
      <div className="flex gap-[3px] flex-wrap">
        {days.map(({ date, visited }) => (
          <div
            key={date}
            className={`w-2.5 h-2.5 rounded-sm ${visited ? 'bg-primary' : 'bg-muted/40'}`}
            title={date}
          />
        ))}
      </div>
    </div>
  )
}
