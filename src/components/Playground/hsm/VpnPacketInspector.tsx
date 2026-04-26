// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { useVpnPacketStore, type VpnPacket } from '@/store/useVpnPacketStore'
import { formatHexDump } from '@/utils/isakmp'
import { CodeBlock } from '@/components/ui/code-block'
import { Button } from '@/components/ui/button'
import { ChevronRight, ChevronLeft } from 'lucide-react'

const HeaderField: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex items-center justify-between gap-2 border-b border-border py-1.5 text-xs">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-mono text-foreground">{value}</span>
  </div>
)

const PacketHeader: React.FC<{ packet: VpnPacket }> = ({ packet }) => {
  const { header, parseError } = packet
  if (parseError || !header) {
    return <p className="text-xs text-destructive">Header parse error: {parseError}</p>
  }
  return (
    <div className="flex flex-col">
      <HeaderField label="Initiator SPI" value={header.initiatorSpi} />
      <HeaderField label="Responder SPI" value={header.responderSpi} />
      <HeaderField label="Next Payload" value={header.nextPayload} />
      <HeaderField label="Version" value={`${header.majorVersion}.${header.minorVersion}`} />
      <HeaderField
        label="Exchange Type"
        value={`${header.exchangeName} (${header.exchangeType})`}
      />
      <HeaderField
        label="Flags"
        value={
          <span>
            0x{header.flags.toString(16).padStart(2, '0')}
            {header.isInitiator ? ' I' : ''}
            {header.isResponse ? ' R' : ''}
          </span>
        }
      />
      <HeaderField label="Message ID" value={header.messageId} />
      <HeaderField label="Length" value={`${header.length} B`} />
    </div>
  )
}

type Tab = 'header' | 'hex'

interface VpnPacketInspectorProps {
  /** Default expanded state. */
  defaultOpen?: boolean
}

export const VpnPacketInspector: React.FC<VpnPacketInspectorProps> = ({ defaultOpen = true }) => {
  const packets = useVpnPacketStore((s) => s.packets)
  const selectedIndex = useVpnPacketStore((s) => s.selectedIndex)
  const selectPacket = useVpnPacketStore((s) => s.selectPacket)
  const clear = useVpnPacketStore((s) => s.clear)

  const [open, setOpen] = useState(defaultOpen)
  const [tab, setTab] = useState<Tab>('header')

  const selectedPacket =
    selectedIndex >= 0 && selectedIndex < packets.length ? packets[selectedIndex] : null

  if (!open) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="self-start"
        onClick={() => setOpen(true)}
        aria-label="Open packet inspector"
      >
        <ChevronLeft className="h-4 w-4" />
        Inspector
      </Button>
    )
  }

  return (
    <div className="glass-panel p-4 flex flex-col gap-3" data-testid="vpn-packet-inspector">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gradient">Packet Inspector</h3>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={clear}
            disabled={packets.length === 0}
            aria-label="Clear packet history"
          >
            Clear
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
            aria-label="Collapse inspector"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-1 max-h-32 overflow-auto rounded border border-border">
        {packets.length === 0 ? (
          <p className="p-3 text-xs text-muted-foreground">No packets captured yet.</p>
        ) : (
          packets.map((p, idx) => (
            <Button
              variant="ghost"
              size="sm"
              key={p.seq}
              onClick={() => selectPacket(idx)}
              className={`h-auto justify-between rounded-none px-2 py-1 text-left text-xs font-normal ${
                idx === selectedIndex ? 'bg-muted text-foreground' : 'text-muted-foreground'
              }`}
            >
              <span className="font-mono">
                #{p.seq} {p.header?.exchangeName ?? 'unparsed'}
              </span>
              <span className="font-mono">
                {p.srcIp} → {p.destIp} · {p.bytes.length}B
              </span>
            </Button>
          ))
        )}
      </div>

      {selectedPacket ? (
        <>
          <div className="flex gap-1 text-xs">
            <Button
              variant={tab === 'header' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setTab('header')}
            >
              Parsed Header
            </Button>
            <Button
              variant={tab === 'hex' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setTab('hex')}
            >
              Hex Dump
            </Button>
          </div>

          {tab === 'header' && <PacketHeader packet={selectedPacket} />}

          {tab === 'hex' && (
            <CodeBlock
              className="max-h-[28rem] overflow-auto text-[10px] leading-tight"
              code={formatHexDump(selectedPacket.bytes)}
              language="hex"
            />
          )}
        </>
      ) : (
        <p className="text-xs text-muted-foreground">
          Click a packet on The Wire or in the list above to inspect.
        </p>
      )}
    </div>
  )
}
