// ── RFC 7228 Constrained Device Classes ──────────────────────────────────────
export interface DeviceClass {
  id: string
  name: string
  ramKB: number
  flashKB: number
  description: string
  examples: string[]
}

export const DEVICE_CLASSES: DeviceClass[] = [
  {
    id: 'class-0',
    name: 'Class 0',
    ramKB: 10,
    flashKB: 100,
    description: 'Extremely constrained. Too limited for direct internet communication.',
    examples: ['Sensor tags', 'RFID sensors', 'Asset trackers'],
  },
  {
    id: 'class-1',
    name: 'Class 1',
    ramKB: 10,
    flashKB: 100,
    description: 'Can communicate using constrained protocols (CoAP/DTLS).',
    examples: ['Smart meters', 'Environmental sensors', 'Actuators'],
  },
  {
    id: 'class-2',
    name: 'Class 2',
    ramKB: 50,
    flashKB: 250,
    description: 'Lightweight IP stack. Supports some TLS/DTLS with PQC.',
    examples: ['Industrial gateways', 'PLCs', 'Camera nodes'],
  },
  {
    id: 'class-3',
    name: 'Class 3+',
    ramKB: 256,
    flashKB: 1024,
    description: 'Near-server class. Can run full TLS 1.3 stack with PQC.',
    examples: ['Edge gateways', 'RTUs', 'Vehicle ECUs'],
  },
]

// ── PQC Algorithm Resource Requirements ──────────────────────────────────────
export interface ConstrainedAlgorithm {
  name: string
  type: 'KEM' | 'Signature'
  ramKB: number
  publicKeyBytes: number
  ciphertextOrSigBytes: number
  nistLevel: number
  quantumSafe: boolean
  suitableForClass: number[]
  notes: string
}

export const CONSTRAINED_ALGORITHMS: ConstrainedAlgorithm[] = [
  // KEMs
  {
    name: 'X25519',
    type: 'KEM',
    ramKB: 0.3,
    publicKeyBytes: 32,
    ciphertextOrSigBytes: 32,
    nistLevel: 0,
    quantumSafe: false,
    suitableForClass: [0, 1, 2, 3],
    notes: 'Classical ECDH baseline. Quantum-vulnerable.',
  },
  {
    name: 'ML-KEM-512',
    type: 'KEM',
    ramKB: 3,
    publicKeyBytes: 800,
    ciphertextOrSigBytes: 768,
    nistLevel: 1,
    quantumSafe: true,
    suitableForClass: [1, 2, 3],
    notes: 'Smallest lattice KEM. Fits Class 1+ devices.',
  },
  {
    name: 'ML-KEM-768',
    type: 'KEM',
    ramKB: 6,
    publicKeyBytes: 1184,
    ciphertextOrSigBytes: 1088,
    nistLevel: 3,
    quantumSafe: true,
    suitableForClass: [2, 3],
    notes: 'Standard NIST recommendation. ~6 KB stack.',
  },
  {
    name: 'ML-KEM-1024',
    type: 'KEM',
    ramKB: 10,
    publicKeyBytes: 1568,
    ciphertextOrSigBytes: 1568,
    nistLevel: 5,
    quantumSafe: true,
    suitableForClass: [3],
    notes: 'Highest security. ~10 KB stack RAM.',
  },
  {
    name: 'FrodoKEM-640',
    type: 'KEM',
    ramKB: 180,
    publicKeyBytes: 9616,
    ciphertextOrSigBytes: 9720,
    nistLevel: 1,
    quantumSafe: true,
    suitableForClass: [],
    notes: 'Conservative (no ring structure). ~180 KB RAM — infeasible for IoT.',
  },
  // Signatures
  {
    name: 'ECDSA P-256',
    type: 'Signature',
    ramKB: 0.3,
    publicKeyBytes: 64,
    ciphertextOrSigBytes: 64,
    nistLevel: 0,
    quantumSafe: false,
    suitableForClass: [0, 1, 2, 3],
    notes: 'Classical baseline. Quantum-vulnerable.',
  },
  {
    name: 'LMS (H10/W4)',
    type: 'Signature',
    ramKB: 0.5,
    publicKeyBytes: 56,
    ciphertextOrSigBytes: 2512,
    nistLevel: 1,
    quantumSafe: true,
    suitableForClass: [0, 1, 2, 3],
    notes: 'Smallest PQC verifier. Stateful — requires monotonic counter.',
  },
  {
    name: 'XMSS (H10)',
    type: 'Signature',
    ramKB: 1,
    publicKeyBytes: 68,
    ciphertextOrSigBytes: 2500,
    nistLevel: 1,
    quantumSafe: true,
    suitableForClass: [1, 2, 3],
    notes: 'Stateful with forward secrecy. BSI-preferred.',
  },
  {
    name: 'FN-DSA-512',
    type: 'Signature',
    ramKB: 1.5,
    publicKeyBytes: 897,
    ciphertextOrSigBytes: 666,
    nistLevel: 1,
    quantumSafe: true,
    suitableForClass: [1, 2, 3],
    notes: 'Most compact PQC signature (666 bytes). FIPS 206 (draft).',
  },
  {
    name: 'ML-DSA-44',
    type: 'Signature',
    ramKB: 2.5,
    publicKeyBytes: 1312,
    ciphertextOrSigBytes: 2420,
    nistLevel: 2,
    quantumSafe: true,
    suitableForClass: [2, 3],
    notes: 'Stateless lattice sig. Larger key than LMS/XMSS.',
  },
  {
    name: 'ML-DSA-65',
    type: 'Signature',
    ramKB: 4,
    publicKeyBytes: 1952,
    ciphertextOrSigBytes: 3309,
    nistLevel: 3,
    quantumSafe: true,
    suitableForClass: [3],
    notes: 'Standard NIST Level 3. ~4 KB stack RAM.',
  },
]

