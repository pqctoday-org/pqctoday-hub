// SPDX-License-Identifier: GPL-3.0-only
/**
 * Common Ground Path — "PQC for Your Organization"
 *
 * A lightweight, read-only learning track for non-technical roles:
 * procurement, legal, HR, and executive leadership.
 *
 * No workshops, no code. Five focused modules drawn from the NICE
 * Framework "Common Ground" pattern (IR 8355 §4, common-ground use case).
 */
import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Shield,
  Clock,
  FileText,
  HelpCircle,
  Users,
  ArrowRight,
  BookOpen,
  ExternalLink,
} from 'lucide-react'
import { Button } from '../ui/button'
import { getCommonGroundModules } from '@/data/niceModuleMapping'
import type { NiceCompetencyAreaId } from '@/data/niceFramework'

// ---------------------------------------------------------------------------
// Curated five-module sequence with descriptions for non-technical readers
// ---------------------------------------------------------------------------

interface CommonGroundModule {
  moduleId: string
  title: string
  audience: string
  description: string
  icon: React.ReactNode
  estimatedMinutes: number
  primaryCA: NiceCompetencyAreaId
}

const COMMON_GROUND_MODULES: CommonGroundModule[] = [
  {
    moduleId: 'pqc-101',
    title: 'Why PQC, Why Now',
    audience: 'Everyone',
    description:
      'Understand what quantum computers are, why they threaten current cryptography, and why organizations must act before the threat window closes.',
    icon: <Shield size={20} className="text-primary" />,
    estimatedMinutes: 15,
    primaryCA: 'CA-RISK',
  },
  {
    moduleId: 'compliance-strategy',
    title: 'Regulatory Deadlines & Who They Apply To',
    audience: 'Legal, Compliance, Finance',
    description:
      'Navigate the NIST, NSA, OMB, and EU regulatory timelines for PQC migration. Understand which mandates apply to your organization and when.',
    icon: <Clock size={20} className="text-warning" />,
    estimatedMinutes: 20,
    primaryCA: 'CA-GOVCOMP',
  },
  {
    moduleId: 'vendor-risk',
    title: 'What to Ask Your Software & Hardware Vendors',
    audience: 'Procurement, Vendor Management',
    description:
      'Learn which PQC readiness questions to ask technology vendors, how to evaluate their migration roadmaps, and what contractual requirements to consider.',
    icon: <HelpCircle size={20} className="text-primary" />,
    estimatedMinutes: 20,
    primaryCA: 'CA-RISK',
  },
  {
    moduleId: 'pqc-risk-management',
    title: 'How to Read a PQC Migration Assessment',
    audience: 'Management, Program Leads',
    description:
      "Demystify risk scores, HNDL windows, and migration urgency ratings. Understand what your security team's assessment output means in plain terms.",
    icon: <FileText size={20} className="text-muted-foreground" />,
    estimatedMinutes: 25,
    primaryCA: 'CA-RISK',
  },
  {
    moduleId: 'migration-program',
    title: 'What Your Security Team Needs',
    audience: 'HR, CIO Office, Executive Leadership',
    description:
      'Understand the NICE work roles needed to lead a PQC migration, what skills to hire or upskill, and how to structure a cross-functional migration program.',
    icon: <Users size={20} className="text-success" />,
    estimatedMinutes: 25,
    primaryCA: 'CA-GOVCOMP',
  },
]

const CA_BADGE_COLORS: Partial<Record<NiceCompetencyAreaId, string>> = {
  'CA-RISK': 'bg-warning/10 text-warning border-warning/20',
  'CA-GOVCOMP': 'bg-destructive/10 text-destructive border-destructive/20',
  'CA-CRYPTO': 'bg-primary/10 text-primary border-primary/20',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const CommonGroundPath: React.FC = () => {
  const navigate = useNavigate()
  const totalMinutes = COMMON_GROUND_MODULES.reduce((sum, m) => sum + m.estimatedMinutes, 0)
  const commonGroundData = getCommonGroundModules()

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Shield size={22} className="text-primary" />
          <h1 className="text-gradient text-2xl font-bold">PQC for Your Organization</h1>
        </div>
        <p className="text-muted-foreground">
          A plain-language introduction to post-quantum cryptography for procurement, legal, HR, and
          executive leadership. No technical background required.
        </p>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <BookOpen size={14} />
            {COMMON_GROUND_MODULES.length} modules
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={14} />~{totalMinutes} minutes total
          </span>
          <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full">
            NICE Common Ground Path
          </span>
        </div>
      </div>

      {/* NICE framing callout */}
      <div className="glass-panel p-4 border-l-2 border-primary space-y-1">
        <p className="text-sm font-medium text-foreground">
          Aligned to NICE Framework (NIST IR 8355)
        </p>
        <p className="text-xs text-muted-foreground">
          The NICE Workforce Framework defines "Common Ground" competency areas — knowledge every
          organizational role needs regardless of technical depth. PQC transition awareness is one
          such area: legal, procurement, and management staff all need it to do their jobs through
          the migration period.
        </p>
        <a
          href="https://www.nist.gov/nice/framework"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
        >
          NICE Framework Resource Center
          <ExternalLink size={11} />
        </a>
      </div>

      {/* Module list */}
      <div className="space-y-3">
        {COMMON_GROUND_MODULES.map((module, idx) => {
          const caBadge =
            CA_BADGE_COLORS[module.primaryCA] ?? 'bg-muted text-foreground border-border'

          return (
            <Link
              key={module.moduleId}
              to={`/learn/${module.moduleId}`}
              className="block glass-panel p-5 hover:bg-muted/20 transition-colors group"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-mono text-muted-foreground">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      {module.icon}
                      <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {module.title}
                      </span>
                    </div>
                    <ArrowRight
                      size={16}
                      className="text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0 mt-0.5"
                    />
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground">
                      For: <span className="text-foreground">{module.audience}</span>
                    </span>
                    <span className="text-muted-foreground/30">·</span>
                    <span className="text-xs text-muted-foreground">
                      ~{module.estimatedMinutes} min
                    </span>
                    <span className="text-muted-foreground/30">·</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded border font-mono ${caBadge}`}>
                      {module.primaryCA}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {module.description}
                  </p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Footer: deeper paths */}
      <div className="glass-panel p-5 space-y-3">
        <p className="text-sm font-medium text-foreground">Ready to go deeper?</p>
        <p className="text-xs text-muted-foreground">
          These five modules give your organization a solid foundation. When you're ready, explore
          role-specific paths tailored to your technical focus.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate('/learn')}>
            <BookOpen size={14} className="mr-1.5" />
            Full Learning Paths
          </Button>
          <Button variant="outline" onClick={() => navigate('/assess')}>
            <Shield size={14} className="mr-1.5" />
            Organization Assessment
          </Button>
        </div>
        <p className="text-xs text-muted-foreground/60">
          {commonGroundData.length} modules across{' '}
          {[...new Set(commonGroundData.flatMap((m) => m.competencyAreas))].length} NICE Competency
          Areas are tagged for the Common Ground path in the full library.
        </p>
      </div>
    </div>
  )
}
