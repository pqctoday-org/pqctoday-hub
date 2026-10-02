// SPDX-License-Identifier: GPL-3.0-only

export interface SecureBootResult {
  loadTimeMs: number
  verifyTimeMs: number
  totalBootDelayMs: number
  payloadSizeBytes: number
  exceedsRealTimeConstraint: boolean
}

/**
 * Calculates the latency impact of a cryptographic algorithm during the Secure Boot phase.
 * @param sigBytes The size of the signature in bytes
 * @param pubBytes The size of the public key in bytes
 * @param verifyCycles The number of CPU cycles required to verify the signature
 * @param spiSpeedMBps The read speed of the SPI Flash in Megabytes per second
 * @param mcuClockMHz The clock speed of the Microcontroller in Megahertz
 * @param rtosConstraintMs The strict real-time constraint for boot (default 100ms)
 */
export function calculateSecureBootLatency(
  sigBytes: number,
  pubBytes: number,
  verifyCycles: number,
  spiSpeedMBps: number,
  mcuClockMHz: number,
  rtosConstraintMs: number = 100
): SecureBootResult {
  if (spiSpeedMBps <= 0 || mcuClockMHz <= 0 || sigBytes < 0 || pubBytes < 0 || verifyCycles < 0) {
    throw new Error('Invalid hardware parameters')
  }

  const payloadSizeBytes = sigBytes + pubBytes

  // (bytes / (MB/s * 10^6)) * 1000 = ms
  const loadTimeMs = (payloadSizeBytes / (spiSpeedMBps * 1_000_000)) * 1000

  // (cycles / (MHz * 10^6)) * 1000 = ms
  const verifyTimeMs = (verifyCycles / (mcuClockMHz * 1_000_000)) * 1000

  const totalBootDelayMs = loadTimeMs + verifyTimeMs

  return {
    loadTimeMs,
    verifyTimeMs,
    totalBootDelayMs,
    payloadSizeBytes,
    exceedsRealTimeConstraint: totalBootDelayMs > rtosConstraintMs,
  }
}

export interface V2XStormResult {
  bandwidthUsedMbps: number
  triggersBroadcastStorm: boolean
}

/**
 * Calculates the RF bandwidth utilized by vehicles broadcasting Basic Safety Messages (BSMs).
 * @param vehicleCount Number of vehicles in range (e.g., at an intersection)
 * @param broadcastHz The frequency of broadcasts per vehicle (default 10Hz)
 * @param sigBytes The size of the cryptographic signature attached to the BSM
 * @param channelLimitMbps The DSRC/C-V2X channel capacity limit (default 6 Mbps)
 */
export function calculateV2XBandwidth(
  vehicleCount: number,
  sigBytes: number,
  broadcastHz: number = 10,
  channelLimitMbps: number = 6
): V2XStormResult {
  if (vehicleCount < 0 || broadcastHz < 0 || sigBytes < 0 || channelLimitMbps <= 0) {
    throw new Error('Invalid V2X parameters')
  }

  // Calculate Mbps: (vehicles * hz * bytes * 8 bits) / 1,000,000
  const bandwidthUsedMbps = (vehicleCount * broadcastHz * sigBytes * 8) / 1_000_000

  return {
    bandwidthUsedMbps,
    triggersBroadcastStorm: bandwidthUsedMbps > channelLimitMbps,
  }
}
