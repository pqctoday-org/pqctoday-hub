// SPDX-License-Identifier: GPL-3.0-only
import type { ExportControlEntry, ExportDestination } from './aerospaceConstants'

export const EXPORT_PRODUCTS: ExportControlEntry[] = [
  {
    id: 'commercial-lru',
    productType: 'Commercial Avionics LRU',
    description:
      'Line-Replaceable Unit with PQC-enhanced firmware for civil aircraft (e.g., SATCOM modem, FMS). Dual-use technology with commercial crypto.',
    regime: 'ear',
    classification: 'ECCN 5A002.a.1',
    licenseRequired: true,
    licenseException: 'ENC (License Exception Encryption)',
    cfrCitation: '15 CFR 740.17',
  },
  {
    id: 'military-crypto-unit',
    productType: 'Military Crypto Unit',
    description:
      'Embedded COMSEC module with PQC algorithms for classified communications. Type 1 encryption for national security systems.',
    regime: 'itar',
    classification: 'USML Category XI(b)',
    licenseRequired: true,
    licenseException: null,
    cfrCitation: '22 CFR 121.1, Category XI',
  },
  {
    id: 'satellite-payload',
    productType: 'Satellite Communication Payload',
    description:
      'Spacecraft communication subsystem with PQC key management for command, telemetry, and data downlink encryption.',
    regime: 'itar',
    classification: 'USML Category XV(a)',
    licenseRequired: true,
    licenseException: null,
    cfrCitation: '22 CFR 121.1, Category XV',
  },
  {
    id: 'ground-station-modem',
    productType: 'Ground Station Modem',
    description:
      'Earth station satellite modem with PQC-enabled link encryption. Used for commercial and government SATCOM ground segments.',
    regime: 'ear',
    classification: 'ECCN 5A002.a.1',
    licenseRequired: true,
    licenseException: 'ENC (License Exception Encryption)',
    cfrCitation: '15 CFR 740.17',
  },
  {
    id: 'uav-flight-controller',
    productType: 'UAV Flight Controller',
    description:
      'Autonomous flight control system with PQC-authenticated command links. Includes GPS anti-spoofing with PQC signatures.',
    regime: 'itar',
    classification: 'USML Category VIII(a)',
    licenseRequired: true,
    licenseException: null,
    cfrCitation: '22 CFR 121.1, Category VIII',
  },
  {
    id: 'pqc-crypto-library',
    productType: 'PQC Crypto Software Library',
    description:
      'Software-only PQC library (ML-KEM, ML-DSA) compiled for avionics RTOS targets. No hardware component.',
    regime: 'ear',
    classification: 'ECCN 5D002.a.1',
    licenseRequired: true,
    licenseException: 'TSR (publicly available) or ENC',
    cfrCitation: '15 CFR 740.17 / 742.15(b)',
  },
]

