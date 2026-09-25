// SPDX-License-Identifier: GPL-3.0-only
// OWNER: FIPS author
/**
 * STUB (scaffold). One named export per Learn-section id, PascalCase from the
 * id (build spec §4). CertIntroduction wraps each in <LearnSection> (title,
 * anchor, path scope, optional badge) — render only the section BODY here.
 */
import { DraftPending } from '../DraftPending'

/** Learn section `fips-what-it-is` */
export const FipsWhatItIs = () => <DraftPending owner="FIPS" />

/** Learn section `fips-requirement-areas` */
export const FipsRequirementAreas = () => <DraftPending owner="FIPS" />

/** Learn section `fips-levels` */
export const FipsLevels = () => <DraftPending owner="FIPS" />

/** Learn section `fips-lifecycle` */
export const FipsLifecycle = () => <DraftPending owner="FIPS" />

/** Learn section `fips-acvp-bridge` */
export const FipsAcvpBridge = () => <DraftPending owner="FIPS" />

/** Learn section `fips-landscape` */
export const FipsLandscape = () => <DraftPending owner="FIPS" />

/** Learn section `fips-route-table` */
export const FipsRouteTable = () => <DraftPending owner="FIPS" />
