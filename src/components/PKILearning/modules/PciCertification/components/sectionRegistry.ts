// SPDX-License-Identifier: GPL-3.0-only
// OWNER: Scaffold
/**
 * Learn-section registry for LM-071: manifest section id → owner component.
 * The shared CertIntroduction (LM-065) renders from this; the parity test pins
 * that it covers exactly the manifest's sections.
 */
import type { SectionEntry } from '@/components/PKILearning/modules/CryptoProductCertification/components/sectionRegistry'
import {
  PciPtsApproval,
  PciV5Changes,
  PciPqcTruth,
  PciOperatingStack,
  PciPinSecurity,
  PciP2peKif,
  PciKmo,
} from './sections/PciSections'

export const SECTION_COMPONENTS: ReadonlyMap<string, SectionEntry> = new Map<string, SectionEntry>([
  ['pci-pts-approval', { Component: PciPtsApproval, group: 'pci' }],
  ['pci-v5-changes', { Component: PciV5Changes, group: 'pci' }],
  ['pci-pqc-truth', { Component: PciPqcTruth, group: 'pci' }],
  ['pci-operating-stack', { Component: PciOperatingStack, group: 'pci' }],
  ['pci-pin-security', { Component: PciPinSecurity, group: 'pci' }],
  ['pci-p2pe-kif', { Component: PciP2peKif, group: 'pci' }],
  ['pci-kmo', { Component: PciKmo, group: 'pci' }],
])
