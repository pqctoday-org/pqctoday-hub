// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldAlert,
  Clock,
  ClipboardList,
  Grid3X3,
  ArrowRight,
  BarChart3,
  AlertTriangle,
  Target,
  BookOpen,
  FlaskConical,
} from 'lucide-react'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'
import { Button } from '@/components/ui/button'

interface IntroductionProps {
  onNavigateToWorkshop: () => void
}

export const Introduction: React.FC<IntroductionProps> = ({ onNavigateToWorkshop }) => {
  return (
    <div className="space-y-8 w-full">
      {/* Quantum Computing Primer */}
      <section className="glass-panel p-4 border-primary/10">
        <p className="text-sm text-foreground/80">
          Quantum computers exploit quantum mechanical properties to solve certain mathematical
          problems exponentially faster than classical computers. Most critically,{' '}
          <strong>Shor&apos;s algorithm</strong> &mdash; running on a sufficiently powerful quantum
          computer &mdash; can factor large integers and solve discrete logarithm problems in
          polynomial time, which would break RSA, Diffie-Hellman, and elliptic curve cryptography
          that protect virtually all internet communications today.
        </p>
      </section>

      {/* Section 1: Why PQC Risk Management? */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <ShieldAlert size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">Why PQC Risk Management?</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            The arrival of a{' '}
            <InlineTooltip term="CRQC">
              cryptographically relevant quantum computer (CRQC)
            </InlineTooltip>{' '}
            will break the asymmetric cryptography that protects virtually all digital
            communications. Risk management provides the framework for understanding <em>when</em>{' '}
            this threat becomes real, <em>what</em> assets are exposed, and <em>how</em> to
            prioritize migration efforts.
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">Identify</div>
              <p className="text-xs text-muted-foreground">
                Discover every cryptographic asset in your organization and map quantum
                vulnerability exposure.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">Quantify</div>
              <p className="text-xs text-muted-foreground">
                Assign likelihood and impact scores to each risk, calculate composite risk levels,
                and estimate exposure windows.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">Prioritize</div>
              <p className="text-xs text-muted-foreground">
                Rank risks by severity, align with compliance deadlines, and allocate migration
                resources where they matter most.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Key Concepts */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-secondary/10">
            <AlertTriangle size={24} className="text-secondary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">Key Concepts</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            PQC risk management introduces several concepts specific to quantum-era threats.
            Understanding these is essential for building an effective risk register.
          </p>
          <div className="space-y-3">
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={16} className="text-primary" />
                <div className="text-sm font-bold text-foreground">CRQC Timeline</div>
              </div>
              <p className="text-xs text-muted-foreground">
                A{' '}
                <InlineTooltip term="CRQC">
                  Cryptographically Relevant Quantum Computer
                </InlineTooltip>{' '}
                is one powerful enough to break <InlineTooltip term="RSA">RSA</InlineTooltip>,{' '}
                <InlineTooltip term="ECC">ECC</InlineTooltip>, and{' '}
                <InlineTooltip term="DH">Diffie-Hellman</InlineTooltip> key exchange. Expert
                estimates for CRQC arrival range from 2030 to 2045+, with a median around 2035. Your
                organization&apos;s planning horizon should be based on conservative estimates.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Target size={16} className="text-status-warning" />
                <div className="text-sm font-bold text-foreground">
                  HNDL &mdash; Harvest Now, Decrypt Later
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                <InlineTooltip term="HNDL">HNDL</InlineTooltip> attacks involve adversaries
                capturing encrypted data today with the intent to decrypt it once quantum computers
                become available. Data with long confidentiality requirements (healthcare records,
                classified information, financial data) is already at risk even though quantum
                computers don&apos;t yet exist.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 size={16} className="text-status-error" />
                <div className="text-sm font-bold text-foreground">Risk Quantification</div>
              </div>
              <p className="text-xs text-muted-foreground">
                Quantum risk is quantified as <strong>Likelihood x Impact</strong> on a 1&ndash;5
                scale for each dimension, producing a risk score from 1 to 25. Likelihood considers
                the probability that the asset&apos;s algorithm will be broken within its required
                protection lifetime. Impact considers the business, regulatory, and reputational
                consequences of a breach.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: The Risk Management Process */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <ClipboardList size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">The Risk Management Process</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            This workshop walks you through a structured three-step quantum risk management process:
          </p>
          <div className="space-y-2">
            {[
              {
                n: 1,
                t: 'CRQC Scenario Planning',
                d: 'Model when a quantum computer could arrive and see which algorithms, compliance deadlines, and data are at risk.',
                icon: Clock,
              },
              {
                n: 2,
                t: 'Risk Register Building',
                d: 'Document every quantum-vulnerable cryptographic asset with likelihood, impact, and mitigation strategies.',
                icon: ClipboardList,
              },
              {
                n: 3,
                t: 'Risk Heatmap Visualization',
                d: 'Plot your risks on a 5x5 likelihood-impact grid to identify critical migration priorities.',
                icon: Grid3X3,
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

      {/* Section 4: Why This Matters for Executives */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-secondary/10">
            <BarChart3 size={24} className="text-secondary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">Executive Perspective</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            For CISOs and security leaders, quantum risk management is not a future concern &mdash;
            it&apos;s a present-day requirement. Regulatory bodies worldwide are setting migration
            deadlines, and the HNDL threat means sensitive data is already at risk.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="text-xs font-bold text-foreground mb-2">Regulatory Pressure</div>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>
                  &bull; NSA <InlineTooltip term="CNSA 2.0">CNSA 2.0</InlineTooltip>: PQC required
                  for NSS by 2030&ndash;2035
                </li>
                <li>&bull; NIST: Deprecating RSA/ECC in standards by 2030</li>
                <li>&bull; EU/ANSSI: Active PQC transition guidance</li>
                <li>&bull; Financial regulators examining quantum risk</li>
              </ul>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="text-xs font-bold text-foreground mb-2">Business Impact</div>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>&bull; Data breach costs averaging $4.88M (IBM, 2024)</li>
                <li>&bull; Supply chain trust dependent on digital signatures</li>
                <li>&bull; Competitive advantage from early PQC adoption</li>
                <li>&bull; Insurance and audit implications</li>
              </ul>
            </div>
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
            <BarChart3 size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Risk Assessment</div>
              <div className="text-xs text-muted-foreground">
                Run a guided PQC readiness assessment
              </div>
            </div>
          </Link>
          <Link
            to="/threats"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <FlaskConical size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Threat Landscape</div>
              <div className="text-xs text-muted-foreground">
                Explore quantum threats by industry and algorithm
              </div>
            </div>
          </Link>
          <Link
            to="/learn/crypto-agility"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <BookOpen size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Crypto Agility</div>
              <div className="text-xs text-muted-foreground">
                Architecture patterns for rapid algorithm migration
              </div>
            </div>
          </Link>
          <Link
            to="/learn/quantum-threats"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <AlertTriangle size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Quantum Threats</div>
              <div className="text-xs text-muted-foreground">
                Why quantum computing threatens current cryptography
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* CTA */}
      <div className="text-center">
        <Button
          variant="gradient"
          onClick={onNavigateToWorkshop}
          className="inline-flex items-center gap-2 px-6 py-3 font-bold rounded-lg transition-colors"
        >
          Start Workshop <ArrowRight size={18} />
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          Model CRQC scenarios, build a risk register, and visualize your exposure on a heatmap.
        </p>
      </div>
      <ReadingCompleteButton />
    </div>
  )
}
