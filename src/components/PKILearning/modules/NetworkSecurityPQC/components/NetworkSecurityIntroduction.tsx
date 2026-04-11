// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import {
  Shield,
  Eye,
  Bell,
  Map,
  Network,
  ChevronRight,
  ArrowRight,
  BookOpen,
  Lock,
  Wrench,
  Globe,
} from 'lucide-react'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'
import { VendorCoverageNotice } from '@/components/PKILearning/common/VendorCoverageNotice'
import { NGFW_VENDORS, INSPECTION_CHALLENGES, IDS_RULE_CATEGORIES } from '../data/networkConstants'
import {
  VENDOR_MIGRATION_DATA,
  PQC_STATUS_LABELS,
  type PQCStatusKey,
} from '../data/networkProviderData'
import { Button } from '@/components/ui/button'

interface CollapsibleSectionProps {
  icon: React.ReactNode
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  icon,
  title,
  defaultOpen = false,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <section className="glass-panel p-6">
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 w-full text-left"
      >
        <div className="p-2 rounded-lg bg-primary/10 shrink-0">{icon}</div>
        <h2 className="text-xl font-bold text-gradient flex-1">{title}</h2>
        <ChevronRight
          size={18}
          className={`text-muted-foreground transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-90' : ''}`}
        />
      </Button>
      {isOpen && <div className="mt-4 space-y-4 text-sm text-foreground/80">{children}</div>}
    </section>
  )
}

interface NetworkSecurityIntroductionProps {
  onNavigateToWorkshop: () => void
}

