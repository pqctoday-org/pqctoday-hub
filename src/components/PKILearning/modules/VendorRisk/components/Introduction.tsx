import React from 'react'
import { Link } from 'react-router-dom'
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

interface IntroductionProps {
  onNavigateToWorkshop: () => void
}

export const Introduction: React.FC<IntroductionProps> = ({ onNavigateToWorkshop }) => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Section 1: Why Vendor PQC Risk Matters */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
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
              &ldquo;Supply chain risks are among the most significant challenges for PQC migration.
              Organizations must evaluate vendors&apos; cryptographic capabilities and ensure
              contractual commitments to post-quantum readiness.&rdquo;
            </blockquote>
            <p className="text-xs text-muted-foreground mt-2">
              &mdash; NIST SP 1800-38 (Draft), PQC Migration Handbook
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">Harvest Now, Decrypt Later</div>
              <p className="text-xs text-muted-foreground">
                Vendors handling sensitive data in transit are immediate{' '}
                <InlineTooltip term="HNDL">HNDL</InlineTooltip> targets. Every unpatched vendor
                extends your exposure window.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">Compliance Cascade</div>
              <p className="text-xs text-muted-foreground">
                Regulatory deadlines (<InlineTooltip term="CNSA 2.0">CNSA 2.0</InlineTooltip>,{' '}
                <InlineTooltip term="FIPS 140-3">FIPS 140-3</InlineTooltip>) apply to your full
                supply chain, not just your own code.
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
        <div className="flex items-center gap-3 mb-4">
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
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileSearch size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">CBOM: Crypto Bill of Materials</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            A <InlineTooltip term="CBOM">CBOM</InlineTooltip> (Cryptographic Bill of Materials)
            extends the SBOM concept to track every cryptographic algorithm, key, certificate, and
            protocol used by a software product. Demanding CBOMs from vendors is the single most
            impactful step toward supply chain quantum readiness.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">What a CBOM Reveals</div>
              <p className="text-xs text-muted-foreground">
                Algorithm inventory, key sizes, protocol versions, certificate types, and quantum
                vulnerability status per component.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">Standard Format</div>
              <p className="text-xs text-muted-foreground">
                CycloneDX 1.6+ includes a crypto extension for machine-readable CBOM data. The
                CycloneDX community (cyclonedx.org) maintains the specification, originally an OWASP
                project.
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
                desc: 'Module has passed CMVP testing. Highest assurance level for cryptographic modules.',
              },
              {
                tier: 'FIPS 140-3 Submitted',
                color: 'text-status-warning',
                desc: 'Module is in the CMVP testing queue. Validation pending but commitment demonstrated.',
              },
              {
                tier: 'FIPS 140-2 Validated',
                color: 'text-status-warning',
                desc: 'Legacy validation. NIST sunsets FIPS 140-2 certificates; migration to 140-3 required.',
              },
              {
                tier: 'FIPS Mode / Self-Claim',
                color: 'text-status-error',
                desc: 'Vendor claims FIPS-mode operation but has no CMVP certificate. Lowest assurance.',
              },
            ].map((item) => (
              <div key={item.tier} className="flex items-start gap-3 bg-muted/50 rounded-lg p-3">
                <span className={`text-sm font-bold shrink-0 w-48 ${item.color}`}>{item.tier}</span>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5: Vendor Assessment Framework */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
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
              <div className="text-sm font-medium text-foreground">Migration Catalog</div>
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
        <button
          onClick={onNavigateToWorkshop}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors"
        >
          Start Workshop <ArrowRight size={18} />
        </button>
        <p className="text-xs text-muted-foreground mt-2">
          Build vendor scorecards, generate contract clauses, and map supply chain risk.
        </p>
      </div>
    </div>
  )
}
