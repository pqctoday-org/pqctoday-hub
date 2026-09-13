// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { CheckCircle2, Circle, ArrowDown } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ChainLevel {
  id: string
  label: string
  todayAlgorithm: string
  todayPq: boolean
  fullDeploymentAlgorithm: string
}

const CHAIN: ChainLevel[] = [
  {
    id: 'root',
    label: 'DNS Root Zone',
    todayAlgorithm: 'Classical (RSA/ECDSA)',
    todayPq: false,
    fullDeploymentAlgorithm: 'Algorithm 18 (ML-DSA-44) DS/DNSKEY',
  },
  {
    id: 'tld',
    label: '.dev TLD',
    todayAlgorithm: 'Classical (RSA/ECDSA)',
    todayPq: false,
    fullDeploymentAlgorithm: 'Algorithm 18 (ML-DSA-44) DS/DNSKEY',
  },
  {
    id: 'leaf',
    label: 'dnstest.dev (test zone)',
    todayAlgorithm: 'Algorithm 18 (ML-DSA-44)',
    todayPq: true,
    fullDeploymentAlgorithm: 'Algorithm 18 (ML-DSA-44) — unchanged',
  },
]

type ViewMode = 'today' | 'full'

export const ValidationChainWalkthrough: React.FC = () => {
  const [view, setView] = useState<ViewMode>('today')

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Button
          variant="ghost"
          onClick={() => setView('today')}
          className={`px-3 py-1.5 rounded text-xs font-bold transition-colors border ${
            view === 'today'
              ? 'bg-primary/20 border-primary/50 text-primary'
              : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted'
          }`}
        >
          Today (pilot)
        </Button>
        <Button
          variant="ghost"
          onClick={() => setView('full')}
          className={`px-3 py-1.5 rounded text-xs font-bold transition-colors border ${
            view === 'full'
              ? 'bg-success/20 border-success/50 text-success'
              : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted'
          }`}
        >
          Full deployment (target)
        </Button>
      </div>

      <div className="space-y-1">
        {CHAIN.map((level, idx) => {
          const isPq = view === 'today' ? level.todayPq : true
          const algorithmLabel =
            view === 'today' ? level.todayAlgorithm : level.fullDeploymentAlgorithm
          return (
            <React.Fragment key={level.id}>
              <div
                className={`rounded-lg p-4 border flex items-center justify-between gap-4 ${
                  isPq ? 'bg-success/5 border-success/30' : 'bg-muted/50 border-border'
                }`}
              >
                <div className="flex items-center gap-3">
                  {isPq ? (
                    <CheckCircle2 size={20} className="text-success shrink-0" />
                  ) : (
                    <Circle size={20} className="text-muted-foreground shrink-0" />
                  )}
                  <div>
                    <div className="text-sm font-bold text-foreground">{level.label}</div>
                    <div className="text-xs text-muted-foreground">{algorithmLabel}</div>
                  </div>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded border font-bold shrink-0 ${
                    isPq
                      ? 'bg-success/20 text-success border-success/50'
                      : 'bg-muted text-muted-foreground border-border'
                  }`}
                >
                  {isPq ? 'PQ' : 'Classical'}
                </span>
              </div>
              {idx < CHAIN.length - 1 && (
                <div className="flex justify-center py-1">
                  <ArrowDown size={16} className="text-muted-foreground" />
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        {view === 'today'
          ? 'Today, algorithm 18 exists only at the leaf — dnstest.dev’s own zone. The root and .dev TLD above it still delegate classically, so an attacker with a quantum computer could still forge trust at either of those levels even though the leaf itself is PQ-signed.'
          : 'Full deployment means every level up to the root carries an algorithm-18 DS record, so the chain of trust is post-quantum end to end — the state Cloudflare’s own roadmap and the DNS root’s separate rollover estimate are both working toward.'}
      </p>
    </div>
  )
}
