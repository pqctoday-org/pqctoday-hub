// SPDX-License-Identifier: GPL-3.0-only
/**
 * Guided exercises. Each scenario opens one workshop step pre-configured, and
 * its "what to observe" text states what that step actually computes with the
 * given settings (pinned by IoTPQC.exercises.test.ts against the models).
 */
import React from 'react'
import { Play, BookOpen, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'

export interface WorkshopConfig {
  step: number
  [key: string]: unknown
}

interface IoTPQCExercisesProps {
  onNavigateToWorkshop: () => void
  onSetWorkshopConfig?: (config: WorkshopConfig) => void
}

interface Scenario {
  id: string
  title: string
  description: string
  badge: string
  observe: string
  config: WorkshopConfig
}

// eslint-disable-next-line react-refresh/only-export-components
export const SCENARIOS: Scenario[] = [
  {
    id: 'verify-vs-sign',
    title: '1. What can a Class 1 device verify — and sign?',
    description:
      'The Algorithm Explorer opens on Class 1, "Device verifies signatures", stack-optimised builds. Read the summary, then switch the build to speed-optimised, then switch the role to "Device signs".',
    badge: 'Algorithms',
    observe:
      'Verifying with stack builds: ECDSA, LMS and FN-DSA-512 fit; XMSS and all three ML-DSA sets are tight (ML-DSA-44 peaks at 6,444 B, 63% of 10 KiB). With speed builds every ML-DSA set is too large (ML-DSA-44 needs 12,644 B). Signing: FN-DSA-512 turns red — 41,952 B of stack and ~104 KB of code — while ML-DSA-44 is still tight. Devices verify; signing belongs on a server.',
    config: { step: 0, classIdx: 1, role: 'verify', build: 'stack' },
  },
  {
    id: 'firmware-lms',
    title: '2. Sign a smart-meter update with LMS, then with ML-DSA',
    description:
      'Firmware Signing opens with the smart meter and LMS. Once the live HSM is ready, sign and verify the manifest. Then pick ML-DSA-44 and sign again. Read the CNSA 2.0 line and the verification ranking.',
    badge: 'Firmware',
    observe:
      'LMS produces a 2,512-byte signature that verifies, the one-bit-tampered manifest is rejected, and the token’s remaining-signature counter (where the engine publishes one) reads one less than 1,024. Signature plus SUIT/COSE is about 0.97% of the 256 KiB update (≈0.8 s of NB-IoT downlink). ML-DSA-44 gives 2,420 bytes and is not accepted by CNSA 2.0 (only ML-DSA-87 or LMS/XMSS are). In the ranking LMS is fifth: FN-DSA-512, ECDSA, ML-DSA-44 and ML-DSA-65 verify in fewer cycles.',
    config: { step: 1, deviceId: 'smart-meter', algId: 'lms' },
  },
  {
    id: 'dtls-vs-edhoc',
    title: '3. DTLS 1.3 or EDHOC over a 6LoWPAN mesh',
    description:
      'Constrained Handshake opens on ML-KEM-768 with ML-DSA-44. Compare the two panels, then switch to X25519 + ECDSA P-256 for the classical baseline.',
    badge: 'Protocols',
    observe:
      'DTLS 1.3 with an ML-DSA-44 chain is about 13,146 B: 13 IPv6 datagrams and 171 IEEE 802.15.4 frames, 9.6× the 1,374 B classical handshake. EDHOC with credentials by reference needs about 7,141 B (92 frames) because no certificate chain is sent. Classically EDHOC is about 216 B against 1,374 B. Tick "send credentials by value" to see EDHOC lose that advantage.',
    config: { step: 2, view: 'handshake', kemId: 'ml-kem-768', sigId: 'ml-dsa-44' },
  },
  {
    id: 'chain-class1',
    title: '4. Fit an ML-DSA-65 chain on a 10 KiB device',
    description:
      'Certificate Chain opens with all three levels on ML-DSA-65 and a 10 KiB RAM budget. Then try each delivery mode. Finally set the root to ML-DSA-87 and the other two to ML-DSA-44.',
    badge: 'Certificates',
    observe:
      'The full chain sends 11,122 B (leaf + intermediate; the root stays on the device) — more than the 10 KiB budget. Compression saves only 300 B (PQC keys and signatures do not compress) and C509 320 B. A raw public key needs 1,982 B, an MTC with a 20-level proof 2,892 B — each with its own trust caveat — and resumption sends nothing. With an ML-DSA-87 root the intermediate grows to 6,239 B, because it carries the root’s 4,627-byte signature.',
    config: {
      step: 3,
      rootAlg: 'ml-dsa-65',
      intAlg: 'ml-dsa-65',
      leafAlg: 'ml-dsa-65',
      ramKB: 10,
      mode: 'full',
    },
  },
  {
    id: 'ble-matter',
    title: '5. Provision a BLE Mesh node and commission a Matter device with PQC keys',
    description:
      'Constrained Handshake opens on the BLE Mesh & Matter provisioning view with ML-KEM-768 and ML-DSA-44. Compare with X25519 + ECDSA P-256, and try the X25519MLKEM768 hybrid.',
    badge: 'BLE Mesh · Matter',
    observe:
      'Today a P-256 provisioning key is 3 PB-ADV segments. An ML-KEM-768 public key would take 52 segments and its ciphertext 48 (the hybrid: 54 and 49), close to the 64-segment, 1,469-byte transaction limit — and no PQC provisioning algorithm is defined in Mesh Protocol 1.1. For Matter, an ML-DSA-44 DAC + PAI chain is 8,064 B (about 7 IPv6-MTU messages) versus 856 B with ECDSA. Out-of-band bootstrap (NFC, QR) or a larger GATT MTU is the practical path.',
    config: { step: 2, view: 'provisioning', kemId: 'ml-kem-768', sigId: 'ml-dsa-44' },
  },
  {
    id: 'fleet-bottleneck',
    title: '6. Find the bottleneck in a 2-million-meter key rotation',
    description:
      'The Fleet Key Manager opens on its default fleet: 2M smart meters, 1,000 per collector, G3-PLC, ML-KEM-768, standard HSM. Then switch the HSM to high-throughput, the baseline to Suite 0, and the link to LoRaWAN.',
    badge: 'Fleet keys',
    observe:
      'Each collector finishes its radio exchanges in about 16 minutes (2,472 B per meter, 7.5× today’s 328 B), but the head-end HSM needs about 1.1 hours for 4 million operations — the HSM is the bottleneck. A high-throughput HSM moves the bottleneck back to the network. Suite 0 has no public-key exchange to break. LoRaWAN raises the warning that its air interface has no public-key key establishment at all.',
    config: { step: 4 },
  },
  {
    id: 'lpwan-multicast',
    title: '7. Is PQC what overloads the cell?',
    description:
      'LPWAN Airtime opens on NB-IoT, a 150 KiB image signed with ML-DSA-87, 2,000 devices, unicast. Read the signature share and the window verdict, then tick multicast.',
    badge: 'LPWAN',
    observe:
      'The ML-DSA-87 signature is 2.9% of the update. Unicast needs about 45 hours of downlink and misses the 24-hour window — but the same update signed with ECDSA needs about 44 hours and misses it too. Multicast delivers it in under 2 minutes. The image and the delivery mode decide this, not the PQC signature.',
    config: {
      step: 5,
      techId: 'nbiot',
      sigAlgId: 'ml-dsa-87',
      firmwareKB: 150,
      devicesPerCell: 2000,
      multicast: false,
    },
  },
]

export const IoTPQCExercises: React.FC<IoTPQCExercisesProps> = ({
  onNavigateToWorkshop,
  onSetWorkshopConfig,
}) => {
  const navigate = useNavigate()

  const handleLoadAndRun = (scenario: Scenario) => {
    onSetWorkshopConfig?.(scenario.config)
    onNavigateToWorkshop()
  }

  return (
    <div className="space-y-6 w-full">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient mb-2">Guided Exercises</h2>
        <p className="text-muted-foreground text-sm">
          Each exercise opens one workshop step with its settings loaded. The expected observations
          are the numbers that step computes — benchmark-based fits and model estimates, labelled as
          such in the workshop.
        </p>
      </div>

      <div className="space-y-4">
        {SCENARIOS.map((scenario) => (
          <div key={scenario.id} className="glass-panel p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h3 className="text-lg font-bold text-foreground">{scenario.title}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded border font-bold bg-primary/20 text-primary border-primary/50">
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

      <div className="glass-panel p-6 border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen size={24} className="text-primary" />
            <div>
              <h3 className="font-bold text-foreground">Test Your Knowledge</h3>
              <p className="text-sm text-muted-foreground">
                Take the PQC quiz on constrained-device PQC, firmware signing and IoT protocols.
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
