// SPDX-License-Identifier: AGPL-3.0-only
import type { ASILLevel, AutomotiveFunction, FailMode } from './automotiveConstants'

// ---------------------------------------------------------------------------
// Automotive Function Profiles
// ---------------------------------------------------------------------------

export interface AutomotiveFunctionProfile {
  id: AutomotiveFunction
  name: string
  asilLevel: ASILLevel
  cryptoInPath: string[]
  maxVerificationMs: number
  failMode: FailMode
  failModeDescription: string
  quantumRisk: string
  pqcConstraint: string
  pqcDesignPattern: string
}

export const AUTOMOTIVE_FUNCTIONS: AutomotiveFunctionProfile[] = [
  {
    id: 'braking',
    name: 'Electronic Braking (ABS/ESC)',
    asilLevel: 'D',
    cryptoInPath: ['ECU secure boot (ECDSA P-256)', 'Inter-ECU command auth (CMAC)'],
    maxVerificationMs: 10,
    failMode: 'fail-operational',
    failModeDescription:
      'Example assumption: braking keeps working even if cryptographic verification fails. A real function\u2019s fail behaviour, and any redundancy it needs, come from its own hazard analysis and safety goals, not from the ASIL letter alone.',
    quantumRisk:
      'Forged ECU firmware could alter braking behavior. Secure boot forgery is the primary attack vector.',
    pqcConstraint:
      'ML-DSA-44 verification (~0.3ms assumed on an automotive SoC) fits the 10 ms example budget. The budget is a fictional assumption: a real one comes from the function\u2019s safety goals and its fault tolerant time interval (FTTI), and the worst-case execution time (WCET) of the verification code has to be measured on the target ECU.',
    pqcDesignPattern:
      'One example pattern: a second verification path that does not depend on the PQC code (for example a classical or symmetric path), so a stalled PQC check does not stop braking and the failure is logged. Whether a design needs this, and what the second path is, is decided by its safety analysis; this module cites no standard that requires a classical backup.',
  },
  {
    id: 'steering',
    name: 'Electric Power Steering (EPS)',
    asilLevel: 'D',
    cryptoInPath: ['ECU secure boot', 'Torque command authentication'],
    maxVerificationMs: 15,
    failMode: 'fail-operational',
    failModeDescription:
      'Steering must degrade gracefully — reduced assist rather than lock-up. Hardware watchdog timer as ultimate fallback.',
    quantumRisk:
      'Compromised steering ECU firmware could cause unintended steering input at speed.',
    pqcConstraint:
      'Similar to braking — ML-DSA-44 verification fits timing. Torque command path uses symmetric auth (AES-CMAC), not affected by quantum.',
    pqcDesignPattern:
      'PQC for firmware integrity (boot-time), AES-CMAC for real-time torque commands (quantum-safe symmetric).',
  },
  {
    id: 'airbag',
    name: 'Airbag Deployment',
    asilLevel: 'D',
    cryptoInPath: ['ECU secure boot', 'Crash sensor data authentication'],
    maxVerificationMs: 5,
    failMode: 'fail-safe',
    failModeDescription:
      'Airbag must NOT deploy on false positive (forged crash signal). Fail-safe = do not deploy if verification fails.',
    quantumRisk:
      'Forged crash sensor data could trigger spurious airbag deployment, injuring occupants.',
    pqcConstraint:
      'The 5 ms example budget is tight. LMS verification (~0.05ms assumed) and ML-DSA-44 (~0.3ms assumed) both fit it on paper, but LMS is a stateful scheme: every signature uses up one one-time key from a finite set, and a one-time key must never sign two messages (NIST SP 800-208). That suits signing firmware, not a stream of crash-sensor messages.',
    pqcDesignPattern:
      'Example pattern: authenticate crash-sensor messages with a symmetric MAC (AES-CMAC), as the other real-time rows do, and keep PQC signatures such as LMS or ML-DSA for firmware and boot-time verification. If a stateful scheme is used, the design has to say who holds the signing state, how key reuse is prevented, what happens when the one-time keys run out, and how keys are rolled over.',
  },
  {
    id: 'cruise-control',
    name: 'Adaptive Cruise Control (ACC)',
    asilLevel: 'C',
    cryptoInPath: ['Radar/camera data fusion', 'V2X cooperative awareness'],
    maxVerificationMs: 50,
    failMode: 'fail-safe',
    failModeDescription:
      'ACC disengages and alerts driver if sensor data cannot be verified. Driver takes manual control.',
    quantumRisk: 'Forged radar returns or V2X messages could cause dangerous following distances.',
    pqcConstraint: '50ms budget gives ample room for ML-DSA-44 or FN-DSA-512 per sensor message.',
    pqcDesignPattern:
      'Per-message V2X verification with FN-DSA-512 (compact signatures). Radar uses symmetric auth.',
  },
  {
    id: 'lane-keeping',
    name: 'Lane Keeping Assist (LKA)',
    asilLevel: 'B',
    cryptoInPath: ['Camera frame authentication', 'HD map segment verification'],
    maxVerificationMs: 67,
    failMode: 'fail-safe',
    failModeDescription:
      'LKA disengages and alerts driver. Vehicle continues on last-known trajectory momentarily.',
    quantumRisk: 'Forged camera frames or manipulated HD map data could cause lane departure.',
    pqcConstraint:
      'Camera at 30 Hz = 33 ms per frame — a generous budget for ML-DSA-44 sign+verify on typical automotive silicon, but measure it on your own ECU: PQC timings swing by an order of magnitude between a hardware-accelerated SoC and a software-only MCU.',
    pqcDesignPattern:
      'ML-DSA-44 frame attestation at camera source. HD map chunks verified with ML-DSA-65 on download.',
  },
  {
    id: 'parking-assist',
    name: 'Automated Parking',
    asilLevel: 'B',
    cryptoInPath: ['Ultrasonic + camera fusion', 'Steering/braking command auth'],
    maxVerificationMs: 200,
    failMode: 'fail-safe',
    failModeDescription: 'Parking maneuver halts and vehicle brakes. Low speed minimizes risk.',
    quantumRisk: 'Lower risk due to low speed. Primarily a firmware integrity concern.',
    pqcConstraint: '200ms budget is generous. Any PQC algorithm fits.',
    pqcDesignPattern:
      'Standard PQC firmware signing. Real-time commands use AES-CMAC (symmetric, quantum-safe).',
  },
  {
    id: 'adaptive-headlights',
    name: 'Adaptive Headlights (ADB)',
    asilLevel: 'A',
    cryptoInPath: ['Camera input for glare detection'],
    maxVerificationMs: 500,
    failMode: 'fail-safe',
    failModeDescription:
      'Headlights revert to standard low-beam pattern. No safety risk from degradation.',
    quantumRisk: 'Minimal — comfort feature, not safety-critical.',
    pqcConstraint: 'Not a PQC priority. Standard firmware signing sufficient.',
    pqcDesignPattern: 'Standard PQC firmware signing during OTA updates.',
  },
  {
    id: 'infotainment',
    name: 'Infotainment System',
    asilLevel: 'QM',
    cryptoInPath: [
      'TLS 1.3 (streaming, navigation)',
      'App store code signing',
      'Payment tokenization',
    ],
    maxVerificationMs: 2000,
    failMode: 'fail-safe',
    failModeDescription: 'Infotainment reboots or shows error screen. No impact on vehicle safety.',
    quantumRisk: 'HNDL on streaming/navigation data. Payment fraud via forged tokenization.',
    pqcConstraint: 'Full-powered SoC — no PQC performance constraints.',
    pqcDesignPattern:
      'Hybrid TLS 1.3 (ML-KEM + X25519, RFC 10024). ML-DSA-65 for app and payment signing.',
  },
]