// ── IoT Protocol Comparison ──────────────────────────────────────────────────
export interface IoTProtocol {
  name: string
  transport: string
  maxPayloadBytes: number
  handshakeRoundTrips: number
  pqcFeasibility: 'good' | 'challenging' | 'problematic'
  notes: string
}

export const IOT_PROTOCOLS: IoTProtocol[] = [
  {
    name: 'CoAP + DTLS 1.3',
    transport: 'UDP',
    maxPayloadBytes: 1024,
    handshakeRoundTrips: 2,
    pqcFeasibility: 'challenging',
    notes:
      'ML-KEM ciphertext requires DTLS fragmentation. Record layer overhead adds ~13 bytes/record.',
  },
  {
    name: 'MQTT 5.0 + TLS 1.3',
    transport: 'TCP',
    maxPayloadBytes: 65535,
    handshakeRoundTrips: 1,
    pqcFeasibility: 'good',
    notes:
      'TCP handles fragmentation natively. Larger PQC handshake tolerable for always-on connections.',
  },
  {
    name: 'LoRaWAN 1.1',
    transport: 'LoRa PHY',
    maxPayloadBytes: 222,
    handshakeRoundTrips: 0,
    pqcFeasibility: 'problematic',
    notes:
      'Pre-shared keys only. ML-KEM-512 ciphertext (768 B) exceeds max payload. PQC requires out-of-band provisioning.',
  },
  {
    name: 'Matter / Thread',
    transport: 'UDP/IPv6',
    maxPayloadBytes: 1280,
    handshakeRoundTrips: 3,
    pqcFeasibility: 'challenging',
    notes: 'CASE protocol uses ECDSA P-256. PQC migration requires protocol specification update.',
  },
]

// ── Simulated IoT Device Types ───────────────────────────────────────────────
export interface IoTDeviceType {
  id: string
  name: string
  deviceClass: number
  firmwareSizeKB: number
  connectivity: string
  bandwidthKbps: number
  updateFrequency: string
  description: string
}

export const IOT_DEVICE_TYPES: IoTDeviceType[] = [
  {
    id: 'smart-meter',
    name: 'Smart Meter',
    deviceClass: 1,
    firmwareSizeKB: 256,
    connectivity: 'NB-IoT',
    bandwidthKbps: 62.5,
    updateFrequency: 'Quarterly',
    description: 'Utility smart meter with NB-IoT cellular connectivity',
  },
  {
    id: 'industrial-gateway',
    name: 'Industrial Gateway',
    deviceClass: 3,
    firmwareSizeKB: 8192,
    connectivity: 'Ethernet',
    bandwidthKbps: 100_000,
    updateFrequency: 'Monthly',
    description: 'Edge gateway bridging OT and IT networks',
  },
  {
    id: 'medical-sensor',
    name: 'Medical Sensor',
    deviceClass: 1,
    firmwareSizeKB: 128,
    connectivity: 'BLE + WiFi',
    bandwidthKbps: 1000,
    updateFrequency: 'Annually',
    description: 'Wearable medical sensor with BLE and WiFi backhaul',
  },
  {
    id: 'vehicle-ecu',
    name: 'Vehicle ECU',
    deviceClass: 2,
    firmwareSizeKB: 2048,
    connectivity: 'CAN / Ethernet',
    bandwidthKbps: 500,
    updateFrequency: 'Bi-annually',
    description: 'Automotive electronic control unit with CAN bus',
  },
]

