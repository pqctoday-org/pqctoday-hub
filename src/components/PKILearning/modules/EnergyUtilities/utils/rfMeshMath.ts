// SPDX-License-Identifier: GPL-3.0-only

export interface RfMeshImpact {
  timeOnAirSecondsPerMeter: number
  totalCellTimeHours: number
  meshCollapse: boolean
}

/**
 * Calculates the Time-on-Air (ToA) and network saturation for legacy RF mesh networks.
 *
 * @param payloadBytes The size of the payload being transmitted (e.g., firmware + signature)
 * @param meshBandwidthKbps The shared bandwidth of the RF mesh cell (e.g., 50 kbps)
 * @param meterCount The number of smart meters in the local mesh cell
 * @param dailyWindowHours The maximum allowed time for all meters to complete their transmission
 */
export function calculateRfMeshImpact(
  payloadBytes: number,
  meshBandwidthKbps: number,
  meterCount: number,
  dailyWindowHours: number = 24
): RfMeshImpact {
  if (payloadBytes < 0 || meshBandwidthKbps <= 0 || meterCount < 0 || dailyWindowHours <= 0) {
    throw new Error('Invalid RF Mesh parameters')
  }

  // Calculate transmission time for a single meter
  // payloadBytes * 8 = bits. kbps * 1000 = bps.
  const timeOnAirSecondsPerMeter = (payloadBytes * 8) / (meshBandwidthKbps * 1000)

  // Total time for all meters in the cell to transmit (assuming perfect TDMA without collisions)
  const totalCellTimeSeconds = timeOnAirSecondsPerMeter * meterCount
  const totalCellTimeHours = totalCellTimeSeconds / 3600

  // If the total time exceeds the allowed window (e.g., a daily 24h reporting cycle)
  const meshCollapse = totalCellTimeHours > dailyWindowHours

  return {
    timeOnAirSecondsPerMeter,
    totalCellTimeHours,
    meshCollapse,
  }
}
