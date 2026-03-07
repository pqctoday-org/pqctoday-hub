// SPDX-License-Identifier: GPL-3.0-only
import type { TransportType, CarKeyActor, CryptoMode } from './automotiveConstants'

// ---------------------------------------------------------------------------
// CCC Digital Key 3.0 Protocol Steps
// ---------------------------------------------------------------------------

export interface CarKeyProtocolStep {
  id: string
  order: number
  label: string
  phase: 'pairing' | 'authentication' | 'sharing'
  description: string
  fromActor: CarKeyActor
  toActor: CarKeyActor
  classicalCrypto: string
  pqcReplacement: string
  classicalSizeBytes: number
  pqcSizeBytes: number
}

export const CAR_KEY_PROTOCOL_STEPS: CarKeyProtocolStep[] = [
  // ─── Pairing Phase ───
  {
    id: 'device-attestation',
    order: 1,
    label: 'Device Attestation',
    phase: 'pairing',
    description: 'Phone proves its identity to OEM server via manufacturer certificate chain.',
    fromActor: 'device',
    toActor: 'oem-server',
    classicalCrypto: 'ECDSA P-256 certificate chain (3 certs)',
    pqcReplacement: 'ML-DSA-44 certificate chain',
    classicalSizeBytes: 600,
    pqcSizeBytes: 11_520,
  },
  {
    id: 'key-agreement',
    order: 2,
    label: 'Key Agreement',
    phase: 'pairing',
    description: 'Phone and vehicle establish shared secret for session key derivation.',
    fromActor: 'device',
    toActor: 'vehicle',
    classicalCrypto: 'ECDH P-256 (ephemeral)',
    pqcReplacement: 'ML-KEM-768 encapsulation',
    classicalSizeBytes: 33,
    pqcSizeBytes: 1184,
  },
  {
    id: 'owner-cert-install',
    order: 3,
    label: 'Owner Certificate Install',
    phase: 'pairing',
    description:
      'OEM server issues an owner digital key certificate and installs it in vehicle and phone.',
    fromActor: 'oem-server',
    toActor: 'vehicle',
    classicalCrypto: 'ECDSA P-256 signed certificate',
    pqcReplacement: 'ML-DSA-44 signed certificate',
    classicalSizeBytes: 256,
    pqcSizeBytes: 3744,
  },
  // ─── Authentication Phase ───
  {
    id: 'proximity-detection',
    order: 4,
    label: 'Proximity Detection',
    phase: 'authentication',
    description: 'Vehicle detects phone via BLE advertisement or NFC field activation.',
    fromActor: 'device',
    toActor: 'vehicle',
    classicalCrypto: 'N/A (RF detection only)',
    pqcReplacement: 'N/A',
    classicalSizeBytes: 31,
    pqcSizeBytes: 31,
  },
  {
    id: 'challenge-response',
    order: 5,
    label: 'Challenge-Response',
    phase: 'authentication',
    description: 'Vehicle sends random challenge; phone signs with owner private key.',
    fromActor: 'vehicle',
    toActor: 'device',
    classicalCrypto: 'ECDSA P-256 signature',
    pqcReplacement: 'ML-DSA-44 signature',
    classicalSizeBytes: 64,
    pqcSizeBytes: 2420,
  },
  {
    id: 'session-key-derivation',
    order: 6,
    label: 'Session Key Derivation',
    phase: 'authentication',
    description:
      'Both sides derive AES session key from shared secret for encrypted communication.',
    fromActor: 'device',
    toActor: 'vehicle',
    classicalCrypto: 'HKDF-SHA-256 from ECDH shared secret',
    pqcReplacement: 'HKDF-SHA-256 from ML-KEM shared secret',
    classicalSizeBytes: 32,
    pqcSizeBytes: 32,
  },
  {
    id: 'uwb-ranging',
    order: 7,
    label: 'UWB Secure Ranging',
    phase: 'authentication',
    description: 'Ultra-Wideband ranging for precise distance measurement (anti-relay attack).',
    fromActor: 'device',
    toActor: 'vehicle',
    classicalCrypto: 'AES-128 STS (Scrambled Timestamp Sequence)',
    pqcReplacement: 'AES-128 STS (symmetric — quantum-safe)',
    classicalSizeBytes: 16,
    pqcSizeBytes: 16,
  },
  // ─── Key Sharing Phase ───
  {
    id: 'friend-key-request',
    order: 8,
    label: 'Friend Key Request',
    phase: 'sharing',
    description: 'Owner initiates key sharing to a friend device via OEM server.',
    fromActor: 'device',
    toActor: 'oem-server',
    classicalCrypto: 'ECDSA P-256 signed share request',
    pqcReplacement: 'ML-DSA-44 signed share request',
    classicalSizeBytes: 128,
    pqcSizeBytes: 2548,
  },
  {
    id: 'friend-cert-issue',
    order: 9,
    label: 'Friend Certificate Issue',
    phase: 'sharing',
    description: 'OEM server issues a restricted digital key certificate to friend device.',
    fromActor: 'oem-server',
    toActor: 'friend-device',
    classicalCrypto: 'ECDSA P-256 restricted certificate',
    pqcReplacement: 'ML-DSA-44 restricted certificate',
    classicalSizeBytes: 300,
    pqcSizeBytes: 3800,
  },
  {
    id: 'friend-vehicle-pairing',
    order: 10,
    label: 'Friend-Vehicle Pairing',
    phase: 'sharing',
    description:
      'Friend device performs first authentication with vehicle to install friend certificate.',
    fromActor: 'friend-device',
    toActor: 'vehicle',
    classicalCrypto: 'ECDH P-256 + ECDSA P-256',
    pqcReplacement: 'ML-KEM-768 + ML-DSA-44',
    classicalSizeBytes: 97,
    pqcSizeBytes: 3604,
  },
]

