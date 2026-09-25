// SPDX-License-Identifier: GPL-3.0-only
// OWNER: PCI author
/**
 * STUB (scaffold). One named export per Learn-section id, PascalCase from the
 * id (build spec §4). CertIntroduction wraps each in <LearnSection> (title,
 * anchor, path scope, optional badge) — render only the section BODY here.
 */
import { DraftPending } from '../DraftPending'

/** Learn section `pci-pts-approval` */
export const PciPtsApproval = () => <DraftPending owner="PCI" />

/** Learn section `pci-v5-changes` */
export const PciV5Changes = () => <DraftPending owner="PCI" />

/** Learn section `pci-pqc-truth` */
export const PciPqcTruth = () => <DraftPending owner="PCI" />

/** Learn section `pci-operating-stack` */
export const PciOperatingStack = () => <DraftPending owner="PCI" />

/** Learn section `pci-pin-security` */
export const PciPinSecurity = () => <DraftPending owner="PCI" />

/** Learn section `pci-p2pe-kif` */
export const PciP2peKif = () => <DraftPending owner="PCI" />

/** Learn section `pci-kmo` */
export const PciKmo = () => <DraftPending owner="PCI" />
