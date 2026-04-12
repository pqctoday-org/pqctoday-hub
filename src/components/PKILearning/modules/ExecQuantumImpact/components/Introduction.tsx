// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Link } from 'react-router-dom'
import { Briefcase, Clock, Scale, TrendingUp, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'

interface Props {
  onNavigateToWorkshop: () => void
}

export const Introduction: React.FC<Props> = ({ onNavigateToWorkshop }) => {
  return (
    <div className="space-y-8 w-full">
      {/* Opening statement */}
      <section className="glass-panel p-4 border-primary/10">
        <p className="text-sm text-foreground/80">
          The quantum computing revolution is not a distant possibility &mdash; it is an active
          threat requiring executive action today.{' '}
          <InlineTooltip term="HNDL">Harvest Now, Decrypt Later</InlineTooltip> attacks mean that
          data intercepted today can be decrypted once quantum computers mature, potentially
          exposing strategic plans, financial data, and intellectual property years from now.
        </p>
      </section>

      {/* Section 1: The Executive Quantum Challenge */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Briefcase size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">The Executive Quantum Challenge</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            As an executive or GRC leader, the quantum threat impacts you differently than it does
            engineers or architects. Your responsibility is not to implement cryptographic changes
            &mdash; it is to ensure the organization is{' '}
            <strong>prepared, funded, governed, and accountable</strong> for a multi-year
            cryptographic transition.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">Fiduciary Duty</div>
              <p className="text-xs text-muted-foreground">
                Directors and officers have a duty of care to protect organizational assets against
                known threats. Quantum risk is now well-documented.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">Regulatory Pressure</div>
              <p className="text-xs text-muted-foreground">
                <InlineTooltip term="CNSA 2.0">CNSA 2.0</InlineTooltip>, NIS2, DORA, and sector
                mandates set hard deadlines for PQC migration.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">Strategic Risk</div>
              <p className="text-xs text-muted-foreground">
                Competitors gaining PQC readiness first may win contracts, customer trust, and
                regulatory standing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Why Now? */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-status-warning/10">
            <Clock size={24} className="text-status-warning" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Why Now?</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            The timeline is tighter than most executives realize. NIST finalized its first
            post-quantum standards in August 2024, and regulatory bodies worldwide are already
            setting compliance deadlines:
          </p>
          <div className="bg-muted/50 rounded-lg p-4 border border-primary/20">
            <blockquote className="text-sm italic text-foreground/90">
              &ldquo;Organizations should not wait for quantum computers to become a reality before
              taking action. The time to start planning for the transition to post-quantum
              cryptography is now.&rdquo;
            </blockquote>
            <p className="text-xs text-muted-foreground mt-2">
              &mdash; NIST IR 8547, Transition to Post-Quantum Cryptography Standards
            </p>
          </div>
          <ul className="space-y-2 list-none">
            <li className="flex items-start gap-2">
              <AlertTriangle size={14} className="text-status-error mt-0.5 shrink-0" />
              <span>
                <strong>2030:</strong> CNSA 2.0 requires PQC exclusively for software/firmware
                signing and networking equipment (VPNs, routers)
              </span>
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle size={14} className="text-status-warning mt-0.5 shrink-0" />
              <span>
                <strong>2033:</strong> Full PQC transition for web browsers, cloud services, and
                operating systems
              </span>
            </li>
            <li className="flex items-start gap-2">
              <AlertTriangle size={14} className="text-primary mt-0.5 shrink-0" />
              <span>
                <strong>2035:</strong> Complete deprecation of all classical asymmetric cryptography
              </span>
            </li>
          </ul>
        </div>
      </section>

      {/* Section 3: What You Will Learn */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Scale size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-foreground">What This Module Covers</h2>
        </div>
        <div className="space-y-3 text-sm text-foreground/80">
          <p>
            This 30-minute module is designed specifically for executives and GRC leaders. The
            interactive workshop guides you through three steps:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-status-error mb-1">Step 1: Why It Matters</div>
              <p className="text-xs text-muted-foreground">
                Assess your organization&apos;s quantum exposure with an interactive impact matrix
                and self-assessment checklist.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-status-warning mb-1">
                Step 2: What to Learn
              </div>
              <p className="text-xs text-muted-foreground">
                Identify your knowledge gaps and build a personalized learning path across the
                modules most relevant to your role.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-status-success mb-1">Step 3: How to Act</div>
              <p className="text-xs text-muted-foreground">
                Build a phased action plan with concrete milestones from this week to six months
                out. Export it as a Markdown document.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Related Resources */}
      <section className="glass-panel p-6 border-secondary/20">
        <h3 className="text-lg font-bold text-gradient mb-3">Related Resources</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Link
            to="/learn/pqc-risk-management"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <AlertTriangle size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">PQC Risk Management</div>
              <div className="text-xs text-muted-foreground">
                Build risk registers and executive heatmaps
              </div>
            </div>
          </Link>
          <Link
            to="/learn/pqc-business-case"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <TrendingUp size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">PQC Business Case</div>
              <div className="text-xs text-muted-foreground">
                ROI models and board-level presentations
              </div>
            </div>
          </Link>
          <Link
            to="/learn/pqc-governance"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Scale size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">PQC Governance</div>
              <div className="text-xs text-muted-foreground">
                Governance frameworks and executive policies
              </div>
            </div>
          </Link>
          <Link
            to="/learn/compliance-strategy"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Briefcase size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">Compliance Strategy</div>
              <div className="text-xs text-muted-foreground">
                Multi-jurisdiction regulatory requirements
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Workshop CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-panel p-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Ready to assess your quantum exposure?
          </h3>
          <p className="text-sm text-muted-foreground">
            The interactive workshop takes about 30 minutes to complete.
          </p>
        </div>
        <Button variant="gradient" size="lg" onClick={onNavigateToWorkshop}>
          Go to Workshop &rarr;
        </Button>
      </div>

      <ReadingCompleteButton />
    </div>
  )
}
