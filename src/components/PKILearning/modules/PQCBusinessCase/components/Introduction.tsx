// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Link } from 'react-router-dom'
import {
  DollarSign,
  TrendingUp,
  ShieldAlert,
  Calculator,
  Presentation,
  ArrowRight,
  ClipboardCheck,
  Scale,
  BarChart3,
  Building2,
} from 'lucide-react'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { LearnStepper } from '@/components/PKILearning/LearnStepper'
import { Button } from '@/components/ui/button'

interface IntroductionProps {
  onNavigateToWorkshop: () => void
}

// ─── Step 1: Why + Concepts + Cost Categories ────────────────────────────────

const Step1WhyConceptsCosts: React.FC = () => (
  <div className="space-y-8 w-full">
    {/* Section 1: Why Build a Business Case? */}
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <DollarSign size={24} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">Why Build a PQC Business Case?</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          <InlineTooltip term="Post-Quantum Cryptography">Post-quantum cryptography</InlineTooltip>{' '}
          migration is not just a technical initiative &mdash; it requires significant
          organizational investment. A well-constructed business case translates technical risk into
          financial language that executives and boards understand.
        </p>
        <div className="bg-muted/50 rounded-lg p-4 border border-primary/20">
          <blockquote className="text-sm italic text-foreground/90">
            &ldquo;Organizations that delay PQC migration face compounding costs: rising compliance
            penalties, increasing breach exposure from harvest-now-decrypt-later attacks, and the
            growing technical debt of maintaining legacy cryptographic systems.&rdquo;
          </blockquote>
          <p className="text-xs text-muted-foreground mt-2">
            &mdash; Industry consensus from NIST, CISA, and leading CISOs
          </p>
        </div>
        <p>
          Without executive buy-in and adequate funding, PQC migration stalls. The business case
          bridges the gap between technical teams who understand the urgency and decision-makers who
          control budgets.
        </p>
      </div>
    </section>

    {/* Section 2: Key Concepts */}
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-secondary/10">
          <BarChart3 size={24} className="text-secondary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">Key Financial Concepts</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          Building a compelling case requires fluency in three financial frameworks that executives
          use to evaluate technology investments:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-primary mb-1">Total Cost of Ownership (TCO)</div>
            <p className="text-xs text-muted-foreground">
              The complete cost of migration including software, hardware, training, consulting,
              downtime, and ongoing operational changes over the full lifecycle.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-primary mb-1">Risk-Adjusted ROI</div>
            <p className="text-xs text-muted-foreground">
              Return on investment weighted by the probability and magnitude of quantum-enabled
              breaches, regulatory fines, and competitive disadvantage from inaction.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-primary mb-1">Board Communication</div>
            <p className="text-xs text-muted-foreground">
              Translating technical quantum risk into business language: revenue impact, market
              position, regulatory exposure, and fiduciary responsibility.
            </p>
          </div>
        </div>
      </div>
    </section>

    {/* Section 3: Cost Categories */}
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <TrendingUp size={24} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">PQC Migration Cost Categories</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          PQC migration costs span four major categories. Each must be estimated and presented
          alongside the cost of <em>not</em> migrating:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-muted/50 rounded-lg p-4 border border-border flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded bg-primary/10 text-primary">
                <Calculator size={16} />
              </div>
              <div className="text-sm font-bold text-foreground">Migration Costs</div>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1 flex-grow">
              <li>&bull; Software upgrades and license fees</li>
              <li>&bull; Hardware replacements (HSMs, accelerators)</li>
              <li>&bull; Staff training and certification</li>
              <li>&bull; External consulting and integration</li>
              <li>&bull; Testing and validation effort</li>
            </ul>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 border border-border flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded bg-status-error/10 text-status-error">
                <ShieldAlert size={16} />
              </div>
              <div className="text-sm font-bold text-foreground">Breach Avoidance Savings</div>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1 flex-grow">
              <li>
                &bull; <InlineTooltip term="Harvest Now, Decrypt Later">HNDL</InlineTooltip> attack
                exposure (data already at risk)
              </li>
              <li>&bull; Per-record breach costs (industry-specific)</li>
              <li>&bull; Historical data retroactive exposure</li>
              <li>&bull; Reputational damage and customer loss</li>
            </ul>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 border border-border flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded bg-status-warning/10 text-status-warning">
                <Scale size={16} />
              </div>
              <div className="text-sm font-bold text-foreground">Compliance Penalty Avoidance</div>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1 flex-grow">
              <li>&bull; Regulatory fines (GDPR, HIPAA, PCI DSS)</li>
              <li>&bull; Government contract eligibility (CMMC, FedRAMP)</li>
              <li>&bull; Industry mandate deadlines (CNSA 2.0, ANSSI)</li>
              <li>&bull; Audit and remediation costs</li>
            </ul>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 border border-border flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 rounded bg-success/10 text-success">
                <TrendingUp size={16} />
              </div>
              <div className="text-sm font-bold text-foreground">Operational &amp; Competitive</div>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1 flex-grow">
              <li>&bull; Reduced operational complexity (crypto agility)</li>
              <li>&bull; Market differentiation and trust signaling</li>
              <li>&bull; Insurance premium reductions</li>
              <li>&bull; Vendor and partner ecosystem alignment</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  </div>
)