// ── Purdue Model Layers (ICS/SCADA) ─────────────────────────────────────────
export interface PurdueLayer {
  level: number | string
  name: string
  description: string
  defaultCrypto: string
  pqcPriority: 'critical' | 'high' | 'medium' | 'low'
  internetFacing: boolean
  assetLifecycleYears: number
}

export const PURDUE_LAYERS: PurdueLayer[] = [
  {
    level: 0,
    name: 'Physical Process',
    description: 'Sensors, actuators, field instruments',
    defaultCrypto: 'None / Pre-shared keys',
    pqcPriority: 'low',
    internetFacing: false,
    assetLifecycleYears: 25,
  },
  {
    level: 1,
    name: 'Basic Control',
    description: 'PLCs, RTUs, IEDs',
    defaultCrypto: 'Pre-shared keys / DNP3-SA',
    pqcPriority: 'medium',
    internetFacing: false,
    assetLifecycleYears: 20,
  },
  {
    level: 2,
    name: 'Area Supervisory',
    description: 'HMIs, SCADA servers, historians',
    defaultCrypto: 'RSA-2048 / TLS 1.2',
    pqcPriority: 'high',
    internetFacing: false,
    assetLifecycleYears: 15,
  },
  {
    level: 3,
    name: 'Site Operations',
    description: 'Domain controllers, file servers, engineering workstations',
    defaultCrypto: 'RSA-2048 / TLS 1.2 / IPsec',
    pqcPriority: 'high',
    internetFacing: false,
    assetLifecycleYears: 10,
  },
  {
    level: '3.5',
    name: 'DMZ',
    description: 'Data diodes, jump servers, patch management, remote access',
    defaultCrypto: 'TLS 1.2/1.3',
    pqcPriority: 'critical',
    internetFacing: true,
    assetLifecycleYears: 5,
  },
  {
    level: 4,
    name: 'Enterprise IT',
    description: 'ERP, email servers, corporate network',
    defaultCrypto: 'TLS 1.3 / IPsec',
    pqcPriority: 'critical',
    internetFacing: true,
    assetLifecycleYears: 5,
  },
  {
    level: 5,
    name: 'Enterprise Network',
    description: 'Cloud services, remote access, VPN gateways',
    defaultCrypto: 'TLS 1.3 / VPN',
    pqcPriority: 'critical',
    internetFacing: true,
    assetLifecycleYears: 3,
  },
]

// ── DTLS 1.3 Handshake Message Sizes ─────────────────────────────────────────
export interface HandshakeAlgorithmOption {
  id: string
  name: string
  type: 'kem' | 'sig'
  category: 'classical' | 'pqc' | 'hybrid'
}

export const HANDSHAKE_KEM_OPTIONS: HandshakeAlgorithmOption[] = [
  { id: 'x25519', name: 'X25519', type: 'kem', category: 'classical' },
  { id: 'ml-kem-512', name: 'ML-KEM-512', type: 'kem', category: 'pqc' },
  { id: 'ml-kem-768', name: 'ML-KEM-768', type: 'kem', category: 'pqc' },
  {
    id: 'x25519-ml-kem-768',
    name: 'X25519 + ML-KEM-768',
    type: 'kem',
    category: 'hybrid',
  },
]

export const HANDSHAKE_SIG_OPTIONS: HandshakeAlgorithmOption[] = [
  { id: 'ecdsa-p256', name: 'ECDSA P-256', type: 'sig', category: 'classical' },
  { id: 'ml-dsa-44', name: 'ML-DSA-44', type: 'sig', category: 'pqc' },
  { id: 'ml-dsa-65', name: 'ML-DSA-65', type: 'sig', category: 'pqc' },
  {
    id: 'ecdsa-ml-dsa-44',
    name: 'ECDSA + ML-DSA-44',
    type: 'sig',
    category: 'hybrid',
  },
]