export const NetworkSecurityIntroduction: React.FC<NetworkSecurityIntroductionProps> = ({
  onNavigateToWorkshop,
}) => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Section 1: How PQC Changes Network Security */}
      <CollapsibleSection
        icon={<Shield size={24} className="text-primary" />}
        title="How PQC Changes Network Security Operations"
        defaultOpen
      >
        <p>
          Post-quantum cryptography introduces fundamental changes to network security operations
          that go beyond algorithm upgrades. Larger{' '}
          <InlineTooltip term="ML-DSA">ML-DSA</InlineTooltip> certificates (2.5-5KB vs RSA 1KB),
          heavier <InlineTooltip term="TLS">TLS</InlineTooltip> handshakes, and new key exchange
          patterns challenge every component of a modern network security stack — from perimeter
          firewalls to inline DPI appliances.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-destructive/5 rounded-lg p-4 border border-destructive/20">
            <div className="text-xs font-bold text-status-error mb-2">Certificate Size</div>
            <div className="text-2xl font-bold text-status-error mb-1">+108%</div>
            <p className="text-xs text-muted-foreground">
              ML-DSA-65 cert: ~2.5KB vs RSA-2048: ~1.2KB. Full hybrid chain: 5-8KB.
            </p>
          </div>
          <div className="bg-warning/5 rounded-lg p-4 border border-warning/20">
            <div className="text-xs font-bold text-status-warning mb-2">TLS Inspection Latency</div>
            <div className="text-2xl font-bold text-status-warning mb-1">35 ms</div>
            <p className="text-xs text-muted-foreground">
              Classical (9 ms), Hybrid (28 ms), and Pure PQC (35 ms) overhead across boundaries.
            </p>
          </div>
          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
            <div className="text-xs font-bold text-primary mb-2">DPI Complexity</div>
            <div className="text-2xl font-bold text-primary mb-1">4-8x</div>
            <p className="text-xs text-muted-foreground">
              TLS inspection certificate buffer requirements increase 4-8x for hybrid chains.
            </p>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="text-sm font-bold text-foreground mb-3">Key Operational Impacts</div>
          <div className="space-y-2 text-xs text-muted-foreground">
            {[
              {
                impact: 'NGFW Buffer Overflows',
                detail:
                  'Fixed-size TLS certificate buffers in older firmware fail silently when receiving PQC chains exceeding 4KB.',
              },
              {
                impact: 'CPU Saturation on Software DPI',
                detail:
                  'Software-only DPI for ML-KEM key derivation increases per-connection CPU cost by 2-3x vs ECDHE.',
              },
              {
                impact: 'IDS/IPS Signature Updates',
                detail:
                  'Existing signatures for TLS handshake anomaly detection require updates to recognize hybrid KEM codepoints.',
              },
              {
                impact: 'Vendor Migration Gaps',
                detail:
                  'Not all vendors support PQC TLS inspection in 2026 — planning bypass policies for compliant traffic is necessary.',
              },
            ].map((item) => (
              <div key={item.impact} className="flex items-start gap-2">
                <Shield size={12} className="text-primary shrink-0 mt-0.5" />
                <span>
                  <strong className="text-foreground">{item.impact}:</strong> {item.detail}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="text-sm font-bold text-foreground mb-3">NGFW Vendor Readiness (2026)</div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 text-muted-foreground font-medium">Vendor</th>
                  <th className="text-center py-2 px-2 text-muted-foreground font-medium">
                    PQC Status
                  </th>
                  <th className="text-center py-2 px-2 text-muted-foreground font-medium">
                    ML-KEM
                  </th>
                  <th className="text-center py-2 px-2 text-muted-foreground font-medium">
                    Roadmap Year
                  </th>
                </tr>
              </thead>
              <tbody>
                {VENDOR_MIGRATION_DATA.slice(0, 4).map((v) => {
                  const status = PQC_STATUS_LABELS[v.pqcStatus as PQCStatusKey]
                  const kemStatus = PQC_STATUS_LABELS[v.mlKemStatus as PQCStatusKey]
                  return (
                    <tr key={v.id} className="border-b border-border/50">
                      <td className="py-2 px-2 font-bold text-foreground">{v.vendor}</td>
                      <td className="py-2 px-2 text-center">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-center">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${kemStatus.className}`}
                        >
                          {kemStatus.label}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-center font-mono text-muted-foreground">
                        {v.roadmapYear}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </CollapsibleSection>

      {/* Section 2: TLS Inspection & DPI Challenges */}
      <CollapsibleSection
        icon={<Eye size={24} className="text-primary" />}
        title="TLS Inspection & Deep Packet Inspection Challenges"
      >
        <p>
          TLS inspection (SSL interception) is central to NGFW security operations. PQC migrations
          stress every assumption in inspection pipelines: buffer sizes, certificate parsing logic,
          hardware offload capacity, and session reassembly.
        </p>

        <div className="space-y-3">
          {INSPECTION_CHALLENGES.map((challenge) => (
            <div
              key={challenge.id}
              className={`rounded-lg p-4 border ${
                challenge.severity === 'critical'
                  ? 'bg-destructive/5 border-destructive/30'
                  : challenge.severity === 'high'
                    ? 'bg-warning/5 border-warning/30'
                    : 'bg-muted/50 border-border'
              }`}
            >
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-sm font-bold text-foreground">{challenge.title}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${
                    challenge.severity === 'critical'
                      ? 'bg-destructive/10 text-status-error border-destructive/30'
                      : challenge.severity === 'high'
                        ? 'bg-warning/10 text-status-warning border-warning/30'
                        : 'bg-muted text-muted-foreground border-border'
                  }`}
                >
                  {challenge.severity}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">{challenge.description}</p>
              <div className="bg-background/80 rounded px-3 py-2 border border-border">
                <div className="text-[10px] font-bold text-primary mb-1">Mitigation</div>
                <p className="text-[10px] text-muted-foreground">{challenge.mitigation}</p>
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Section 3: IDS/IPS Migration */}
      <CollapsibleSection
        icon={<Bell size={24} className="text-primary" />}
        title="IDS/IPS: Signature Updates & Algorithm Visibility"
      >
        <p>
          Intrusion detection and prevention systems must evolve to recognize{' '}
          <InlineTooltip term="hybrid cryptography">hybrid</InlineTooltip> PQC traffic patterns,
          detect certificate size anomalies, and identify downgrade attacks targeting the classical
          component of hybrid key exchanges.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {IDS_RULE_CATEGORIES.slice(0, 4).map((rule) => (
            <div key={rule.id} className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-xs font-bold text-foreground">{rule.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${
                    rule.falsePositiveRisk === 'high'
                      ? 'bg-destructive/10 text-status-error border-destructive/30'
                      : rule.falsePositiveRisk === 'medium'
                        ? 'bg-warning/10 text-status-warning border-warning/30'
                        : 'bg-success/10 text-status-success border-success/30'
                  }`}
                >
                  FP: {rule.falsePositiveRisk}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {rule.detectionCoverage}% coverage
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{rule.description}</p>
            </div>
          ))}
        </div>

        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="text-sm font-bold text-foreground mb-2">IDS Deployment Strategy</div>
          <div className="space-y-2 text-xs text-muted-foreground">
            {[
              'Phase 1 (Now): Enable inventory and hybrid KEM detection rules in log-only mode',
              'Phase 2 (2026): Enable certificate size threshold alerts with tuned thresholds',
              'Phase 3 (2027): Add downgrade attack detection with 30-day baselining period',
            ].map((step) => (
              <div key={step} className="flex items-start gap-2">
                <span className="text-primary shrink-0">•</span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>
      </CollapsibleSection>

      {/* Section 4: Vendor Roadmaps */}
      <CollapsibleSection
        icon={<Map size={24} className="text-primary" />}
        title="Cisco, Palo Alto, Fortinet, Juniper Migration Timelines"
      >
        <p>
          The four dominant enterprise NGFW vendors are at varying stages of PQC adoption. Planning
          infrastructure upgrades requires understanding not just current capabilities but the
          firmware and hardware upgrade paths required for full PQC TLS inspection support.
        </p>

        <div className="space-y-3">
          {NGFW_VENDORS.slice(0, 4).map((vendor) => (
            <div key={vendor.id} className="bg-muted/50 rounded-lg p-4 border border-border">
              <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
                <div>
                  <div className="text-sm font-bold text-foreground">{vendor.name}</div>
                  <div className="text-[10px] text-muted-foreground">{vendor.product}</div>
                </div>
                <div className="flex gap-1 flex-wrap">
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${
                      vendor.pqcReadiness === 'ga'
                        ? 'bg-success/10 text-status-success border-success/30'
                        : vendor.pqcReadiness === 'beta'
                          ? 'bg-primary/10 text-primary border-primary/30'
                          : 'bg-warning/10 text-status-warning border-warning/30'
                    }`}
                  >
                    {vendor.pqcReadiness === 'ga'
                      ? 'GA'
                      : vendor.pqcReadiness === 'beta'
                        ? 'Beta'
                        : 'Roadmap'}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded border font-bold bg-muted text-muted-foreground border-border">
                    {vendor.roadmapYear}
                  </span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{vendor.notes}</p>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Section 5: Zero Trust PQC */}
      <CollapsibleSection
        icon={<Network size={24} className="text-primary" />}
        title="Zero Trust Network Access with PQC"
      >
        <p>
          Zero Trust architecture assumes no implicit trust based on network location. Every
          connection is authenticated, authorized, and encrypted.{' '}
          <InlineTooltip term="ZTNA">ZTNA</InlineTooltip> components that rely on classical PKI for
          authentication are vulnerable to harvest-now-decrypt-later (HNDL) attacks — making
          quantum-safe migration a priority for zero trust frameworks.
        </p>

        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="text-sm font-bold text-foreground mb-3">ZTNA PQC Migration Priority</div>
          <div className="space-y-2">
            {[
              {
                component: 'Identity Provider (IdP)',
                priority: 'Highest',
                reason:
                  'IdP certificates anchor trust for all ZTNA decisions. A compromised IdP signature key invalidates all access policies.',
                colorClass: 'text-status-error',
                bg: 'bg-destructive/5 border-destructive/20',
              },
              {
                component: 'Policy Engine / PEP',
                priority: 'High',
                reason:
                  'Policy enforcement channels must be quantum-safe to prevent MITM attacks on access control decisions.',
                colorClass: 'text-status-warning',
                bg: 'bg-warning/5 border-warning/20',
              },
              {
                component: 'Application Access Gateway',
                priority: 'High',
                reason:
                  'External-facing TLS endpoint. First component to benefit from hybrid TLS deployment. Most vendors have PQC-capable gateways in 2025-2026.',
                colorClass: 'text-status-warning',
                bg: 'bg-warning/5 border-warning/20',
              },
              {
                component: 'Micro-Segmentation',
                priority: 'Medium',
                reason:
                  'East-west IPsec/WireGuard tunnels. High volume means handshake overhead matters most. Plan hardware refresh for ML-KEM acceleration.',
                colorClass: 'text-primary',
                bg: 'bg-primary/5 border-primary/20',
              },
            ].map((item) => (
              <div key={item.component} className={`rounded-lg p-3 border ${item.bg}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-foreground">{item.component}</span>
                  <span className={`text-[10px] font-bold ${item.colorClass}`}>
                    Priority: {item.priority}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{item.reason}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="text-sm font-bold text-foreground mb-2">
            NIST SP 800-207: Zero Trust Architecture
          </div>
          <p className="text-xs text-muted-foreground">
            NIST SP 800-207 (Zero Trust Architecture) cross-references{' '}
            <InlineTooltip term="NIST SP 800-227">NIST SP 800-227</InlineTooltip> for key
            encapsulation mechanisms used in ZTNA session establishment. Organizations implementing
            zero trust should plan PQC adoption in their ZTNA architecture aligned with CNSA 2.0
            timelines (hybrid by 2026, exclusively PQC by 2033 for NSS environments).
          </p>
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
            <Lock size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">TLS & PQC Basics</div>
              <div className="text-xs text-muted-foreground">
                TLS 1.3 protocol mechanics and PQC integration points
              </div>
            </div>
          </Link>
          <Link
            to="/learn/vpn-ssh-pqc"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Shield size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">VPN & SSH with PQC</div>
              <div className="text-xs text-muted-foreground">
                IPsec IKEv2 and OpenSSH PQC migration patterns
              </div>
            </div>
          </Link>
          <Link
            to="/learn/crypto-agility"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Wrench size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Crypto Agility</div>
              <div className="text-xs text-muted-foreground">
                Design patterns for algorithm-agnostic security infrastructure
              </div>
            </div>
          </Link>
          <Link
            to="/learn/hybrid-crypto"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <BookOpen size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Hybrid Cryptography</div>
              <div className="text-xs text-muted-foreground">
                Classical + PQC hybrid schemes for the transition period
              </div>
            </div>
          </Link>
          <Link
            to="/learn/web-gateway-pqc"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Globe size={18} className="text-primary shrink-0" />
            <div>
              <div className="text-sm font-medium text-foreground">Web Gateway PQC</div>
              <div className="text-xs text-muted-foreground">
                PQC TLS termination at reverse proxies, CDNs, and API gateways
              </div>
            </div>
          </Link>
        </div>
      </section>

      <VendorCoverageNotice migrateLayer="Network" />

      {/* CTA */}
      <div className="text-center">
        <Button
          variant="ghost"
          onClick={onNavigateToWorkshop}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-colors"
        >
          Start Workshop <ArrowRight size={18} />
        </Button>
        <p className="text-xs text-muted-foreground mt-2">
          Analyze NGFW cipher policies, simulate TLS inspection, and design a PQC-ready zero trust
          architecture.
        </p>
      </div>
      <ReadingCompleteButton />
    </div>
  )
}
