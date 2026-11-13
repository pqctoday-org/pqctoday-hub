// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-object-injection */
import type { TransportType, CarKeyActor, CryptoMode } from './automotiveConstants'

/**
 * Fictional digital car key flow used by the Car Key Protocol Explorer.
 *
 * The message table below is a project sample. It adds up application payload bytes of a made-up
 * pairing, authentication and key-sharing flow. It is not the Car Connectivity Consortium Digital
 * Key wire format, not a measured or encoded certificate, and it defines no new wire format.
 * Radio events (a BLE advertisement, an NFC field activation) and local key derivation are shown
 * apart from the table and are never added to its totals.
 *
 * Timing is never assumed. An elapsed time appears only when the learner supplies the service
 * time per radio fragment and per carmaker network message.
 */

// ---------------------------------------------------------------------------
// Flow choices
// ---------------------------------------------------------------------------

/** The radio scenario for credential messages. Only `ble+uwb` adds a UWB ranging message. */
export type RadioScenario = 'nfc' | 'ble' | 'ble+uwb'

/** Where the owner certificate for the vehicle comes from. */
export type OwnerCertRoute = 'direct-carmaker' | 'phone-relay'

/** A message travels on the carmaker network or on one local radio. */
export type FlowTransport = 'network' | TransportType

export const RADIO_SCENARIOS: readonly RadioScenario[] = ['nfc', 'ble', 'ble+uwb']
export const OWNER_CERT_ROUTES: readonly OwnerCertRoute[] = ['direct-carmaker', 'phone-relay']

/** The sample request (challenge) length: one authored figure, not derived from a signature size. */
export const SAMPLE_CHALLENGE_BYTES = 32

