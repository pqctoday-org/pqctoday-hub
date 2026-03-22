// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Play, BookOpen, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export interface WorkshopConfig {
  step: number
}

interface ExercisesProps {
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

export const AutomotivePQCExercises: React.FC<ExercisesProps> = ({
  onNavigateToWorkshop,
  onSetWorkshopConfig,
}) => {
  const navigate = useNavigate()

  const scenarios: Scenario[] = [
    {
      id: 'zonal-architecture-crypto-audit',
      title:
        '1. Zonal Architecture Crypto Audit — Map quantum-vulnerable crypto across vehicle zones',
      description:
        "Select an autonomous shuttle with zonal architecture in the Vehicle Architecture Mapper. Examine each zone's ECU count, bus protocol, and quantum-vulnerable crypto. Identify which zones need immediate PQC migration.",
      badge: 'Architecture',
      badgeColor: 'bg-primary/20 text-primary border-primary/50',
      observe:
        'The ADAS zone runs 12+ ECUs on automotive Ethernet with ECDSA P-256 signing \u2014 highest quantum exposure. The body zone uses CAN 2.0 with AES-CMAC (symmetric, quantum-safe). Zonal architecture consolidates 40% fewer ECUs but concentrates crypto risk in zone controllers.',
      config: { step: 0 },
    },
    {
      id: 'lidar-signing-throughput',
      title:
        '2. LiDAR Signing Throughput Challenge — Compare PQC signing speed for high-bandwidth sensors',
      description:
        'Enable LiDAR (300 MB/s, 20 Hz) in the Sensor Data Integrity Simulator. Compare ML-DSA-44 vs FN-DSA-512 signing throughput. Determine whether per-frame signing meets the 50ms ADAS latency budget.',
      badge: 'Sensor',
      badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
      observe:
        'ML-DSA-44 signing takes 0.8ms per frame \u2014 well within budget. FN-DSA-512 signing takes 2.0ms and produces 666-byte signatures (vs 2,420 for ML-DSA-44). FN-DSA-512 produces smaller signatures (666 bytes vs 2,420 for ML-DSA-44), reducing bandwidth on CAN FD. ML-DSA-44 has faster signing (0.8ms vs 2.0ms per frame). LiDAR on Ethernet supports larger signature sizes.',
      config: { step: 1 },
    },
    {
      id: 'asil-d-braking-crypto',
      title:
        '3. ASIL-D Braking Crypto Verification — Validate PQC timing for safety-critical braking',
      description:
        'Select Electronic Braking (ASIL-D) in the Safety-Crypto Analyzer. Evaluate whether ML-DSA-44 verification meets the 10ms safety timing deadline. Compare fail-operational design patterns for PQC.',
      badge: 'Safety',
      badgeColor: 'bg-status-warning/20 text-status-warning border-status-warning/50',
      observe:
        'ML-DSA-44 verification (~0.3ms on automotive SoC) easily fits the 10ms budget. However, ASIL-D requires fail-operational mode: if the PQC path stalls, a classical ECDSA backup must maintain braking. This dual-path architecture adds complexity but is mandatory for safety certification.',
      config: { step: 2 },
    },
    {
      id: 'fleet-ota-pqc-campaign',
      title:
        '4. Fleet OTA Campaign with PQC Signatures — Assess signature overhead for mass firmware updates',
      description:
        'Configure a 1M-vehicle fleet in the OTA Orchestration Planner. Compare campaign completion time using ECDSA vs ML-DSA-65 firmware signatures. Evaluate the bandwidth impact of larger PQC signatures across the dependency graph.',
      badge: 'OTA',
      badgeColor: 'bg-status-error/20 text-status-error border-status-error/50',
      observe:
        'ML-DSA-65 adds ~3.3 KB per signed firmware block (vs 72 bytes for ECDSA). For a 6-ECU campaign with 200 MB total firmware, PQC signature overhead adds <0.01% \u2014 negligible. The critical path is the ADAS ECU (45 min update, A/B partition) which gates all downstream ECUs.',
      config: { step: 3 },
    },
    {
      id: 'nfc-car-key-fragmentation',
      title:
        '5. NFC Car Key PQC Fragmentation — Analyze ML-KEM fragment behavior over NFC transports',
      description:
        'Select NFC transport in the Car Key Protocol Explorer. Switch to PQC mode and observe how ML-KEM-768 public keys and ciphertexts fragment across NFC APDUs. Compare total transaction time vs BLE transport.',
      badge: 'Car Key',
      badgeColor: 'bg-status-info/20 text-status-info border-status-info/30',
      observe:
        'NFC max APDU is 256 bytes. Exchanging the ML-KEM-768 public key (1,184 B) + ciphertext (1,088 B) requires 9+ APDUs for key agreement alone. Total PQC handshake on NFC takes ~800ms (vs ~120ms classical). BLE handles the same handshake in 1-2 L2CAP frames at ~200ms. UWB ranging is symmetric (quantum-safe).',
      config: { step: 4 },
    },
    {
      id: '20-year-vehicle-crqc-exposure',
      title: '6. 20-Year Vehicle CRQC Exposure — Plan crypto lifecycle for long-lived vehicles',
      description:
        'Configure a 2027 model-year vehicle with 20-year road life in the Lifecycle Migration Roadmap. Set CRQC arrival to 2035. Examine the vulnerability window and planned OTA crypto upgrade windows.',
      badge: 'Capstone',
      badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
      observe:
        'A 2027 vehicle lasts until 2047 \u2014 12 years past the 2035 CRQC estimate. With OTA upgrades every 4 years, there are 5 crypto upgrade opportunities. The first PQC OTA should target 2031 (before CRQC) to protect long-lived root keys. Factory HSMs must dual-provision classical+PQC keys from day one.',
      config: { step: 5 },
    },
  ]

  const handleLoadAndRun = (scenario: Scenario) => {
    onSetWorkshopConfig?.(scenario.config)
    onNavigateToWorkshop()
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient mb-2">Guided Exercises</h2>
        <p className="text-muted-foreground text-sm">
          Work through these scenarios to explore zonal architecture crypto audits, sensor signing
          throughput, safety-critical timing, OTA campaigns, car key protocols, and vehicle
          lifecycle planning. Each exercise pre-configures the Workshop &mdash; click &quot;Load
          &amp; Run&quot; to begin.
        </p>
      </div>

      <div className="space-y-4">
        {scenarios.map((scenario) => (
          <div key={scenario.id} className="glass-panel p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
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
              <button
                onClick={() => handleLoadAndRun(scenario)}
                className="btn btn-primary flex items-center gap-2 px-4 py-2 shrink-0"
              >
                <Play size={14} fill="currentColor" /> Load &amp; Run
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Related Modules */}
      <div className="glass-panel p-6 border-primary/20">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen size={24} className="text-primary" />
          <div>
            <h3 className="font-bold text-foreground">Related Modules</h3>
            <p className="text-sm text-muted-foreground">
              Deepen your automotive PQC knowledge with these complementary modules.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => navigate('/learn/iot-ot-pqc')}
            className="btn btn-secondary flex items-center justify-center gap-2 px-4 py-2 text-sm"
          >
            IoT &amp; OT Security <ArrowRight size={14} />
          </button>
          <button
            onClick={() => navigate('/learn/hsm-pqc')}
            className="btn btn-secondary flex items-center justify-center gap-2 px-4 py-2 text-sm"
          >
            HSM &amp; PQC Operations <ArrowRight size={14} />
          </button>
          <button
            onClick={() => navigate('/learn/emv-payment-pqc')}
            className="btn btn-secondary flex items-center justify-center gap-2 px-4 py-2 text-sm"
          >
            EMV Payment PQC <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
