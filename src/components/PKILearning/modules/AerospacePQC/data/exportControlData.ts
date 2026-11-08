// SPDX-License-Identifier: AGPL-3.0-only
import type { ExportControlEntry, ExportDestination } from './aerospaceConstants'

export const EXPORT_PRODUCTS: ExportControlEntry[] = [
  {
    id: 'commercial-lru',
    productType: 'Commercial Avionics LRU',
    description:
      'Hypothetical example: Line-Replaceable Unit with PQC-enhanced firmware for civil aircraft (e.g., SATCOM modem, FMS). Dual-use technology with commercial crypto. A real product needs its own classification.',
    regime: 'ear',
    classification: 'Hypothetical: ECCN 5A002.a candidate',
    licenseRequired: true,
    licenseException: 'ENC (15 CFR 740.17), only if its conditions are met',
    cfrCitation: '15 CFR 740.17; 15 CFR part 774, Category 5 Part 2',
  },
  {
    id: 'military-crypto-unit',
    productType: 'Military Crypto Unit',
    description:
      'Hypothetical example: embedded COMSEC module with PQC algorithms for classified communications on national security systems. A real product needs its own jurisdiction and classification determination.',
    regime: 'itar',
    classification: 'Hypothetical: USML Category XIII(b)(1) candidate',
    licenseRequired: true,
    licenseException: null,
    cfrCitation: '22 CFR 121.1, Category XIII(b)',
  },
  {
    id: 'satellite-payload',
    productType: 'Satellite Communication Payload',
    description:
      'Hypothetical example: spacecraft communication subsystem with PQC key management for command, telemetry, and data downlink encryption. The spacecraft and its telemetry-and-control encryption equipment can fall under different entries.',
    regime: 'itar',
    classification:
      'Hypothetical: depends on spacecraft features (USML XV) and TT&C encryption (USML XIII(b)(1))',
    licenseRequired: true,
    licenseException: null,
    cfrCitation: '22 CFR 121.1, Categories XV and XIII(b)',
  },
  {
    id: 'ground-station-modem',
    productType: 'Ground Station Modem',
    description:
      'Hypothetical example: earth station satellite modem with PQC-enabled link encryption. Used for commercial and government SATCOM ground segments. A real product needs its own classification.',
    regime: 'ear',
    classification: 'Hypothetical: ECCN 5A002.a candidate',
    licenseRequired: true,
    licenseException: 'ENC (15 CFR 740.17), only if its conditions are met',
    cfrCitation: '15 CFR 740.17; 15 CFR part 774, Category 5 Part 2',
  },
  {
    id: 'uav-flight-controller',
    productType: 'UAV Flight Controller',
    description:
      'Hypothetical example: autonomous flight control system with PQC-authenticated command links. Includes GPS anti-spoofing with PQC signatures. Whether it is controlled under the USML or the EAR depends on the aircraft and the design.',
    regime: 'itar',
    classification: 'Hypothetical: USML Category VIII or EAR, depending on the aircraft and design',
    licenseRequired: true,
    licenseException: null,
    cfrCitation: '22 CFR 121.1, Category VIII',
  },
  {
    id: 'pqc-crypto-library',
    productType: 'PQC Crypto Software Library',
    description:
      'Hypothetical example: software-only PQC library (ML-KEM, ML-DSA) compiled for avionics RTOS targets. No hardware component. Whether it is outside the EAR depends on whether the source code is publicly available.',
    regime: 'ear',
    classification: 'Hypothetical: ECCN 5D002.c.1 candidate',
    licenseRequired: true,
    licenseException:
      'ENC (15 CFR 740.17) for proprietary code; publicly available source code is not subject to the EAR (15 CFR 742.15(b))',
    cfrCitation: '15 CFR 740.17; 15 CFR 742.15(b); 15 CFR 734.7(b)',
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
      'AUKUS: 22 CFR 126.7 (Federal Register, 20 August 2024, amended 30 December 2025) lets some ITAR defense articles and services move without a license between eligible parties in Australia, the UK and the US, but only if every condition is met: eligible transferor and recipient, activity within those three countries, an item not on the Supplement No. 2 excluded technology list, and the value and manufacturing-abroad limits. It is not a country-level waiver, and other ITAR and EAR requirements still apply.',
  },
  {
    id: 'uk',
    country: 'United Kingdom',
    alliance: 'AUKUS / Five Eyes / NATO',
    sovereignMandates: ['NCSC PQC guidance', 'UK Defence Standard 05-138'],
    licenseEase: 'streamlined',
    notes:
      'AUKUS: the same 22 CFR 126.7 conditions as for Australia apply. The UK party must be a UK national-level government agency or an Authorized User identified through the DDTC website, and the item must not be on the Supplement No. 2 excluded technology list.',
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
      'Non-aligned but Quad member. ITAR licenses evaluated case-by-case. DRDO develops domestic crypto for military platforms (Tejas, HAL). Whether an EAR item can use a license exception depends on the item, the end user and the destination, not on the country alone.',
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
 * Items the sample products touch that the AUKUS exemption (22 CFR 126.7) excludes through the
 * excluded technology list (22 CFR part 126, Supplement No. 2).
 */
const AUKUS_EXCLUSION_NOTES: Record<string, string> = {
  'military-crypto-unit':
    'Excluded from the AUKUS exemption if the unit is a classified article described in USML Category XIII(b) (22 CFR part 126, Supplement No. 2); in that case a license or agreement is required.',
  'uav-flight-controller':
    'Articles annotated "MT" (Missile Technology Control Regime) are on the AUKUS excluded technology list (22 CFR part 126, Supplement No. 2); check the MT designation before relying on the exemption.',
}

/** Product-specific EAR notes that change the screening result. */
const EAR_PRODUCT_NOTES: Record<string, string> = {
  'pqc-crypto-library':
    'If the source code is publicly available it is not subject to the EAR (15 CFR 742.15(b); notification only for non-standard cryptography), and compiled copies qualify only when their source meets those criteria (15 CFR 734.7(b)). Proprietary code goes through classification and License Exception ENC or a license.',
}

/**
 * Screen a hypothetical product-destination combination. The result is a starting point for a
 * conditional analysis, never a legal determination: an exemption or license exception applies
 * only when every one of its conditions is met for the real item, parties and transaction.
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
    const exclusion = AUKUS_EXCLUSION_NOTES[product.id]
    if (destination.licenseEase === 'streamlined') {
      return {
        regime: 'ITAR',
        classification: product.classification,
        // A license is the default. 22 CFR 126.7 removes it only when every condition is met.
        licenseRequired: true,
        licenseException:
          product.id === 'military-crypto-unit'
            ? null
            : 'AUKUS exemption (22 CFR 126.7), only if every condition is met',
        sovereignMandates: destination.sovereignMandates,
        verdict: exclusion
          ? exclusion
          : 'Potentially eligible for the AUKUS exemption (22 CFR 126.7), subject to every condition: eligible parties, activity within Australia, the UK or the US, an item not on the Supplement No. 2 excluded technology list, and the value limits. If any condition fails, a license or agreement is required.',
        verdictColor: 'text-status-warning',
      }
    }
    return {
      regime: 'ITAR',
      classification: product.classification,
      licenseRequired: true,
      licenseException: null,
      sovereignMandates: destination.sovereignMandates,
      verdict:
        destination.licenseEase === 'restricted'
          ? 'License required — case-by-case review'
          : 'A license is normally required (for example a DSP-5 for the permanent export of unclassified articles); check whether an exemption applies',
      verdictColor:
        destination.licenseEase === 'restricted' ? 'text-status-error' : 'text-status-warning',
    }
  }

  // EAR: encryption items need a license to every destination except Canada (15 CFR 742.15(a)),
  // so the question is whether a license exception such as ENC applies to this item and end user.
  const productNote = EAR_PRODUCT_NOTES[product.id]
  const base =
    destination.licenseEase === 'restricted'
      ? 'License Exception ENC may apply but can be narrower for government end users and for countries not listed in Supplement No. 3 to part 740, and a classification request may be needed (15 CFR 740.17); otherwise a license is required.'
      : 'License Exception ENC may be available if its conditions are met: the type of item, the end user (private sector or government), the destination, and any classification request or reporting step (15 CFR 740.17). Otherwise a license is required.'
  return {
    regime: 'EAR',
    classification: product.classification,
    licenseRequired: true,
    licenseException: product.licenseException,
    sovereignMandates: destination.sovereignMandates,
    verdict: productNote ? `${base} ${productNote}` : base,
    verdictColor: 'text-status-warning',
  }
}