// ---------------------------------------------------------------------------
// Example crypto design assumptions by ASIL
//
// Fictional teaching assumptions, not ISO 26262 requirements: nothing here is
// taken from ISO 26262, whose text this module does not reproduce. Hardware-level
// metrics (ISO 26262-5, "Product development at the hardware level") are a
// different question from cryptographic assurance, so the diagnostic-coverage
// column deliberately gives no percentage. A real project derives timing and
// redundancy from the function's own hazard analysis (safety goals, fault
// tolerant time interval) and measures the worst-case execution time of the
// crypto code on the target ECU. The same ASIL letter can carry different
// budgets for different functions (see AUTOMOTIVE_FUNCTIONS).
// ---------------------------------------------------------------------------

export interface ASILCryptoRequirement {
  asilLevel: ASILLevel
  /** Hardware-metric target: set by the hardware safety analysis, not a crypto property. */
  diagnosticCoverage: string
  cryptoRequirement: string
  redundancyLevel: string
  pqcImpact: string
}

export const ASIL_CRYPTO_REQUIREMENTS: ASILCryptoRequirement[] = [
  {
    asilLevel: 'QM',
    diagnosticCoverage: 'Not applicable in this example',
    cryptoRequirement: 'Example assumption: best-effort authentication',
    redundancyLevel: 'None assumed',
    pqcImpact: 'Standard migration; no safety timing constraint assumed',
  },
  {
    asilLevel: 'A',
    diagnosticCoverage: 'Set by the hardware safety analysis',
    cryptoRequirement: 'Example assumption: firmware integrity verification',
    redundancyLevel: 'Example: single channel with monitoring',
    pqcImpact: 'Example: PQC firmware signing; relaxed timing budget (>200ms assumed)',
  },
  {
    asilLevel: 'B',
    diagnosticCoverage: 'Set by the hardware safety analysis',
    cryptoRequirement: 'Example assumption: real-time data authentication',
    redundancyLevel: 'Example: single channel with plausibility checks',
    pqcImpact: 'Example: per-message PQC verification; moderate timing budget (<100ms assumed)',
  },
  {
    asilLevel: 'C',
    diagnosticCoverage: 'Set by the hardware safety analysis',
    cryptoRequirement: 'Example assumption: continuous authenticated data path',
    redundancyLevel: 'Example: independent monitoring',
    pqcImpact: 'Example: high-frequency PQC verification; tight timing budget (<50ms assumed)',
  },
  {
    asilLevel: 'D',
    diagnosticCoverage: 'Set by the hardware safety analysis',
    cryptoRequirement: 'Example assumption: authenticated data path with a hardware watchdog',
    redundancyLevel: 'Example: redundancy chosen by the safety analysis',
    pqcImpact: 'Example: strictest timing budget in this table (<15ms assumed)',
  },
]
