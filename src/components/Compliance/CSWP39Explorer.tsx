// SPDX-License-Identifier: GPL-3.0-only
import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ExternalLink,
  FileText,
  Workflow,
  Layers,
  Columns3,
  GraduationCap,
  Database,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CryptoAgilityProcessDiagram } from '@/components/PKILearning/modules/CryptoMgmtModernization/visuals/CryptoAgilityProcessDiagram'
import { CSWP39_STEPS, CSWP39_TIERS, CSWP39_CROSS_WALK, CSWP39_SOURCE_METADATA } from './cswp39Data'
import { CSWP39StepCard } from './CSWP39StepCard'
import { MaturityEvidenceGrid } from './MaturityEvidenceGrid'
import { maturityRequirements } from '@/data/maturityGovernanceData'

interface CSWP39ExplorerProps {
  onNavigateToFramework: (
    targetTab: 'standards' | 'technical' | 'certification' | 'compliance',
    searchQuery: string
  ) => void
  evref?: string
  onClearEvref?: () => void
}

const tierToneClasses: Record<
  'error' | 'warning' | 'info' | 'success',
  { bg: string; border: string; text: string; accent: string }
> = {
  error: {
    bg: 'bg-status-error/5',
    border: 'border-status-error/30',
    text: 'text-status-error',
    accent: 'bg-status-error/10',
  },
  warning: {
    bg: 'bg-status-warning/5',
    border: 'border-status-warning/30',
    text: 'text-status-warning',
    accent: 'bg-status-warning/10',
  },
  info: {
    bg: 'bg-status-info/5',
    border: 'border-status-info/30',
    text: 'text-status-info',
    accent: 'bg-status-info/10',
  },
  success: {
    bg: 'bg-status-success/5',
    border: 'border-status-success/30',
    text: 'text-status-success',
    accent: 'bg-status-success/10',
  },
}

