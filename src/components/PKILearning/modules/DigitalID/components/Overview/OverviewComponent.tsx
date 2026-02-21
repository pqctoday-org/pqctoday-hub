import React from 'react'
import {
  BookOpen,
  Shield,
  FileText,
  Users,
  Globe,
  Lock,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react'

interface OverviewComponentProps {
  onNavigateTo: (stepId: string) => void
}

export const OverviewComponent: React.FC<OverviewComponentProps> = ({ onNavigateTo }) => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* What is eIDAS 2.0? */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <BookOpen size={20} /> What is eIDAS 2.0?
        </h2>
        <p className="text-foreground/80 leading-relaxed">
          The European Digital Identity Regulation (eIDAS 2.0, Regulation EU 2024/1183) entered into
          force in May 2024 and mandates that all 27 EU member states provide citizens and residents
          with at least one EUDI Wallet by late 2026. Unlike eIDAS 1.0 where national eID
          notification was voluntary, eIDAS 2.0 makes digital identity wallets mandatory — creating
          a pan-European trust framework for identity, attestations, and qualified electronic
          signatures.
        </p>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-sm font-bold text-primary mb-1">eIDAS 1.0 (2014)</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>National eID notification voluntary</li>
              <li>5 qualified trust services</li>
              <li>No wallet framework</li>
              <li>Limited cross-border recognition</li>
            </ul>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-sm font-bold text-success mb-1">eIDAS 2.0 (2024)</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>EUDI Wallet mandatory for all states</li>
              <li>Attribute attestations (EAA, QEAA)</li>
              <li>Full cross-border mutual recognition</li>
              <li>Private sector acceptance required</li>
            </ul>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-sm font-bold text-warning mb-1">Key Deadlines</div>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>May 2024: Regulation entered into force</li>
              <li>Dec 2024: First implementing acts</li>
              <li>Dec 2026: Wallets available</li>
              <li>Late 2027: Private sector acceptance</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Credential Formats */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <FileText size={20} /> Credential Formats: mdoc vs SD-JWT
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-4">
          The EUDI Architecture Reference Framework (ARF) supports two credential formats. Both
          enable selective disclosure, but serve different use cases.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-sm font-bold text-primary mb-2">mso_mdoc (ISO 18013-5)</div>
            <ul className="text-xs text-muted-foreground space-y-1.5">
              <li>
                <span className="font-medium text-foreground">Encoding:</span> CBOR (binary)
              </li>
              <li>
                <span className="font-medium text-foreground">Optimized for:</span> Proximity — NFC,
                BLE (in-person verification)
              </li>
              <li>
                <span className="font-medium text-foreground">Namespace:</span>{' '}
                eu.europa.ec.eudi.pid.1
              </li>
              <li>
                <span className="font-medium text-foreground">Used in this module:</span> PID
                credential
              </li>
            </ul>
          </div>
          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-sm font-bold text-success mb-2">vc+sd-jwt (IETF SD-JWT VC)</div>
            <ul className="text-xs text-muted-foreground space-y-1.5">
              <li>
                <span className="font-medium text-foreground">Encoding:</span> JSON (text-based)
              </li>
              <li>
                <span className="font-medium text-foreground">Optimized for:</span> Remote — online
                services, APIs
              </li>
              <li>
                <span className="font-medium text-foreground">Disclosure:</span> Hash-based
                selective claims
              </li>
              <li>
                <span className="font-medium text-foreground">Used in this module:</span> Diploma
                attestation
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Trust Framework */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <Shield size={20} /> Trust Framework
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-4">
          EUDI establishes a layered trust chain. Relying Parties can verify credential authenticity
          without contacting the issuer, using public trust infrastructure.
        </p>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex items-center gap-3 p-3 rounded border bg-muted/30">
            <Globe className="w-5 h-5 text-primary shrink-0" />
            <div>
              <span className="font-medium">National Trusted Lists</span>
              <span className="text-xs text-muted-foreground block">
                Each member state publishes a machine-readable list of Qualified Trust Service
                Providers (QTSPs).
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded border bg-muted/30">
            <Users className="w-5 h-5 text-success shrink-0" />
            <div>
              <span className="font-medium">QTSPs (Qualified Trust Service Providers)</span>
              <span className="text-xs text-muted-foreground block">
                Certified organizations that issue qualified attestations (QEAA) and provide
                qualified signatures (QES).
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded border bg-muted/30">
            <Lock className="w-5 h-5 text-warning shrink-0" />
            <div>
              <span className="font-medium">eIDAS Trust Framework (Bridge)</span>
              <span className="text-xs text-muted-foreground block">
                Cross-border mechanism ensuring mutual recognition of wallets, PIDs, and
                attestations across all 27 member states.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy & Data Minimization */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <Lock size={20} /> Privacy by Design
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-4">
          The EUDI Wallet enforces strong privacy guarantees aligned with GDPR.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-sm font-bold text-primary mb-1">Selective Disclosure</div>
            <p className="text-xs text-muted-foreground">
              Only requested attributes are revealed. All other claims remain cryptographically
              hidden from the verifier.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-sm font-bold text-success mb-1">Unlinkability</div>
            <p className="text-xs text-muted-foreground">
              Different presentations to different Relying Parties should not be correlatable. The
              ARF addresses this through batch-issued credentials and pseudonymous identifiers.
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-sm font-bold text-warning mb-1">Data Minimization</div>
            <p className="text-xs text-muted-foreground">
              GDPR Art. 5(1)(c) compliance. The wallet enforces sharing only the minimum data
              necessary for a specific purpose.
            </p>
          </div>
        </div>
      </section>

      {/* PQC Readiness */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <AlertTriangle size={20} /> Post-Quantum Readiness
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-3">
          Current EUDI implementations use classical ECDSA (P-256, P-384) for signatures and key
          binding. eIDAS 2.0 does not yet mandate post-quantum cryptography, but ENISA has
          identified wallet providers as high-impact entities for early PQC adoption. Future ARF
          versions are expected to require PQC-safe algorithms (ML-DSA, SLH-DSA) for long-lived
          credentials.
        </p>
        <p className="text-xs text-muted-foreground">
          This simulation uses classical algorithms to match current ARF specifications. The PQC
          migration path for EUDI is an active area of ETSI and ENISA research.
        </p>
      </section>

      {/* Large-Scale Pilots */}
      <section className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient flex items-center gap-2 mb-3">
          <Globe size={20} /> Large-Scale Pilots
        </h2>
        <p className="text-foreground/80 leading-relaxed mb-3">
          The EU funded four Large-Scale Pilots (LSPs) testing EUDI wallets in real conditions
          across 26+ countries.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2 rounded border bg-muted/30 text-center">
            <div className="font-bold text-foreground">DC4EU</div>
            <div className="text-muted-foreground">Education & Social Security</div>
          </div>
          <div className="p-2 rounded border bg-muted/30 text-center">
            <div className="font-bold text-foreground">EWC</div>
            <div className="text-muted-foreground">Travel & Org Identity</div>
          </div>
          <div className="p-2 rounded border bg-muted/30 text-center">
            <div className="font-bold text-foreground">NOBID</div>
            <div className="text-muted-foreground">Banking & Telecom</div>
          </div>
          <div className="p-2 rounded border bg-muted/30 text-center">
            <div className="font-bold text-foreground">POTENTIAL</div>
            <div className="text-muted-foreground">Government & Payments</div>
          </div>
        </div>
      </section>

      {/* Start CTA */}
      <div className="text-center py-4">
        <button
          onClick={() => onNavigateTo('wallet')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary/20 border border-primary text-primary rounded-full hover:bg-primary/30 transition-colors font-medium"
        >
          Start the Simulation <ArrowRight size={16} />
        </button>
      </div>
    </div>
  )
}
