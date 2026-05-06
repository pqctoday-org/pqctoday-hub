// SPDX-License-Identifier: GPL-3.0-only

export interface TelemetryImpact {
  requiredSegments: number
  requiresExtraRTT: boolean
  rttPenalty: number
  packets: { id: number; flight: number }[]
  totalFlights: number
}

/**
 * Calculates the impact of a given payload on TCP Initial Congestion Window.
 * @param payloadBytes The total size of the TLS handshake payload
 * @param mtuBytes The Maximum Transmission Unit (typically ~1440 for TCP payload)
 * @param initCwnd The TCP Initial Congestion Window (typically 10)
 */
export function calculateTelemetryImpact(
  payloadBytes: number,
  mtuBytes: number = 1440,
  initCwnd: number = 10
): TelemetryImpact {
  if (payloadBytes < 0 || mtuBytes <= 0 || initCwnd <= 0) {
    throw new Error('Invalid network parameters')
  }

  const requiredSegments = Math.ceil(payloadBytes / mtuBytes)

  // Each full initCwnd requires a round trip to ACK before the window expands
  // For a simplistic model, if segments > initCwnd, we incur RTT penalties
  const requiresExtraRTT = requiredSegments > initCwnd
  const totalFlights = Math.ceil(requiredSegments / initCwnd)
  const rttPenalty = Math.max(0, totalFlights - 1)

  const packets = Array.from({ length: requiredSegments }, (_, i) => ({
    id: i,
    flight: Math.floor(i / initCwnd) + 1,
  }))

  return {
    requiredSegments,
    requiresExtraRTT,
    rttPenalty,
    packets,
    totalFlights,
  }
}
