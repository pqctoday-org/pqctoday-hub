// SPDX-License-Identifier: GPL-3.0-only

// ---------------------------------------------------------------------------
// Energy-sector protocol data (zero overlap with IoT/OT module)
// IoT/OT covers: CoAP, MQTT, LoRaWAN, Matter, LwM2M, BLE Mesh, OPC UA
// This module covers: IEC 61850 GOOSE/MMS/SV, DNP3-SA, Modbus, DLMS/COSEM, IEEE 2030.5
// ---------------------------------------------------------------------------

export interface ProtocolCryptoLayer {
  layerName: string
  currentAlgorithm: string
  quantumVulnerable: boolean
  pqcReplacement: string | null
  pqcMessageSizeBytes: number
  classicalMessageSizeBytes: number
  migrationComplexity: 'low' | 'medium' | 'high'
  notes: string
}

export interface EnergyProtocol {
  id: string
  name: string
  standard: string
  transport: 'TCP' | 'UDP' | 'Serial' | 'Multicast' | 'PLC'
  typicalBandwidth: string
  maxMessageBytes: number
  timingRequirement: string | null
  cryptoLayers: ProtocolCryptoLayer[]
  pqcFeasibility: 'good' | 'challenging' | 'problematic'
  description: string
}

export const ENERGY_PROTOCOLS: EnergyProtocol[] = [
  {
    id: 'iec61850-goose',
    name: 'IEC 61850 GOOSE',
    standard: 'IEC 61850-8-1',
    transport: 'Multicast',
    typicalBandwidth: '100 Mbps (LAN)',
    maxMessageBytes: 1518,
    timingRequirement: '4ms (protection tripping)',
    description:
      'Generic Object Oriented Substation Event. High-speed multicast protocol for protection relay tripping and status changes.',
    pqcFeasibility: 'good',
    cryptoLayers: [
      {
        layerName: 'Message Authentication',
        currentAlgorithm: 'HMAC-SHA256 (IEC 62351-6)',
        quantumVulnerable: false,
        pqcReplacement: null,
        pqcMessageSizeBytes: 32,
        classicalMessageSizeBytes: 32,
        migrationComplexity: 'low',
        notes: 'HMAC is symmetric — quantum-safe. No migration needed for per-message auth.',
      },
      {
        layerName: 'Key Distribution',
        currentAlgorithm: 'RSA-2048 certificate-based',
        quantumVulnerable: true,
        pqcReplacement: 'ML-KEM-768',
        pqcMessageSizeBytes: 1088,
        classicalMessageSizeBytes: 256,
        migrationComplexity: 'high',
        notes:
          'Key distribution channel seeds HMAC keys. Runs infrequently but is the quantum vulnerability surface.',
      },
    ],
  },
  {
    id: 'iec61850-mms',
    name: 'IEC 61850 MMS',
    standard: 'IEC 61850-8-1 / ISO 9506',
    transport: 'TCP',
    typicalBandwidth: '100 Mbps (LAN)',
    maxMessageBytes: 65535,
    timingRequirement: null,
    description:
      'Manufacturing Message Specification. Client/server protocol for SCADA polling, breaker control, and configuration.',
    pqcFeasibility: 'good',
    cryptoLayers: [
      {
        layerName: 'Transport Security',
        currentAlgorithm: 'TLS 1.2 (IEC 62351-3) with RSA-2048',
        quantumVulnerable: true,
        pqcReplacement: 'TLS 1.3 + ML-KEM-768 hybrid',
        pqcMessageSizeBytes: 2200,
        classicalMessageSizeBytes: 600,
        migrationComplexity: 'medium',
        notes: 'Standard TLS migration path. IED firmware must support TLS 1.3.',
      },
      {
        layerName: 'Certificate Authentication',
        currentAlgorithm: 'RSA-2048 / ECDSA P-256',
        quantumVulnerable: true,
        pqcReplacement: 'ML-DSA-65 (FIPS 204)',
        pqcMessageSizeBytes: 3309,
        classicalMessageSizeBytes: 256,
        migrationComplexity: 'medium',
        notes:
          'Certificate chain in TLS handshake. Larger PQC certs but TCP handles fragmentation.',
      },
    ],
  },
  {
    id: 'iec61850-sv',
    name: 'IEC 61850 Sampled Values',
    standard: 'IEC 61850-9-2',
    transport: 'Multicast',
    typicalBandwidth: '100 Mbps (LAN)',
    maxMessageBytes: 1518,
    timingRequirement: '1ms (80 samples/cycle at 50Hz)',
    description:
      'Multicast measurement data from instrument transformers. Used for protection and metering.',
    pqcFeasibility: 'good',
    cryptoLayers: [
      {
        layerName: 'Message Authentication',
        currentAlgorithm: 'HMAC-SHA256 (IEC 62351-6)',
        quantumVulnerable: false,
        pqcReplacement: null,
        pqcMessageSizeBytes: 32,
        classicalMessageSizeBytes: 32,
        migrationComplexity: 'low',
        notes: 'Same HMAC pattern as GOOSE. Quantum-safe per-message authentication.',
      },
      {
        layerName: 'Key Distribution',
        currentAlgorithm: 'RSA-2048 certificate-based',
        quantumVulnerable: true,
        pqcReplacement: 'ML-KEM-768',
        pqcMessageSizeBytes: 1088,
        classicalMessageSizeBytes: 256,
        migrationComplexity: 'high',
        notes: 'Identical key distribution challenge as GOOSE. Can share migration effort.',
      },
    ],
  },
  {
    id: 'dnp3-sa',
    name: 'DNP3 Secure Authentication',
    standard: 'IEEE 1815.1 (DNP3-SA v5)',
    transport: 'Serial',
    typicalBandwidth: '9.6 kbps - 100 Mbps',
    maxMessageBytes: 2048,
    timingRequirement: null,
    description:
      'Most widely deployed SCADA protocol in North American power systems with secure authentication extension.',
    pqcFeasibility: 'good',
    cryptoLayers: [
      {
        layerName: 'Session Authentication',
        currentAlgorithm: 'HMAC-SHA256 (challenge-response)',
        quantumVulnerable: false,
        pqcReplacement: null,
        pqcMessageSizeBytes: 36,
        classicalMessageSizeBytes: 36,
        migrationComplexity: 'low',
        notes: 'Challenge-response using HMAC with session keys. Quantum-safe symmetric mechanism.',
      },
      {
        layerName: 'Update Key Distribution',
        currentAlgorithm: 'RSA-2048 key transport',
        quantumVulnerable: true,
        pqcReplacement: 'ML-KEM-768',
        pqcMessageSizeBytes: 1088,
        classicalMessageSizeBytes: 256,
        migrationComplexity: 'medium',
        notes:
          'ML-KEM-768 ciphertext (1088 bytes) fits within DNP3 2048-byte fragment limit. Clean single-fragment migration.',
      },
    ],
  },
  {
    id: 'modbus-tcp',
    name: 'Modbus TCP / Modbus TCP Security',
    standard: 'Modbus TCP (MBAP) / Modbus/TCP Security (2018)',
    transport: 'TCP',
    typicalBandwidth: '10 Mbps - 100 Mbps',
    maxMessageBytes: 260,
    timingRequirement: null,
    description:
      'Widely used industrial protocol. Base Modbus has no security; the 2018 Security extension adds TLS.',
    pqcFeasibility: 'challenging',
    cryptoLayers: [
      {
        layerName: 'Transport Security (Security extension)',
        currentAlgorithm: 'TLS 1.2 with RSA/ECDSA',
        quantumVulnerable: true,
        pqcReplacement: 'TLS 1.3 + ML-KEM-768 hybrid',
        pqcMessageSizeBytes: 2200,
        classicalMessageSizeBytes: 600,
        migrationComplexity: 'medium',
        notes:
          'Only applies to Modbus/TCP Security (2018). Legacy Modbus has no crypto — relies on network isolation.',
      },
      {
        layerName: 'Legacy Modbus (no security)',
        currentAlgorithm: 'None (physical isolation only)',
        quantumVulnerable: false,
        pqcReplacement: null,
        pqcMessageSizeBytes: 0,
        classicalMessageSizeBytes: 0,
        migrationComplexity: 'high',
        notes:
          'No crypto to migrate, but also no protection. Consider VPN/gateway-mediated security.',
      },
    ],
  },
  {
    id: 'dlms-cosem-ss1',
    name: 'DLMS/COSEM Security Suite 1',
    standard: 'DLMS UA Blue Book',
    transport: 'PLC',
    typicalBandwidth: '10-200 kbps (PLC) / 62.5 kbps (NB-IoT)',
    maxMessageBytes: 2048,
    timingRequirement: null,
    description:
      'Smart meter protocol with AES-GCM-128 + ECDSA P-256 + ECDH P-256. Most widely deployed security suite.',
    pqcFeasibility: 'challenging',
    cryptoLayers: [
      {
        layerName: 'Symmetric Encryption',
        currentAlgorithm: 'AES-GCM-128',
        quantumVulnerable: false,
        pqcReplacement: null,
        pqcMessageSizeBytes: 0,
        classicalMessageSizeBytes: 0,
        migrationComplexity: 'low',
        notes:
          'AES-128 provides 64-bit post-quantum security under Grover. Acceptable for meter data lifetimes.',
      },
      {
        layerName: 'Key Agreement',
        currentAlgorithm: 'ECDH P-256',
        quantumVulnerable: true,
        pqcReplacement: 'ML-KEM-768',
        pqcMessageSizeBytes: 1088,
        classicalMessageSizeBytes: 33,
        migrationComplexity: 'high',
        notes:
          '33x size increase (33 bytes → 1088 bytes). At PLC speeds, key rotation for millions of meters takes days.',
      },
      {
        layerName: 'Signature Verification',
        currentAlgorithm: 'ECDSA P-256',
        quantumVulnerable: true,
        pqcReplacement: 'ML-DSA-44 (FIPS 204)',
        pqcMessageSizeBytes: 2420,
        classicalMessageSizeBytes: 64,
        migrationComplexity: 'high',
        notes: 'Firmware verification and HLS authentication. PQC signatures are 38x larger.',
      },
    ],
  },
  {
    id: 'dlms-cosem-ss2',
    name: 'DLMS/COSEM Security Suite 2',
    standard: 'DLMS UA Blue Book',
    transport: 'PLC',
    typicalBandwidth: '10-200 kbps (PLC) / 62.5 kbps (NB-IoT)',
    maxMessageBytes: 2048,
    timingRequirement: null,
    description:
      'Enhanced security suite with AES-GCM-256 + ECDSA P-384 + ECDH P-384. Stronger but same quantum vulnerability.',
    pqcFeasibility: 'challenging',
    cryptoLayers: [
      {
        layerName: 'Symmetric Encryption',
        currentAlgorithm: 'AES-GCM-256',
        quantumVulnerable: false,
        pqcReplacement: null,
        pqcMessageSizeBytes: 0,
        classicalMessageSizeBytes: 0,
        migrationComplexity: 'low',
        notes: 'AES-256 provides 128-bit post-quantum security under Grover. Fully quantum-safe.',
      },
      {
        layerName: 'Key Agreement',
        currentAlgorithm: 'ECDH P-384',
        quantumVulnerable: true,
        pqcReplacement: 'ML-KEM-768',
        pqcMessageSizeBytes: 1088,
        classicalMessageSizeBytes: 49,
        migrationComplexity: 'high',
        notes: '22x size increase. Same bandwidth constraint as Suite 1.',
      },
      {
        layerName: 'Signature Verification',
        currentAlgorithm: 'ECDSA P-384',
        quantumVulnerable: true,
        pqcReplacement: 'ML-DSA-65 (FIPS 204)',
        pqcMessageSizeBytes: 3309,
        classicalMessageSizeBytes: 96,
        migrationComplexity: 'high',
        notes: '34x larger signatures. Firmware update bandwidth impact is significant.',
      },
    ],
  },
  {
    id: 'ieee-2030-5',
    name: 'IEEE 2030.5',
    standard: 'IEEE 2030.5 (Smart Energy Profile 2.0)',
    transport: 'TCP',
    typicalBandwidth: '1 Mbps+ (cellular/Wi-Fi)',
    maxMessageBytes: 65535,
    timingRequirement: null,
    description:
      'Smart grid communication profile for DERs: solar inverters, battery storage, EV chargers. Certificate-based device authentication.',
    pqcFeasibility: 'good',
    cryptoLayers: [
      {
        layerName: 'Transport Security',
        currentAlgorithm: 'TLS 1.2 with ECDSA P-256',
        quantumVulnerable: true,
        pqcReplacement: 'TLS 1.3 + ML-KEM-768 hybrid',
        pqcMessageSizeBytes: 2200,
        classicalMessageSizeBytes: 600,
        migrationComplexity: 'medium',
        notes: 'Standard TLS migration. TCP transport handles PQC message sizes.',
      },
      {
        layerName: 'Device Certificate Authentication',
        currentAlgorithm: 'ECDSA P-256 device certificates',
        quantumVulnerable: true,
        pqcReplacement: 'ML-DSA-65 device certificates',
        pqcMessageSizeBytes: 3309,
        classicalMessageSizeBytes: 64,
        migrationComplexity: 'high',
        notes:
          'Each DER has a unique device certificate issued by utility CA. Fleet-wide certificate reissuance required.',
      },
    ],
  },
]

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function getVulnerableLayers(protocol: EnergyProtocol): ProtocolCryptoLayer[] {
  return protocol.cryptoLayers.filter((l) => l.quantumVulnerable)
}

export function getSafeLayers(protocol: EnergyProtocol): ProtocolCryptoLayer[] {
  return protocol.cryptoLayers.filter((l) => !l.quantumVulnerable)
}

export function computeBandwidthImpact(protocol: EnergyProtocol): {
  classicalTotal: number
  pqcTotal: number
  multiplier: string
} {
  const classicalTotal = protocol.cryptoLayers.reduce(
    (sum, l) => sum + l.classicalMessageSizeBytes,
    0
  )
  const pqcTotal = protocol.cryptoLayers.reduce((sum, l) => sum + l.pqcMessageSizeBytes, 0)
  const multiplier = classicalTotal > 0 ? (pqcTotal / classicalTotal).toFixed(1) : 'N/A'
  return { classicalTotal, pqcTotal, multiplier }
}
