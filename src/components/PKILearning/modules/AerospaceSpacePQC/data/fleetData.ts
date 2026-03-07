// SPDX-License-Identifier: GPL-3.0-only
import type { AircraftType } from './aerospaceConstants'

export const AIRCRAFT_TYPES: AircraftType[] = [
  {
    id: 'b737-800',
    name: 'Boeing 737-800',
    manufacturer: 'Boeing',
    generation: 'legacy',
    firstDeliveryYear: 1998,
    expectedRetirementYear: 2038,
    avionicsBus: 'ARINC 429',
    commCapabilities: ['acars'],
    pqcUpgradeFeasibility: 'gateway-only',
    fleetSizeEstimate: 4500,
    notes:
      'Most-produced 737 variant. ARINC 429 bus limits upgrade options. ACARS-only communication means no native PQC path. Requires ground gateway for PQC protection.',
  },
  {
    id: 'b737-max',
    name: 'Boeing 737 MAX',
    manufacturer: 'Boeing',
    generation: 'current',
    firstDeliveryYear: 2017,
    expectedRetirementYear: 2055,
    avionicsBus: 'ARINC 429 / ARINC 664 (partial)',
    commCapabilities: ['acars', 'cpdlc'],
    pqcUpgradeFeasibility: 'retrofit',
    fleetSizeEstimate: 1200,
    notes:
      'Mixed bus architecture. AFDX used for some subsystems. CPDLC capability via SATCOM. Retrofit PQC possible for AFDX-connected systems.',
  },
  {
    id: 'a320neo',
    name: 'Airbus A320neo',
    manufacturer: 'Airbus',
    generation: 'current',
    firstDeliveryYear: 2016,
    expectedRetirementYear: 2054,
    avionicsBus: 'ARINC 429 / ARINC 664 (partial)',
    commCapabilities: ['acars', 'cpdlc'],
    pqcUpgradeFeasibility: 'retrofit',
    fleetSizeEstimate: 3500,
    notes:
      'Best-selling narrowbody. AFDX used for newer avionics suites. ACARS and CPDLC via dual-path VHF and SATCOM.',
  },
  {
    id: 'a350',
    name: 'Airbus A350 XWB',
    manufacturer: 'Airbus',
    generation: 'next-gen',
    firstDeliveryYear: 2014,
    expectedRetirementYear: 2054,
    avionicsBus: 'ARINC 664 (native)',
    commCapabilities: ['acars', 'cpdlc', 'arinc-664'],
    pqcUpgradeFeasibility: 'native',
    fleetSizeEstimate: 600,
    notes:
      'Full AFDX architecture. IMA (Integrated Modular Avionics) with ARINC 653 partitioning. Best candidate for native PQC integration.',
  },
  {
    id: 'b787',
    name: 'Boeing 787 Dreamliner',
    manufacturer: 'Boeing',
    generation: 'next-gen',
    firstDeliveryYear: 2011,
    expectedRetirementYear: 2051,
    avionicsBus: 'ARINC 664 (native)',
    commCapabilities: ['acars', 'cpdlc', 'arinc-664'],
    pqcUpgradeFeasibility: 'native',
    fleetSizeEstimate: 1100,
    notes:
      'Common Core System (CCS) architecture with AFDX backbone. Open IMA platform supports software-defined avionics. Strong PQC candidate.',
  },
  {
    id: 'e175',
    name: 'Embraer E-175',
    manufacturer: 'Embraer',
    generation: 'legacy',
    firstDeliveryYear: 2005,
    expectedRetirementYear: 2040,
    avionicsBus: 'ARINC 429',
    commCapabilities: ['acars'],
    pqcUpgradeFeasibility: 'gateway-only',
    fleetSizeEstimate: 700,
    notes:
      'Regional jet workhorse. ARINC 429 avionics with limited upgrade budget. ACARS-only comms. Gateway-mediated PQC is the only viable path.',
  },
  {
    id: 'f-35',
    name: 'F-35 Lightning II',
    manufacturer: 'Lockheed Martin',
    generation: 'next-gen',
    firstDeliveryYear: 2015,
    expectedRetirementYear: 2070,
    avionicsBus: 'Fibre Channel / MIL-STD-1553 (legacy interfaces)',
    commCapabilities: ['link-16', 'mil-std-1553'],
    pqcUpgradeFeasibility: 'retrofit',
    fleetSizeEstimate: 950,
    notes:
      'ALIS/ODIN mission systems use high-bandwidth Fibre Channel. Legacy 1553 interfaces for weapon stores and external pods. Type 1 crypto via embedded COMSEC. Service life extends to 2070+.',
  },
  {
    id: 'c-130j',
    name: 'C-130J Super Hercules',
    manufacturer: 'Lockheed Martin',
    generation: 'current',
    firstDeliveryYear: 1999,
    expectedRetirementYear: 2060,
    avionicsBus: 'MIL-STD-1553 / ARINC 429',
    commCapabilities: ['acars', 'mil-std-1553', 'link-16'],
    pqcUpgradeFeasibility: 'retrofit',
    fleetSizeEstimate: 500,
    notes:
      'Military transport with dual civil/military comms. MIL-STD-1553 for mission systems, ARINC 429 for flight instruments. Block upgrades add Link 16 and modern comms.',
  },
]

/**
 * Determine interoperability status between two aircraft for PQC data links.
 * Returns: 'pqc' if both can do PQC natively, 'gateway' if one needs a gateway, 'legacy' if neither can.
 */
export function getInteropStatus(a: AircraftType, b: AircraftType): 'pqc' | 'gateway' | 'legacy' {
  const aCapable = a.pqcUpgradeFeasibility === 'native'
  const bCapable = b.pqcUpgradeFeasibility === 'native'
  const aRetrofit = a.pqcUpgradeFeasibility === 'retrofit'
  const bRetrofit = b.pqcUpgradeFeasibility === 'retrofit'

  if (aCapable && bCapable) return 'pqc'
  if ((aCapable || aRetrofit) && (bCapable || bRetrofit)) return 'gateway'
  return 'legacy'
}

export const INTEROP_COLORS: Record<string, string> = {
  pqc: 'bg-status-success/20 text-status-success',
  gateway: 'bg-status-warning/20 text-status-warning',
  legacy: 'bg-status-error/20 text-status-error',
}

export const INTEROP_LABELS: Record<string, string> = {
  pqc: 'Native PQC',
  gateway: 'Gateway-Mediated',
  legacy: 'Legacy (Unprotected)',
}
