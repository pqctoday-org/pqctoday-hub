// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { useVpnPacketStore } from './useVpnPacketStore'
import { EXCHANGE_TYPE, ISAKMP_HEADER_BYTES } from '@/utils/isakmp'

/**
 * Build a valid ISAKMP packet (RFC 7296 §3.1 fixed 28-byte header) with
 * big-endian Message ID / Length, plus optional trailing payload bytes.
 */
function buildIsakmpPacket(opts: {
  exchangeType?: number
  messageId?: number
  length?: number
  flags?: number
  extraBytes?: number
}): Uint8Array {
  const {
    exchangeType = EXCHANGE_TYPE.IKE_SA_INIT,
    messageId = 0,
    flags = 0x08, // initiator
    extraBytes = 0,
  } = opts
  const total = ISAKMP_HEADER_BYTES + extraBytes
  const length = opts.length ?? total
  const bytes = new Uint8Array(total)
  // Initiator SPI: 0x0102030405060708, Responder SPI: 0x1112131415161718
  for (let i = 0; i < 8; i++) bytes[i] = i + 1
  for (let i = 0; i < 8; i++) bytes[8 + i] = 0x11 + i
  bytes[16] = 33 // next payload (SA)
  bytes[17] = 0x20 // major 2, minor 0
  bytes[18] = exchangeType
  bytes[19] = flags
  const dv = new DataView(bytes.buffer)
  dv.setUint32(20, messageId, false) // big-endian
  dv.setUint32(24, length, false) // big-endian
  return bytes
}

const basePacket = (bytes: Uint8Array) => ({
  srcIp: '192.168.0.1',
  destIp: '192.168.0.2',
  srcPort: 500,
  destPort: 500,
  bytes,
})

describe('useVpnPacketStore', () => {
  beforeEach(() => {
    useVpnPacketStore.getState().clear()
  })

  it('addPacket parses a valid 28+ byte ISAKMP header', () => {
    const bytes = buildIsakmpPacket({
      exchangeType: EXCHANGE_TYPE.IKE_SA_INIT,
      messageId: 7,
      extraBytes: 100,
    })
    useVpnPacketStore.getState().addPacket(basePacket(bytes))

    const { packets } = useVpnPacketStore.getState()
    expect(packets).toHaveLength(1)
    const p = packets[0]
    expect(p.parseError).toBeNull()
    expect(p.header).not.toBeNull()
    expect(p.header?.exchangeType).toBe(34)
    expect(p.header?.exchangeName).toBe('IKE_SA_INIT')
    expect(p.header?.messageId).toBe(7) // big-endian decode
    expect(p.header?.length).toBe(128) // big-endian decode
    expect(p.header?.majorVersion).toBe(2)
    expect(p.header?.minorVersion).toBe(0)
    expect(p.header?.initiatorSpi).toBe('0102030405060708')
    expect(p.header?.responderSpi).toBe('1112131415161718')
    expect(p.header?.isInitiator).toBe(true)
    expect(p.header?.isResponse).toBe(false)
    expect(p.seq).toBe(1)
  })

  it('decodes multi-byte big-endian message IDs', () => {
    const bytes = buildIsakmpPacket({ messageId: 0x01020304 })
    useVpnPacketStore.getState().addPacket(basePacket(bytes))
    expect(useVpnPacketStore.getState().packets[0].header?.messageId).toBe(0x01020304)
  })

  it('sets parseError (and null header) for packets shorter than the 28-byte header', () => {
    useVpnPacketStore.getState().addPacket(basePacket(new Uint8Array(10)))
    const p = useVpnPacketStore.getState().packets[0]
    expect(p.header).toBeNull()
    expect(p.parseError).toMatch(/shorter than 28-byte/i)
  })

  it('increments seq monotonically across packets', () => {
    const store = useVpnPacketStore.getState()
    store.addPacket(basePacket(buildIsakmpPacket({})))
    store.addPacket(basePacket(buildIsakmpPacket({})))
    store.addPacket(basePacket(buildIsakmpPacket({})))
    const seqs = useVpnPacketStore.getState().packets.map((p) => p.seq)
    expect(seqs).toEqual([1, 2, 3])
  })

  it('trims to maxPackets, dropping the oldest packets', () => {
    const { maxPackets, addPacket } = useVpnPacketStore.getState()
    const overshoot = 5
    for (let i = 0; i < maxPackets + overshoot; i++) {
      addPacket(basePacket(buildIsakmpPacket({ messageId: i })))
    }
    const { packets } = useVpnPacketStore.getState()
    expect(packets).toHaveLength(maxPackets)
    // The first `overshoot` packets were dropped, so the window starts at seq overshoot+1.
    expect(packets[0].seq).toBe(overshoot + 1)
    expect(packets[packets.length - 1].seq).toBe(maxPackets + overshoot)
  })

  it('clear() resets packets, selection, and the seq counter', () => {
    const store = useVpnPacketStore.getState()
    store.addPacket(basePacket(buildIsakmpPacket({})))
    store.addPacket(basePacket(buildIsakmpPacket({})))
    store.selectPacket(1)
    expect(useVpnPacketStore.getState().packets).toHaveLength(2)
    expect(useVpnPacketStore.getState().selectedIndex).toBe(1)

    useVpnPacketStore.getState().clear()
    expect(useVpnPacketStore.getState().packets).toHaveLength(0)
    expect(useVpnPacketStore.getState().selectedIndex).toBe(-1)

    // Seq counter restarts at 1 after clear().
    useVpnPacketStore.getState().addPacket(basePacket(buildIsakmpPacket({})))
    expect(useVpnPacketStore.getState().packets[0].seq).toBe(1)
  })
})
