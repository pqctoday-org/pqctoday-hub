// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo, useState } from 'react'
import { ChevronRight, ChevronLeft, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { CANDIDATES, getCandidate } from '../data/candidates'
import { LIFECYCLE_EVENTS } from '../data/rounds'
import { FAMILIES } from '../data/families'

interface StandardizationLifecycleProps {
  initialCandidateId?: string
}

const ROUNDS = [
  {
    id: 'round-1',
    label: 'Round 1 — Initial submission',
    description:
      '40 schemes submitted. Public cryptanalysis period opens. NIST checks each submission against the evaluation criteria and runs preliminary benchmarks.',
    rangeStart: '2023-09-01',
    rangeEnd: '2024-10-23',
  },
  {
    id: 'round-2',
    label: 'Round 2 — Refinement and cryptanalysis',
    description:
      '14 schemes advance per NIST IR 8528 (Oct 2024). New cryptanalysis emerges (Ran wedge, Furue–Ikematsu). Teams revise parameters. Candidates that cannot recover are dropped.',
    rangeStart: '2024-10-24',
    rangeEnd: '2026-01-01',
  },
  {
    id: 'round-3',
    label: 'Round 3 — Down-selection',
    description:
      'Nine schemes advance: FAEST, MQOM, SDitH, UOV, MAYO, QR-UOV, SNOVA, SQIsign, HAWK. Final cryptanalysis. NIST drafts FIPS profiles for the most-mature winners.',
    rangeStart: '2026-01-01',
    rangeEnd: '2027-06-01',
  },
  {
    id: 'standardisation',
    label: 'Standardisation — Draft FIPS',
    description:
      'Selected schemes move to draft FIPS publications. Public comment period. Errata cycle. ISO/IEC SC 27 begins adoption. KpqC and CACR finalise their parallel selections.',
    rangeStart: '2027-06-01',
    rangeEnd: '2029-12-31',
  },
]

export const StandardizationLifecycle: React.FC<StandardizationLifecycleProps> = ({
  initialCandidateId,
}) => {
  const [candidateId, setCandidateId] = useState<string>(initialCandidateId ?? 'uov')
  const [roundIdx, setRoundIdx] = useState(0)

  const candidate = getCandidate(candidateId)
  const round = ROUNDS[roundIdx] // eslint-disable-line security/detect-object-injection
  const family = candidate ? FAMILIES[candidate.family] : null

  const eventsInRound = useMemo(() => {
    if (!round) return []
    return LIFECYCLE_EVENTS.filter(
      (evt) => evt.date >= round.rangeStart && evt.date < round.rangeEnd
    )
  }, [round])

  const affectingEvents = useMemo(
    () => eventsInRound.filter((evt) => evt.affects?.includes(candidateId)),
    [eventsInRound, candidateId]
  )

  const candidateItems = CANDIDATES.map((c) => ({
    id: c.id,
    label: `${c.name} (${FAMILIES[c.family].label})`,
  }))

  return (
    <div className="space-y-6">
      {/* Candidate picker */}
      <div className="glass-panel p-4 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <span className="text-sm font-semibold text-foreground">Pick a candidate to follow</span>
          <FilterDropdown
            items={candidateItems}
            selectedId={candidateId}
            onSelect={(v) => setCandidateId(v)}
            label="Candidate"
            defaultLabel="Select candidate"
          />
        </div>
        {candidate && family && (
          <div className={`rounded-md border ${family.borderClass} ${family.bgClass} p-3`}>
            <div className="flex items-baseline justify-between gap-3 flex-wrap">
              <h3 className={`text-base font-bold ${family.colorClass}`}>{candidate.name}</h3>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
                {family.label} · {candidate.hardness}
              </span>
            </div>
            <p className="text-xs text-foreground/85 mt-1">{candidate.whyAdvanced}</p>
          </div>
        )}
      </div>

      {/* Round timeline */}
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold text-foreground">Standardisation rounds</h3>
          <span className="text-xs text-muted-foreground">
            Round {roundIdx + 1} of {ROUNDS.length}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {ROUNDS.map((r, idx) => (
            <Button
              key={r.id}
              variant="ghost"
              onClick={() => setRoundIdx(idx)}
              className={`rounded-md border p-2 text-left transition-colors h-auto block ${
                idx === roundIdx
                  ? 'border-primary bg-primary/10'
                  : idx < roundIdx
                    ? 'border-status-success/40 bg-status-success/5'
                    : 'border-border bg-card/40 hover:bg-card'
              }`}
            >
              <div
                className={`text-[10px] uppercase tracking-wider font-bold ${
                  idx === roundIdx
                    ? 'text-primary'
                    : idx < roundIdx
                      ? 'text-status-success'
                      : 'text-muted-foreground'
                }`}
              >
                Round {idx + 1}
              </div>
              <div className="text-xs font-semibold text-foreground mt-1 leading-tight">
                {r.label.split('—')[1]?.trim() ?? r.label}
              </div>
            </Button>
          ))}
        </div>
      </div>

      {/* Current round detail */}
      {round && (
        <div className="glass-panel p-4 space-y-4">
          <div>
            <h3 className="text-lg font-bold text-foreground">{round.label}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mt-1">
              {round.description}
            </p>
          </div>

          {affectingEvents.length > 0 && (
            <div className="rounded-lg border border-status-error/40 bg-status-error/5 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle size={16} className="text-status-error shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-bold text-status-error mb-1">
                    {candidate?.name} is affected by cryptanalysis in this round
                  </div>
                  <div className="space-y-2 mt-2">
                    {affectingEvents.map((evt) => (
                      <div
                        key={evt.id}
                        className="rounded border border-status-error/30 bg-card/50 p-2"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {evt.date}
                          </span>
                          <span className="text-xs font-semibold text-status-error">
                            {evt.title}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {evt.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {eventsInRound.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-2">
                All events in this round
              </div>
              <div className="space-y-2">
                {eventsInRound.map((evt) => (
                  <div key={evt.id} className="flex items-start gap-2 text-xs">
                    <span className="font-mono text-muted-foreground w-20 shrink-0">
                      {evt.date}
                    </span>
                    <span className="text-foreground">{evt.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {affectingEvents.length === 0 && eventsInRound.length > 0 && (
            <div className="rounded-lg border border-status-success/30 bg-status-success/5 p-3">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-status-success" />
                <span className="text-sm text-status-success">
                  {candidate?.name} is unaffected by cryptanalysis in this round.
                </span>
              </div>
            </div>
          )}

          {eventsInRound.length === 0 && (
            <div className="rounded-lg border border-border bg-card/40 p-3 flex items-center gap-2">
              <Info size={16} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                No public events catalogued in this round window yet.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Round navigation */}
      <div className="flex justify-between gap-3">
        <Button
          variant="ghost"
          onClick={() => setRoundIdx(Math.max(0, roundIdx - 1))}
          disabled={roundIdx === 0}
          className="gap-2"
        >
          <ChevronLeft size={14} /> Previous round
        </Button>
        <Button
          variant="gradient"
          onClick={() => setRoundIdx(Math.min(ROUNDS.length - 1, roundIdx + 1))}
          disabled={roundIdx === ROUNDS.length - 1}
          className="gap-2"
        >
          Next round <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  )
}