/** Largest sample payload carried in one fragment on each local radio. */
export const FRAGMENT_BOUND_BYTES: Record<TransportType, number> = {
  nfc: 256,
  ble: 512,
  uwb: 127,
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------

export interface CarKeyMessage {
  id: string
  label: string
  phase: 'pairing' | 'authentication' | 'sharing'
  description: string
  fromActor: CarKeyActor
  toActor: CarKeyActor
  transport: FlowTransport
  classicalCrypto: string
  pqcReplacement: string
  classicalBytes: number
  pqcBytes: number
}

interface BuildOptions {
  challengeBytes: number
  ownerCertRoute: OwnerCertRoute
  radio: RadioScenario
}

/**
 * Builds the sample message table. Every choice is explicit and invalid or missing choices throw,
 * so a total can never come from a silent default.
 */
export function buildCarKeyFlow(options: BuildOptions): CarKeyMessage[] {
  const { challengeBytes, ownerCertRoute, radio } = options
  if (!Number.isInteger(challengeBytes) || challengeBytes <= 0) {
    throw new Error('An explicit positive integer request length is required')
  }
  if (!OWNER_CERT_ROUTES.includes(ownerCertRoute)) {
    throw new Error('An explicit owner certificate route is required')
  }
  if (!RADIO_SCENARIOS.includes(radio)) {
    throw new Error('An explicit radio scenario is required')
  }
  const local: TransportType = radio === 'ble+uwb' ? 'ble' : radio
  const direct = ownerCertRoute === 'direct-carmaker'

  const messages: CarKeyMessage[] = [
    {
      id: 'attestation',
      label: 'Device attestation',
      phase: 'pairing',
      description: 'The phone proves its identity to the carmaker with a device certificate chain.',
      fromActor: 'device',
      toActor: 'oem-server',
      transport: 'network',
      classicalCrypto: 'ECDSA P-256 certificate chain (3 certs)',
      pqcReplacement: 'ML-DSA-44 certificate chain',
      classicalBytes: 600,
      pqcBytes: 11_520,
    },
    {
      id: 'owner-kex-public',
      label: 'Owner key agreement: public value',
      phase: 'pairing',
      description: 'The phone sends its key-agreement public value to the vehicle.',
      fromActor: 'device',
      toActor: 'vehicle',
      transport: local,
      classicalCrypto: 'ECDH P-256 ephemeral public value',
      pqcReplacement: 'ML-KEM-768 encapsulation key',
      classicalBytes: 33,
      pqcBytes: 1184,
    },
    {
      id: 'owner-kex-return',
      label: 'Owner key agreement: return',
      phase: 'pairing',
      description: 'The vehicle answers with its public value (classical) or the ciphertext (PQC).',
      fromActor: 'vehicle',
      toActor: 'device',
      transport: local,
      classicalCrypto: 'ECDH P-256 ephemeral public value',
      pqcReplacement: 'ML-KEM-768 ciphertext',
      classicalBytes: 33,
      pqcBytes: 1088,
    },
    {
      id: 'owner-cert-phone',
      label: 'Owner certificate to the phone',
      phase: 'pairing',
      description: 'The carmaker issues the owner digital key certificate to the phone.',
      fromActor: 'oem-server',
      toActor: 'device',
      transport: 'network',
      classicalCrypto: 'ECDSA P-256 signed certificate',
      pqcReplacement: 'ML-DSA-44 signed certificate',
      classicalBytes: 256,
      pqcBytes: 3744,
    },
    {
      id: 'owner-cert-vehicle',
      label: 'Owner certificate to the vehicle',
      phase: 'pairing',
      description: direct
        ? 'The carmaker delivers the same owner certificate to the vehicle directly.'
        : 'The phone relays the owner certificate to the vehicle over the local radio.',
      fromActor: direct ? 'oem-server' : 'device',
      toActor: 'vehicle',
      transport: direct ? 'network' : local,
      classicalCrypto: 'ECDSA P-256 signed certificate',
      pqcReplacement: 'ML-DSA-44 signed certificate',
      classicalBytes: 256,
      pqcBytes: 3744,
    },
    {
      id: 'owner-challenge',
      label: 'Owner request',
      phase: 'authentication',
      description: 'The vehicle sends a random request for the phone to sign.',
      fromActor: 'vehicle',
      toActor: 'device',
      transport: local,
      classicalCrypto: 'Random request',
      pqcReplacement: 'Random request',
      classicalBytes: challengeBytes,
      pqcBytes: challengeBytes,
    },
    {
      id: 'owner-response',
      label: 'Owner signed response',
      phase: 'authentication',
      description: 'The phone signs the request with the owner private key and sends it back.',
      fromActor: 'device',
      toActor: 'vehicle',
      transport: local,
      classicalCrypto: 'ECDSA P-256 signature',
      pqcReplacement: 'ML-DSA-44 signature',
      classicalBytes: 64,
      pqcBytes: 2420,
    },
    {
      id: 'share-request',
      label: 'Friend key request',
      phase: 'sharing',
      description: 'The owner asks the carmaker to share the key with a friend device.',
      fromActor: 'device',
      toActor: 'oem-server',
      transport: 'network',
      classicalCrypto: 'ECDSA P-256 signed share request',
      pqcReplacement: 'ML-DSA-44 signed share request',
      classicalBytes: 128,
      pqcBytes: 2548,
    },
    {
      id: 'friend-cert-issue',
      label: 'Friend certificate issue',
      phase: 'sharing',
      description: 'The carmaker issues a restricted digital key certificate to the friend device.',
      fromActor: 'oem-server',
      toActor: 'friend-device',
      transport: 'network',
      classicalCrypto: 'ECDSA P-256 restricted certificate',
      pqcReplacement: 'ML-DSA-44 restricted certificate',
      classicalBytes: 300,
      pqcBytes: 3800,
    },
    {
      id: 'friend-kex-public',
      label: 'Friend key agreement: public value',
      phase: 'sharing',
      description: 'On first use the friend device sends its public value to the vehicle.',
      fromActor: 'friend-device',
      toActor: 'vehicle',
      transport: local,
      classicalCrypto: 'ECDH P-256 ephemeral public value',
      pqcReplacement: 'ML-KEM-768 encapsulation key',
      classicalBytes: 33,
      pqcBytes: 1184,
    },
    {
      id: 'friend-kex-return',
      label: 'Friend key agreement: return',
      phase: 'sharing',
      description: 'The vehicle answers with its public value (classical) or the ciphertext (PQC).',
      fromActor: 'vehicle',
      toActor: 'friend-device',
      transport: local,
      classicalCrypto: 'ECDH P-256 ephemeral public value',
      pqcReplacement: 'ML-KEM-768 ciphertext',
      classicalBytes: 33,
      pqcBytes: 1088,
    },
    {
      id: 'friend-cert-forward',
      label: 'Friend certificate forwarded to the vehicle',
      phase: 'sharing',
      description:
        'The friend device forwards its restricted certificate so the vehicle can authenticate it for the first time.',
      fromActor: 'friend-device',
      toActor: 'vehicle',
      transport: local,
      classicalCrypto: 'ECDSA P-256 restricted certificate',
      pqcReplacement: 'ML-DSA-44 restricted certificate',
      classicalBytes: 300,
      pqcBytes: 3800,
    },
    {
      id: 'friend-challenge',
      label: 'Friend request',
      phase: 'sharing',
      description: 'The vehicle sends a random request for the friend device to sign.',
      fromActor: 'vehicle',
      toActor: 'friend-device',
      transport: local,
      classicalCrypto: 'Random request',
      pqcReplacement: 'Random request',
      classicalBytes: challengeBytes,
      pqcBytes: challengeBytes,
    },
    {
      id: 'friend-response',
      label: 'Friend signed response',
      phase: 'sharing',
      description: 'The friend device signs the request and sends it back.',
      fromActor: 'friend-device',
      toActor: 'vehicle',
      transport: local,
      classicalCrypto: 'ECDSA P-256 signature',
      pqcReplacement: 'ML-DSA-44 signature',
      classicalBytes: 64,
      pqcBytes: 2420,
    },
  ]

  if (radio === 'ble+uwb') {
    messages.push({
      id: 'ranging',
      label: 'UWB secure ranging',
      phase: 'authentication',
      description:
        'Ultra-Wideband ranging measures distance to resist relay attacks. Credential messages stay on BLE.',
      fromActor: 'device',
      toActor: 'vehicle',
      transport: 'uwb',
      classicalCrypto: 'AES-128 STS (Scrambled Timestamp Sequence)',
      pqcReplacement: 'AES-128 STS (symmetric)',
      classicalBytes: 16,
      pqcBytes: 16,
    })
  }
  return messages
}

/** Things that happen but are not part of the byte totals. */
export interface CarKeyLocalEvent {
  id: string
  label: string
  description: string
}

export const CAR_KEY_LOCAL_EVENTS: readonly CarKeyLocalEvent[] = [
  {
    id: 'rf-discovery',
    label: 'Proximity detection (radio event)',
    description:
      'The vehicle notices the phone through a BLE advertisement or an NFC field activation. A BLE advertisement is not the same event as NFC field activation. A 31-byte sample figure for the advertisement is not counted in the totals.',
  },
  {
    id: 'session-key-derivation',
    label: 'Session key derivation (local)',
    description:
      'Each side derives the 32-byte AES session key locally with HKDF-SHA-256 from the shared secret. The derived key is never transmitted, so it adds 0 bytes to the totals.',
  },
]

// ---------------------------------------------------------------------------
// Transport profiles (sample assumptions, not universal limits)
// ---------------------------------------------------------------------------

export interface TransportProfile {
  id: TransportType
  name: string
  maxPayloadBytes: number
  rangeMeters: number
  pqcFeasibility: 'good' | 'challenging' | 'problematic'
  notes: string
}

export const TRANSPORT_PROFILES: TransportProfile[] = [
  {
    id: 'nfc',
    name: 'NFC (ISO 14443 / ISO 7816)',
    maxPayloadBytes: FRAGMENT_BOUND_BYTES.nfc,
    rangeMeters: 0.04,
    pqcFeasibility: 'problematic',
    notes:
      'The sample assumes short commands of about 256 bytes. Extended-length APDUs or chaining may change this.',
  },
  {
    id: 'ble',
    name: 'BLE 5.0+',
    maxPayloadBytes: FRAGMENT_BOUND_BYTES.ble,
    rangeMeters: 10,
    pqcFeasibility: 'good',
    notes:
      'The sample assumes 512-byte fragments. Real segmentation depends on the negotiated MTU and the profile in use.',
  },
  {
    id: 'uwb',
    name: 'UWB (IEEE 802.15.4z)',
    maxPayloadBytes: FRAGMENT_BOUND_BYTES.uwb,
    rangeMeters: 50,
    pqcFeasibility: 'good',
    notes:
      'UWB ranging uses symmetric crypto (AES-128 STS) and carries only the ranging message in this sample. Credential messages use BLE.',
  },
]

// ---------------------------------------------------------------------------
// Summaries
// ---------------------------------------------------------------------------

export interface TransportTotals {
  bytes: number
  messages: number
  /** Sum of per-message ceil(bytes / bound). Null for the carmaker network. */
  payloadFragments: number | null
}

export interface FlowSummary {
  totalBytes: number
  transports: Partial<Record<FlowTransport, TransportTotals>>
  /** Null unless a complete service-time profile was supplied. */
  serialServiceMs: number | null
}

/**
 * Service time inputs in milliseconds: per payload fragment on a local radio, per message on the
 * carmaker network. There are no defaults.
 */
export type ServiceMs = Partial<Record<FlowTransport, number>>

export function summarizeCarKeyFlow(
  messages: CarKeyMessage[],
  mode: CryptoMode,
  serviceMs?: ServiceMs
): FlowSummary {
  if (new Set(messages.map((m) => m.id)).size !== messages.length) {
    throw new Error('Duplicate message')
  }
  const transports: Partial<Record<FlowTransport, TransportTotals>> = {}
  for (const m of messages) {
    const n = mode === 'classical' ? m.classicalBytes : m.pqcBytes
    if (!Number.isInteger(n) || n <= 0) throw new Error('Invalid message payload')
    if (m.transport !== 'network' && !(m.transport in FRAGMENT_BOUND_BYTES)) {
      throw new Error('Unknown transport')
    }
    const entry = (transports[m.transport] ??= {
      bytes: 0,
      messages: 0,
      payloadFragments: m.transport === 'network' ? null : 0,
    })
    entry.bytes += n
    entry.messages += 1
    if (m.transport !== 'network') {
      entry.payloadFragments =
        (entry.payloadFragments ?? 0) + Math.ceil(n / FRAGMENT_BOUND_BYTES[m.transport])
    }
  }

  let serialServiceMs: number | null = null
  if (serviceMs !== undefined) {
    const used = Object.keys(transports).sort()
    const given = Object.keys(serviceMs).sort()
    if (used.length !== given.length || used.some((t, i) => t !== given[i])) {
      throw new Error('A complete service-time profile is required')
    }
    serialServiceMs = 0
    for (const t of used as FlowTransport[]) {
      const rate = serviceMs[t]
      if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) {
        throw new Error('Service times must be finite and positive')
      }
      const totals = transports[t]!
      serialServiceMs += rate * (t === 'network' ? totals.messages : (totals.payloadFragments ?? 0))
    }
  }

  return {
    totalBytes: Object.values(transports).reduce((sum, t) => sum + t.bytes, 0),
    transports,
    serialServiceMs,
  }
}

/** Fragments one payload needs on a local radio: ceil(bytes / bound). */
export function fragmentCount(transport: TransportType, bytes: number): number {
  return Math.ceil(bytes / FRAGMENT_BOUND_BYTES[transport])
}