export const EXPORT_DESTINATIONS: ExportDestination[] = [
  {
    id: 'australia',
    country: 'Australia',
    alliance: 'AUKUS / Five Eyes',
    sovereignMandates: ['ASD Essential Eight crypto requirements'],
    licenseEase: 'streamlined',
    notes:
      'AUKUS Technology Sharing Agreement (2023) enables streamlined licensing for PQC crypto shared between AUS/UK/US. ITAR Technology Assistance Agreement (TAA) covers most transfers.',
  },
  {
    id: 'uk',
    country: 'United Kingdom',
    alliance: 'AUKUS / Five Eyes / NATO',
    sovereignMandates: ['NCSC PQC guidance', 'UK Defence Standard 05-138'],
    licenseEase: 'streamlined',
    notes:
      'AUKUS trilateral framework. UK defence procures US crypto under existing bilateral MOUs. NCSC provides independent PQC algorithm evaluation.',
  },
  {
    id: 'germany',
    country: 'Germany',
    alliance: 'NATO',
    sovereignMandates: ['BSI TR-02102 (crypto requirements)', 'Bundeswehr national evaluation'],
    licenseEase: 'standard',
    notes:
      'NATO ally but not Five Eyes. BSI mandates independent evaluation of imported crypto for government/military use. Bundeswehr systems require BSI approval.',
  },
  {
    id: 'france',
    country: 'France',
    alliance: 'NATO',
    sovereignMandates: ['ANSSI crypto certification', 'DGA national crypto preference'],
    licenseEase: 'standard',
    notes:
      'Strong preference for French-origin crypto (DGA/ANSSI). Thales and Airbus Defence are preferred suppliers. Foreign PQC libraries require ANSSI CSPN certification.',
  },
  {
    id: 'japan',
    country: 'Japan',
    alliance: 'US bilateral / Quad',
    sovereignMandates: ['CRYPTREC recommendations'],
    licenseEase: 'standard',
    notes:
      'Close US defence ally. Japan follows CRYPTREC for algorithm selection (historically aligns with NIST). Mitsubishi Heavy Industries and Kawasaki integrate US avionics under license.',
  },
  {
    id: 'india',
    country: 'India',
    alliance: 'Non-aligned / Quad',
    sovereignMandates: ['DRDO national crypto program', 'Indian CC evaluation'],
    licenseEase: 'restricted',
    notes:
      'Non-aligned but Quad member. ITAR licenses evaluated case-by-case. DRDO develops domestic crypto for military platforms (Tejas, HAL). EAR items feasible with ENC license exception.',
  },
  {
    id: 'uae',
    country: 'United Arab Emirates',
    alliance: 'US partner (limited)',
    sovereignMandates: ['NESA (National Electronic Security Authority) approval'],
    licenseEase: 'restricted',
    notes:
      'Significant F-35 exclusion. Other US defence exports proceed under standard ITAR licensing. NESA evaluates all imported crypto independently.',
  },
  {
    id: 'embargo-generic',
    country: 'Embargoed Nations',
    alliance: 'None',
    sovereignMandates: ['N/A — export prohibited'],
    licenseEase: 'denied',
    notes:
      'Countries under comprehensive US sanctions (OFAC SDN). All crypto exports prohibited regardless of algorithm or application. Includes ITAR and EAR items.',
  },
]

/**
 * Get the applicable export control result for a product-destination combination.
 */
export function classifyExport(
  product: ExportControlEntry,
  destination: ExportDestination
): {
  regime: string
  classification: string
  licenseRequired: boolean
  licenseException: string | null
  sovereignMandates: string[]
  verdict: string
  verdictColor: string
} {
  if (destination.licenseEase === 'denied') {
    return {
      regime: product.regime.toUpperCase(),
      classification: product.classification,
      licenseRequired: true,
      licenseException: null,
      sovereignMandates: destination.sovereignMandates,
      verdict: 'Export Denied — comprehensive sanctions',
      verdictColor: 'text-destructive',
    }
  }

  if (product.regime === 'itar') {
    const exception =
      destination.licenseEase === 'streamlined'
        ? 'AUKUS/bilateral agreement — streamlined TAA'
        : null
    return {
      regime: 'ITAR',
      classification: product.classification,
      licenseRequired: destination.licenseEase !== 'streamlined',
      licenseException: exception,
      sovereignMandates: destination.sovereignMandates,
      verdict:
        destination.licenseEase === 'streamlined'
          ? 'Streamlined under bilateral agreement'
          : destination.licenseEase === 'restricted'
            ? 'License required — case-by-case review'
            : 'DSP-5 license required',
      verdictColor:
        destination.licenseEase === 'streamlined'
          ? 'text-status-success'
          : destination.licenseEase === 'restricted'
            ? 'text-status-error'
            : 'text-status-warning',
    }
  }

  // EAR
  return {
    regime: 'EAR',
    classification: product.classification,
    licenseRequired: destination.licenseEase === 'restricted',
    licenseException: product.licenseException,
    sovereignMandates: destination.sovereignMandates,
    verdict:
      destination.licenseEase === 'restricted'
        ? 'License Exception ENC — may require classification ruling'
        : 'License Exception ENC — generally available',
    verdictColor:
      destination.licenseEase === 'restricted' ? 'text-status-warning' : 'text-status-success',
  }
}
