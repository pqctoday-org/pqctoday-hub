// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Play, BookOpen, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export interface WorkshopConfig {
  step: number
}

interface IoTOTExercisesProps {
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

export const IoTOTExercises: React.FC<IoTOTExercisesProps> = ({
  onNavigateToWorkshop,
  onSetWorkshopConfig,
}) => {
  const navigate = useNavigate()

  const scenarios: Scenario[] = [
    {
      id: 'algorithm-fit',
      title: '1. Find the smallest PQC algorithm that fits a Class 1 device',
      description:
        'In the Constrained Algorithm Explorer, select Class 1 (~10 KB RAM, ~100 KB Flash). Identify which KEM and signature algorithms fit within the resource budget. Compare ML-KEM-512 against FrodoKEM-640 to understand why lattice-based algorithms dominate constrained IoT.',
      badge: 'Algorithms',
      badgeColor: 'bg-primary/20 text-primary border-primary/50',
      observe:
        'ML-KEM-512 requires ~3 KB stack RAM and fits within Class 1 constraints (~3 KB of ~10 KB total RAM). FrodoKEM-640 requires ~180 KB \u2014 impossible for Class 0/1 devices. For signatures, LMS requires only ~0.5 KB RAM with a 56-byte public key, making it ideal for boot-time verification on microcontrollers.',
      config: { step: 0 },
    },
    {
      id: 'firmware-ota',
      title: '2. Sign a smart meter firmware image and calculate NB-IoT transfer time',
      description:
        'In the Firmware Signing workshop, select "Smart Meter" as the device type and "LMS / HSS" as the signing algorithm. Click "Sign Firmware Image" and observe the SUIT manifest. Note the total bandwidth required and the estimated transfer time over NB-IoT.',
      badge: 'Firmware',
      badgeColor: 'bg-warning/20 text-warning border-warning/50',
      observe:
        'LMS produces a 2,512-byte signature with a 56-byte public key \u2014 the most bandwidth-efficient PQC option for firmware updates. On NB-IoT at 62.5 kbps, the signature overhead adds only ~0.3 seconds. Compare this to ML-DSA-65 at 3,309 bytes + 1,952-byte key \u2014 significantly more overhead.',
      config: { step: 1 },
    },
    {
      id: 'dtls-overhead',
      title: '3. Compare classical vs PQC DTLS 1.3 handshake sizes',
      description:
        'In the DTLS Handshake workshop, first observe the classical baseline (X25519 + ECDSA P-256). Then switch to PQC (ML-KEM-768 + ML-DSA-44). Compare the total handshake bytes and fragment counts. Finally, try hybrid mode (X25519 + ML-KEM-768 with ECDSA + ML-DSA-44).',
      badge: 'Protocols',
      badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
      observe:
        'A classical DTLS 1.3 handshake is ~5 KB. Pure PQC increases this to ~22 KB \u2014 a 4\u00d7 increase requiring 15+ DTLS fragments over a 1,280-byte MTU. This means more round trips, more packet loss risk, and higher latency on lossy wireless networks.',
      config: { step: 2 },
    },
    {
      id: 'cert-chain',
      title: '4. Build a PQC certificate chain for a Class 2 industrial gateway',
      description:
        'In the Certificate Chain Bloat Analyzer, set all three levels (Root, Intermediate, End Entity) to ML-DSA-65. Observe how the total chain size compares to device RAM. Then adjust the RAM budget slider to a Class 1 device (10 KB) and enable the Merkle Tree Certificates and Certificate Compression mitigations.',
      badge: 'Certificates',
      badgeColor: 'bg-status-info/20 text-status-info border-status-info/50',
      observe:
        'An ML-DSA-65 certificate chain totals ~22 KB \u2014 exceeding a Class 1 device\u2019s entire 10 KB RAM. With Merkle Tree Certificates (85% reduction) and compression (30%), the combined mitigations bring the chain down to ~3 KB, making it feasible even for constrained devices.',
      config: { step: 3 },
    },
    {
      id: 'ble-mesh-oob',
      title: '5. Provision a BLE Mesh device with PQC Out-of-Band (OOB)',
      description:
        'BLE Mesh networks face extreme payload constraints. Review a simulated provisioning flow for a new BLE Mesh sensor joining a network.',
      badge: 'BLE Mesh',
      badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
      observe:
        'Due to tight payload limits, transmitting a 1,088-byte ML-KEM public key over standard BLE advertising channels is prohibitive. An out-of-band (OOB) PQC provisioning channel — such as QR codes or NFC — must be used to securely bootstrap the device before standard RF communications begin.',
      config: { step: 4 },
    },
    {
      id: 'scada-plan',
      title: '6. Assess a power grid SCADA system and prioritize PQC migration layers',
      description:
        'In the SCADA Migration Planner, the default configuration approximates a typical power grid. Review the generated migration priority matrix and timeline. Then try setting the DMZ to "PQC Hybrid" and observe how the priority matrix changes.',
      badge: 'SCADA',
      badgeColor: 'bg-success/20 text-success border-success/50',
      observe:
        'The DMZ (Level 3.5) and enterprise boundary (Level 4\u20135) score highest migration priority because they are internet-facing and subject to HNDL. Level 0\u20131 devices may not need PQC directly if they are air-gapped, but gateway devices at Level 2 must protect data in transit from quantum threats.',
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
          Work through these scenarios to understand PQC constraints on IoT devices, firmware
          signing trade-offs, protocol overhead, and SCADA migration planning. Each exercise
          pre-configures the Workshop &mdash; click &quot;Load &amp; Run&quot; to begin.
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

      {/* Quiz Link */}
      <div className="glass-panel p-6 border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen size={24} className="text-primary" />
            <div>
              <h3 className="font-bold text-foreground">Test Your Knowledge</h3>
              <p className="text-sm text-muted-foreground">
                Take the PQC quiz to test what you&apos;ve learned about IoT/OT security and
                constrained device PQC migration.
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
    </div>
  )
}
