// SPDX-License-Identifier: GPL-3.0-only
/**
 * V2X channel-load model (moved from the IoT/OT module's Hardware Constraints
 * simulator, 2026-10-01).
 *
 * Counts ONLY the signature bytes every vehicle in range broadcasts at the
 * BSM rate, and compares that against a raw channel data rate. It ignores the
 * BSM payload, IEEE 1609.2 headers, the certificate or certificate digest that
 * is periodically attached, and all MAC/PHY/CSMA overhead — so real channel
 * congestion starts well below the point this model flags. Outputs are a
 * model estimate, not a link-level simulation.
 */

/** BSM broadcast rate — SAE J2945/1 nominal 10 Hz */
export const BSM_RATE_HZ = 10

/** IEEE 802.11p default data rate (10 MHz channel, QPSK 1/2) — the DSRC / ITS-G5 reference */
export const REFERENCE_CHANNEL_MBPS = 6

export interface V2XSignatureOption {
  name: string
  sigBytes: number
  source: string
}

export const V2X_SIGNATURE_OPTIONS: V2XSignatureOption[] = [
  { name: 'ECDSA P-256', sigBytes: 64, source: 'IEEE 1609.2 / FIPS 186-5 (r‖s)' },
  {
    name: 'FN-DSA-512',
    sigBytes: 666,
    source: 'Falcon-512 specification (FN-DSA, FIPS 206 in development)',
  },
  { name: 'ML-DSA-44', sigBytes: 2420, source: 'FIPS 204' },
]

export interface V2XLoadResult {
  bandwidthUsedMbps: number
  /** fraction of the channel rate consumed by signatures alone */
  channelShare: number
  exceedsChannel: boolean
}

/**
 * Aggregate signature bandwidth for vehicles broadcasting BSMs.
 * @param vehicleCount vehicles in radio range
 * @param sigBytes signature bytes per message
 * @param broadcastHz messages per second per vehicle (default 10 Hz)
 * @param channelMbps raw channel data rate (default 6 Mbps, 802.11p default)
 */
export function calculateV2XBandwidth(
  vehicleCount: number,
  sigBytes: number,
  broadcastHz: number = BSM_RATE_HZ,
  channelMbps: number = REFERENCE_CHANNEL_MBPS
): V2XLoadResult {
  if (vehicleCount < 0 || broadcastHz < 0 || sigBytes < 0 || channelMbps <= 0) {
    throw new Error('Invalid V2X parameters')
  }
  // vehicles × Hz × bytes × 8 bits / 10^6
  const bandwidthUsedMbps = (vehicleCount * broadcastHz * sigBytes * 8) / 1_000_000
  return {
    bandwidthUsedMbps,
    channelShare: bandwidthUsedMbps / channelMbps,
    exceedsChannel: bandwidthUsedMbps > channelMbps,
  }
}

/** Vehicle count at which signature bytes alone fill the channel (model estimate). */
export function vehiclesToFillChannel(
  sigBytes: number,
  broadcastHz: number = BSM_RATE_HZ,
  channelMbps: number = REFERENCE_CHANNEL_MBPS
): number {
  if (sigBytes <= 0 || broadcastHz <= 0 || channelMbps <= 0) {
    throw new Error('Invalid V2X parameters')
  }
  return Math.floor((channelMbps * 1_000_000) / (broadcastHz * sigBytes * 8))
}
