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
            <strong>Crypto agility</strong> is the ability to rapidly switch cryptographic
            algorithms, protocols, and implementations without significant changes to application
            code or infrastructure. It&apos;s NIST&apos;s top recommendation for PQC transition
            preparedness.
          </p>
          <div className="bg-muted/50 rounded-lg p-4 border border-primary/20">
            <blockquote className="text-sm italic text-foreground/90">
              &ldquo;Organizations should begin preparing for the migration to post-quantum
              cryptography by designing systems with cryptographic agility.&rdquo;
            </blockquote>
            <p className="text-xs text-muted-foreground mt-2">&mdash; NIST IR 8547, March 2025</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">Algorithm Agility</div>
              <p className="text-xs text-muted-foreground">
                Swap algorithms (RSA &rarr; ML-KEM) via configuration changes, not code rewrites.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-xs font-bold text-primary mb-1">Protocol Agility</div>
              <p className="text-xs text-muted-foreground">
                Support multiple protocol versions simultaneously (TLS 1.2/1.3, hybrid key
                exchange).
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

      {/* Section 2: Abstraction Layers */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-secondary/10">
            <Layers size={24} className="text-secondary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">Abstraction Layers</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            The provider model separates <em>what</em> crypto operations your app needs from{' '}
            <em>how</em> they&apos;re implemented. This is the foundation of crypto agility.
          </p>
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="space-y-2 text-center">
              <div className="p-2 rounded bg-primary/10 text-primary text-xs font-bold">
                Application Code
              </div>
              <div className="text-muted-foreground">&darr;</div>
              <div className="p-2 rounded bg-secondary/10 text-secondary text-xs font-bold">
                Crypto Abstraction API (encrypt, sign, verify, keyExchange)
              </div>
              <div className="text-muted-foreground">&darr;</div>
              <div className="p-2 rounded bg-muted text-foreground text-xs font-bold">
                Provider Registry (configuration-driven)
              </div>
              <div className="text-muted-foreground">&darr;</div>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded bg-warning/10 text-warning text-[10px] font-bold text-center">
                  RSA-2048
                </div>
                <div className="p-2 rounded bg-success/10 text-success text-[10px] font-bold text-center">
                  ML-KEM-768
                </div>
                <div className="p-2 rounded bg-primary/10 text-primary text-[10px] font-bold text-center">
                  X25519MLKEM768
                </div>
              </div>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Real-world examples: Java&apos;s JCA (Java Cryptography Architecture), OpenSSL&apos;s
            provider framework (3.x), PKCS#11 for HSMs, and cloud KMS APIs (AWS, Azure, GCP).
          </p>
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
            organization. A CBOM provides this visibility using the CycloneDX standard.
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
            PQC migration follows a structured framework aligned with NIST IR 8547, CISA guidance,
            and NSA CNSA 2.0 timelines. Each phase builds on the previous.
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
              Deployed X25519MLKEM768 hybrid key exchange across all TLS connections in 2024.
              Observed &lt;1% performance overhead with 3x ciphertext size increase.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-xs font-bold text-primary mb-2">Google Chrome</div>
            <p className="text-xs text-muted-foreground">
              Enabled hybrid TLS key exchange by default in Chrome 124. Crypto agile architecture
              allowed rollout without changing the TLS stack.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-xs font-bold text-primary mb-2">Apple</div>
            <p className="text-xs text-muted-foreground">
              iMessage adopted PQ3 protocol (X25519 + Kyber-1024 ratchet) in iOS 17.4. Phased
              rollout leveraging protocol agility.
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
                NIST, ANSSI, and BSI compliance requirements
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
