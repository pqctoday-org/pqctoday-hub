import React from 'react'
import { Link } from 'react-router-dom'
import {
  Map,
  Users,
  Target,
  ArrowRight,
  Building2,
  ClipboardCheck,
  Route,
  BarChart3,
  Shield,
  Calendar,
} from 'lucide-react'
import { InlineTooltip } from '@/components/ui/InlineTooltip'

interface IntroductionProps {
  onNavigateToWorkshop: () => void
}

export const Introduction: React.FC<IntroductionProps> = ({ onNavigateToWorkshop }) => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Section 1: Migration as a Program Management Challenge */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Map size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">
            PQC Migration: A Program Management Challenge
          </h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Migrating an enterprise to{' '}
            <InlineTooltip term="Post-Quantum Cryptography">
              post-quantum cryptography
            </InlineTooltip>{' '}
            is not a single project &mdash; it is a multi-year, cross-functional{' '}
            <strong>program</strong> that spans every system, vendor, and team that touches
            cryptography. Success requires structured planning, executive sponsorship, and
            continuous stakeholder alignment.
          </p>
          <div className="bg-muted/50 rounded-lg p-4 border border-primary/20">
            <p className="text-sm text-foreground/90">
              Migrating to post-quantum cryptography is as much an organizational challenge as it is
              a technical one. Agencies and enterprises should establish a dedicated migration
              program with clear governance, milestones, and reporting structures.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Aligned with CISA Post-Quantum Cryptography Initiative guidance (cisa.gov/pqc)
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">Program vs Project</div>
              <p className="text-xs text-muted-foreground">
                A project delivers a specific output; a program coordinates multiple interdependent
                projects toward a strategic goal &mdash; full PQC readiness.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">Critical Path</div>
              <p className="text-xs text-muted-foreground">
                The longest sequence of dependent tasks determines your minimum migration timeline.
                Vendor PQC readiness is often the binding constraint.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">Executive Sponsorship</div>
              <p className="text-xs text-muted-foreground">
                Without C-suite commitment, PQC migration stalls. Budget, priority, and
                cross-department coordination require top-down authority.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: NIST IR 8547 7-Phase Framework */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-secondary/10">
            <Route size={24} className="text-secondary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">
            NIST IR 8547: 7-Phase Migration Framework
          </h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            <InlineTooltip term="NIST IR 8547">NIST IR 8547</InlineTooltip> defines a structured
            approach to PQC migration that serves as the foundation for enterprise migration
            programs. Each phase builds on the previous and has clear deliverables.
          </p>
          <div className="space-y-2">
            {[
              {
                n: 1,
                t: 'Discovery',
                d: 'Identify all cryptographic assets across the organization using automated scanning and manual inventory.',
                icon: ClipboardCheck,
              },
              {
                n: 2,
                t: 'Inventory',
                d: 'Build a comprehensive Cryptographic Bill of Materials (CBOM) documenting algorithms, key sizes, and dependencies.',
                icon: ClipboardCheck,
              },
              {
                n: 3,
                t: 'Prioritization',
                d: 'Rank systems by quantum vulnerability, data sensitivity, compliance requirements, and migration complexity.',
                icon: Target,
              },
              {
                n: 4,
                t: 'Planning',
                d: 'Develop migration roadmaps, allocate resources, establish governance structures, and define success criteria.',
                icon: Map,
              },
              {
                n: 5,
                t: 'Pilot',
                d: 'Deploy hybrid PQC configurations in controlled environments to validate interoperability and performance.',
                icon: Shield,
              },
              {
                n: 6,
                t: 'Migration',
                d: 'Execute phased rollout of PQC algorithms across production systems with rollback capability.',
                icon: Route,
              },
              {
                n: 7,
                t: 'Validation',
                d: 'Verify PQC deployment correctness, monitor for regressions, and establish continuous compliance.',
                icon: BarChart3,
              },
            ].map((phase) => {
              const Icon = phase.icon
              return (
                <div key={phase.n} className="flex items-start gap-3 bg-muted/50 rounded-lg p-3">
                  <div className="p-1.5 rounded bg-primary/10 shrink-0">
                    <Icon size={16} className="text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      Phase {phase.n}: {phase.t}
                    </div>
                    <p className="text-xs text-muted-foreground">{phase.d}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Section 3: Success Factors */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Users size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">Critical Success Factors</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Enterprise PQC migration programs that succeed share common characteristics. These
            success factors are drawn from early adopters and regulatory guidance.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Building2 size={16} className="text-primary" />
                <div className="text-sm font-bold text-foreground">Executive Sponsorship</div>
              </div>
              <p className="text-xs text-muted-foreground">
                CISO or CTO-level ownership with regular board reporting. Migration budgets,
                cross-team authority, and organizational priority require executive mandate.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Users size={16} className="text-primary" />
                <div className="text-sm font-bold text-foreground">Cross-Functional Teams</div>
              </div>
              <p className="text-xs text-muted-foreground">
                Security, engineering, compliance, vendor management, and business stakeholders must
                all be represented. Crypto touches every layer of the stack.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={16} className="text-primary" />
                <div className="text-sm font-bold text-foreground">Phased Approach</div>
              </div>
              <p className="text-xs text-muted-foreground">
                Start with hybrid deployments in low-risk systems, validate, then expand. Big-bang
                migrations are too risky for cryptographic infrastructure.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 size={16} className="text-primary" />
                <div className="text-sm font-bold text-foreground">Measurable KPIs</div>
              </div>
              <p className="text-xs text-muted-foreground">
                Track systems inventoried, algorithms migrated, vendor readiness, compliance gaps
                closed, and budget utilization. What gets measured gets managed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Workshop Overview */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-secondary/10">
            <Target size={24} className="text-secondary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">Workshop: Build Your Program</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            This workshop provides three interactive tools that produce real, exportable artifacts
            for your PQC migration program:
          </p>
          <div className="space-y-2">
            {[
              {
                n: 1,
                t: 'Roadmap Builder',
                d: 'Build a migration roadmap with your milestones overlaid on real country-specific regulatory deadlines from the Timeline dataset.',
                icon: Map,
              },
              {
                n: 2,
                t: 'Stakeholder Communications Planner',
                d: 'Map stakeholders, craft tailored messages for each audience (board, technical leads, developers, partners), and define reporting cadence.',
                icon: Users,
              },
              {
                n: 3,
                t: 'KPI Tracker Template',
                d: 'Design a scorecard with weighted dimensions (systems inventoried, algorithms migrated, vendor readiness, compliance, budget, risk trend) auto-scored from live data.',
                icon: Target,
              },
            ].map((step) => {
              const Icon = step.icon
              return (
                <div key={step.n} className="flex items-start gap-3 bg-muted/50 rounded-lg p-3">
                  <div className="p-1.5 rounded bg-primary/10 shrink-0">
                    <Icon size={16} className="text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      Step {step.n}: {step.t}
                    </div>
                    <p className="text-xs text-muted-foreground">{step.d}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Related Resources */}
      <section className="glass-panel p-6 border-secondary/20">
        <h3 className="text-lg font-bold text-gradient mb-3">Related Resources</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Link
            to="/assess"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <ClipboardCheck size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Risk Assessment</div>
              <div className="text-xs text-muted-foreground">
                Run a guided PQC readiness assessment
              </div>
            </div>
          </Link>
          <Link
            to="/timeline"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Calendar size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Regulatory Timeline</div>
              <div className="text-xs text-muted-foreground">
                Country-by-country PQC deadlines and milestones
              </div>
            </div>
          </Link>
          <Link
            to="/learn/crypto-agility"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Route size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Crypto Agility</div>
              <div className="text-xs text-muted-foreground">
                Architecture patterns for rapid algorithm migration
              </div>
            </div>
          </Link>
          <Link
            to="/learn/pqc-governance"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Shield size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">PQC Governance &amp; Policy</div>
              <div className="text-xs text-muted-foreground">
                RACI matrices, policy drafts, and KPI dashboards
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* CTA */}
      <div className="text-center">
        <button
          onClick={onNavigateToWorkshop}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors"
        >
          Start Workshop <ArrowRight size={18} />
        </button>
        <p className="text-xs text-muted-foreground mt-2">
          Build a migration roadmap, plan stakeholder communications, and design a KPI tracker.
        </p>
      </div>
    </div>
  )
}