// ---------------------------------------------------------------------------
// Transport Profiles
// ---------------------------------------------------------------------------

export interface TransportProfile {
  id: TransportType
  name: string
  maxPayloadBytes: number
  rangeMeters: number
  typicalLatencyMs: number
  pqcFeasibility: 'good' | 'challenging' | 'problematic'
  apduFragmentation: boolean
  notes: string
}

export const TRANSPORT_PROFILES: TransportProfile[] = [
  {
    id: 'nfc',
    name: 'NFC (ISO 14443 / ISO 7816)',
    maxPayloadBytes: 256,
    rangeMeters: 0.04,
    typicalLatencyMs: 200,
    pqcFeasibility: 'problematic',
    apduFragmentation: true,
    notes:
      'Max APDU payload ~256 bytes. ML-KEM-768 public key (1,184 bytes) requires 5+ APDUs. Total handshake: ~12 APDUs vs 3 classical. Latency increases from ~200ms to ~800ms.',
  },
  {
    id: 'ble',
    name: 'BLE 5.0+',
    maxPayloadBytes: 512,
    rangeMeters: 10,
    typicalLatencyMs: 50,
    pqcFeasibility: 'good',
    apduFragmentation: false,
    notes:
      'BLE L2CAP CoC supports large payloads via segmentation. PQC key exchange fits natively. Preferred transport for PQC migration.',
  },
  {
    id: 'uwb',
    name: 'UWB (IEEE 802.15.4z)',
    maxPayloadBytes: 127,
    rangeMeters: 50,
    typicalLatencyMs: 10,
    pqcFeasibility: 'good',
    apduFragmentation: false,
    notes:
      'UWB ranging uses symmetric crypto (AES-128 STS) — already quantum-safe. PQC only needed for initial key agreement, which happens over BLE.',
  },
]

// ---------------------------------------------------------------------------
// Compute total message sizes for protocol comparison
// ---------------------------------------------------------------------------

export function computeProtocolTotals(mode: CryptoMode): {
  totalBytes: number
  totalSteps: number
  pairingBytes: number
  authBytes: number
  sharingBytes: number
} {
  const steps = CAR_KEY_PROTOCOL_STEPS
  const getSize = (step: CarKeyProtocolStep) =>
    mode === 'classical' ? step.classicalSizeBytes : step.pqcSizeBytes

  const pairingBytes = steps
    .filter((s) => s.phase === 'pairing')
    .reduce((sum, s) => sum + getSize(s), 0)
  const authBytes = steps
    .filter((s) => s.phase === 'authentication')
    .reduce((sum, s) => sum + getSize(s), 0)
  const sharingBytes = steps
    .filter((s) => s.phase === 'sharing')
    .reduce((sum, s) => sum + getSize(s), 0)

  return {
    totalBytes: pairingBytes + authBytes + sharingBytes,
    totalSteps: steps.length,
    pairingBytes,
    authBytes,
    sharingBytes,
  }
}

export function computeNFCApduCount(sizeBytes: number): number {
  const maxApduPayload = 256
  return Math.ceil(sizeBytes / maxApduPayload)
}
