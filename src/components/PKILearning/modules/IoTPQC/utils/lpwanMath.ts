// SPDX-License-Identifier: GPL-3.0-only
/**
 * LPWAN airtime models for step 6 (generalised 2026-10-01 from the Energy &
 * Utilities RF-mesh simulator). All outputs are MODEL estimates and are
 * labelled so in the UI.
 *
 * The lesson the old simulator got wrong: it blamed PQC for a mesh "collapse"
 * that the classical firmware image causes on its own. The signature is a few
 * percent of a firmware update's bytes; what decides whether a cell can be
 * updated is the image size, unicast vs multicast delivery, and the link rate.
 */

export type LpwanTech = 'wisun-fsk' | 'wisun-ofdm' | 'nbiot' | 'lorawan'

export interface LpwanTechSpec {
  id: LpwanTech
  name: string
  /** PHY rate used by the model (kbit/s) */
  phyKbps: number
  rateSource: string
  /** fraction of PHY rate left after MAC/PHY overhead, retries and scheduling. Model. */
  efficiency: number
  /** max application bytes per frame (LoRaWAN) — undefined for IP links that fragment */
  maxFramePayload?: number
  /** multi-hop mesh: every hop re-sends on the shared channel */
  mesh?: boolean
  notes: string
}

export const LPWAN_TECHS: LpwanTechSpec[] = [
  {
    id: 'wisun-fsk',
    name: 'Wi-SUN FAN 1.1 (FSK, 150 kbit/s)',
    phyKbps: 150,
    rateSource: 'Wi-SUN FAN 1.1 FSK PHY modes span 50–300 kbit/s',
    efficiency: 0.4,
    mesh: true,
    notes: 'Multi-hop IPv6 mesh; every extra hop re-sends the same bytes on the shared channel.',
  },
  {
    id: 'wisun-ofdm',
    name: 'Wi-SUN FAN 1.1 (OFDM, 800 kbit/s)',
    phyKbps: 800,
    rateSource: 'Wi-SUN FAN 1.1 adds OFDM PHY modes up to 2.4 Mbit/s; 800 kbit/s chosen',
    efficiency: 0.4,
    mesh: true,
    notes: 'FAN 1.1 OFDM raises the ceiling well above the 300 kbit/s of FSK.',
  },
  {
    id: 'nbiot',
    name: 'NB-IoT (Cat-NB1 downlink)',
    phyKbps: 26,
    rateSource: '3GPP TS 36.306 Cat-NB1 peak downlink ≈ 26 kbit/s',
    efficiency: 0.6,
    notes: 'Licensed cellular; firmware travels downlink, which is the slow direction for Cat-NB1.',
  },
  {
    id: 'lorawan',
    name: 'LoRaWAN EU868 (DR5: SF7 / 125 kHz)',
    phyKbps: 5.47,
    rateSource: 'LoRa SF7/125 kHz ≈ 5.47 kbit/s; DR5 max application payload 222 B (EU868)',
    efficiency: 1,
    maxFramePayload: 222,
    notes:
      'Frame-based, 1% duty cycle in most EU868 sub-bands. Firmware uses multicast + fragmentation (FUOTA).',
  },
]

export interface FirmwareAirtimeInput {
  techId: LpwanTech
  firmwareBytes: number
  signatureBytes: number
  /** public key / certificate shipped with the update (0 if pre-provisioned) */
  keyBytes: number
  devicesPerCell: number
  multicast: boolean
  hops: number
  windowHours: number
}

export interface FirmwareAirtimeResult {
  payloadBytes: number
  signatureShare: number
  /** seconds of channel time to deliver one copy */
  secondsPerCopy: number
  copies: number
  cellHours: number
  fitsWindow: boolean
  /** LoRaWAN only: frames per copy and the duty-cycle-limited wall time */
  frames?: number
  dutyCycleHours?: number
}

/** LoRa time on air for one frame (Semtech AN1200.13 formula), SF7/125 kHz, CR 4/5, explicit header. */
export function loraTimeOnAirSeconds(phyPayloadBytes: number, sf = 7, bwHz = 125_000): number {
  const tSym = 2 ** sf / bwHz
  const de = sf >= 11 ? 1 : 0
  const cr = 1 // 4/5
  const h = 0 // explicit header
  const crc = 1
  const nPayload =
    8 +
    Math.max(
      Math.ceil((8 * phyPayloadBytes - 4 * sf + 28 + 16 * crc - 20 * h) / (4 * (sf - 2 * de))) *
        (cr + 4),
      0
    )
  return (8 + 4.25) * tSym + nPayload * tSym
}

/** LoRaWAN MAC header + FHDR + FPort + MIC around the application payload. */
export const LORAWAN_MAC_OVERHEAD = 13
export const EU868_DUTY_CYCLE = 0.01

export function firmwareAirtime(input: FirmwareAirtimeInput): FirmwareAirtimeResult {
  if (
    input.firmwareBytes < 0 ||
    input.signatureBytes < 0 ||
    input.keyBytes < 0 ||
    input.devicesPerCell < 1 ||
    input.hops < 1 ||
    input.windowHours <= 0
  ) {
    throw new Error('Invalid LPWAN airtime parameters')
  }
  const tech = LPWAN_TECHS.find((t) => t.id === input.techId) ?? LPWAN_TECHS[0]
  const payloadBytes = input.firmwareBytes + input.signatureBytes + input.keyBytes
  const signatureShare = payloadBytes > 0 ? input.signatureBytes / payloadBytes : 0
  const copies = input.multicast ? 1 : input.devicesPerCell

  if (tech.maxFramePayload) {
    const frames = Math.ceil(payloadBytes / tech.maxFramePayload)
    const lastPayload = payloadBytes - (frames - 1) * tech.maxFramePayload
    const toaFull = loraTimeOnAirSeconds(tech.maxFramePayload + LORAWAN_MAC_OVERHEAD)
    const toaLast = loraTimeOnAirSeconds(lastPayload + LORAWAN_MAC_OVERHEAD)
    const secondsPerCopy = (frames - 1) * toaFull + toaLast
    const cellHours = (secondsPerCopy * copies) / 3600
    const dutyCycleHours = cellHours / EU868_DUTY_CYCLE
    return {
      payloadBytes,
      signatureShare,
      secondsPerCopy,
      copies,
      cellHours,
      fitsWindow: dutyCycleHours <= input.windowHours,
      frames,
      dutyCycleHours,
    }
  }

  const effectiveBps = (tech.phyKbps * 1000 * tech.efficiency) / (tech.mesh ? input.hops : 1)
  const secondsPerCopy = (payloadBytes * 8) / effectiveBps
  const cellHours = (secondsPerCopy * copies) / 3600
  return {
    payloadBytes,
    signatureShare,
    secondsPerCopy,
    copies,
    cellHours,
    fitsWindow: cellHours <= input.windowHours,
  }
}
