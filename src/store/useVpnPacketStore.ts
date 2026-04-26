// SPDX-License-Identifier: GPL-3.0-only
import { create } from 'zustand'
import { parseIsakmpHeader, ISAKMP_HEADER_BYTES, type IsakmpHeader } from '@/utils/isakmp'

export interface VpnPacket {
  /** Auto-incremented sequence number, monotonic per session. */
  seq: number
  /** Wallclock millis at emission time. */
  timestamp: number
  /** Source IP in dotted-decimal. */
  srcIp: string
  /** Destination IP in dotted-decimal. */
  destIp: string
  destPort: number
  srcPort: number
  /** Raw packet bytes — full UDP payload (so the ISAKMP header is at offset 0). */
  bytes: Uint8Array
  /** Parsed ISAKMP header, or null if the packet is too short / malformed. */
  header: IsakmpHeader | null
  /** Parse error message if header decode failed. */
  parseError: string | null
}

interface VpnPacketState {
  packets: VpnPacket[]
  /** Selected packet index for the inspector drawer. -1 = none selected. */
  selectedIndex: number
  /** Last 200 packets are kept; older ones are dropped. */
  maxPackets: number

  addPacket: (raw: Omit<VpnPacket, 'seq' | 'timestamp' | 'header' | 'parseError'>) => void
  selectPacket: (index: number) => void
  clear: () => void
}

const ipToString = (n: number): string =>
  `${(n >>> 24) & 0xff}.${(n >>> 16) & 0xff}.${(n >>> 8) & 0xff}.${n & 0xff}`

let _seqCounter = 0

export const useVpnPacketStore = create<VpnPacketState>()((set) => ({
  packets: [],
  selectedIndex: -1,
  maxPackets: 200,

  addPacket: (raw) =>
    set((state) => {
      _seqCounter += 1
      let header: IsakmpHeader | null = null
      let parseError: string | null = null
      if (raw.bytes.length >= ISAKMP_HEADER_BYTES) {
        try {
          header = parseIsakmpHeader(raw.bytes)
        } catch (err: unknown) {
          parseError = err instanceof Error ? err.message : String(err)
        }
      } else {
        parseError = `Packet shorter than 28-byte ISAKMP header (${raw.bytes.length} bytes)`
      }
      const next: VpnPacket = {
        ...raw,
        seq: _seqCounter,
        timestamp: Date.now(),
        header,
        parseError,
      }
      const all = [...state.packets, next]
      const trimmed = all.length > state.maxPackets ? all.slice(-state.maxPackets) : all
      return { packets: trimmed }
    }),

  selectPacket: (index) => set({ selectedIndex: index }),

  clear: () => {
    _seqCounter = 0
    set({ packets: [], selectedIndex: -1 })
  },
}))

/** Helper used by the bridge to convert raw u32 IPs into dotted-decimal. */
export const formatIp = ipToString
