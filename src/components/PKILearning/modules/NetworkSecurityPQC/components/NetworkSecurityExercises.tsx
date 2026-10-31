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
        'Audit your NGFW cipher policy for quantum vulnerability. Select a hardware platform (entry-level branch, mid-range campus, or high-end enterprise core) and toggle cipher modes from Classical → Hybrid → Pure PQC. Observe how hardware offload availability changes throughput projections and what buffer upgrades are required.',
      badge: 'Cipher Policy',
      badgeColor: 'bg-primary/20 text-primary border-primary/50',
      observe:
        'In the simulator, switching to Hybrid mode on entry-level hardware without hardware offload reduces effective connections/sec by ~28%, while high-end platforms with offload keep 90% of classical throughput; these are illustrative simulation settings, not measurements. Certificate size rises from 1.0KB to at least 5.3KB for hybrid (the ML-DSA-65 public key plus signature alone, FIPS 204 Table 2).',
      config: { step: 0 },
    },
    {
      id: 'tls-inspection-planning',
      title: '2. TLS Inspection Planning',
      description:
        'Simulate TLS intercept proxy behavior with different PQC certificate types. Toggle between pass-through and full inspection modes. Compare how ML-DSA-65, hybrid ECDSA+ML-DSA-65, and pure PQC certificate chains affect inspection latency and feasibility on current NGFW firmware.',
      badge: 'TLS Inspection',
      badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
      observe:
        'Hybrid ECDSA+ML-DSA-65 chains are at least about 11.9KB in the simulator (an IETF C509 draft example puts a two-certificate ML-DSA-65 chain at 11,869 bytes), and larger certificates may exceed the buffer sizes or parsing limits of devices that inspect TLS chains. The simulator projects full-inspection latency rising several-fold (roughly 9ms to 28ms; illustrative settings, not measurements) — significant for real-time applications. Pass-through mode adds no inspection latency but loses Layer 7 visibility.',
      config: { step: 1 },
    },
    {
      id: 'ids-rule-update',
      title: '3. IDS Rule Update',
      description:
        'Update your IDS/IPS signature library for PQC traffic detection. Enable and disable rule categories covering hybrid KEM handshake detection, certificate size anomalies, PQC algorithm inventory, and downgrade attack detection. Adjust the base false positive rate slider to see how high-risk rules amplify alert noise.',
      badge: 'IDS/IPS',
      badgeColor: 'bg-warning/20 text-status-warning border-warning/50',
      observe:
        'Enabling the downgrade attack detection rule (high false positive risk) at 5% base FP rate increases the adjusted rate to 9%. A balanced ruleset with Hybrid KEM Detection + Certificate Size + PQC Inventory achieves 90%+ coverage at <5% false positives. Avoid enabling all 6 rules simultaneously without environment tuning.',
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
        'Leaving the Identity Provider on classical crypto produces a high risk score even if all other components are hybrid — the IdP is the trust anchor for all ZTNA access decisions. Setting all components to Hybrid reduces the transition risk score to under 30 while maintaining backwards compatibility with non-PQC clients.',
      config: { step: 4 },
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
                <p className="text-xs text-muted-foreground">
                  <strong>What to observe:</strong> {scenario.observe}
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