export const CSWP39Explorer: React.FC<CSWP39ExplorerProps> = ({
  onNavigateToFramework,
  evref,
  onClearEvref,
}) => {
  const navigate = useNavigate()
  const uniqueSources = useMemo(() => new Set(maturityRequirements.map((r) => r.refId)).size, [])
  return (
    <div className="space-y-6">
      {/* Overview banner */}
      <div className="glass-panel p-5 border border-primary/20 rounded-lg">
        <div className="flex items-start gap-3 flex-wrap">
          <div className="p-2 rounded-lg bg-primary/10">
            <Workflow size={24} className="text-primary" />
          </div>
          <div className="flex-1 min-w-[260px]">
            <h2 className="text-lg font-bold text-gradient">
              NIST CSWP.39 — Crypto Agility Strategic Plan
            </h2>
            <p className="text-sm text-foreground/80 mt-1">
              Published December 2025. Defines a continuously repeated five-step process for
              achieving crypto agility, a 4-tier maturity model (§6.5), and a Management Tools
              architecture (§5) that bridges asset inventory and risk management. Every step on this
              page cross-references the compliance frameworks already catalogued on the other tabs
              of this page.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              <span className="font-medium">Source:</span>{' '}
              <a
                href={CSWP39_SOURCE_METADATA.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                {CSWP39_SOURCE_METADATA.documentLabel} ({CSWP39_SOURCE_METADATA.documentVersion},{' '}
                {CSWP39_SOURCE_METADATA.publicationDate})
                <ExternalLink size={10} />
              </a>{' '}
              · Hub data verified {CSWP39_SOURCE_METADATA.dataExtractedAt} · Next review by{' '}
              {CSWP39_SOURCE_METADATA.nextReviewBy}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <Button
              variant="gradient"
              onClick={() => navigate('/learn/crypto-mgmt-modernization')}
              className="flex items-center gap-1.5"
            >
              <GraduationCap size={16} />
              Open Full Learn Module
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                window.open('/library/NIST_CSWP_39.pdf', '_blank', 'noopener,noreferrer')
              }
              className="flex items-center gap-1.5"
            >
              <FileText size={16} />
              Download PDF
              <ExternalLink size={12} />
            </Button>
          </div>
        </div>
      </div>

      {/* Interactive process diagram */}
      <section className="glass-panel p-5 border border-border rounded-lg">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-secondary/10">
            <Workflow size={20} className="text-secondary" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Interactive Process Diagram</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Click any zone of the CSWP.39 Fig. 3 framework to see what belongs there, the CPM
              pillar it maps to, and the exact section reference.
            </p>
          </div>
        </div>
        <CryptoAgilityProcessDiagram />
      </section>

      {/* 5-step process */}
      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Layers size={20} className="text-primary" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">
              5-Step Process &amp; Requirements
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Each step shows a plain-language explainer and the enumerated requirements your
              organisation needs to satisfy, plus which existing compliance frameworks align.
            </p>
          </div>
        </div>
        <div className="space-y-2">
          {CSWP39_STEPS.map((step) => (
            <CSWP39StepCard
              key={step.id}
              step={step}
              crossWalk={CSWP39_CROSS_WALK.find((cw) => cw.stepId === step.id)}
              onFrameworkChipClick={onNavigateToFramework}
            />
          ))}
        </div>
      </section>

      {/* 4-tier maturity model */}
      <section className="glass-panel p-5 border border-border rounded-lg">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-accent/10">
            <Columns3 size={20} className="text-accent" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">4-Tier Maturity Model (§6.5)</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Derived from the NIST Cybersecurity Framework Implementation Tiers. Each tier shows
              its characteristics and the concrete steps to reach it.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {CSWP39_TIERS.map((tier) => {
            const cls = tierToneClasses[tier.tone]
            return (
              <div
                key={tier.level}
                className={`${cls.bg} ${cls.border} border rounded-lg p-3 flex flex-col`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`${cls.accent} ${cls.text} font-bold text-[11px] px-2 py-0.5 rounded`}
                  >
                    Tier {tier.level}
                  </span>
                  <span className="font-bold text-sm text-foreground">{tier.name}</span>
                </div>
                <p className="text-xs text-foreground/80 mb-3">{tier.characteristics}</p>
                <div className="mt-auto">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                    How to reach
                  </div>
                  <ul className="space-y-0.5">
                    {tier.howToReach.map((item, i) => (
                      <li key={i} className="text-[11px] text-foreground/80">
                        · {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Cross-walk summary table ── */}
      <section
        id="cswp39-cross-walk"
        className="glass-panel p-5 border border-border rounded-lg scroll-mt-24"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 rounded-lg bg-status-info/10">
            <Columns3 size={20} className="text-status-info" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">
              Framework Cross-Walk — CSWP.39 → Other Compliance
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Quick index mapping each CSWP.39 step to the frameworks on the other tabs of this
              page. Click any chip to jump.
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border border-border">
            <thead>
              <tr className="bg-muted/60">
                <th className="text-left p-2 border-b border-border">CSWP.39 step</th>
                <th className="text-left p-2 border-b border-border">Aligns with</th>
              </tr>
            </thead>
            <tbody>
              {CSWP39_CROSS_WALK.map((row) => {
                const step = CSWP39_STEPS.find((s) => s.id === row.stepId)
                if (!step) return null
                return (
                  <tr key={row.stepId}>
                    <td className="p-2 border-b border-border font-bold align-top whitespace-nowrap">
                      {step.number}. {step.title}
                      <div className="text-[10px] font-normal text-muted-foreground">
                        {step.sectionRef}
                      </div>
                    </td>
                    <td className="p-2 border-b border-border">
                      <div className="flex flex-wrap gap-1.5">
                        {row.frameworks.map((fw) => (
                          <Button
                            key={fw.label}
                            variant="ghost"
                            onClick={() => onNavigateToFramework(fw.targetTab, fw.searchQuery)}
                            title={fw.hint}
                            className="h-auto text-[11px] px-2 py-1 rounded-md bg-muted/60 hover:bg-primary/10 border border-border hover:border-primary/40 text-foreground hover:text-primary transition-colors font-normal"
                          >
                            {fw.label}
                          </Button>
                        ))}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Authoritative Evidence ── */}
      <section className="glass-panel p-5 border border-border rounded-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-accent/10">
            <Database size={20} className="text-accent" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">
              Authoritative Evidence — {maturityRequirements.length} requirements from{' '}
              {uniqueSources} sources
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              LLM-extracted governance obligations mapped to each CSWP.39 pillar and maturity tier.
              Click any highlighted cell to see sourced requirements.
            </p>
          </div>
        </div>
        <MaturityEvidenceGrid
          requirements={maturityRequirements}
          initialRefFilter={evref}
          onClearRefFilter={onClearEvref}
        />
      </section>
    </div>
  )
}
