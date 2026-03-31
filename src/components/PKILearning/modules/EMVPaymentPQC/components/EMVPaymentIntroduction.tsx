// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Globe,
  Smartphone,
  ShoppingCart,
  Monitor,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Lock,
  Layers,
  KeyRound,
  Server,
  Cpu,
  Scale,
} from 'lucide-react'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { Button } from '@/components/ui/button'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'
import { VendorCoverageNotice } from '@/components/PKILearning/common/VendorCoverageNotice'
import { PAYMENT_NETWORKS } from '../data/paymentNetworkData'
import { CARD_AUTH_SPECS } from '../data/cardCryptoData'
import { MOBILE_WALLETS } from '../data/tokenizationData'
import { POS_TERMINAL_PROFILES } from '../data/posCryptoData'
import { MIGRATION_VECTORS } from '../data/migrationRiskData'
import {
  PQC_POSTURE_COLORS,
  PQC_POSTURE_LABELS,
  SEVERITY_COLORS,
  SEVERITY_LABELS,
} from '../data/emvConstants'

// ── Local CollapsibleSection ─────────────────────────────────────────────

interface CollapsibleSectionProps {
  title: string
  icon: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  defaultOpen = false,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <section className="glass-panel overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">{icon}</div>
          <h2 className="text-xl font-bold text-gradient">{title}</h2>
        </div>
        {isOpen ? (
          <ChevronUp size={20} className="text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown size={20} className="text-muted-foreground shrink-0" />
        )}
      </button>
      {isOpen && <div className="px-6 pb-6 space-y-4">{children}</div>}
    </section>
  )
}

// ── Introduction Component ───────────────────────────────────────────────

interface EMVPaymentIntroductionProps {
  onNavigateToWorkshop: () => void
}

