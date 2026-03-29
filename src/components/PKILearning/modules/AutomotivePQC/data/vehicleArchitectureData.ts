// SPDX-License-Identifier: GPL-3.0-only
import type { ECUZone, InVehicleBus, VehicleType } from './automotiveConstants'

// ---------------------------------------------------------------------------
// ECU Zone Configurations
// ---------------------------------------------------------------------------

export interface ECUZoneConfig {
  id: ECUZone
  name: string
  description: string
  ecuCount: Record<VehicleType, number>
  primaryBus: InVehicleBus
  secondaryBus?: InVehicleBus
  currentCrypto: string[]
  quantumVulnerablePoints: string[]
  pqcRecommendation: { kem: string; signature: string; rationale: string }
  latencyBudgetMs: number
  bandwidthKbps: number
}

export const ECU_ZONES: ECUZoneConfig[] = [
  {
    id: 'powertrain',
    name: 'Powertrain',
    description:
      'Engine/motor control, transmission, battery management (EV). Safety-critical with strict timing constraints.',
    ecuCount: { sedan: 4, suv: 5, 'commercial-truck': 6, 'autonomous-shuttle': 3 },
    primaryBus: 'can-fd',
    secondaryBus: 'can',
    currentCrypto: ['AES-128 CMAC (CAN FD auth)', 'RSA-2048 (firmware signing)'],
    quantumVulnerablePoints: ['ECU firmware signing (RSA-2048)', 'Diagnostic TLS sessions'],
    pqcRecommendation: {
      kem: 'ML-KEM-768',
      signature: 'LMS (stateful, infrequent firmware updates)',
      rationale:
        'LMS has fast verification and small verifier footprint for infrequent firmware updates',
    },
    latencyBudgetMs: 5,
    bandwidthKbps: 5000,
  },
  {
    id: 'chassis',
    name: 'Chassis',
    description:
      'Braking (ABS/ESC), steering (EPS), suspension. Highest ASIL levels, real-time constraints.',
    ecuCount: { sedan: 3, suv: 4, 'commercial-truck': 5, 'autonomous-shuttle': 4 },
    primaryBus: 'flexray',
    secondaryBus: 'can-fd',
    currentCrypto: ['AES-128 CMAC (FlexRay auth)', 'ECDSA P-256 (secure boot)'],
    quantumVulnerablePoints: ['ECU secure boot (ECDSA P-256)', 'Inter-ECU command authentication'],
    pqcRecommendation: {
      kem: 'ML-KEM-512',
      signature: 'ML-DSA-44 (fast verification for safety-critical path)',
      rationale: 'ML-DSA-44 meets sub-10ms verification budget for ASIL-D braking',
    },
    latencyBudgetMs: 10,
    bandwidthKbps: 10000,
  },
  {
    id: 'adas',
    name: 'ADAS (Advanced Driver Assistance)',
    description:
      'Autonomous driving perception (LiDAR, radar, camera fusion), path planning, V2X. Most crypto-intensive zone.',
    ecuCount: { sedan: 5, suv: 6, 'commercial-truck': 4, 'autonomous-shuttle': 12 },
    primaryBus: 'automotive-ethernet',
    secondaryBus: 'can-fd',
    currentCrypto: [
      'ECDSA P-256 (sensor data attestation)',
      'AES-256 GCM (Ethernet MACsec)',
      'ECDSA P-256 (V2X IEEE 1609.2 certificates)',
      'TLS 1.3 RSA/ECDSA (HD map downloads)',
    ],
    quantumVulnerablePoints: [
      'Sensor data attestation (ECDSA)',
      'V2X certificate PKI (IEEE 1609.2)',
      'HD map download encryption',
      'ML model provenance signing',
      'Inter-zone ADAS commands',
    ],
    pqcRecommendation: {
      kem: 'ML-KEM-768',
      signature: 'ML-DSA-44 (sensor attestation) + FN-DSA-512 (compact V2X certs)',
      rationale: 'High-frequency sensor signing needs fast algorithms; V2X needs compact certs',
    },
    latencyBudgetMs: 100,
    bandwidthKbps: 1000000,
  },
  {
    id: 'body',
    name: 'Body Electronics',
    description:
      'Doors, windows, lights, climate control, digital car key (NFC/BLE/UWB). Lower safety but high privacy.',
    ecuCount: { sedan: 8, suv: 10, 'commercial-truck': 6, 'autonomous-shuttle': 4 },
    primaryBus: 'lin',
    secondaryBus: 'can',
    currentCrypto: ['AES-128 (immobilizer)', 'ECDH P-256 / ECDSA P-256 (CCC Digital Key)'],
    quantumVulnerablePoints: [
      'Digital car key (ECDH/ECDSA P-256)',
      'Immobilizer challenge-response',
    ],
    pqcRecommendation: {
      kem: 'ML-KEM-768 (BLE/UWB key agreement)',
      signature: 'ML-DSA-44 (key attestation)',
      rationale: 'NFC APDU constraint (256B) requires multi-APDU PQC; BLE/UWB are preferred',
    },
    latencyBudgetMs: 500,
    bandwidthKbps: 20,
  },
  {
    id: 'infotainment',
    name: 'Infotainment',
    description:
      'Head unit, navigation, media, app store, in-vehicle payments. Internet-connected with OTA.',
    ecuCount: { sedan: 2, suv: 3, 'commercial-truck': 2, 'autonomous-shuttle': 2 },
    primaryBus: 'automotive-ethernet',
    secondaryBus: 'can-fd',
    currentCrypto: [
      'TLS 1.3 RSA/ECDSA (cloud services)',
      'RSA-2048 (app signing)',
      'ECDSA P-256 (payment tokenization)',
    ],
    quantumVulnerablePoints: [
      'Cloud service TLS (RSA/ECDSA)',
      'App store code signing',
      'Payment tokenization (ISO 15118)',
    ],
    pqcRecommendation: {
      kem: 'ML-KEM-768 (hybrid TLS)',
      signature: 'ML-DSA-65 (app signing, payment auth)',
      rationale: 'Full-powered SoC can handle larger PQC operations; TLS hybrid migration first',
    },
    latencyBudgetMs: 1000,
    bandwidthKbps: 1000000,
  },
  {
    id: 'connectivity',
    name: 'Connectivity',
    description:
      'Telematics Control Unit (TCU), cellular modem, Wi-Fi, Bluetooth, OTA gateway. Bridge between vehicle and cloud.',
    ecuCount: { sedan: 2, suv: 2, 'commercial-truck': 3, 'autonomous-shuttle': 3 },
    primaryBus: 'automotive-ethernet',
    currentCrypto: [
      'TLS 1.3 (telematics)',
      'RSA-2048 (OTA firmware signing)',
      'AES-256 (OTA encryption)',
      'ECDSA P-256 (V2X broadcast signing)',
    ],
    quantumVulnerablePoints: [
      'OTA firmware signing (RSA-2048)',
      'Telematics TLS sessions (HNDL risk)',
      'V2X broadcast signing (ECDSA)',
      'Fleet management API auth',
    ],
    pqcRecommendation: {
      kem: 'ML-KEM-768 (hybrid TLS 1.3)',
      signature: 'ML-DSA-65 (OTA signing) + SLH-DSA (long-lived root keys)',
      rationale: 'Gateway ECU has resources; SLH-DSA for root keys that outlive vehicle',
    },
    latencyBudgetMs: 2000,
    bandwidthKbps: 150000,
  },
]

