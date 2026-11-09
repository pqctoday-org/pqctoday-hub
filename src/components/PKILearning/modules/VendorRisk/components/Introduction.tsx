// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { useSectionAnchors } from '@/components/PKILearning/common/LearnSection'
import { Link } from 'react-router'
import {
  ShieldCheck,
  ClipboardCheck,
  Network,
  ArrowRight,
  FileSearch,
  AlertTriangle,
  Building2,
  Route,
  BookOpen,
} from 'lucide-react'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'
import { Button } from '@/components/ui/button'

interface IntroductionProps {
  onNavigateToWorkshop: () => void
}

export const Introduction: React.FC<IntroductionProps> = ({ onNavigateToWorkshop }) => {
  // The data-section-id anchors below were already here and already
  // matched this module's manifest; nothing read them. One call makes
  // deep links land and section progress record.
  useSectionAnchors()

  return (
    <div className="space-y-8 w-full">
      {/* Section 1: Why Vendor PQC Risk Matters */}
      <section className="glass-panel p-6">
        <div data-section-id="readiness" className="flex items-center gap-3 mb-4 scroll-mt-20">
          <div className="p-2 rounded-lg bg-primary/10">
            <AlertTriangle size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">Why Vendor PQC Risk Matters</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Your organization&apos;s quantum readiness is only as strong as your weakest vendor.
            Third-party software, hardware, and cloud services form the backbone of enterprise
            cryptographic infrastructure. If a critical vendor lacks{' '}
            <InlineTooltip term="Post-Quantum Cryptography">PQC</InlineTooltip> support, your entire
            migration timeline is at risk.
          </p>
          <div className="bg-muted/50 rounded-lg p-4 border border-primary/20">
            <blockquote className="text-sm italic text-foreground/90">
              &ldquo;The supply chains have dependencies on the maturity of standards, protocols,
              and the cryptographic validation program before the products and services can be
              delivered to the implementer.&rdquo;
            </blockquote>
            <p className="text-xs text-muted-foreground mt-2">
              &mdash; NIST CSWP 39-upd1, Section 5.3 (Technology Supply Chains)
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">Harvest Now, Decrypt Later</div>
              <p className="text-xs text-muted-foreground">
                Vendors handling sensitive data in transit are immediate{' '}
                <InlineTooltip term="HNDL">HNDL</InlineTooltip> targets. Every unpatched vendor
                extends your exposure window. For the full HNDL risk quantification framework, see{' '}
                <Link to="/learn/pqc-risk-management" className="text-primary hover:underline">
                  PQC Risk Management
                </Link>
                .
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">Compliance Cascade</div>
              <p className="text-xs text-muted-foreground">
                Ask first which requirement applies to you.{' '}
                <InlineTooltip term="CNSA 2.0">CNSA 2.0</InlineTooltip> sets algorithm requirements
                for national security systems; NSA encourages adoption elsewhere but says it is not
                an NSA requirement there.{' '}
                <InlineTooltip term="FIPS 140-3">FIPS 140-3</InlineTooltip> applies to federal
                agencies that use cryptography to protect sensitive information and to modules
                operated for them under contract; private and commercial organizations may adopt it
                voluntarily. Where a requirement applies, it attaches to the specific product,
                module and configuration in scope. Module validation and PQC transition dates are
                separate questions: a validated module shows what was tested, not that a transition
                date is met.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">Single Points of Failure</div>
              <p className="text-xs text-muted-foreground">
                A single vendor dependency on classical-only crypto can block your entire PQC
                migration program.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Vendor Scorecards */}
      <section className="glass-panel p-6">
        <div data-section-id="supply-chain" className="flex items-center gap-3 mb-4 scroll-mt-20">
          <div className="p-2 rounded-lg bg-secondary/10">
            <ClipboardCheck size={24} className="text-secondary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">Vendor PQC Scorecards</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            A vendor scorecard provides a structured, repeatable method for evaluating how
            well-prepared each vendor is for the post-quantum transition. Scores are weighted across
            dimensions that map to real migration risk factors.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-foreground mb-1">Key Dimensions</div>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>
                  &bull; PQC algorithm support (ML-KEM/FIPS&nbsp;203, ML-DSA/FIPS&nbsp;204,
                  SLH-DSA/FIPS&nbsp;205)
                </li>
                <li>&bull; FIPS 140-3 validation status</li>
                <li>&bull; Published PQC migration roadmap</li>
                <li>&bull; Crypto agility capability</li>
                <li>&bull; SBOM/CBOM delivery</li>
                <li>&bull; Hybrid mode support</li>
              </ul>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-foreground mb-1">Scoring Methodology</div>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>&bull; Each dimension scored 0&ndash;100</li>
                <li>&bull; Weights reflect migration impact</li>
                <li>&bull; FIPS dimension auto-scored from product data</li>
                <li>&bull; Composite score drives risk tier</li>
                <li>&bull; Exportable for procurement reviews</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: CBOM — Crypto Bill of Materials */}
      <section className="glass-panel p-6">
        <div data-section-id="cbom" className="flex items-center gap-3 mb-4 scroll-mt-20">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileSearch size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">CBOM: Crypto Bill of Materials</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            A <InlineTooltip term="CBOM">CBOM</InlineTooltip> (Cryptographic Bill of Materials)
            extends the{' '}
            <Link to="/learn/sbom" className="text-primary hover:underline">
              SBOM
            </Link>{' '}
            concept to list the cryptographic algorithms, keys, certificates, and protocols a
            software product uses. It supports component visibility: you can see what a product
            contains and judge which parts can be updated and which must be replaced. It is also a
            supplier-produced inventory, so it stays self-attestation until you check it against
            scoped independent testing, validation records, and change evidence, and it does not
            show on its own which product versions will be supported. Use it alongside version
            support, testing, and contractual commitments rather than in place of them.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">What a CBOM Reveals</div>
              <p className="text-xs text-muted-foreground">
                Algorithm inventory, key sizes, protocol versions, certificate types, and quantum
                vulnerability status per component, as far as the supplier records them.
                Completeness is something to check, not assume.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">Standard Format</div>
              <p className="text-xs text-muted-foreground">
                CycloneDX 1.7, the current version on cyclonedx.org, models cryptographic assets, so
                a CBOM can be machine-readable. The specification is developed by the OWASP
                Foundation and is also standardized as ECMA-424 (Ecma TC54).
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">Vendor Requirement</div>
              <p className="text-xs text-muted-foreground">
                Include CBOM delivery requirements in vendor contracts with defined frequency,
                format, and scope expectations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: FIPS Validation Tiers */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-secondary/10">
            <ShieldCheck size={24} className="text-secondary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">FIPS Validation Tiers</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Not all &ldquo;FIPS compliance&rdquo; claims are equal. Understanding the tiers helps
            you assess real vendor cryptographic maturity.
          </p>
          <div className="space-y-2">
            {[
              {
                tier: 'FIPS 140-3 Validated',
                color: 'text-status-success',
                desc: 'Module has an active CMVP certificate. Check its overall level, operational environments, caveats and approved-algorithm list, and that the product uses that module in that configuration.',
              },
              {
                tier: 'FIPS 140-3 In Process (MIP)',
                color: 'text-status-warning',
                desc: 'Module is on the CMVP Modules in Process list. That is a queue position, not evidence of the outcome: a submission can stall, be withdrawn or fail. Treat it as a roadmap statement until a certificate is issued.',
              },
              {
                tier: 'FIPS 140-2 Validated',
                color: 'text-status-warning',
                desc: 'Legacy validation. FIPS 140-2 certificates moved to the CMVP Historical list in September 2026: NIST still supports buying and using them for existing systems, and says Federal Agencies should not include them in new systems.',
              },
              {
                tier: 'FIPS Mode / Self-Claim',
                color: 'text-status-error',
                desc: 'Vendor claims FIPS-mode operation but has no CMVP certificate. Lowest assurance.',
              },
            ].map((item) => (
              <div
                key={item.tier}
                className="flex flex-col sm:flex-row items-start gap-1 sm:gap-3 bg-muted/50 rounded-lg p-3"
              >
                <span className={`text-sm font-bold shrink-0 w-full sm:w-48 ${item.color}`}>
                  {item.tier}
                </span>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4b: PQC Contract Requirements */}
      <section className="glass-panel p-6">
        <div data-section-id="contracts" className="flex items-center gap-3 mb-4 scroll-mt-20">
          <div className="p-2 rounded-lg bg-primary/10">
            <ClipboardCheck size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">PQC Contract Requirements</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Contract language turns a vendor&apos;s roadmap statement into something you can check
            and enforce. The Contract Clauses tool in this module drafts these areas; they are this
            module&apos;s drafting guidance, not legal advice, so have counsel review any language
            before it goes into an agreement.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">Timeline and scope</div>
              <p className="text-xs text-muted-foreground">
                Tie vendor deadlines to your own migration plan and to the requirement that actually
                applies to you, and name the products, versions, and configurations in scope.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">Version support</div>
              <p className="text-xs text-muted-foreground">
                State which product versions will receive PQC support and how long each version
                stays supported, so a CBOM for one version is not read as a promise for another.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">Validation and testing</div>
              <p className="text-xs text-muted-foreground">
                Where your policy or contract requires validated modules, ask for the CMVP
                certificate, the module name and version, and the tested configuration. Add scoped
                independent testing results where the risk justifies them.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">
                CBOM, change notice, and audit
              </div>
              <p className="text-xs text-muted-foreground">
                Require CBOM delivery at a stated frequency and format, advance notice of
                cryptographic changes, and the right to check the CBOM against testing, validation,
                and release evidence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5: Vendor Assessment Framework */}
      <section className="glass-panel p-6">
        <div data-section-id="risk-matrix" className="flex items-center gap-3 mb-4 scroll-mt-20">
          <div className="p-2 rounded-lg bg-primary/10">
            <Building2 size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">Vendor Assessment Framework</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            A structured approach to evaluating vendors ensures consistent, auditable assessments
            across your supply chain. Follow this framework when engaging vendors on PQC readiness.
          </p>
          <div className="space-y-2">
            {[
              {
                n: 1,
                t: 'Inventory',
                d: 'Catalog all vendor products that handle cryptographic operations',
              },
              {
                n: 2,
                t: 'Request CBOM',
                d: 'Ask vendors for Crypto Bill of Materials (CycloneDX format)',
              },
              {
                n: 3,
                t: 'Score Readiness',
                d: 'Apply the PQC readiness scorecard across 6 dimensions',
              },
              {
                n: 4,
                t: 'Contract Requirements',
                d: 'Embed PQC migration clauses in vendor agreements',
              },
              {
                n: 5,
                t: 'Monitor & Reassess',
                d: 'Track vendor progress quarterly; escalate non-compliance',
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
            to="/migrate"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Route size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Migration Workbench</div>
              <div className="text-xs text-muted-foreground">
                Browse PQC-ready products across infrastructure layers
              </div>
            </div>
          </Link>
          <Link
            to="/compliance"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <BookOpen size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Compliance Tracker</div>
              <div className="text-xs text-muted-foreground">
                FIPS, CNSA 2.0, and international PQC compliance requirements
              </div>
            </div>
          </Link>
          <Link
            to="/learn/crypto-agility"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Network size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Crypto Agility</div>
              <div className="text-xs text-muted-foreground">
                Architecture patterns for algorithm-agile vendor integration
              </div>
            </div>
          </Link>
          <Link
            to="/assess"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <ClipboardCheck size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Risk Assessment</div>
              <div className="text-xs text-muted-foreground">
                Run a full PQC readiness assessment for your organization
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
          Build vendor scorecards, generate contract clauses, and map supply chain risk.
        </p>
      </div>
      <ReadingCompleteButton />
    </div>
  )
}