export const EMVPaymentIntroduction: React.FC<EMVPaymentIntroductionProps> = ({
  onNavigateToWorkshop,
}) => {
  const activeNetworks = PAYMENT_NETWORKS.filter(
    (n) => n.pqcPosture === 'active-pilot' || n.pqcPosture === 'research'
  ).length
  const criticalVectors = MIGRATION_VECTORS.filter((v) => v.severity === 'critical').length

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ── Section 1: The EMV Payment Ecosystem ── */}
      <CollapsibleSection
        title="1. The EMV Payment Ecosystem"
        icon={<Globe size={20} className="text-primary" />}
        defaultOpen
      >
        <p className="text-muted-foreground">
          <InlineTooltip term="EMV">
            <strong className="text-foreground">EMV</strong>
          </InlineTooltip>{' '}
          (Europay, Mastercard, Visa) is the global standard for chip-based payment card
          authentication. Originally developed in the 1990s, EMV is now managed by{' '}
          <strong className="text-foreground">EMVCo</strong>, jointly owned by the six major payment
          networks. With approximately <strong className="text-foreground">14.7 billion</strong> EMV
          cards in circulation, it is the largest deployed PKI ecosystem in the world.
        </p>

        <div className="glass-panel p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Major Payment Networks</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Network</th>
                  <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Region</th>
                  <th className="text-right py-2 pr-4 text-muted-foreground font-medium">Cards</th>
                  <th className="text-right py-2 pr-4 text-muted-foreground font-medium">Volume</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">PQC Posture</th>
                </tr>
              </thead>
              <tbody>
                {PAYMENT_NETWORKS.map((n) => (
                  <tr key={n.id} className="border-b border-border/50">
                    <td className="py-2 pr-4 font-medium text-foreground">{n.name}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{n.headquartersRegion}</td>
                    <td className="py-2 pr-4 text-right text-foreground">{n.cardsInCirculation}</td>
                    <td className="py-2 pr-4 text-right text-foreground">
                      {n.annualTransactionVolume}
                    </td>
                    <td className="py-2">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${PQC_POSTURE_COLORS[n.pqcPosture]}`}
                      >
                        {PQC_POSTURE_LABELS[n.pqcPosture]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-panel p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Four-Party Payment Model</h3>
          <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
            <span className="px-3 py-1.5 rounded border border-primary/30 bg-primary/10 text-primary font-medium">
              Cardholder
            </span>
            <ArrowRight size={16} className="text-muted-foreground" />
            <span className="px-3 py-1.5 rounded border border-status-warning/30 bg-status-warning/10 text-status-warning font-medium">
              Merchant
            </span>
            <ArrowRight size={16} className="text-muted-foreground" />
            <span className="px-3 py-1.5 rounded border border-accent/30 bg-accent/10 text-accent font-medium">
              Acquirer
            </span>
            <ArrowRight size={16} className="text-muted-foreground" />
            <span className="px-3 py-1.5 rounded border border-status-info/30 bg-status-info/10 text-status-info font-medium">
              Network
            </span>
            <ArrowRight size={16} className="text-muted-foreground" />
            <span className="px-3 py-1.5 rounded border border-status-success/30 bg-status-success/10 text-status-success font-medium">
              Issuer
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Every transaction traverses this chain. Cryptography protects each link.
          </p>
        </div>
      </CollapsibleSection>

      {/* ── Section 2: Card Authentication ── */}
      <CollapsibleSection
        title="2. Card Authentication: SDA, DDA & CDA"
        icon={<Shield size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          EMV defines three offline authentication methods, all based on{' '}
          <strong className="text-foreground">RSA signatures</strong>. The card contains a
          certificate chain signed by the EMVCo Root CA. The terminal verifies this chain to
          authenticate the card without contacting the issuer.
        </p>

        <div className="grid gap-4">
          {CARD_AUTH_SPECS.map((spec) => (
            <div key={spec.id} className="glass-panel p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-primary/20 text-primary border border-primary/30">
                  {spec.name}
                </span>
                <span className="text-sm font-medium text-foreground">{spec.fullName}</span>
                <span className="text-xs text-muted-foreground ml-auto">{spec.prevalence}</span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{spec.description}</p>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground">
                  {spec.algorithm}
                </span>
                <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground">
                  Key: {spec.keySize} bits
                </span>
                <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground">
                  Sig: {spec.signatureBytes} bytes
                </span>
                {spec.quantumVulnerable && (
                  <span className="px-2 py-0.5 rounded bg-status-error/20 text-status-error border border-status-error/30">
                    Quantum Vulnerable
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 rounded-lg bg-status-warning/10 border border-status-warning/20">
          <p className="text-sm text-status-warning">
            <strong>Key insight:</strong> All three EMV authentication methods rely on RSA. A
            quantum computer capable of running Shor&apos;s algorithm could forge ICC certificates,
            enabling counterfeit cards to pass offline terminal verification.
          </p>
        </div>
      </CollapsibleSection>

      {/* ── Section 3: Payment Network Architecture ── */}
      <CollapsibleSection
        title="3. Payment Network Architecture"
        icon={<Globe size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          Every online EMV transaction follows a precise authorization flow. The card generates an{' '}
          <InlineTooltip term="ARQC">
            <strong className="text-foreground">ARQC</strong>
          </InlineTooltip>{' '}
          (Authorization Request Cryptogram) using symmetric keys, which travels through the
          acquirer and network to the issuer. The issuer verifies and responds with an{' '}
          <InlineTooltip term="ARPC">
            <strong className="text-foreground">ARPC</strong>
          </InlineTooltip>
          .
        </p>

        <div className="glass-panel p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Crypto at Each Hop</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-3">
              <span className="shrink-0 w-28 font-medium text-foreground">Card → Terminal</span>
              <span className="text-muted-foreground">
                RSA-2048 certificate chain verification (offline auth) + 3DES/AES ARQC generation
                (symmetric)
              </span>
            </div>
            <div className="flex items-start gap-3">
              <span className="shrink-0 w-28 font-medium text-foreground">Terminal → Acquirer</span>
              <span className="text-muted-foreground">
                TLS 1.2/1.3 with RSA/ECDSA key exchange + AES-GCM payload encryption
              </span>
            </div>
            <div className="flex items-start gap-3">
              <span className="shrink-0 w-28 font-medium text-foreground">Acquirer → Network</span>
              <span className="text-muted-foreground">
                TLS (network-to-network) + ISO 8583 MAC (3DES/AES symmetric)
              </span>
            </div>
            <div className="flex items-start gap-3">
              <span className="shrink-0 w-28 font-medium text-foreground">Network → Issuer</span>
              <span className="text-muted-foreground">
                ARQC verification in issuer HSM (symmetric) + HSM key wrapping (RSA-2048)
              </span>
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Online vs Offline:</strong> Online transactions get
          real-time issuer authorization, providing a second layer of defense. Offline transactions
          rely entirely on the RSA certificate chain — the quantum attack surface is larger.
        </p>
      </CollapsibleSection>

      {/* ── Section 4: Tokenization & Mobile Payments ── */}
      <CollapsibleSection
        title="4. Tokenization & Mobile Payments"
        icon={<Smartphone size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          Payment tokenization replaces the real{' '}
          <InlineTooltip term="PAN">
            <strong className="text-foreground">PAN</strong>
          </InlineTooltip>{' '}
          with a surrogate token managed by a{' '}
          <InlineTooltip term="TSP">
            <strong className="text-foreground">Token Service Provider (TSP)</strong>
          </InlineTooltip>
          . Each major network operates its own TSP: Visa Token Service (VTS), Mastercard MDES, and
          Amex EST.
        </p>

        <div className="glass-panel p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Mobile Wallets</h3>
          <div className="grid gap-3">
            {MOBILE_WALLETS.map((w) => (
              <div
                key={w.id}
                className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border/50"
              >
                <div className="flex-1">
                  <span className="font-medium text-foreground text-sm">{w.name}</span>
                  <p className="text-xs text-muted-foreground mt-0.5">SE: {w.secureElement}</p>
                </div>
                <p className="text-xs text-muted-foreground max-w-sm">{w.pqcStatus}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-status-info/10 border border-status-info/20">
          <p className="text-sm text-status-info">
            <strong>Key insight:</strong> Per-transaction cryptograms (AES-256) are quantum-safe.
            The quantum vulnerability is in the <em>provisioning</em> phase — RSA/ECDSA device
            attestation and TLS key exchange to the TSP.
          </p>
        </div>
      </CollapsibleSection>

      {/* ── Section 5: E-Commerce & Card-Not-Present ── */}
      <CollapsibleSection
        title="5. E-Commerce & Card-Not-Present"
        icon={<ShoppingCart size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          Card-not-present (CNP) transactions transmit card data over TLS to payment gateways.{' '}
          <InlineTooltip term="3-D Secure">
            <strong className="text-foreground">3-D Secure 2.0</strong>
          </InlineTooltip>{' '}
          (Visa Secure, Mastercard Identity Check) adds cardholder authentication using ECDSA
          challenge signing and device binding.
        </p>

        <div className="glass-panel p-4 space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Quantum Attack Surface</h3>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            <li>
              <strong className="text-foreground">TLS key exchange:</strong> RSA/ECDSA vulnerable to
              Shor&apos;s algorithm — HNDL risk on payment data in transit
            </li>
            <li>
              <strong className="text-foreground">3DS challenge signing:</strong> ECDSA P-256
              signatures can be forged, enabling unauthorized authentication
            </li>
            <li>
              <strong className="text-foreground">Payment gateway certificates:</strong> X.509
              certificates with RSA/ECDSA keys
            </li>
          </ul>
          <p className="text-xs text-muted-foreground mt-2">
            E-commerce TLS is the fastest migration path — hybrid ML-KEM TLS 1.3 is already
            supported by major CDN providers and browsers.
          </p>
        </div>
      </CollapsibleSection>

      {/* ── Section 6: POS Terminals & Key Injection ── */}
      <CollapsibleSection
        title="6. POS Terminals & Key Injection"
        icon={<Monitor size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          Payment terminals range from powerful ATMs to constrained mPOS dongles.{' '}
          <InlineTooltip term="DUKPT">
            <strong className="text-foreground">DUKPT</strong>
          </InlineTooltip>{' '}
          (Derived Unique Key Per Transaction) ensures each transaction uses a unique symmetric key
          derived from a{' '}
          <InlineTooltip term="BDK">
            <strong className="text-foreground">Base Derivation Key (BDK)</strong>
          </InlineTooltip>
          .
        </p>

        <div className="glass-panel p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Terminal Types</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {POS_TERMINAL_PROFILES.map((t) => (
              <div
                key={t.id}
                className="p-2 rounded bg-muted/50 border border-border/50 text-center"
              >
                <span className="text-sm font-medium text-foreground">{t.name}</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t.ramKB >= 1024 ? `${(t.ramKB / 1024).toFixed(0)} MB` : `${t.ramKB} KB`} RAM
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-status-error/10 border border-status-error/20">
          <p className="text-sm text-status-error">
            <strong>Critical vulnerability:</strong> The DUKPT symmetric derivation chain is
            quantum-safe. The quantum attack point is RSA-2048 key transport at{' '}
            <InlineTooltip term="KIF">
              <strong>Key Injection Facilities</strong>
            </InlineTooltip>
            . Compromising the BDK allows deriving ALL past and future transaction keys.
          </p>
        </div>

        <Link
          to="/learn/hsm-pqc?tab=workshop&step=0"
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors font-medium"
        >
          <ArrowRight size={12} />
          Explore Payment HSMs in the HSM & PQC Module
        </Link>
      </CollapsibleSection>

      {/* ── Section 7: Quantum Threats to Payment Systems ── */}
      <CollapsibleSection
        title="7. Quantum Threats to Payment Systems"
        icon={<ShieldAlert size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          The payment ecosystem faces multiple quantum threat vectors, from offline card
          authentication to key injection infrastructure. The scale is unprecedented —{' '}
          <strong className="text-foreground">14.7 billion EMV cards</strong> cannot be replaced
          overnight.
        </p>

        <div className="glass-panel p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Payment Component Risk Summary
          </h3>
          <div className="space-y-2">
            {MIGRATION_VECTORS.filter((v) => v.severity === 'critical' || v.severity === 'high')
              .slice(0, 6)
              .map((v) => (
                <div
                  key={v.id}
                  className="flex items-center gap-3 p-2 rounded bg-muted/50 border border-border/50"
                >
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded text-xs font-medium border ${SEVERITY_COLORS[v.severity]}`}
                  >
                    {SEVERITY_LABELS[v.severity]}
                  </span>
                  <span className="text-sm text-foreground flex-1">{v.componentLabel}</span>
                  {v.hndlExposure && (
                    <AlertTriangle size={14} className="text-status-warning shrink-0" />
                  )}
                  <span className="text-xs text-muted-foreground shrink-0">
                    {v.migrationTimeline}
                  </span>
                </div>
              ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="glass-panel p-3 text-center">
            <div className="text-2xl font-bold text-status-error">{criticalVectors}</div>
            <div className="text-xs text-muted-foreground">Critical Vectors</div>
          </div>
          <div className="glass-panel p-3 text-center">
            <div className="text-2xl font-bold text-status-warning">
              {MIGRATION_VECTORS.filter((v) => v.hndlExposure).length}
            </div>
            <div className="text-xs text-muted-foreground">HNDL Exposed</div>
          </div>
          <div className="glass-panel p-3 text-center">
            <div className="text-2xl font-bold text-primary">
              {activeNetworks}/{PAYMENT_NETWORKS.length}
            </div>
            <div className="text-xs text-muted-foreground">Networks Active</div>
          </div>
        </div>
      </CollapsibleSection>

      {/* ── Section 8: PQC Migration Landscape ── */}
      <CollapsibleSection
        title="8. PQC Migration Landscape"
        icon={<Lock size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          The payment industry is at an inflection point. EMVCo does not expect quantum threats
          until 2040+, but BIS, G7, and national regulators target{' '}
          <strong className="text-foreground">2030-2032</strong> for critical financial system
          migration. Only <strong className="text-foreground">Mastercard</strong> has published a
          comprehensive PQC white paper and active TLS 1.3 PQC pilots.
        </p>

        <div className="glass-panel p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Key Migration Factors</h3>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1.5">
            <li>
              <strong className="text-foreground">FN-DSA (Falcon, FIPS 206 draft):</strong> Leading
              candidate for constrained card chips — compact signatures (~690 bytes vs ML-DSA&apos;s
              ~2,420 bytes)
            </li>
            <li>
              <strong className="text-foreground">Hybrid approach:</strong> Dual-signature cards
              (RSA + FN-DSA) during transition enable backwards compatibility with legacy terminals
            </li>
            <li>
              <strong className="text-foreground">Card replacement cycle:</strong> 3-5 years per
              card fleet — cards issued today are in circulation until 2029-2031
            </li>
            <li>
              <strong className="text-foreground">HSM dependency:</strong> Payment HSMs must support
              PQC key wrapping before any downstream migration can begin
            </li>
            <li>
              <strong className="text-foreground">PCI DSS alignment:</strong> PCI SSC recognizes
              NIST FIPS 203/204/205 — binding requirements expected in 2026+ wave
            </li>
          </ul>
        </div>
      </CollapsibleSection>

      {/* Related Resources */}
      <section className="glass-panel p-6 border-secondary/20">
        <h3 className="text-lg font-bold text-gradient mb-3">Related Resources</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Link
            to="/learn/tls-basics"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Lock size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">TLS Basics &amp; PQC</div>
              <div className="text-xs text-muted-foreground">
                ML-KEM hybrid KEMs for securing payment network channels
              </div>
            </div>
          </Link>
          <Link
            to="/learn/hybrid-crypto"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Layers size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">Hybrid Cryptography</div>
              <div className="text-xs text-muted-foreground">
                Dual-signature card strategies for backwards-compatible migration
              </div>
            </div>
          </Link>
          <Link
            to="/learn/kms-pqc"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <KeyRound size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">KMS &amp; PQC</div>
              <div className="text-xs text-muted-foreground">
                DUKPT and KIF key management lifecycle for PQC migration
              </div>
            </div>
          </Link>
          <Link
            to="/learn/hsm-pqc"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Server size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">HSM &amp; PQC</div>
              <div className="text-xs text-muted-foreground">
                Payment HSM vendors and PQC key-wrapping support timelines
              </div>
            </div>
          </Link>
          <Link
            to="/learn/iot-ot-pqc"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Cpu size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">IoT &amp; OT Security</div>
              <div className="text-xs text-muted-foreground">
                FN-DSA for constrained card chips and POS terminal migration
              </div>
            </div>
          </Link>
          <Link
            to="/learn/compliance-strategy"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Scale size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">Compliance Strategy</div>
              <div className="text-xs text-muted-foreground">
                PCI DSS, G7, and BIS regulatory timelines for payment PQC
              </div>
            </div>
          </Link>
        </div>
      </section>
      <VendorCoverageNotice migrateLayer="AppServers" />
      <div className="flex items-center justify-start">
        <Button variant="gradient" onClick={onNavigateToWorkshop}>
          <ShieldCheck size={16} className="mr-2" />
          Start Workshop
        </Button>
      </div>
      <ReadingCompleteButton />
    </div>
  )
}
