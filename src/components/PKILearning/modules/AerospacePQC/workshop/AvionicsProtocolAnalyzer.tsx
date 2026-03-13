// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import { Radio, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { AVIONICS_PROTOCOLS, PQC_ALGORITHM_SIZES } from '../data/aerospaceProtocolData'
import { FEASIBILITY_COLORS, FEASIBILITY_LABELS } from '../data/aerospaceConstants'

const protocolItems = AVIONICS_PROTOCOLS.map((p) => ({ id: p.id, label: p.name }))

export const AvionicsProtocolAnalyzer: React.FC = () => {
  const [selectedProtocol, setSelectedProtocol] = useState(AVIONICS_PROTOCOLS[0].id)

  const protocol = useMemo(
    () => AVIONICS_PROTOCOLS.find((p) => p.id === selectedProtocol)!,
    [selectedProtocol]
  )

  const algorithms = useMemo(() => {
    const maxBytes = protocol.maxPayloadBytes
    return [
      {
        name: 'ML-DSA-65',
        size: protocol.pqcOverhead.mldsa65Bytes,
        type: 'Signature',
        blocks: maxBytes > 0 ? Math.ceil(protocol.pqcOverhead.mldsa65Bytes / maxBytes) : Infinity,
      },
      {
        name: 'ML-DSA-44',
        size: protocol.pqcOverhead.mldsa44Bytes,
        type: 'Signature',
        blocks: maxBytes > 0 ? Math.ceil(protocol.pqcOverhead.mldsa44Bytes / maxBytes) : Infinity,
      },
      {
        name: 'LMS (H10/W4)',
        size: protocol.pqcOverhead.lmsBytes,
        type: 'Signature',
        blocks: maxBytes > 0 ? Math.ceil(protocol.pqcOverhead.lmsBytes / maxBytes) : Infinity,
      },
      {
        name: 'ML-KEM-768',
        size: protocol.pqcOverhead.mlkem768Bytes,
        type: 'KEM Ciphertext',
        blocks: maxBytes > 0 ? Math.ceil(protocol.pqcOverhead.mlkem768Bytes / maxBytes) : Infinity,
      },
      {
        name: 'ECDSA P-256',
        size: PQC_ALGORITHM_SIZES['ECDSA-P256'].signature,
        type: 'Signature (classical)',
        blocks:
          maxBytes > 0
            ? Math.ceil(PQC_ALGORITHM_SIZES['ECDSA-P256'].signature / maxBytes)
            : Infinity,
      },
    ]
  }, [protocol])

  const maxAlgoSize = Math.max(...algorithms.map((a) => a.size))

  return (
    <div className="space-y-6">
      {/* Protocol Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Radio size={18} className="text-primary" />
          <span className="text-sm font-medium text-foreground">Select Protocol:</span>
        </div>
        <FilterDropdown
          items={protocolItems}
          selectedId={selectedProtocol}
          onSelect={setSelectedProtocol}
          label="Protocol"
        />
      </div>

      {/* Protocol Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-panel p-4 space-y-3">
          <h3 className="text-sm font-bold text-foreground">{protocol.name}</h3>
          <p className="text-xs text-muted-foreground">{protocol.description}</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Max Payload:</span>{' '}
              <span className="font-bold text-foreground">{protocol.maxPayloadBytes} bytes</span>
            </div>
            <div>
              <span className="text-muted-foreground">Data Rate:</span>{' '}
              <span className="font-bold text-foreground">
                {protocol.dataRateKbps >= 1000
                  ? `${(protocol.dataRateKbps / 1000).toFixed(0)} Mbps`
                  : `${protocol.dataRateKbps} kbps`}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Link Type:</span>{' '}
              <span className="font-bold text-foreground">{protocol.linkType}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Current Crypto:</span>{' '}
              <span className="font-bold text-foreground">{protocol.currentCrypto}</span>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">Standard:</span> {protocol.standardRef}
          </div>
        </div>

        {/* Feasibility Verdict */}
        <div className="glass-panel p-4 space-y-3">
          <h3 className="text-sm font-bold text-foreground">PQC Feasibility</h3>
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold border ${FEASIBILITY_COLORS[protocol.pqcOverhead.feasibility]}`}
            >
              {FEASIBILITY_LABELS[protocol.pqcOverhead.feasibility]}
            </span>
          </div>
          <div className="flex items-start gap-2">
            {protocol.pqcOverhead.feasibility === 'infeasible' ? (
              <AlertTriangle size={14} className="text-status-error shrink-0 mt-0.5" />
            ) : protocol.pqcOverhead.feasibility === 'fits' ? (
              <CheckCircle size={14} className="text-status-success shrink-0 mt-0.5" />
            ) : (
              <Info size={14} className="text-status-warning shrink-0 mt-0.5" />
            )}
            <p className="text-xs text-muted-foreground">{protocol.pqcOverhead.notes}</p>
          </div>
        </div>
      </div>

      {/* Algorithm Size Comparison Chart */}
      <div className="glass-panel p-4 space-y-4">
        <h3 className="text-sm font-bold text-foreground">Algorithm Size vs. Protocol Capacity</h3>
        <div className="space-y-3">
          {algorithms.map((algo) => {
            const pct = (algo.size / maxAlgoSize) * 100
            const fitsInOne = algo.size <= protocol.maxPayloadBytes
            return (
              <div key={algo.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">{algo.name}</span>
                  <span className="text-muted-foreground">
                    {algo.size.toLocaleString()} B
                    {protocol.maxPayloadBytes > 0 && (
                      <span className="ml-2">
                        (
                        {fitsInOne ? (
                          <span className="text-status-success">1 block</span>
                        ) : (
                          <span className="text-status-warning">{algo.blocks} blocks</span>
                        )}
                        )
                      </span>
                    )}
                  </span>
                </div>
                <div className="h-4 bg-muted rounded-full overflow-hidden relative">
                  <div
                    className={`h-full rounded-full transition-all ${
                      fitsInOne ? 'bg-status-success/60' : 'bg-status-error/60'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                  {/* Protocol capacity marker */}
                  {protocol.maxPayloadBytes > 0 && protocol.maxPayloadBytes < maxAlgoSize && (
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-primary"
                      style={{
                        left: `${(protocol.maxPayloadBytes / maxAlgoSize) * 100}%`,
                      }}
                      title={`Protocol max: ${protocol.maxPayloadBytes} B`}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
        {protocol.maxPayloadBytes > 0 && protocol.maxPayloadBytes < maxAlgoSize && (
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <span className="inline-block w-3 h-0.5 bg-primary" /> = Protocol max payload (
            {protocol.maxPayloadBytes} B)
          </p>
        )}
      </div>
    </div>
  )
}
