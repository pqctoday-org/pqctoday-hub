// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Link } from 'react-router'
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Globe,
  Smartphone,
  ShoppingCart,
  Monitor,
  AlertTriangle,
  ArrowRight,
  ArrowRightLeft,
  Lock,
  Layers,
  KeyRound,
  Server,
  Cpu,
  Scale,
  Landmark,
  FileKey,
} from 'lucide-react'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { Button } from '@/components/ui/button'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'
import { VendorCoverageNotice } from '@/components/PKILearning/common/VendorCoverageNotice'
import { LearnSection, useActiveLearnPath } from '@/components/PKILearning/common/LearnSection'
import {
  SETTLEMENT_RAILS,
  KEY_BLOCK_FACTS,
  EPC_PQC_POSITION,
  SECTOR_BODIES,
} from '../data/bankingData'
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

// The local CollapsibleSection this module used to declare was replaced by the
// shared, anchored LearnSection (2026-07-30) so that industry deep links can
// land on a specific section and per-section reading is actually recorded.

// ── Introduction Component ───────────────────────────────────────────────

interface EMVPaymentIntroductionProps {
  onNavigateToWorkshop: () => void
}

export const EMVPaymentIntroduction: React.FC<EMVPaymentIntroductionProps> = ({
  onNavigateToWorkshop,
}) => {
  // Records `?path=` when a learner arrives from the Industry Landscape, so
  // this module completes on their path's sections rather than all eleven.
  useActiveLearnPath()

  const activeNetworks = PAYMENT_NETWORKS.filter(
    (n) => n.pqcPosture === 'active-pilot' || n.pqcPosture === 'research'
  ).length
  const criticalVectors = MIGRATION_VECTORS.filter((v) => v.severity === 'critical').length

  return (
    <div className="w-full space-y-6">
      {/* ── Section 1: The EMV Payment Ecosystem ── */}
      <LearnSection
        sectionId="emv-ecosystem"
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
          networks. With <strong className="text-foreground">14.7 billion</strong> EMV cards in
          circulation at the end of 2024 — EMVCo&rsquo;s own figure, reported at the 2025 EMV User
          Meeting, and growing about 7% a year — it is the largest deployed PKI ecosystem in the
          world.
        </p>

        <div className="glass-panel p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Major Payment Networks</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Five of EMVCo&rsquo;s six owners are profiled below. JCB, the sixth, is not — its
            published PQC position and card-fleet figures are not sourced to the standard the other
            five rows meet, and this module does not assert what it cannot cite.
          </p>
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
      </LearnSection>

      {/* ── Section 2: Card Authentication ── */}
      <LearnSection
        sectionId="card-auth"
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
      </LearnSection>

      {/* ── Section 3: Payment Network Architecture ── */}
      <LearnSection
        sectionId="network-architecture"
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
      </LearnSection>

      {/* ── Section 4: Tokenization & Mobile Payments ── */}
      <LearnSection
        sectionId="tokenization"
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
      </LearnSection>

      {/* ── Section 5: E-Commerce & Card-Not-Present ── */}
      <LearnSection
        sectionId="ecommerce"
        title="5. E-Commerce, Card-Not-Present & Retail Checkout"
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
      </LearnSection>

      {/* ── Section 6: POS Terminals & Key Injection ── */}
      <LearnSection
        sectionId="pos-terminals"
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
      </LearnSection>

      {/* ── Section 7: Interbank Rails & Settlement ── */}
      <LearnSection
        sectionId="interbank-rails"
        title="7. Interbank Rails & Settlement"
        icon={<Landmark size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          Cards are only one half of the payments estate. The other half moves money between
          institutions — and it has a different threat profile, because settlement traffic is
          long-lived, highly structured, and traverses parties you do not control.
        </p>
        <div className="space-y-3">
          {SETTLEMENT_RAILS.map((rail) => (
            <div key={rail.id} className="p-4 rounded-lg bg-muted/50 border border-border">
              <h4 className="font-semibold text-foreground">{rail.label}</h4>
              <p className="mt-1 text-sm text-muted-foreground">{rail.description}</p>
              <dl className="mt-3 grid gap-2 sm:grid-cols-3 text-sm">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    Protected today by
                  </dt>
                  <dd className="mt-0.5 text-foreground">{rail.classical}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    Data lifetime
                  </dt>
                  <dd className="mt-0.5 text-foreground">{rail.dataLifetime}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-muted-foreground">
                    PQC posture
                  </dt>
                  <dd className="mt-0.5 text-foreground">{rail.pqcPosture}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
        <div className="p-4 rounded-lg bg-status-warning/10 border border-status-warning/30">
          <p className="text-sm">
            <AlertTriangle size={14} className="inline mr-1.5 -mt-0.5 text-status-warning" />
            The correspondent chain is the structural problem: a payment crosses several
            institutions, each retaining its own records, and no participant can migrate the chain
            unilaterally. This is why the sector publishes jointly rather than per-bank.
          </p>
        </div>
        <Button variant="outline" onClick={onNavigateToWorkshop} className="text-sm">
          Model settlement exposure in the Workshop <ArrowRight size={14} className="ml-1" />
        </Button>
      </LearnSection>

      {/* ── Section 8: Banking Key Management & Key Blocks ── */}
      <LearnSection
        sectionId="banking-key-management"
        title="8. Banking Key Management & Key Blocks"
        icon={<FileKey size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">{KEY_BLOCK_FACTS.what}</p>
        <p className="text-muted-foreground">{KEY_BLOCK_FACTS.controlVector}</p>

        <div className="p-4 rounded-lg bg-muted/50 border border-border">
          <h4 className="font-semibold text-foreground">
            Cite the current standard, not the famous one
          </h4>
          <p className="mt-1 text-sm text-muted-foreground">
            The key-block specification most people name is{' '}
            <strong className="text-foreground">{KEY_BLOCK_FACTS.supersededStandard}</strong>. The
            current one is{' '}
            <strong className="text-foreground">{KEY_BLOCK_FACTS.currentStandard}</strong>.{' '}
            {KEY_BLOCK_FACTS.supersessionNote}
          </p>
        </div>

        <div className="p-4 rounded-lg bg-status-info/10 border border-status-info/30">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">
              Why this module teaches around those documents.
            </strong>{' '}
            {KEY_BLOCK_FACTS.paywallNote}
          </p>
        </div>

        <p className="text-muted-foreground">{KEY_BLOCK_FACTS.pciMandate}</p>

        <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-2">
          <h4 className="font-semibold text-foreground">
            Where payments cryptography stands, in the sector&rsquo;s own words
          </h4>
          <p className="text-sm text-muted-foreground">{EPC_PQC_POSITION.standardised}</p>
          <p className="text-sm text-muted-foreground">{EPC_PQC_POSITION.inPreparation}</p>
          <p className="text-sm text-muted-foreground">{EPC_PQC_POSITION.tlsDirection}</p>
          <p className="text-sm text-muted-foreground">{EPC_PQC_POSITION.hndlDriver}</p>
          <p className="text-sm text-muted-foreground">{EPC_PQC_POSITION.symmetricNote}</p>
          <p className="text-xs text-muted-foreground pt-1">
            Source: EPC 342-08 v16.0.1, 24 June 2026 —{' '}
            <Link
              to="/library?ref=EPC-342-08-v16-0-1-Guidelines-on-Cryptographic-Algorithms-Us"
              className="text-primary hover:underline"
            >
              open in the Library
            </Link>
            .
          </p>
        </div>
      </LearnSection>

      {/* ── Section 9: Sector Regulation & Deadlines ── */}
      <LearnSection
        sectionId="sector-regulation"
        title="9. Sector Regulation & Deadlines"
        icon={<Scale size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          No single authority sets the financial sector&rsquo;s post-quantum timetable. The eight
          bodies below publish across five jurisdictions, and which of them binds a given
          institution depends on where it is regulated — not on where it operates.
        </p>
        <div className="space-y-2">
          {SECTOR_BODIES.map((b) => (
            <div
              key={b.id}
              className="flex flex-wrap items-baseline gap-2 p-3 rounded-lg bg-muted/50 border border-border"
            >
              <Link
                to={`/library?ref=${encodeURIComponent(b.libraryRef)}`}
                className="font-medium text-primary hover:underline"
              >
                {b.label}
              </Link>
              <span className="text-xs px-2 py-0.5 rounded-full bg-background text-muted-foreground">
                {b.jurisdiction}
              </span>
              <p className="w-full text-sm text-muted-foreground">{b.contribution}</p>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Unlike Government &amp; Defense, none of these carries a dated{' '}
          <strong className="text-foreground">algorithm</strong> mandate of the CNSA 2.0 kind —
          nothing here names a specific algorithm and a date it must be running by. The EU NIS CG
          Coordinated Implementation Roadmap (above) is the closest exception: it sets a dated{' '}
          <strong className="text-foreground">transition expectation</strong> for EU Member States —
          high-risk use cases transitioned by end-2030 — that reaches EU-regulated banks indirectly
          through NIS2 and DORA&rsquo;s state-of-the-art-cryptography requirements. It is a
          Commission Recommendation, not a law, and it names no algorithm. Otherwise, the
          sector&rsquo;s pressure comes from operational-resilience regulation and from
          harvest-now-decrypt-later exposure, not from a compliance cliff.
        </p>
        <p className="text-sm text-muted-foreground border-l-2 border-border pl-3">
          <strong className="text-foreground">Out of scope.</strong> This module covers card
          payments, interbank rails, and — as of the next section — open banking APIs and PSD2
          Strong Customer Authentication. Instant-payment schemes (SEPA Instant, FedNow) and central
          bank digital currencies raise their own post-quantum questions — different threat models,
          different standards bodies — that this module does not address. They are not covered here
          because the library does not yet hold a substantive PQC source for either; this note will
          be narrowed further once one is acquired, not expanded from general knowledge.
        </p>
      </LearnSection>

      {/* ── Section 10: Open Banking & PSD2 Strong Customer Authentication ── */}
      <LearnSection
        sectionId="open-banking-psd2"
        title="10. Open Banking & PSD2 Strong Customer Authentication"
        icon={<ArrowRightLeft size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          Open banking gives account information service providers (AISPs) and payment initiation
          service providers (PISPs) — often fintechs, not banks — programmatic access to a
          customer&rsquo;s account at their bank. In the EU this is not a voluntary API program; it
          is a legal right created by{' '}
          <Link
            to="/library?ref=PSD2-Directive-EU-2015-2366"
            className="text-primary hover:underline"
          >
            PSD2
          </Link>{' '}
          Article 97, which requires two-factor strong customer authentication (knowledge,
          possession, and inherence — at least two of the three) for online account access, remote
          payment initiation, and any action carrying fraud risk, with the authentication code
          dynamically linked to the exact amount and payee of the transaction.
        </p>
        <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-2">
          <h4 className="font-semibold text-foreground">
            The RTS on SCA (Commission Delegated Regulation (EU) 2018/389)
          </h4>
          <p className="text-sm text-muted-foreground">
            PSD2 sets the legal requirement; the RTS is where the technical shape of it lives — and
            where the cryptography actually shows up.
          </p>
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
            <li>
              <strong className="text-foreground">Dedicated interface (Art. 30).</strong> Every bank
              offering online-accessible accounts must expose an interface AISPs and PISPs can use
              to identify themselves, request account data, and initiate payments — the legal basis
              for every open-banking API in the EU.
            </li>
            <li>
              <strong className="text-foreground">Mandatory fallback (Art. 33).</strong> If a
              bank&rsquo;s dedicated interface is unavailable or under-performing, third-party
              providers must be able to fall back to the interface the bank&rsquo;s own customers
              use — unless the bank&rsquo;s interface has passed three months of problem-free
              operation under independent testing.
            </li>
            <li>
              <strong className="text-foreground">eIDAS qualified certificates (Art. 34).</strong>{' '}
              AISPs, PISPs, and banks identify themselves to each other using qualified certificates
              for website authentication (QWAC) or electronic seals (QSealC) under eIDAS — the same
              certificate framework{' '}
              <Link to="/learn/digital-id" className="text-primary hover:underline">
                the Digital ID module
              </Link>{' '}
              covers for the EUDI Wallet.
            </li>
            <li>
              <strong className="text-foreground">Channel encryption (Art. 35).</strong> The
              regulation requires &ldquo;strong and widely recognised encryption techniques&rdquo;
              for the communication channel — it names no algorithm and no TLS version. That wording
              is deliberately technology-neutral: migrating a dedicated interface to hybrid ML-KEM
              TLS needs no legislative change, only an implementation one.
            </li>
          </ul>
          <p className="text-xs text-muted-foreground pt-1">
            Sources:{' '}
            <Link
              to="/library?ref=PSD2-Directive-EU-2015-2366"
              className="text-primary hover:underline"
            >
              Directive (EU) 2015/2366, Art. 97
            </Link>
            ;{' '}
            <Link to="/library?ref=EBA-RTS-SCA-2018-389" className="text-primary hover:underline">
              Commission Delegated Regulation (EU) 2018/389, Art. 4, 5, 30, 33, 34, 35
            </Link>
            .
          </p>
        </div>
        <p className="text-sm text-muted-foreground border-l-2 border-border pl-3">
          <strong className="text-foreground">
            Continental Europe&rsquo;s dominant technical implementation
          </strong>{' '}
          of the Article 30 dedicated interface is the Berlin Group&rsquo;s NextGenPSD2 Framework,
          adopted by most large EU banking groups. Its site was unreachable while researching this
          section, so this module names it without citing specifics from its own spec — the same
          discipline applied everywhere else here.
        </p>
      </LearnSection>

      {/* ── Section 11: Quantum Threats to Payment Systems ── */}
      <LearnSection
        sectionId="quantum-threats"
        title="11. Quantum Threats to Payment Systems"
        icon={<ShieldAlert size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          The payment ecosystem faces multiple quantum threat vectors, from offline card
          authentication to key injection infrastructure. The scale is unprecedented —{' '}
          <strong className="text-foreground">14.7 billion EMV cards</strong> (end of 2024) cannot
          be replaced overnight.
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
      </LearnSection>

      {/* ── Section 8: PQC Migration Landscape ── */}
      <LearnSection
        sectionId="migration-landscape"
        title="12. PQC Migration Landscape"
        icon={<Lock size={20} className="text-primary" />}
      >
        <p className="text-muted-foreground">
          The payment industry is at an inflection point. EMVCo does not expect quantum computing to
          threaten EMV infrastructure before <strong className="text-foreground">2040</strong> — and
          says it may never — while the G7 Cyber Expert Group points to{' '}
          <strong className="text-foreground">2030-2032</strong> for the most critical financial
          systems, against a broader <strong className="text-foreground">2035</strong> horizon. The
          G7 CEG is explicit that this is not a deadline: the period &ldquo;is reflective of the
          variety of envisaged approaches taken across G7 jurisdictions&rdquo;, and the statement
          &ldquo;does not set guidance or regulatory expectations&rdquo;. Among the card networks,{' '}
          <strong className="text-foreground">Mastercard</strong> is the one that has published a
          dedicated PQC white paper; the rest engage through the EMVCo study group without public
          timetables.
        </p>

        <div className="glass-panel p-4 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Key Migration Factors</h3>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1.5">
            <li>
              <strong className="text-foreground">FN-DSA (Falcon, FIPS 206 in development):</strong>{' '}
              Leading candidate for constrained card chips — compact signatures (666 bytes, a fixed
              padded size, vs ML-DSA&apos;s 2,420 bytes)
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
            {/* NARROWED 2026-08-23. This read "v4.0.1 is the current standard — there is no
                v5.0. PCI SSC opened a six-week request for comments on it on 3 June 2026".
                Neither half was sourceable: nothing in the library supports the negative or the
                date, PCI SSC's own page is JS-rendered so no version string is retrievable, and
                the only "v5.0" in our evidence is PCI PTS HSM v5.0 — a DIFFERENT standard, which
                is a plausible origin for the confusion. What remains is checkable: the library
                holds PCI DSS v4.0.1, and that 794,273-character document contains zero
                occurrences of "post-quantum", "quantum", "ML-KEM", "ML-DSA" or "FIPS 203". */}
            <li>
              <strong className="text-foreground">PCI DSS alignment:</strong> this module works
              against PCI DSS v4.0.1, the version in the standards library. It carries no
              post-quantum requirements; a future revision is where they would first appear
            </li>
          </ul>
        </div>
      </LearnSection>

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

        {/*
          Added 2026-07-31. This module previously reached only /learn and
          /library — it named threat ids in its own search summary with no path
          for a learner to open them, and offered no route to the compliance or
          timeline catalogues despite being the most regulation-dense module in
          the Industries track.
        */}
        <h4 className="text-sm font-semibold text-foreground mt-6 mb-3">
          This sector, elsewhere in the hub
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Link
            to="/threats?industry=Payment%20Card%20Industry"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <AlertTriangle size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">Payment Card Threats</div>
              <div className="text-xs text-muted-foreground">
                Card-ecosystem quantum threats, with sources
              </div>
            </div>
          </Link>
          <Link
            to="/threats?industry=Financial%20Services%20%2F%20Banking"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Landmark size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">Banking Threats</div>
              <div className="text-xs text-muted-foreground">
                Settlement, HSM and interbank threat entries
              </div>
            </div>
          </Link>
          <Link
            to="/compliance"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Scale size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">Compliance Landscape</div>
              <div className="text-xs text-muted-foreground">
                DORA and the sector&rsquo;s regulatory obligations
              </div>
            </div>
          </Link>
          <Link
            to="/timeline"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <ArrowRightLeft size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">Migration Timeline</div>
              <div className="text-xs text-muted-foreground">
                The 2030-2032 targets this module cites
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
