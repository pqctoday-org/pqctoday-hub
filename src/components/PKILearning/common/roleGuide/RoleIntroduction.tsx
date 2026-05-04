// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { AlertTriangle, BookOpen, Rocket, ArrowRight, Shield, Clock, Target } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import type { RoleGuideData } from './types'

const SEVERITY_BADGE: Record<string, string> = {
  critical: 'bg-status-error/15 text-status-error',
  high: 'bg-status-warning/15 text-status-warning',
  medium: 'bg-primary/15 text-primary',
  low: 'bg-muted text-muted-foreground',
}

interface Props {
  data: RoleGuideData
  onNavigateToWorkshop: () => void
}

export const RoleIntroduction: React.FC<Props> = ({ data, onNavigateToWorkshop }) => {
  const criticalCount = data.threatImpacts.filter((t) => t.severity === 'critical').length
  const highCount = data.threatImpacts.filter((t) => t.severity === 'high').length

  return (
    <div className="space-y-8 w-full">
      {/* Role tagline */}
      <div className="glass-panel p-6 border-l-4 border-primary">
        <div className="flex items-start gap-3">
          <Shield className="w-6 h-6 text-primary mt-0.5 shrink-0" />
          <div>
            <h2 className="text-xl font-bold text-foreground mb-2">For the {data.roleLabel}</h2>
            <p className="text-foreground/90 text-lg leading-relaxed italic">
              &ldquo;{data.tagline}&rdquo;
            </p>
          </div>
        </div>
      </div>

      {/* Why this matters */}
      <div data-section-id="why-it-matters" className="glass-panel p-6 scroll-mt-20">
        <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-status-warning" />
          Why This Matters for You
        </h3>
        <p className="text-foreground/80 leading-relaxed mb-4">{data.urgencyStatement}</p>

        <div className="flex flex-wrap gap-3">
          {criticalCount > 0 && (
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-status-error/15 text-status-error">
              {criticalCount} critical impact{criticalCount > 1 ? 's' : ''}
            </span>
          )}
          {highCount > 0 && (
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-status-warning/15 text-status-warning">
              {highCount} high impact{highCount > 1 ? 's' : ''}
            </span>
          )}
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-primary/15 text-primary">
            {data.threatImpacts.length} total threats
          </span>
        </div>
      </div>

      {/* Key threats overview */}
      <div className="glass-panel p-6">
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Key Threat Impacts
        </h3>
        <div className="grid gap-3">
          {data.threatImpacts.slice(0, 4).map((threat) => (
            <div
              key={threat.id}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border"
            >
              <div className="shrink-0 mt-0.5">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${SEVERITY_BADGE[threat.severity]}`}
                >
                  {threat.severity}
                </span>
              </div>
              <div>
                <p className="font-medium text-foreground">{threat.title}</p>
                <p className="text-sm text-muted-foreground">{threat.description}</p>
                <p className="text-xs text-muted-foreground/70 mt-1">{threat.timeframe}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* What you'll learn */}
      <div data-section-id="what-to-learn" className="glass-panel p-6 scroll-mt-20">
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          Knowledge Domains
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {data.knowledgeDomains.map((domain) => (
            <div key={domain.name} className="p-4 rounded-lg border border-border bg-muted/20">
              <h4 className="font-semibold text-foreground mb-1">{domain.name}</h4>
              <p className="text-sm text-muted-foreground mb-3">{domain.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {domain.modules.map((mod) => (
                  <Link
                    key={mod.id}
                    to={`/learn/${mod.id}`}
                    className="text-xs px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    {mod.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Workshop overview */}
      <div data-section-id="how-to-act" className="glass-panel p-6 scroll-mt-20">
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          Workshop: 3-Step Action Plan
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg border border-border bg-muted/20">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-status-warning" />
              <span className="font-semibold text-foreground">Step 1: Why It Matters</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Assess your personal exposure with an interactive self-assessment. See how each
              quantum threat impacts your specific responsibilities.
            </p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-muted/20">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="font-semibold text-foreground">Step 2: What to Learn</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Identify skill gaps with a guided self-rating tool. Get a personalized learning path
              with direct links to relevant modules.
            </p>
          </div>
          <div className="p-4 rounded-lg border border-border bg-muted/20">
            <div className="flex items-center gap-2 mb-2">
              <Rocket className="w-4 h-4 text-status-success" />
              <span className="font-semibold text-foreground">Step 3: How to Act</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Build a phased action plan with immediate quick wins, 30-day milestones, and long-term
              KPIs tailored to your role.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <Button variant="gradient" onClick={onNavigateToWorkshop}>
            Start the Workshop
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      {/* Quick wins preview */}
      {data.quickWins.length > 0 && (
        <div className="glass-panel p-6">
          <h3 className="text-lg font-bold text-foreground mb-3">Quick Wins to Start Today</h3>
          <div className="grid md:grid-cols-3 gap-3">
            {data.quickWins.map((qw) => (
              <div
                key={qw.id}
                className="p-3 rounded-lg bg-status-success/5 border border-status-success/20"
              >
                <p className="font-medium text-foreground text-sm">{qw.label}</p>
                <p className="text-xs text-muted-foreground mt-1">{qw.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
