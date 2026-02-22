import React from 'react'
import { Link } from 'react-router-dom'
import {
  Repeat,
  Layers,
  FileSearch,
  Route,
  Building2,
  ArrowRight,
  ClipboardCheck,
  BookOpen,
  FlaskConical,
} from 'lucide-react'
import { InlineTooltip } from '@/components/ui/InlineTooltip'

interface CryptoAgilityIntroductionProps {
  onNavigateToWorkshop: () => void
}

export const CryptoAgilityIntroduction: React.FC<CryptoAgilityIntroductionProps> = ({
  onNavigateToWorkshop,
}) => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Section 1: What is Crypto Agility? */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Repeat size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">What is Crypto Agility?</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            <strong>
              <InlineTooltip term="Crypto Agility">Crypto agility</InlineTooltip>
            </strong>{' '}
            is the ability to rapidly switch cryptographic algorithms, protocols, and
            implementations without significant changes to application code or infrastructure.
            It&apos;s NIST&apos;s top recommendation for PQC transition preparedness.
          </p>
          <div className="bg-muted/50 rounded-lg p-4 border border-primary/20">
            <blockquote className="text-sm italic text-foreground/90">
              &ldquo;Organizations should begin preparing for the migration to post-quantum
              cryptography by designing systems with cryptographic agility.&rdquo;
            </blockquote>
            <p className="text-xs text-muted-foreground mt-2">
              &mdash; NIST IR 8547 (Draft), November 2024
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">Algorithm Agility</div>
              <p className="text-xs text-muted-foreground">
                Swap algorithms (<InlineTooltip term="RSA">RSA</InlineTooltip> &rarr;{' '}
                <InlineTooltip term="ML-KEM">ML-KEM</InlineTooltip>) via configuration changes, not
                code rewrites.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">Protocol Agility</div>
              <p className="text-xs text-muted-foreground">
                Support multiple protocol versions simultaneously (
                <InlineTooltip term="TLS">TLS</InlineTooltip> 1.2/1.3, hybrid key exchange).
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">Implementation Agility</div>
              <p className="text-xs text-muted-foreground">
                Switch between crypto providers (OpenSSL, BoringSSL, AWS-LC) without application
                changes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Architecture Patterns */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-secondary/10">
            <Layers size={24} className="text-secondary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">Architecture Patterns</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Crypto agility isn't just about code — it's an architectural decision. Organizations
            typically use one or more of these three macro-patterns to achieve agility:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {/* Pattern 1: Provider Model */}
            <div className="bg-muted/50 rounded-lg p-4 border border-border flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded bg-primary/10 text-primary">
                  <Layers size={16} />
                </div>
                <div className="text-sm font-bold text-foreground">Provider Model</div>
              </div>
              <p className="text-xs text-muted-foreground mb-3 flex-grow">
                Applications link to a crypto library through an abstraction API (like JCA or
                OpenSSL Providers). Agility is achieved at the application level via config changes.
              </p>
              <div className="mt-auto space-y-1 text-[10px] font-mono bg-background p-2 rounded">
                <div className="text-primary text-center">App Code</div>
                <div className="text-center text-muted-foreground">&darr;</div>
                <div className="text-secondary text-center">Provider API</div>
                <div className="text-center text-muted-foreground">&darr;</div>
                <div className="text-foreground text-center border-t border-border pt-1">
                  Algorithm
                </div>
              </div>
            </div>

            {/* Pattern 2: Service Mesh */}
            <div className="bg-muted/50 rounded-lg p-4 border border-border flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded bg-success/10 text-success">
                  <Route size={16} />
                </div>
                <div className="text-sm font-bold text-foreground">Service Mesh / Proxy</div>
              </div>
              <p className="text-xs text-muted-foreground mb-3 flex-grow">
                Cryptography for data-in-transit (mTLS) is completely offloaded to an infrastructure
                proxy (Envoy, Istio). Zero app code changes required.
              </p>
              <div className="mt-auto space-y-1 text-[10px] font-mono bg-background p-2 rounded">
                <div className="text-primary text-center">App (Plaintext)</div>
                <div className="text-center text-muted-foreground">&harr;</div>
                <div className="text-success text-center">Sidecar Proxy</div>
                <div className="text-center text-muted-foreground">&harr;</div>
                <div className="text-foreground text-center border-t border-border pt-1">
                  PQC Network
                </div>
              </div>
            </div>

            {/* Pattern 3: External KMS */}
            <div className="bg-muted/50 rounded-lg p-4 border border-border flex flex-col">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded bg-warning/10 text-warning">
                  <Building2 size={16} />
                </div>
                <div className="text-sm font-bold text-foreground">
                  External <InlineTooltip term="KMS">KMS</InlineTooltip> /{' '}
                  <InlineTooltip term="HSM">HSM</InlineTooltip>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-3 flex-grow">
                Crypto operations are outsourced over the network to a central service (AWS KMS,
                Azure Key Vault). Upgrading the central KMS upgrades the enterprise.
              </p>
              <div className="mt-auto space-y-1 text-[10px] font-mono bg-background p-2 rounded">
                <div className="text-primary text-center">App (API Request)</div>
                <div className="text-center text-muted-foreground">&harr;</div>
                <div className="text-warning text-center">Cloud KMS API</div>
                <div className="text-center text-muted-foreground">&harr;</div>
                <div className="text-foreground text-center border-t border-border pt-1">
                  Hardware Security Module
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: CBOM */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileSearch size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">CBOM: Cryptographic Bill of Materials</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Before you can migrate, you need to <em>find</em> every cryptographic algorithm in your
            organization. A <InlineTooltip term="CBOM">CBOM</InlineTooltip> provides this visibility
            using the CycloneDX standard.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-foreground mb-1">What a CBOM tracks</div>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>&bull; Algorithm name and key size</li>
                <li>&bull; Where it&apos;s used (component, service, protocol)</li>
                <li>&bull; Classical and quantum security levels</li>
                <li>&bull; Compliance framework requirements</li>
                <li>&bull; Migration recommendation</li>
              </ul>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-foreground mb-1">
                Tools for CBOM generation
              </div>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>&bull; IBM Quantum Safe Explorer</li>
                <li>&bull; Keyfactor CBOM Generator</li>
                <li>&bull; InfoSec Global AgileSec</li>
                <li>&bull; Cryptosense Analyzer</li>
                <li>&bull; Manual audit + code scanning</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: 7-Phase Migration */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-secondary/10">
            <Route size={24} className="text-secondary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">7-Phase Migration Framework</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            <InlineTooltip term="Post-Quantum Cryptography">PQC</InlineTooltip> migration follows a
            structured framework aligned with{' '}
            <InlineTooltip term="NIST IR 8547">NIST IR 8547</InlineTooltip>, CISA guidance, and NSA{' '}
            <InlineTooltip term="CNSA 2.0">CNSA 2.0</InlineTooltip> timelines. Each phase builds on
            the previous.
          </p>
          <div className="space-y-2">
            {[
              { n: 1, t: 'Assessment & Inventory', d: 'Discover all crypto assets, build CBOM' },
              { n: 2, t: 'Risk Prioritization', d: 'Rank by data sensitivity and compliance' },
              { n: 3, t: 'Preparation & Tooling', d: 'Select PQC-ready libraries and HSMs' },
              { n: 4, t: 'Testing & Validation', d: 'Pilot hybrid deployments' },
              { n: 5, t: 'Hybrid Migration', d: 'Deploy dual-algorithm configurations' },
              { n: 6, t: 'Production Deployment', d: 'Full PQC across all systems' },
              { n: 7, t: 'Monitoring', d: 'Continuous compliance and optimization' },
            ].map((phase) => (
              <div key={phase.n} className="flex items-start gap-3 bg-muted/50 rounded-lg p-3">
                <span className="text-sm font-bold text-primary shrink-0 w-6 text-center">
                  {phase.n}
                </span>
                <div>
                  <div className="text-sm font-medium text-foreground">{phase.t}</div>
                  <p className="text-xs text-muted-foreground">{phase.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5: Industry Examples */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Building2 size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">Industry Case Studies</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-xs font-bold text-primary mb-2">Cloudflare</div>
            <p className="text-xs text-muted-foreground">
              Enabled hybrid PQC key exchange (X25519Kyber768, later{' '}
              <InlineTooltip term="X25519MLKEM768">X25519MLKEM768</InlineTooltip>) across its
              network in 2024. TLS handshake times increased ~4%; hybrid client key share is 1,216
              bytes vs 32 bytes for X25519 alone.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-xs font-bold text-primary mb-2">Google Chrome</div>
            <p className="text-xs text-muted-foreground">
              Enabled hybrid PQC key exchange (X25519Kyber768) by default in Chrome 124 (April
              2024); upgraded to standardized X25519MLKEM768 in Chrome 131 (November 2024).
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-xs font-bold text-primary mb-2">Apple</div>
            <p className="text-xs text-muted-foreground">
              iMessage adopted PQ3 protocol (P-256 ECDH + Kyber-1024 initial keys, Kyber-768
              rekeying ratchet) in iOS 17.4. Phased rollout leveraging protocol agility.
            </p>
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
            to="/migrate"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Route size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Migration Guide</div>
              <div className="text-xs text-muted-foreground">
                Detailed migration workflows and software catalog
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
                NIST, <InlineTooltip term="ANSSI">ANSSI</InlineTooltip>, and{' '}
                <InlineTooltip term="BSI">BSI</InlineTooltip> compliance requirements
              </div>
            </div>
          </Link>
          <Link
            to="/learn/quantum-threats"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <FlaskConical size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Quantum Threats</div>
              <div className="text-xs text-muted-foreground">
                Why migration matters &mdash; the quantum threat explained
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
          Explore abstraction layers, scan a sample CBOM, and plan a PQC migration.
        </p>
      </div>
    </div>
  )
}
