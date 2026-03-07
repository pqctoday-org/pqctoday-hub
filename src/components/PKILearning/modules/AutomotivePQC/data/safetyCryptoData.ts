// SPDX-License-Identifier: GPL-3.0-only
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
      'Braking must continue functioning even if crypto verification fails. Dual-channel design: primary PQC path + independent classical backup.',
    quantumRisk:
      'Forged ECU firmware could alter braking behavior. Secure boot forgery is the primary attack vector.',
    pqcConstraint:
      'ML-DSA-44 verification (~0.3ms on automotive SoC) meets 10ms budget. However, fail-operational requirement demands dual-path architecture.',
    pqcDesignPattern:
      'Dual-channel verification: PQC primary + classical backup. If PQC stalls, classical path maintains braking while logging PQC failure.',
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
      '5ms budget is tight. LMS verification (~0.05ms) is the safest choice. ML-DSA-44 (~0.3ms) also fits.',
    pqcDesignPattern:
      'Hardware-verified sensor path with LMS one-time signatures for crash data authenticity.',
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
      'Camera at 30 Hz = 33ms per frame. ML-DSA-44 signing (0.8ms) + verification (0.3ms) fits easily.',
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
    pqcDesignPattern: 'Hybrid TLS 1.3 (ML-KEM + X25519). ML-DSA-65 for app and payment signing.',
  },
]

// ---------------------------------------------------------------------------
// ASIL to Crypto Requirements mapping
// ---------------------------------------------------------------------------

export interface ASILCryptoRequirement {
  asilLevel: ASILLevel
  diagnosticCoverage: string
  cryptoRequirement: string
  redundancyLevel: string
  pqcImpact: string
}

export const ASIL_CRYPTO_REQUIREMENTS: ASILCryptoRequirement[] = [
  {
    asilLevel: 'QM',
    diagnosticCoverage: 'None required',
    cryptoRequirement: 'Best-effort authentication',
    redundancyLevel: 'None',
    pqcImpact: 'Standard migration — no safety timing constraints',
  },
  {
    asilLevel: 'A',
    diagnosticCoverage: '60%+',
    cryptoRequirement: 'Firmware integrity verification',
    redundancyLevel: 'Single-channel with monitoring',
    pqcImpact: 'PQC firmware signing; relaxed timing (>200ms)',
  },
  {
    asilLevel: 'B',
    diagnosticCoverage: '90%+',
    cryptoRequirement: 'Real-time data authentication',
    redundancyLevel: 'Single-channel with plausibility checks',
    pqcImpact: 'Per-message PQC verification; moderate timing (<100ms)',
  },
  {
    asilLevel: 'C',
    diagnosticCoverage: '97%+',
    cryptoRequirement: 'Continuous authenticated data path',
    redundancyLevel: 'Redundant with independent monitoring',
    pqcImpact: 'High-frequency PQC verification; tight timing (<50ms)',
  },
  {
    asilLevel: 'D',
    diagnosticCoverage: '99%+',
    cryptoRequirement: 'Dual-path verified with hardware watchdog',
    redundancyLevel: 'Dual-channel or fail-operational',
    pqcImpact: 'Dual PQC+classical verification; strictest timing (<15ms)',
  },
]