/**
 * Pre-calculated DTLS 1.3 handshake component sizes (bytes).
 * Each entry maps algo IDs to byte contributions per handshake message.
 */
export interface HandshakeSizes {
  kemId: string
  sigId: string
  clientHello: number
  serverHello: number
  encryptedExtensions: number
  certificate: number
  certificateVerify: number
  finished: number
  totalBytes: number
}

const BASE_OVERHEAD = 200 // DTLS record headers, extensions, etc.

/** Map of KEM ID → { publicKeyBytes, ciphertextBytes } */
const KEM_SIZES: Record<string, { pk: number; ct: number }> = {
  x25519: { pk: 32, ct: 32 },
  'ml-kem-512': { pk: 800, ct: 768 },
  'ml-kem-768': { pk: 1184, ct: 1088 },
  'x25519-ml-kem-768': { pk: 32 + 1184, ct: 32 + 1088 },
}

/** Map of Sig ID → { publicKeyBytes, signatureBytes } */
const SIG_SIZES: Record<string, { pk: number; sig: number }> = {
  'ecdsa-p256': { pk: 64, sig: 64 },
  'ml-dsa-44': { pk: 1312, sig: 2420 },
  'ml-dsa-65': { pk: 1952, sig: 3309 },
  'ecdsa-ml-dsa-44': { pk: 64 + 1312, sig: 64 + 2420 },
}

export function calculateHandshakeSizes(kemId: string, sigId: string): HandshakeSizes {
  // eslint-disable-next-line security/detect-object-injection
  const kem = KEM_SIZES[kemId] ?? KEM_SIZES['x25519']
  // eslint-disable-next-line security/detect-object-injection
  const sig = SIG_SIZES[sigId] ?? SIG_SIZES['ecdsa-p256']

  const clientHello = BASE_OVERHEAD + kem.pk + 50 // key_share + cipher suites
  const serverHello = BASE_OVERHEAD + kem.ct + 50
  const encryptedExtensions = 100
  // Certificate: ~200 bytes structure + 3 certs (root, intermediate, leaf) with public keys + signatures
  const certificate = 600 + sig.pk * 3 + sig.sig * 2
  const certificateVerify = 50 + sig.sig
  const finished = 80

  return {
    kemId,
    sigId,
    clientHello,
    serverHello,
    encryptedExtensions,
    certificate,
    certificateVerify,
    finished,
    totalBytes:
      clientHello + serverHello + encryptedExtensions + certificate + certificateVerify + finished,
  }
}

// ── Certificate Chain Algorithm Options ──────────────────────────────────────
export interface CertAlgorithmOption {
  id: string
  name: string
  publicKeyBytes: number
  signatureBytes: number
  category: 'classical' | 'pqc' | 'hybrid'
}

export const CERT_ALGORITHM_OPTIONS: CertAlgorithmOption[] = [
  {
    id: 'rsa-2048',
    name: 'RSA-2048',
    publicKeyBytes: 256,
    signatureBytes: 256,
    category: 'classical',
  },
  {
    id: 'ecdsa-p256',
    name: 'ECDSA P-256',
    publicKeyBytes: 64,
    signatureBytes: 64,
    category: 'classical',
  },
  {
    id: 'ml-dsa-44',
    name: 'ML-DSA-44',
    publicKeyBytes: 1312,
    signatureBytes: 2420,
    category: 'pqc',
  },
  {
    id: 'ml-dsa-65',
    name: 'ML-DSA-65',
    publicKeyBytes: 1952,
    signatureBytes: 3309,
    category: 'pqc',
  },
  {
    id: 'ml-dsa-87',
    name: 'ML-DSA-87',
    publicKeyBytes: 2592,
    signatureBytes: 4627,
    category: 'pqc',
  },
  {
    id: 'ecdsa-ml-dsa-44',
    name: 'ECDSA + ML-DSA-44 Hybrid',
    publicKeyBytes: 64 + 1312,
    signatureBytes: 64 + 2420,
    category: 'hybrid',
  },
]

export const CERT_BASE_OVERHEAD = 300 // ASN.1 structure, extensions, validity, subject/issuer

// ── Mitigation Options for Cert Chain Bloat ─────────────────────────────────
export interface CertMitigation {
  id: string
  name: string
  rfc: string
  reductionPercent: number
  description: string
}