// ---------------------------------------------------------------------------
// In-Vehicle Bus Profiles
// ---------------------------------------------------------------------------

export interface BusProfile {
  id: InVehicleBus
  name: string
  maxBandwidthMbps: number
  maxPayloadBytes: number
  authenticationSupport: string
  pqcFeasibility: 'good' | 'challenging' | 'problematic'
  notes: string
}

export const BUS_PROFILES: BusProfile[] = [
  {
    id: 'can',
    name: 'CAN 2.0B (ISO 11898-1)',
    maxBandwidthMbps: 0.5,
    maxPayloadBytes: 8,
    authenticationSupport: 'None native; SecOC (AUTOSAR) adds CMAC truncated to 24-64 bits',
    pqcFeasibility: 'problematic',
    notes:
      '8-byte payload cannot carry PQC signatures (ML-DSA-44 = 2,420 bytes). Authentication must stay symmetric (AES-CMAC).',
  },
  {
    id: 'can-fd',
    name: 'CAN FD (ISO 11898-1:2015)',
    maxBandwidthMbps: 5,
    maxPayloadBytes: 64,
    authenticationSupport: 'SecOC with CMAC; CAN XL (future) up to 2048 bytes',
    pqcFeasibility: 'challenging',
    notes:
      '64-byte payload still too small for PQC signatures. CAN XL (ISO 11898-2:2024) may enable PQC but not yet deployed.',
  },
  {
    id: 'lin',
    name: 'LIN',
    maxBandwidthMbps: 0.02,
    maxPayloadBytes: 8,
    authenticationSupport: 'None',
    pqcFeasibility: 'problematic',
    notes:
      'Low-speed body electronics bus. PQC not applicable; relies on gateway ECU for authenticated commands.',
  },
  {
    id: 'flexray',
    name: 'FlexRay (ISO 10681)',
    maxBandwidthMbps: 10,
    maxPayloadBytes: 254,
    authenticationSupport: 'Optional frame-level authentication',
    pqcFeasibility: 'challenging',
    notes:
      '254-byte payload could carry FN-DSA-512 signatures (666 bytes with fragmentation) but not ML-DSA. Being phased out in favor of Automotive Ethernet.',
  },
  {
    id: 'automotive-ethernet',
    name: 'Automotive Ethernet (IEEE 802.3 100BASE-T1/1000BASE-T1)',
    maxBandwidthMbps: 1000,
    maxPayloadBytes: 1500,
    authenticationSupport: 'MACsec (IEEE 802.1AE), TLS/DTLS, IPsec',
    pqcFeasibility: 'good',
    notes:
      'Standard Ethernet MTU (1500 bytes) and MACsec support make PQC feasible. ML-KEM-768 encapsulation (1088 bytes) fits in one frame.',
  },
]