// ─── Step 2: Workshop + Resources + CTA ──────────────────────────────────────

const Step2WorkshopAndResources: React.FC<{ onNavigateToWorkshop: () => void }> = ({
  onNavigateToWorkshop,
}) => (
  <div className="space-y-8 w-full">
    {/* Section 4: Workshop Preview */}
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-secondary/10">
          <Presentation size={24} className="text-secondary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">Workshop: Build Your Business Case</h2>
      </div>
      <div className="space-y-4 text-sm text-foreground/80">
        <p>
          The workshop guides you through three steps to create a complete, data-driven PQC
          investment case:
        </p>
        <div className="space-y-2">
          {[
            {
              n: 1,
              t: 'ROI Calculator',
              d: 'Score migration cost, breach avoidance, compliance, operational efficiency, and competitive advantage to calculate overall ROI.',
            },
            {
              n: 2,
              t: 'Breach Scenario Simulator',
              d: 'Model the financial impact of classical vs. quantum-enabled breaches with industry-specific cost data.',
            },
            {
              n: 3,
              t: 'Board Pitch Builder',
              d: 'Generate a professional board memo with executive summary, risk overview, cost-benefit analysis, and recommended actions.',
            },
          ].map((step) => (
            <div key={step.n} className="flex items-start gap-3 bg-muted/50 rounded-lg p-3">
              <span className="text-sm font-bold text-primary shrink-0 w-6 text-center">
                {step.n}
              </span>
              <div>
                <div className="text-sm font-medium text-foreground">{step.t}</div>
                <p className="text-xs text-muted-foreground">{step.d}</p>
              </div>
            </div>
          ))}
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
              Run a guided PQC readiness assessment to feed into your business case
            </div>
          </div>
        </Link>
        <Link
          to="/threats"
          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
        >
          <ShieldAlert size={18} className="text-primary shrink-0" />
          <div>
            <div className="text-sm font-medium text-foreground">Threat Landscape</div>
            <div className="text-xs text-muted-foreground">
              Explore industry-specific quantum threats and attack vectors
            </div>
          </div>
        </Link>
        <Link
          to="/compliance"
          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
        >
          <Scale size={18} className="text-primary shrink-0" />
          <div>
            <div className="text-sm font-medium text-foreground">Compliance Tracker</div>
            <div className="text-xs text-muted-foreground">
              Review PQC compliance deadlines and regulatory requirements
            </div>
          </div>
        </Link>
        <Link
          to="/migrate"
          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
        >
          <Building2 size={18} className="text-primary shrink-0" />
          <div>
            <div className="text-sm font-medium text-foreground">Migration Catalog</div>
            <div className="text-xs text-muted-foreground">
              Browse PQC-ready products to estimate migration costs
            </div>
          </div>
        </Link>
      </div>
    </section>

    {/* Related Modules */}
    <div className="glass-panel p-4">
      <h3 className="text-sm font-semibold text-foreground mb-3">Related Modules</h3>
      <div className="flex flex-wrap gap-2">
        {[
          { path: '/learn/pqc-risk-management', label: 'PQC Risk Management' },
          { path: '/learn/migration-program', label: 'Migration Program' },
          { path: '/learn/vendor-risk', label: 'Vendor Risk' },
          { path: '/learn/compliance-strategy', label: 'Compliance Strategy' },
        ].map((m) => (
          <Link
            key={m.path}
            to={m.path}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs text-primary hover:text-primary/80 bg-primary/10 border border-primary/20 transition-colors"
          >
            <ArrowRight size={10} />
            {m.label}
          </Link>
        ))}
      </div>
    </div>

    {/* CTA */}
    <div className="text-center">
      <Button
        variant="ghost"
        onClick={onNavigateToWorkshop}
        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors"
      >
        Start Workshop <ArrowRight size={18} />
      </Button>
      <p className="text-xs text-muted-foreground mt-2">
        Calculate ROI, model breach scenarios, and build a board-ready investment case.
      </p>
    </div>
  </div>
)

// ─── Main Component ───────────────────────────────────────────────────────────

export const Introduction: React.FC<IntroductionProps> = ({ onNavigateToWorkshop }) => {
  const steps = [
    {
      label: 'Why PQC Investment & Cost Categories',
      content: <Step1WhyConceptsCosts />,
    },
    {
      label: 'Workshop & Resources',
      content: <Step2WorkshopAndResources onNavigateToWorkshop={onNavigateToWorkshop} />,
    },
  ]

  return <LearnStepper steps={steps} />
}
