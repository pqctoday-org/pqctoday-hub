// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import { ShieldCheck, ShieldAlert, ShieldOff, HelpCircle, Radio, Info } from 'lucide-react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import {
  NETWORK_SEGMENTS,
  PASSIVE_OBSERVATIONS,
  type TrafficObservation,
} from '../data/testingConstants'
import { Button } from '@/components/ui/button'

type ClassifyAnswer = 'quantum-safe' | 'vulnerable' | 'hybrid' | 'unknown' | null

const RISK_COLORS: Record<TrafficObservation['risk'], string> = {
  none: 'text-status-success',
  low: 'text-status-success',
  medium: 'text-status-warning',
  high: 'text-status-warning',
  critical: 'text-destructive',
}

const RISK_BG: Record<TrafficObservation['risk'], string> = {
  none: 'bg-status-success/10 border-status-success/30',
  low: 'bg-status-success/10 border-status-success/30',
  medium: 'bg-status-warning/10 border-status-warning/30',
  high: 'bg-status-warning/10 border-status-warning/30',
  critical: 'bg-destructive/10 border-destructive/30',
}

const STATUS_ICONS: Record<TrafficObservation['quantumSafe'], React.ReactNode> = {
  yes: <ShieldCheck size={16} className="text-status-success" />,
  no: <ShieldOff size={16} className="text-destructive" />,
  hybrid: <ShieldAlert size={16} className="text-status-warning" />,
  unknown: <HelpCircle size={16} className="text-muted-foreground" />,
}

