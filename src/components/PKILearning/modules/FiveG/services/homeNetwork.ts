// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The fictional home network of the SUCI sample: the PLMN and home-network key ID its SIDF accepts.
 * This is the receiver's own configuration. It is never read from a subscriber identifier, so an
 * envelope for a different PLMN or key ID is refused even when everything else is valid.
 */
export const HOME_NETWORK = { mcc: '310', mnc: '260', keyId: 1 } as const
