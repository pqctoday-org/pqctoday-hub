// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Link } from 'react-router-dom'
import {
  Globe,
  Shield,
  Network,
  RefreshCw,
  Zap,
  ArrowRight,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  Server,
  Building2,
} from 'lucide-react'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { TERMINATION_PATTERNS, GATEWAY_VENDORS, HANDSHAKE_MITIGATIONS } from '../data/gatewayData'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'
import { VendorCoverageNotice } from '@/components/PKILearning/common/VendorCoverageNotice'
import { Button } from '@/components/ui/button'

interface WebGatewayIntroductionProps {
  onNavigateToWorkshop: () => void
}

export const WebGatewayIntroduction: React.FC<WebGatewayIntroductionProps> = ({
  onNavigateToWorkshop,
}) => {
  const productionVendors = GATEWAY_VENDORS.filter((v) => v.pqcStatus === 'production')
  const plannedVendors = GATEWAY_VENDORS.filter((v) => v.pqcStatus === 'planned')

  return (
    <div className="space-y-8 w-full">
      {/* Section 1: Web Gateway Architecture & TLS Termination Patterns */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Network size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">
            Web Gateway Architecture &amp; TLS Termination Patterns
          </h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Web gateways &mdash; <InlineTooltip term="Reverse Proxy">reverse proxies</InlineTooltip>
            , load balancers, <InlineTooltip term="WAF">WAFs</InlineTooltip>, and CDN edge nodes
            &mdash; are the primary{' '}
            <InlineTooltip term="TLS Termination">TLS termination</InlineTooltip> points in modern
            web infrastructure. They handle millions of TLS handshakes per day, making them the most
            impactful place to deploy{' '}
            <InlineTooltip term="Post-Quantum Cryptography">PQC</InlineTooltip>.
          </p>
          <p>
            Unlike application-level PQC (covered in{' '}
            <Link to="/learn/tls-basics" className="text-primary hover:underline">
              TLS Basics
            </Link>
            ), gateway-level deployment affects every client connection simultaneously. Upgrading a
            single reverse proxy to PQC hybrid can protect thousands of backend services without
            modifying application code.
          </p>

          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-xs font-bold text-foreground mb-3">
              Four TLS Termination Patterns
            </div>
            <div className="space-y-3">
              {TERMINATION_PATTERNS.map((pattern) => (
                <div key={pattern.id} className="flex items-start gap-3">
                  <div className="shrink-0 mt-0.5">
                    {pattern.wafCanInspect ? (
                      <Eye size={14} className="text-status-success" />
                    ) : (
                      <EyeOff size={14} className="text-status-error" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">{pattern.name}</div>
                    <p className="text-xs text-muted-foreground">{pattern.description}</p>
                    <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                      <span>Certs: {pattern.certsRequired}</span>
                      <span>WAF inspection: {pattern.wafCanInspect ? 'Yes' : 'No'}</span>
                      <span>Gateway holds key: {pattern.gatewayHoldsKey ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground italic">
            Try the{' '}
            <Button
              variant="ghost"
              onClick={onNavigateToWorkshop}
              className="text-primary hover:underline"
            >
              Topology Builder (Workshop Step 1)
            </Button>{' '}
            to construct your gateway architecture and the{' '}
            <Button
              variant="ghost"
              onClick={onNavigateToWorkshop}
              className="text-primary hover:underline"
            >
              TLS Termination Patterns (Step 2)
            </Button>{' '}
            to compare these patterns side by side.
          </p>
        </div>
      </section>

      {/* Section 2: Certificate Lifecycle at Edge Scale */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <RefreshCw size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">Certificate Lifecycle at Edge Scale</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            CDN and load balancer operators manage certificates at enormous scale. Cloudflare
            manages over 50 million certificates across 300+ edge PoPs. AWS ALB handles per-listener
            certificate binding. Migrating these certificates from classical algorithms (RSA-2048,
            ECDSA P-256) to <InlineTooltip term="ML-DSA">ML-DSA</InlineTooltip> requires careful
            operational planning.
          </p>

          <div className="space-y-2">
            {[
              {
                t: 'ACME Automation',
                d: "Automated Certificate Management Environment (RFC 8555) is essential at scale. CAs must support PQC issuance for automated rotation to work. Let's Encrypt and Google Trust Services are evaluating PQC certificate support.",
              },
              {
                t: 'Certificate Transparency Impact',
                d: 'CT logs (RFC 9162) must store PQC certificates that are 5\u201310\u00d7 larger than classical ones. This increases CT log bandwidth and storage requirements significantly.',
              },
              {
                t: 'Edge Memory Consumption',
                d: 'Caching larger PQC certificates and expanded session state at millions-of-connections scale significantly impacts edge nodes. Large-scale deployments have observed up to a 38% increase in CDN edge memory consumption just for cert caching.',
              },
              {
                t: 'SAN Consolidation vs Isolation',
                d: 'Subject Alternative Name certificates covering multiple domains reduce the total cert count but increase blast radius if compromised. With PQC, the size trade-off shifts \u2014 fewer, larger certs may be preferable.',
              },
              {
                t: 'Certificate Pinning',
                d: 'Applications that pin specific certificate public keys (HPKP, mobile apps) will break during PQC migration unless pin sets are updated first. Plan pin deprecation before algorithm rotation.',
              },
            ].map((item) => (
              <div key={item.t} className="flex items-start gap-3 bg-muted/50 rounded-lg p-3">
                <Lock size={14} className="text-primary shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-foreground">{item.t}</div>
                  <p className="text-xs text-muted-foreground">{item.d}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground italic">
            Use the{' '}
            <Button
              variant="ghost"
              onClick={onNavigateToWorkshop}
              className="text-primary hover:underline"
            >
              Certificate Rotation Planner (Workshop Step 4)
            </Button>{' '}
            to model your edge migration timeline.
          </p>
        </div>
      </section>

      {/* Section 3: PQC Handshake Performance & Session Optimization */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Zap size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">
            PQC Handshake Performance &amp; Session Optimization
          </h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            PQC algorithms produce larger keys and signatures, directly increasing TLS handshake
            size. At gateway scale (thousands of handshakes per second), this bandwidth cost is the
            primary operational concern &mdash; not CPU, which remains manageable with modern
            hardware.
          </p>

          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-xs font-bold text-foreground mb-3">
              Handshake Size Comparison (Full TLS 1.3, 2-cert chain)
            </div>
            <div className="space-y-2">
              {[
                { label: 'Classical (X25519 + ECDSA)', size: '~5 KB', color: 'bg-status-success' },
                {
                  label: 'Hybrid (X25519MLKEM768 + ECDSA)',
                  size: '~15 KB',
                  color: 'bg-status-warning',
                },
                {
                  label: 'Pure PQC (ML-KEM-768 + ML-DSA-65)',
                  size: '~25 KB',
                  color: 'bg-status-error',
                },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${item.color} shrink-0`} />
                  <span className="text-xs text-foreground flex-1">{item.label}</span>
                  <span className="text-xs font-mono text-foreground">{item.size}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs font-bold text-foreground mb-2">Key Mitigations</div>
          <div className="space-y-2">
            {HANDSHAKE_MITIGATIONS.map((m) => (
              <div key={m.id} className="flex items-start gap-3 bg-muted/50 rounded-lg p-3">
                <div className="text-xs font-mono text-status-success shrink-0 mt-0.5 w-10 text-right">
                  -{m.reductionPercent}%
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">{m.name}</div>
                  <p className="text-xs text-muted-foreground">{m.description}</p>
                  <p className="text-xs text-muted-foreground/70 mt-0.5">{m.applicability}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground italic">
            Try the{' '}
            <Button
              variant="ghost"
              onClick={onNavigateToWorkshop}
              className="text-primary hover:underline"
            >
              Handshake Budget Calculator (Workshop Step 3)
            </Button>{' '}
            to model your specific gateway scenario.
          </p>
        </div>
      </section>

      {/* Section 4: WAF/IDS Inspection Challenges with PQC */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Shield size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">
            WAF/IDS Inspection Challenges with PQC
          </h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Web Application Firewalls (WAFs) and Intrusion Detection Systems (IDS) rely on{' '}
            <InlineTooltip term="TLS Interception">TLS interception</InlineTooltip> to inspect
            traffic for threats, data loss, and compliance violations. PQC migration creates a
            critical decision point: if the gateway cannot terminate PQC TLS, it loses all
            visibility into traffic content.
          </p>

          <div className="space-y-2">
            {[
              {
                t: 'NGFW Hardware Buffer Limits',
                d: 'Next-Gen Firewalls (NGFWs) often have hardcoded ~4 KB inspection buffer limits for deep packet TLS inspection. A PQC hybrid handshake (~15+ KB) exceeds these limits, causing the firewall to drop the connection entirely.',
                icon: Server,
                iconColor: 'text-status-error',
              },
              {
                t: 'Passthrough Breaks Inspection',
                d: 'If an upstream CDN negotiates PQC with the client and passes through to a WAF that only supports classical TLS, the WAF cannot decrypt or inspect the traffic. This creates a security blind spot.',
                icon: AlertTriangle,
                iconColor: 'text-status-error',
              },
              {
                t: 'TLS Interception Boxes Must Upgrade',
                d: 'Dedicated TLS inspection appliances (Zscaler, Bluecoat, McAfee Web Gateway) must support PQC on both the client-facing and server-facing TLS sessions. If they cannot negotiate PQC, they become a quantum-vulnerable chokepoint.',
                icon: AlertTriangle,
                iconColor: 'text-status-warning',
              },
              {
                t: 'Hybrid Transition Strategy',
                d: 'During migration, use classical TLS at the inspection point (WAF/IDS) and PQC hybrid on the client-facing edge. This preserves inspection capability while protecting the internet-facing segment. Upgrade inspection infrastructure in phase two.',
                icon: Shield,
                iconColor: 'text-status-success',
              },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.t} className="flex items-start gap-3 bg-muted/50 rounded-lg p-3">
                  <Icon size={14} className={`${item.iconColor} shrink-0 mt-0.5`} />
                  <div>
                    <div className="text-sm font-medium text-foreground">{item.t}</div>
                    <p className="text-xs text-muted-foreground">{item.d}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Section 5: CDN Edge Deployment & Origin Shielding */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Globe size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">
            CDN Edge Deployment &amp; Origin Shielding
          </h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Content Delivery Networks deploy PQC at{' '}
            <InlineTooltip term="Edge PoP">edge Points of Presence (PoPs)</InlineTooltip>{' '}
            distributed globally. Cloudflare deployed X25519MLKEM768 in production in 2024, AWS
            CloudFront offers hybrid TLS in preview, and nginx supports it via OpenSSL. This makes
            CDN edge nodes the largest real-world PQC deployment today.
          </p>

          <div className="space-y-2">
            {[
              {
                t: 'Origin Shielding',
                d: 'A designated edge node aggregates requests from other PoPs before forwarding to the origin server. This creates a natural PQC deployment boundary \u2014 the shield-to-origin connection can be upgraded to PQC independently of client-facing connections.',
              },
              {
                t: 'Key Distribution',
                d: 'CDNs must distribute TLS private keys or certificate issuance authority across 300+ PoPs. With PQC, larger key material increases distribution bandwidth. Some CDNs use keyless SSL architectures where private keys never leave a central HSM.',
              },
              {
                t: 'Last Mile Problem',
                d: 'CDN edge PQC only protects the client-to-edge segment if the client browser also supports PQC. Chrome, Firefox, and Edge already support X25519MLKEM768 \u2014 but Safari and older browsers do not, requiring hybrid fallback.',
              },
            ].map((item) => (
              <div key={item.t} className="flex items-start gap-3 bg-muted/50 rounded-lg p-3">
                <Globe size={14} className="text-primary shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-foreground">{item.t}</div>
                  <p className="text-xs text-muted-foreground">{item.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 6: Vendor-Specific PQC Migration Paths */}
      <section className="glass-panel p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Building2 size={24} className="text-primary" />
          </div>
          <h2 className="text-xl font-bold text-gradient">Vendor-Specific PQC Migration Paths</h2>
        </div>
        <div className="space-y-4 text-sm text-foreground/80">
          <p>
            Gateway vendor PQC readiness varies significantly. Some products (Cloudflare Edge, F5
            BIG-IP 17.5+, Envoy) already support hybrid PQC TLS in production, while others (Imperva
            WAF, Broadcom Avi, Zscaler) are still on the roadmap. Understanding each vendor&apos;s
            status and upgrade path is critical for planning.
          </p>

          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-xs font-bold text-foreground mb-3">
              Production PQC Support ({productionVendors.length} vendors)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="pb-2 pr-3">Product</th>
                    <th className="pb-2 pr-3">Version</th>
                    <th className="pb-2 pr-3">Algorithms</th>
                    <th className="pb-2">FIPS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {productionVendors.map((v) => (
                    <tr key={v.id}>
                      <td className="py-1.5 pr-3 font-medium text-foreground">{v.name}</td>
                      <td className="py-1.5 pr-3 text-muted-foreground">{v.pqcVersion}</td>
                      <td className="py-1.5 pr-3 font-mono text-muted-foreground">
                        {v.algorithms.join(', ') || '\u2014'}
                      </td>
                      <td className="py-1.5 text-muted-foreground">{v.fipsStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 border border-border">
            <div className="text-xs font-bold text-foreground mb-3">
              Planned / Roadmap ({plannedVendors.length} vendors)
            </div>
            <div className="space-y-2">
              {plannedVendors.map((v) => (
                <div key={v.id} className="flex items-start gap-2">
                  <Server size={12} className="text-status-warning shrink-0 mt-0.5" />
                  <div>
                    <span className="text-sm font-medium text-foreground">{v.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">{v.notes}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground italic">
            Use the{' '}
            <Button
              variant="ghost"
              onClick={onNavigateToWorkshop}
              className="text-primary hover:underline"
            >
              Vendor Readiness Matrix (Workshop Step 5)
            </Button>{' '}
            to assess your specific gateway infrastructure against PQC readiness.
          </p>
        </div>
      </section>

      <VendorCoverageNotice migrateLayer="Network" />

      {/* Workshop CTA */}
      <div className="glass-panel p-6 border-l-4 border-l-primary">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-bold text-foreground">Ready to explore interactively?</div>
            <p className="text-xs text-muted-foreground mt-1">
              The workshop has 5 interactive steps: Topology Builder, TLS Termination Patterns,
              Handshake Budget Calculator, Certificate Rotation Planner, and Vendor Readiness
              Matrix.
            </p>
          </div>
          <Button
            variant="ghost"
            onClick={onNavigateToWorkshop}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-black font-medium rounded-lg hover:bg-primary/90 transition-colors shrink-0"
          >
            Start Workshop
            <ArrowRight size={16} />
          </Button>
        </div>
      </div>

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
                ML-KEM hybrid KEMs and TLS 1.3 handshake fundamentals
              </div>
            </div>
          </Link>
          <Link
            to="/learn/vpn-ssh-pqc"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Network size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">VPN &amp; SSH</div>
              <div className="text-xs text-muted-foreground">
                PQC key exchange for tunnelled gateway traffic
              </div>
            </div>
          </Link>
          <Link
            to="/learn/network-security-pqc"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <Shield size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">Network Security</div>
              <div className="text-xs text-muted-foreground">
                NGFW, TLS inspection, and ZTNA with PQC cipher suites
              </div>
            </div>
          </Link>
          <Link
            to="/learn/crypto-agility"
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border hover:border-primary/30"
          >
            <RefreshCw size={18} className="text-primary shrink-0" aria-hidden="true" />
            <div>
              <div className="text-sm font-medium text-foreground">Crypto Agility</div>
              <div className="text-xs text-muted-foreground">
                Algorithm-agnostic gateway configuration for rapid cipher rollout
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Reading complete */}
      <ReadingCompleteButton />
    </div>
  )
}