export const PassiveDiscoveryLab: React.FC = () => {
  const [selectedSegment, setSelectedSegment] = useState(NETWORK_SEGMENTS[0].id)
  const [classified, setClassified] = useState<Record<string, ClassifyAnswer>>({})
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})

  const segment = useMemo(
    () => NETWORK_SEGMENTS.find((s) => s.id === selectedSegment)!,
    [selectedSegment]
  )
  const observations = useMemo(() => PASSIVE_OBSERVATIONS[selectedSegment] ?? [], [selectedSegment])

  const summary = useMemo(() => {
    const counts = { 'quantum-safe': 0, vulnerable: 0, hybrid: 0, unknown: 0 }
    observations.forEach((obs) => {
      if (obs.quantumSafe === 'yes') counts['quantum-safe']++
      else if (obs.quantumSafe === 'no') counts['vulnerable']++
      else if (obs.quantumSafe === 'hybrid') counts['hybrid']++
      else counts['unknown']++
    })
    return counts
  }, [observations])

  const segmentItems = NETWORK_SEGMENTS.map((s) => ({ id: s.id, label: s.label }))

  const handleClassify = (obsId: string, answer: ClassifyAnswer) => {
    setClassified((prev) => ({ ...prev, [obsId]: answer }))
  }

  const handleReveal = (obsId: string) => {
    setRevealed((prev) => ({ ...prev, [obsId]: true }))
  }

  const classifyOptions: { id: ClassifyAnswer; label: string }[] = [
    { id: 'quantum-safe', label: 'Quantum-Safe' },
    { id: 'hybrid', label: 'Hybrid PQC' },
    { id: 'vulnerable', label: 'Vulnerable' },
    { id: 'unknown', label: 'Unknown' },
  ]

  return (
    <div className="space-y-6">
      {/* Tool context */}
      <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
        <Radio size={16} className="text-primary mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Simulating:</span> CryptoNext COMPASS /
          pqc-flow passive probe on SPAN port. Inspecting TLS/SSH/IKEv2 handshakes in-flight.{' '}
          <span className="text-primary">No packets injected.</span>
        </p>
      </div>

      {/* Segment selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <span className="text-sm font-medium text-foreground whitespace-nowrap">
          Network segment:
        </span>
        <FilterDropdown
          items={segmentItems}
          selectedId={selectedSegment}
          onSelect={setSelectedSegment}
          defaultLabel="Select segment"
          noContainer
        />
      </div>

      {/* Segment info */}
      <div className="p-4 rounded-lg bg-muted border border-border">
        <div className="flex items-center gap-2 mb-2">
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
              segment.riskLevel === 'critical'
                ? 'bg-destructive/20 text-destructive'
                : segment.riskLevel === 'high'
                  ? 'bg-status-warning/20 text-status-warning'
                  : 'bg-status-success/20 text-status-success'
            }`}
          >
            {segment.riskLevel.toUpperCase()} RISK SEGMENT
          </span>
        </div>
        <p className="text-sm text-foreground/80">{segment.description}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {segment.typicalTraffic.map((t) => (
            <span
              key={t}
              className="text-xs bg-background border border-border px-2 py-0.5 rounded font-mono"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {(
          [
            ['quantum-safe', 'Quantum-Safe', 'text-status-success bg-status-success/10'],
            ['hybrid', 'Hybrid', 'text-status-warning bg-status-warning/10'],
            ['vulnerable', 'Vulnerable', 'text-destructive bg-destructive/10'],
            ['unknown', 'Unknown', 'text-muted-foreground bg-muted'],
          ] as const
        ).map(([key, label, cls]) => (
          <div
            key={key}
            className={`p-3 rounded-lg border border-border text-center ${cls.split(' ')[1]}`}
          >
            <div className={`text-2xl font-bold ${cls.split(' ')[0]}`}>{summary[key]}</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      {/* Observations */}
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
          <Info size={14} className="text-primary" />
          Captured flows — classify each:
        </h3>

        {observations.map((obs) => {
          const userAnswer = classified[obs.id]
          const isRevealed = revealed[obs.id]
          const isCorrect =
            userAnswer ===
            (obs.quantumSafe === 'yes'
              ? 'quantum-safe'
              : obs.quantumSafe === 'no'
                ? 'vulnerable'
                : obs.quantumSafe)

          return (
            <div key={obs.id} className={`p-4 rounded-lg border ${RISK_BG[obs.risk]}`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm font-mono">
                    <span className="text-muted-foreground">{obs.source}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="text-muted-foreground">{obs.destination}</span>
                    <span className="bg-background border border-border px-1.5 py-0.5 rounded text-xs">
                      {obs.protocol}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-foreground/70">{obs.algorithm}</p>
                </div>
                {isRevealed && (
                  <div className="flex items-center gap-1 shrink-0">
                    {STATUS_ICONS[obs.quantumSafe]}
                    <span className={`text-xs font-semibold ${RISK_COLORS[obs.risk]}`}>
                      {obs.risk.toUpperCase()} RISK
                    </span>
                  </div>
                )}
              </div>

              {/* Classify buttons */}
              {!isRevealed && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {classifyOptions.map((opt) => (
                    <Button
                      variant="ghost"
                      key={opt.id}
                      onClick={() => handleClassify(obs.id, opt.id)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        userAnswer === opt.id
                          ? 'bg-primary text-primary-foreground border-primary font-semibold'
                          : 'bg-background/60 text-muted-foreground border-border hover:border-primary/50 hover:text-foreground'
                      }`}
                    >
                      {opt.label}
                    </Button>
                  ))}
                </div>
              )}

              {userAnswer && !isRevealed && (
                <Button
                  variant="ghost"
                  onClick={() => handleReveal(obs.id)}
                  className="text-xs px-3 py-1.5 bg-primary/10 text-primary border border-primary/30 rounded hover:bg-primary/20 transition-colors"
                >
                  Reveal answer
                </Button>
              )}

              {isRevealed && (
                <div className="space-y-2">
                  {userAnswer && (
                    <div
                      className={`text-xs flex items-center gap-2 ${isCorrect ? 'text-status-success' : 'text-destructive'}`}
                    >
                      {isCorrect
                        ? '✓ Correct'
                        : `✗ You said: ${userAnswer} — Actual: ${obs.quantumSafe === 'yes' ? 'quantum-safe' : obs.quantumSafe === 'no' ? 'vulnerable' : obs.quantumSafe}`}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground border-t border-border/50 pt-2">
                    {obs.details}
                  </p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
