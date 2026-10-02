// SPDX-License-Identifier: GPL-3.0-only
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