// ---------------------------------------------------------------------------
// Vehicle Type Configurations
// ---------------------------------------------------------------------------

export interface VehicleTypeConfig {
  id: VehicleType
  name: string
  totalECUs: number
  autonomyLevel: string
  typicalLifeYears: number
  otaCapable: boolean
  v2xRequired: boolean
  primaryUseCase: string
}

export const VEHICLE_TYPES: VehicleTypeConfig[] = [
  {
    id: 'sedan',
    name: 'Passenger Sedan',
    totalECUs: 24,
    autonomyLevel: 'L2 (ADAS)',
    typicalLifeYears: 15,
    otaCapable: true,
    v2xRequired: false,
    primaryUseCase: 'Personal transportation',
  },
  {
    id: 'suv',
    name: 'SUV / Crossover',
    totalECUs: 30,
    autonomyLevel: 'L3 (Conditional — Highway)',
    typicalLifeYears: 18,
    otaCapable: true,
    v2xRequired: false,
    primaryUseCase: 'Family & utility',
  },
  {
    id: 'commercial-truck',
    name: 'Commercial Truck',
    totalECUs: 26,
    autonomyLevel: 'L4 (Highway — Emerging)',
    typicalLifeYears: 20,
    otaCapable: true,
    v2xRequired: true,
    primaryUseCase: 'Freight logistics',
  },
  {
    id: 'autonomous-shuttle',
    name: 'Autonomous Shuttle',
    totalECUs: 28,
    autonomyLevel: 'L4 (Geofenced Urban)',
    typicalLifeYears: 12,
    otaCapable: true,
    v2xRequired: true,
    primaryUseCase: 'Urban mobility',
  },
]

// ---------------------------------------------------------------------------
// SAE J3016 Autonomy Level Reference (2021 revision)
// ---------------------------------------------------------------------------

export interface SAELevel {
  level: string
  name: string
  description: string
  driverRole: string
}

export const SAE_LEVELS: SAELevel[] = [
  {
    level: 'L0',
    name: 'No Driving Automation',
    description: 'Driver performs all driving tasks.',
    driverRole: 'Full control at all times',
  },
  {
    level: 'L1',
    name: 'Driver Assistance',
    description:
      'System controls steering OR speed, not both. Examples: adaptive cruise control, lane centering.',
    driverRole: 'Must monitor and control the other axis',
  },
  {
    level: 'L2',
    name: 'Partial Driving Automation',
    description:
      'System controls both steering and speed simultaneously. Driver must supervise at all times. Examples: Tesla Autopilot, GM Super Cruise.',
    driverRole: 'Must supervise and intervene immediately',
  },
  {
    level: 'L3',
    name: 'Conditional Driving Automation',
    description:
      'System handles all driving in specific conditions (e.g., highway < 60 km/h). Driver must respond to takeover requests within ~10 seconds. Example: Mercedes DRIVE PILOT.',
    driverRole: 'Fallback-ready; responds to takeover requests',
  },
  {
    level: 'L4',
    name: 'High Driving Automation',
    description:
      'System handles all driving within a defined operational design domain (ODD) — e.g., geofenced urban area, highway corridor. No human fallback required within the ODD. Examples: Waymo robotaxi, truck platooning lead vehicle.',
    driverRole: 'Not required within the ODD',
  },
  {
    level: 'L5',
    name: 'Full Driving Automation',
    description:
      'System handles all driving in all conditions, everywhere. No operational design domain restrictions. No production vehicles exist at this level as of 2026.',
    driverRole: 'Not required — no steering wheel necessary',
  },
]
