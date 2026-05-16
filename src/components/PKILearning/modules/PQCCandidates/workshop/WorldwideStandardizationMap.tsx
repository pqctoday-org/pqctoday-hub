// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { Globe, ExternalLink, GitMerge, Link2, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WORLDWIDE_BODIES, type StandardsBody } from '../data/worldwideBodies'
import { NATIONAL_CANDIDATES } from '../data/nationalCandidates'

const RELATION_LABEL: Record<string, { label: string; tone: string; icon: React.ReactNode }> = {
  parallel: {
    label: 'Parallel',
    tone: 'bg-status-warning/15 text-status-warning border-status-warning/40',
    icon: <GitMerge size={12} />,
  },
  aligned: {
    label: 'Aligned',
    tone: 'bg-status-success/15 text-status-success border-status-success/40',
    icon: <Link2 size={12} />,
  },
  overlay: {
    label: 'Overlay',
    tone: 'bg-status-info/15 text-status-info border-status-info/40',
    icon: <Layers size={12} />,
  },
}

const STAGE_LABEL: Record<string, string> = {
  'open-call': 'Open call',
  evaluation: 'Evaluation',
  finalists: 'Finalists picked',
  standardised: 'Standardised',
  monitoring: 'Monitoring',
}

export const WorldwideStandardizationMap: React.FC = () => {
  const [selected, setSelected] = useState<StandardsBody | null>(
    WORLDWIDE_BODIES.find((b) => b.depth === 'drill-down') ?? null
  )

  return (
    <div className="space-y-4">
      <div className="glass-panel p-4">
        <h3 className="text-base font-bold text-foreground flex items-center gap-2 mb-2">
          <Globe size={16} className="text-primary" /> Where the worldwide tracks intersect
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          NIST is one of nine bodies on this map. Three modes of relationship matter:{' '}
          <strong className="text-status-warning">Parallel</strong> processes pick their own
          algorithms; <strong className="text-status-success">Aligned</strong> bodies adopt NIST
          outputs as their own standards; <strong className="text-status-info">Overlay</strong>{' '}
          bodies profile NIST outputs for a region or sector.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bodies grid */}
        <div className="glass-panel p-4 space-y-2 max-h-[500px] overflow-y-auto">
          {/* NIST anchor */}
          <div className="w-full text-left rounded-md border border-primary/40 bg-primary/10 p-3">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-sm font-bold text-primary">NIST PQC</span>
              <span className="text-[10px] font-mono uppercase text-muted-foreground">
                United States
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-snug">
              The reference track. FIPS 203/204/205 published; on-ramp Round 3 underway. The
              algorithm decisions made here cascade to most other bodies.
            </p>
          </div>

          {WORLDWIDE_BODIES.map((body) => {
            const isSelected = selected?.id === body.id
            const relation = RELATION_LABEL[body.nistRelation]
            return (
              <Button
                key={body.id}
                variant="ghost"
                onClick={() => setSelected(body)}
                className={`w-full text-left rounded-md border p-3 transition-colors h-auto block ${
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card/40 hover:bg-card'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                  <span className="text-sm font-bold text-foreground">{body.name}</span>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${relation.tone}`}
                  >
                    {relation.icon} {relation.label}
                  </span>
                </div>
                <div className="text-[10px] font-mono uppercase text-muted-foreground mb-1">
                  {body.region} · {STAGE_LABEL[body.stage]}
                </div>
                <p className="text-xs text-muted-foreground leading-snug">{body.role}</p>
              </Button>
            )
          })}
        </div>

        {/* Selected body detail */}
        <div className="glass-panel p-4 space-y-3">
          {selected ? (
            <>
              <div className="flex items-baseline justify-between gap-2 flex-wrap">
                <h3 className="text-lg font-bold text-foreground">{selected.name}</h3>
                <span className="text-xs font-mono uppercase text-muted-foreground">
                  {selected.region}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${RELATION_LABEL[selected.nistRelation].tone}`}
                >
                  {RELATION_LABEL[selected.nistRelation].icon}{' '}
                  {RELATION_LABEL[selected.nistRelation].label} to NIST
                </span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-border text-muted-foreground">
                  {STAGE_LABEL[selected.stage]}
                </span>
              </div>
              <p className="text-sm text-foreground/85 italic leading-relaxed">{selected.role}</p>
              <p className="text-sm text-foreground/80 leading-relaxed">{selected.detail}</p>

              {(selected.id === 'kpqc' || selected.id === 'cacr-china') && (
                <NationalFinalists trackId={selected.id === 'kpqc' ? 'kpqc' : 'cacr'} />
              )}

              <a
                href={selected.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                Official reference <ExternalLink size={12} />
              </a>
            </>
          ) : (
            <p className="text-sm text-muted-foreground italic">Select a body to view detail.</p>
          )}
        </div>
      </div>
    </div>
  )
}

const NationalFinalists: React.FC<{ trackId: 'kpqc' | 'cacr' }> = ({ trackId }) => {
  const finalists = NATIONAL_CANDIDATES.filter((c) => c.track === trackId)
  if (finalists.length === 0) return null
  return (
    <div className="rounded-md border border-border bg-card/40 p-3">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-2">
        {trackId === 'kpqc' ? 'KpqC' : 'CACR'} finalists
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {finalists.map((c) => (
          <div key={c.id} className="rounded border border-border/60 bg-background/60 p-2">
            <div className="text-xs font-semibold text-foreground">
              {c.name}{' '}
              <span className="text-[10px] text-muted-foreground font-normal">({c.kind})</span>
            </div>
            <div className="text-[11px] text-muted-foreground italic">{c.family}</div>
            <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{c.summary}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