export const CERT_MITIGATIONS: CertMitigation[] = [
  {
    id: 'mtc',
    name: 'Merkle Tree Certificates',
    rfc: 'draft-ietf-tls-merkle-tree-certs',
    reductionPercent: 85,
    description:
      'Replace PQC signatures in leaf certs with compact Merkle inclusion proofs (~300 bytes vs ~3 KB).',
  },
  {
    id: 'compression',
    name: 'Certificate Compression',
    rfc: 'RFC 8879',
    reductionPercent: 30,
    description:
      'Zlib/Brotli compress the certificate chain during TLS handshake. 25-35% reduction on PQC certs.',
  },
  {
    id: 'resumption',
    name: 'Session Resumption (PSK)',
    rfc: 'RFC 8446 \u00a72.2',
    reductionPercent: 90,
    description:
      'Reuse prior session keys via PSK. Eliminates certificate exchange entirely on reconnection.',
  },
  {
    id: 'raw-keys',
    name: 'Raw Public Keys',
    rfc: 'RFC 7250',
    reductionPercent: 70,
    description:
      'Send bare public keys instead of full X.509 certs. Removes signatures, extensions, and metadata.',
  },
]

// ── Firmware Signing Algorithm Options (reused from IoT context) ─────────────
export interface IoTFirmwareAlgorithm {
  id: string
  name: string
  signatureBytes: number
  publicKeyBytes: number
  stateful: boolean
  verifyTimeMs: number
  notes: string
}

export const IOT_FIRMWARE_ALGORITHMS: IoTFirmwareAlgorithm[] = [
  {
    id: 'lms',
    name: 'LMS / HSS',
    signatureBytes: 2512,
    publicKeyBytes: 56,
    stateful: true,
    verifyTimeMs: 0.1,
    notes: 'Smallest verifier. Requires monotonic counter in TPM or secure element.',
  },
  {
    id: 'xmss',
    name: 'XMSS',
    signatureBytes: 2500,
    publicKeyBytes: 68,
    stateful: true,
    verifyTimeMs: 0.3,
    notes: 'Forward secrecy. BSI-preferred. Requires HSM for state persistence.',
  },
  {
    id: 'ml-dsa-44',
    name: 'ML-DSA-44',
    signatureBytes: 2420,
    publicKeyBytes: 1312,
    stateful: false,
    verifyTimeMs: 0.2,
    notes: 'Stateless. Larger public key but no state management overhead.',
  },
  {
    id: 'ml-dsa-65',
    name: 'ML-DSA-65',
    signatureBytes: 3309,
    publicKeyBytes: 1952,
    stateful: false,
    verifyTimeMs: 0.3,
    notes: 'NIST Level 3 stateless. Suitable for gateways and Class 3+ devices.',
  },
]

// ── SUIT Manifest Structure (RFC 9019) ───────────────────────────────────────
export interface SUITManifestField {
  field: string
  value: string
  description: string
}

export function buildSUITManifest(
  deviceType: IoTDeviceType,
  algorithm: IoTFirmwareAlgorithm,
  firmwareHash: string
): SUITManifestField[] {
  return [
    {
      field: 'manifest-version',
      value: '1',
      description: 'SUIT manifest format version',
    },
    {
      field: 'manifest-sequence-number',
      value: String(Date.now()),
      description: 'Monotonically increasing sequence to prevent rollback',
    },
    {
      field: 'component-id',
      value: `["${deviceType.id}", "firmware", "v${deviceType.firmwareSizeKB}"]`,
      description: 'Identifies the firmware slot being updated',
    },
    {
      field: 'payload-digest',
      value: firmwareHash,
      description: 'SHA-256 hash of the firmware image',
    },
    {
      field: 'payload-size',
      value: `${deviceType.firmwareSizeKB * 1024} bytes`,
      description: 'Firmware image size for pre-flight storage check',
    },
    {
      field: 'signature-algorithm',
      value: algorithm.name,
      description: `${algorithm.stateful ? 'Stateful' : 'Stateless'} PQC signature (${algorithm.signatureBytes} bytes)`,
    },
    {
      field: 'signature-size',
      value: `${algorithm.signatureBytes} bytes`,
      description: 'Total bandwidth overhead for signature delivery',
    },
    {
      field: 'conditions',
      value: `vendor-id: "example.com", class-id: "${deviceType.id}"`,
      description: 'Device must match vendor and class before applying update',
    },
  ]
}
