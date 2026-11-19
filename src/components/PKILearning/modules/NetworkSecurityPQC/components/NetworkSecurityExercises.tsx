// SPDX-License-Identifier: AGPL-3.0-only
import React from 'react'
import { useEmbeddedLearn } from '../../../embeddedLearnContext'
import { Play, BookOpen, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'

export interface WorkshopConfig {
  step: number
}

interface NetworkSecurityExercisesProps {
  onNavigateToWorkshop: () => void
  onSetWorkshopConfig?: (config: WorkshopConfig) => void
}

interface Scenario {
  id: string
  title: string
  description: string
  badge: string
  badgeColor: string
  observe: string
  productionCheck: string
  config: WorkshopConfig
}

export const NetworkSecurityExercises: React.FC<NetworkSecurityExercisesProps> = ({
  onNavigateToWorkshop,
  onSetWorkshopConfig,
}) => {
  const navigate = useNavigate()
  const embeddedLearn = useEmbeddedLearn()

  const scenarios: Scenario[] = [
    {
      id: 'ngfw-policy-audit',
      title: '1. NGFW Policy Audit',
      description:
        'Audit your NGFW cipher policy for quantum vulnerability. Select a hardware platform (entry-level branch, mid-range campus, or high-end enterprise core) and toggle cipher modes from Classical → Hybrid → Pure PQC. Keep software handling as the default, then explicitly assume selected-algorithm acceleration on the high-end fictional tier and compare the throughput arithmetic.',
      badge: 'Cipher Policy',
      badgeColor: 'bg-primary/20 text-primary border-primary/50',
      observe:
        'Select Entry-Level and Hybrid with the acceleration assumption off: 5,000 × 0.72 = 3,600 connections/sec. Select High-End; its generic offload flag alone still uses software handling: 500,000 × 0.72 = 360,000. Check “Assume selected algorithms are hardware-accelerated (sample)” to apply 0.90 and obtain 450,000. Switching mode, tier or the PQC toggle clears that assumption. These are illustrative settings, not measurements or verified appliance capabilities. The certificate comparison uses the existing 1.0KB TLS 1.3 baseline and at least 5.3KB hybrid sample (the ML-DSA-65 public key plus signature alone, FIPS 204 Table 2).',
      productionCheck:
        'Decision & evidence: Verify per-algorithm hardware offload on your exact appliance model and firmware release notes, and benchmark new-connection rate under representative hybrid/PQC cipher policies before sizing hardware refreshes.',
      config: { step: 0 },
    },
    {
      id: 'tls-inspection-planning',
      title: '2. TLS Inspection Planning',
      description:
        'Simulate TLS intercept proxy behavior with different PQC certificate types. Toggle between pass-through and full inspection modes. Compare how ML-DSA-65, hybrid ECDSA+ML-DSA-65, and pure PQC certificate chains affect inspection feasibility on current NGFW firmware.',
      badge: 'TLS Inspection',
      badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
      observe:
        'Hybrid ECDSA+ML-DSA-65 chains are at least about 11.9KB in the simulator (an IETF C509 draft example puts a two-certificate ML-DSA-65 chain at 11,869 bytes), and larger certificates may exceed the buffer sizes or parsing limits of devices that inspect TLS chains. The lab reports sizes only and simulates no handshake time; measure inspection latency on your own device. Pass-through mode avoids inspection work but loses Layer 7 visibility.',
      productionCheck:
        'Decision & evidence: Test every inline TLS-intercept proxy and middlebox with representative ML-KEM ClientHellos (RFC 10024, 0x11EC) and ML-DSA chains, recording handshake success, re-signing behavior, and added latency.',
      config: { step: 1 },
    },
    {
      id: 'ids-rule-update',
      title: '3. IDS Rule Update',
      description:
        'Update your IDS/IPS signature library for PQC traffic detection. Enable and disable rule categories covering hybrid KEM handshake detection, certificate size anomalies, PQC algorithm inventory, and downgrade attack detection. Adjust the base false positive rate slider to see how high-risk rules amplify alert noise.',
      badge: 'IDS/IPS',
      badgeColor: 'bg-warning/20 text-foreground border-warning/50',
      observe:
        'In this illustrative model, enabling one high false positive risk rule, such as downgrade attack detection, at 5% base FP rate increases the adjusted rate to 7% (5% × 1.4). With no high-risk rules enabled, the same base rate remains 5%. Compare the selected rules’ modelled coverage and adjusted rate; these outputs are not measured IDS performance or a calibrated detection guarantee. Evaluate the trade-off with your own tools and environment.',
      productionCheck:
        'Decision & evidence: Replay recorded hybrid TLS pcaps (including RFC 10024 0x11EC key shares) against your staged IDS/IPS rule set to verify parser compatibility and measure real alert volume before enabling blocking rules.',
      config: { step: 2 },
    },
    {
      id: 'vendor-selection',
      title: '4. Vendor Selection',
      description:
        'Compare PQC migration readiness across Cisco, Palo Alto, Fortinet, Juniper, Check Point, Sophos, SonicWall, and pfSense/OPNsense. Filter by feature (TLS inspection support, ML-KEM availability, hardware offload) to identify which platforms meet your 2026-2027 procurement requirements.',
      badge: 'Vendor Matrix',
      badgeColor: 'bg-destructive/20 text-status-error border-destructive/50',
      observe:
        'Vendor support varies widely and moves fast. The Cisco Secure Firewall roadmap blog (13 April 2026) targets ML-KEM support for late 2026 and ML-DSA for the second half of 2027, Sophos SFOS 22.0 MR2 detects and controls ML-KEM key exchange, and the OPNsense 26.7.4 release notes (15 September 2026) add some hybrid post-quantum variants as additional IPsec key exchange. Use the Vendor Matrix for current per-vendor status rather than relying on fixed dates.',
      productionCheck:
        'Decision & evidence: Require exact firmware version numbers, supported TLS/IKEv2 PQC codepoints, and lab proof-of-concept test logs in vendor RFP responses rather than roadmap slides.',
      config: { step: 3 },
    },
    {
      id: 'ztna-architecture',
      title: '5. ZTNA Architecture',
      description:
        'Design a quantum-safe Zero Trust Network Access architecture. Assign migration approaches (Classical, Hybrid, Pure PQC) to 5 ZTNA components: Identity Provider, Device Posture, Policy Engine, Micro-Segmentation, and Application Access Gateway. The risk score and architecture diagram update in real-time.',
      badge: 'Zero Trust',
      badgeColor: 'bg-success/20 text-status-success border-success/50',
      observe:
        'In this illustrative scoring model, all five components set to Hybrid produce 28 (Low Risk). Leaving the Identity Provider on Classical while the other four remain Hybrid produces 40 (Moderate Risk), so review the IdP dependency even though this model does not label that case High Risk. Selecting Hybrid does not establish compatibility: check matching endpoint, protocol and certificate or token profile support, define the intended fallback policy, and test it with your own tools.',
      productionCheck:
        'Decision & evidence: Sequence ZTNA migration starting with your Identity Provider and Policy Engine, verify end-to-end token/mTLS algorithm compatibility across gateways and clients, and document explicit fallback rules.',
      config: { step: 4 },
    },
    {
      id: 'network-telemetry',
      title: '6. Network Telemetry & TCP initcwnd Impact',
      description:
        'Inspect how larger PQC TLS handshake flights interact with the 10-segment TCP Initial Congestion Window (RFC 6928) in the Network Telemetry Analyzer, and compare single-flight classical handshakes against multi-flight PQC payloads.',
      badge: 'Telemetry',
      badgeColor: 'bg-accent/20 text-accent border-accent/50',
      observe:
        'Once a server handshake flight exceeds the initial congestion window (~14.6 KB at 1,460-byte MSS), the connection requires an additional round trip. These profiles are illustrative payload models, not measurements of your network.',
      productionCheck:
        'Decision & evidence: Capture actual TLS 1.3 handshake packet traces on high-RTT links in your staging environment to verify segment counts, middlebox fragmentation handling, and whether session resumption or certificate compression reduces added round trips.',
      config: { step: 5 },
    },
  ]

  const handleLoadAndRun = (scenario: Scenario) => {
    onSetWorkshopConfig?.(scenario.config)
    onNavigateToWorkshop()
  }

  return (
    <div className="space-y-6 w-full">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient mb-2">Guided Exercises</h2>
        <p className="text-muted-foreground text-sm">
          Work through these scenarios to master PQC migration for network security infrastructure.
          Each exercise pre-configures the Workshop — click &quot;Load &amp; Run&quot; to begin.
        </p>
      </div>

      <div className="space-y-4">
        {scenarios.map((scenario) => (
          <div key={scenario.id} className="glass-panel p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h3 className="text-lg font-bold text-foreground">{scenario.title}</h3>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded border font-bold ${scenario.badgeColor}`}
                  >
                    {scenario.badge}
                  </span>
                </div>
                <p className="text-sm text-foreground/80 mb-2">{scenario.description}</p>
                <p className="text-xs text-muted-foreground mb-1">
                  <strong>What to observe:</strong> {scenario.observe}
                </p>
                <p className="text-xs text-muted-foreground">
                  <strong>{scenario.productionCheck.split(':')[0]}:</strong>
                  {scenario.productionCheck.slice(scenario.productionCheck.indexOf(':') + 1)}
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={() => handleLoadAndRun(scenario)}
                className="btn btn-primary flex items-center gap-2 px-4 py-2 shrink-0"
              >
                <Play size={14} fill="currentColor" /> Load &amp; Run
              </Button>
            </div>
          </div>
        ))}
      </div>

      {!embeddedLearn && (
        <div className="glass-panel p-6 border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen size={24} className="text-primary" />
              <div>
                <h3 className="font-bold text-foreground">Test Your Knowledge</h3>
                <p className="text-sm text-muted-foreground">
                  Take the PQC quiz to test what you&apos;ve learned about network security and PQC
                  migration.
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={() => navigate('/learn/quiz')}
              className="btn btn-secondary flex items-center gap-2 px-4 py-2"
            >
              Take Quiz <ArrowRight size={14} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
