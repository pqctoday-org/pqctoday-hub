// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Play } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface WorkshopConfig {
  step: number
}

interface PQCTestingExercisesProps {
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

export const PQCTestingExercises: React.FC<PQCTestingExercisesProps> = ({
  onNavigateToWorkshop,
  onSetWorkshopConfig,
}) => {
  const scenarios: Scenario[] = [
    {
      id: 'ot-passive-scan',
      title: '1. OT Network Passive Scan',
      description:
        'Your OT/SCADA network includes Modbus TCP, DNP3, and TLS-protected historian connections. You cannot perform active scanning — any injected packets risk disrupting safety systems. Use passive discovery to classify traffic and identify which connections are plaintext, classically encrypted, or quantum-safe. Produce a risk-ranked inventory.',
      badge: 'Passive Discovery',
      badgeColor: 'bg-status-success/20 text-status-success border-status-success/50',
      observe:
        'Modbus TCP appears as plaintext (no encryption at all) — highest risk. TLS 1.2 with CBC mode is present on the historian. DNP3 uses HMAC-SHA-256 (authentication only, no confidentiality). Only one segment uses hybrid TLS. Critical finding: three connections transmitting operational data with zero cryptographic protection.',
      config: { step: 0 },
    },
    {
      id: 'vpn-gateway-scan',
      title: '2. VPN Gateway Pre-Migration Scan',
      description:
        'Before upgrading your VPN headend to support IKEv2 with ML-KEM, scan all VPN-adjacent endpoints to understand the current state. Identify which branch offices use legacy IKEv2 configurations, which use modern DH groups, and which could already negotiate hybrid PQC if the headend supported it.',
      badge: 'Active Scanning',
      badgeColor: 'bg-status-info/20 text-status-info border-status-info/50',
      observe:
        'VPN gateway shows DH Group 14 (2048-bit) — quantum-vulnerable and scheduled for NIST deprecation by 2030. RSA-2048 certificate also flags for replacement. SSH bastion uses legacy curve25519 key exchange without hybrid. The cloud proxy is already using X25519+ML-KEM-768 hybrid TLS — ahead of the VPN.',
      config: { step: 1 },
    },
    {
      id: 'satellite-perf',
      title: '3. Satellite Link Performance Impact',
      description:
        'Your organization has remote sites connected via VSAT satellite links with 600ms RTT. Before mandating pure PQC for all VPN tunnels, benchmark the performance impact. Test classical, hybrid, and pure-PQC configurations to determine which meets your latency SLA (<2 second VPN setup time).',
      badge: 'Benchmarking',
      badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
      observe:
        'Satellite link results are stark: classical IKEv2 SA setup is 4.8 seconds (already at SLA limit). Hybrid PQC increases this to 7.2 seconds (+50%). Pure PQC with ML-KEM-768 reaches 95 seconds — completely unusable for interactive applications. Recommendation: satellite sites require hybrid PQC only; pure PQC mandate must include WAN latency exemptions.',
      config: { step: 2 },
    },
    {
      id: 'legacy-server-interop',
      title: '4. Legacy Server Interop Failure Analysis',
      description:
        'After enabling hybrid PQC on your corporate clients (Chrome 130+), help desk tickets spike. Users report intermittent TLS connection failures to internal applications. Use the interoperability matrix to diagnose which server configurations reject the hybrid ClientHello and why.',
      badge: 'Interop Testing',
      badgeColor: 'bg-warning/20 text-status-warning border-warning/50',
      observe:
        'Chrome sends an oversized hybrid ClientHello (1120 bytes vs classical 320 bytes). Legacy TLS 1.2 servers with small receive buffers reject the connection. Servers with default TLS 1.3 fallback work correctly via RFC 9794 fallback path. Root cause: 3 internal applications still on TLS 1.2 with default buffer sizes. Fix: update TLS 1.2 configurations or accelerate those apps to TLS 1.3.',
      config: { step: 3 },
    },
    {
      id: 'iot-side-channel',
      title: '5. IoT Firmware TVLA Assessment',
      description:
        'Your IoT device vendor claims their ML-KEM implementation is "quantum-safe." Before deploying 50,000 field devices with this firmware, conduct a TVLA assessment. Identify whether the implementation uses masking and whether the NTT stage leaks key material under power analysis.',
      badge: 'TVLA / Side-Channel',
      badgeColor: 'bg-destructive/20 text-destructive border-destructive/50',
      observe:
        'The unmasked reference implementation leaks at the NTT stage — t-test values well above the 4.5-sigma threshold. The Key Load and Polynomial Multiplication stages also show statistically significant leakage. The vendor\'s claimed "quantum-safe" status refers only to algorithm selection, not implementation security. Require first-order masking countermeasures before production deployment.',
      config: { step: 4 },
    },
    {
      id: 'eu-deadline-strategy',
      title: '6. EU 2026 Inventory Deadline Strategy',
      description:
        'The European Commission mandated complete cryptographic asset inventory by end-2026. You are a CISO at a financial institution in the inventory phase. Build a test strategy covering your enterprise IT environment: 15,000 endpoints, 3 datacenters, 200+ SaaS integrations, and 3 legacy COBOL systems with RSA-1024.',
      badge: 'Strategy Builder',
      badgeColor: 'bg-accent/20 text-accent border-accent/50',
      observe:
        'For enterprise IT in inventory phase with EU 2026 deadline: priority steps are passive network discovery (1-2 weeks), active endpoint scanning (1 week), and certificate inventory via CLM platform (2-3 days). Tool recommendations: CryptoNext COMPASS for passive discovery (NIST NCCoE recommended), pqcscan for active scanning, Keyfactor AgileSec for certificate inventory. CBOM generation from COBOL systems requires manual code review — flag as high-effort item requiring specialist engagement.',
      config: { step: 5 },
    },
  ]

  const handleTryIt = (scenario: Scenario) => {
    if (onSetWorkshopConfig) {
      onSetWorkshopConfig(scenario.config)
    }
    onNavigateToWorkshop()
  }

  return (
    <div className="space-y-6 w-full">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient mb-2">Practice Scenarios</h2>
        <p className="text-sm text-muted-foreground">
          Six real-world PQC testing scenarios — each designed to reveal a key insight about testing
          methodology. Click &ldquo;Try It&rdquo; to jump to the relevant workshop step.
        </p>
      </div>

      <div className="space-y-4">
        {scenarios.map((scenario) => (
          <div key={scenario.id} className="glass-panel p-6 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-bold text-foreground">{scenario.title}</h3>
              <span
                className={`text-xs px-2 py-1 rounded-full border whitespace-nowrap ${scenario.badgeColor}`}
              >
                {scenario.badge}
              </span>
            </div>

            <p className="text-sm text-foreground/80">{scenario.description}</p>

            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-xs font-semibold text-primary mb-1">What to observe:</p>
              <p className="text-xs text-muted-foreground">{scenario.observe}</p>
            </div>

            <Button
              variant="ghost"
              onClick={() => handleTryIt(scenario)}
              className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/30 rounded-lg hover:bg-primary/20 transition-colors text-sm font-medium"
            >
              <Play size={14} />
              Try It
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
