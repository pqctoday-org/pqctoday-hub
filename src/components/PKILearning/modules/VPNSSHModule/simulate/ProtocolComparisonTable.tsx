// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState } from 'react'
import { ArrowUpDown } from 'lucide-react'
import {
  PROTOCOL_SIZE_DATA,
  PROTOCOL_FEATURE_COMPARISON,
  type ProtocolName,
  type CryptoMode,
} from '../data/protocolSizeComparisons'
import { Button } from '@/components/ui/button'
import { tlsSample } from '../data/measuredTlsHandshake'

type SortField = 'protocol' | 'handshakeBytes' | 'roundTrips' | 'publicKeyBytes'

const MODE_LABELS: Record<CryptoMode, string> = {
  classical: 'Classical',
  hybrid: 'Hybrid',
  'pure-pqc': 'Pure PQC',
}

const MODE_COLORS: Record<CryptoMode, string> = {
  classical: 'bg-muted text-foreground border-border',
  hybrid: 'bg-warning/10 text-warning border-warning/30',
  'pure-pqc': 'bg-success/10 text-success border-success/30',
}

const PROTOCOL_COLORS: Record<ProtocolName, string> = {
  IKEv2: 'text-primary',
  SSH: 'text-secondary',
  WireGuard: 'text-warning',
  'TLS 1.3': 'text-success',
}

export const ProtocolComparisonTable: React.FC = () => {
  const [filterMode, setFilterMode] = useState<CryptoMode | 'all'>('all')
  const [filterProtocol, setFilterProtocol] = useState<ProtocolName | 'all'>('all')
  const [sortField, setSortField] = useState<SortField>('protocol')
  const [sortAsc, setSortAsc] = useState(true)
  const [showFeatures, setShowFeatures] = useState(true)

  const filteredData = PROTOCOL_SIZE_DATA.filter((entry) => {
    if (filterMode !== 'all' && entry.mode !== filterMode) return false
    if (filterProtocol !== 'all' && entry.protocol !== filterProtocol) return false
    return true
  }).sort((a, b) => {
    const dir = sortAsc ? 1 : -1
    if (sortField === 'protocol') {
      return dir * a.protocol.localeCompare(b.protocol)
    }
    return dir * (a[sortField] - b[sortField])
  })

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc)
    } else {
      setSortField(field)
      setSortAsc(true)
    }
  }

  const protocols: ProtocolName[] = ['IKEv2', 'SSH', 'WireGuard', 'TLS 1.3']
  const modes: CryptoMode[] = ['classical', 'hybrid', 'pure-pqc']

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="space-y-1">
          <span className="text-[10px] text-muted-foreground font-bold uppercase">Protocol</span>
          <div className="flex flex-wrap gap-1">
            <Button
              variant="ghost"
              onClick={() => setFilterProtocol('all')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors border ${
                filterProtocol === 'all'
                  ? 'bg-primary/20 border-primary/50 text-primary'
                  : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              All
            </Button>
            {protocols.map((p) => (
              <Button
                variant="ghost"
                key={p}
                onClick={() => setFilterProtocol(p)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors border ${
                  filterProtocol === p
                    ? 'bg-primary/20 border-primary/50 text-primary'
                    : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                {p}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <span className="text-[10px] text-muted-foreground font-bold uppercase">Mode</span>
          <div className="flex flex-wrap gap-1">
            <Button
              variant="ghost"
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors border ${
                filterMode === 'all'
                  ? 'bg-primary/20 border-primary/50 text-primary'
                  : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted'
              }`}
            >
              All
            </Button>
            {modes.map((m) => (
              <Button
                variant="ghost"
                key={m}
                onClick={() => setFilterMode(m)}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors border ${
                  filterMode === m
                    ? 'bg-primary/20 border-primary/50 text-primary'
                    : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                {MODE_LABELS[m]}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Size Comparison Table */}
      <div className="overflow-x-auto">
        <table aria-label="Protocol size comparison" className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-2">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('protocol')}
                  className="flex items-center gap-1 text-muted-foreground font-bold hover:text-foreground transition-colors"
                >
                  Protocol <ArrowUpDown size={10} />
                </Button>
              </th>
              <th className="text-left p-2 text-muted-foreground font-bold">Mode</th>
              <th className="text-left p-2 text-muted-foreground font-bold">KEX Algorithm</th>
              <th className="text-right p-2">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('handshakeBytes')}
                  className="flex items-center gap-1 text-muted-foreground font-bold hover:text-foreground transition-colors ml-auto"
                >
                  Handshake <ArrowUpDown size={10} />
                </Button>
              </th>
              <th className="text-right p-2">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('roundTrips')}
                  className="flex items-center gap-1 text-muted-foreground font-bold hover:text-foreground transition-colors ml-auto"
                >
                  RTTs <ArrowUpDown size={10} />
                </Button>
              </th>
              <th className="text-right p-2">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('publicKeyBytes')}
                  className="flex items-center gap-1 text-muted-foreground font-bold hover:text-foreground transition-colors ml-auto"
                >
                  Key / share <ArrowUpDown size={10} />
                </Button>
              </th>
              <th className="text-left p-2 text-muted-foreground font-bold hidden lg:table-cell">
                Notes
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((entry, idx) => (
              <tr
                key={`${entry.protocol}-${entry.mode}-${idx}`}
                className="border-b border-border/50 hover:bg-muted/30 transition-colors"
              >
                <td className={`p-2 font-medium ${PROTOCOL_COLORS[entry.protocol]}`}>
                  {entry.protocol}
                </td>
                <td className="p-2">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded border font-bold ${MODE_COLORS[entry.mode]}`}
                  >
                    {entry.modeLabel}
                  </span>
                </td>
                <td className="p-2 text-muted-foreground">{entry.kexAlgorithm}</td>
                <td className="p-2 text-right text-foreground font-medium">
                  {entry.handshakeBytes.toLocaleString()} B
                </td>
                <td className="p-2 text-right text-muted-foreground">{entry.roundTrips}</td>
                <td className="p-2 text-right text-muted-foreground">
                  {entry.publicKeyBytes.toLocaleString()} B
                </td>
                <td className="p-2 text-muted-foreground hidden lg:table-cell">{entry.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Visual Bar Chart */}
      <div className="space-y-3">
        <h4 className="text-sm font-bold text-foreground">Handshake Size Comparison</h4>
        <div className="space-y-2">
          {filteredData.map((entry, idx) => {
            const maxBytes = Math.max(...filteredData.map((e) => e.handshakeBytes))
            const widthPercent = (entry.handshakeBytes / maxBytes) * 100
            return (
              <div
                key={`bar-${entry.protocol}-${entry.mode}-${idx}`}
                className="space-y-1"
                role="img"
                aria-label={`${entry.protocol} ${entry.modeLabel}: ${entry.handshakeBytes} handshake bytes`}
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span className={`font-medium ${PROTOCOL_COLORS[entry.protocol]}`}>
                    {entry.protocol} ({entry.modeLabel})
                  </span>
                  <span className="text-muted-foreground">
                    {entry.handshakeBytes.toLocaleString()} B
                  </span>
                </div>
                <div className="h-3 bg-muted/50 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary/60 rounded-full transition-all duration-500"
                    style={{ width: `${widthPercent}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {filteredData.some((entry) => entry.protocol === 'TLS 1.3') && (
        <section aria-label="Measured TLS handshake examples" className="glass-panel p-4 space-y-3">
          <h4 className="text-sm font-bold text-foreground">What the TLS totals include</h4>
          <p className="text-xs text-muted-foreground">
            Measured 9 November 2026 with OpenSSL 3.6.3: TLS_AES_128_GCM_SHA256, server
            authentication, and fictional example.test certificates. Each total counts all seven
            handshake messages, including their four-byte headers. TLS record framing, tags and
            padding, TCP/IP, application data, session tickets, resumption and client authentication
            are excluded. No ALPN or certificate compression is used.
          </p>
          <p className="text-xs text-muted-foreground">
            The server sends a leaf and intermediate certificate; the root is trusted locally. The
            profiles use matching fictional certificate metadata. RSA-2048 and ML-DSA-65 are not
            equivalent security strengths. The PQC authentication example uses
            draft-ietf-tls-mldsa-06, which is in the RFC Editor queue.
          </p>
          {filteredData
            .filter((entry) => entry.protocol === 'TLS 1.3')
            .map((entry) => {
              const sample = tlsSample(entry.mode)
              return (
                <details key={entry.mode} className="rounded-lg border border-border p-3">
                  <summary className="cursor-pointer text-xs font-semibold text-foreground">
                    {entry.modeLabel}: {sample.totalBytes.toLocaleString()} B
                  </summary>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Client key share: {sample.clientShareBytes.toLocaleString()} B. Server key
                    share: {sample.serverShareBytes.toLocaleString()} B. ML-KEM ciphertext
                    component: {sample.ciphertextBytes.toLocaleString()} B. The key/share column is
                    the client key-share payload, not the complete handshake.
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Certificate authentication messages:{' '}
                    {sample.authenticationBytes.toLocaleString()} B, including a{' '}
                    {sample.signatureBytes.toLocaleString()} B CertificateVerify signature. Both
                    Finished messages are also counted below.
                  </p>
                  <table className="mt-3 w-full table-fixed text-xs">
                    <caption className="text-left font-semibold mb-1">
                      Captured handshake messages
                    </caption>
                    <thead>
                      <tr className="border-b border-border">
                        <th scope="col" className="text-left py-1 w-[38%]">
                          Direction
                        </th>
                        <th scope="col" className="text-left py-1">
                          Message
                        </th>
                        <th scope="col" className="text-right py-1 w-[20%]">
                          Bytes
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {sample.messages.map((message, index) => (
                        <tr key={`${message.name}-${index}`} className="border-b border-border/50">
                          <td className="py-1">
                            {message.direction === 'client-to-server'
                              ? 'Client → server'
                              : 'Server → client'}
                          </td>
                          <td className="py-1 break-all">{message.name}</td>
                          <td className="text-right py-1">{message.bytes.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <th scope="row" colSpan={2} className="text-left py-1">
                          Total
                        </th>
                        <td className="text-right py-1 font-semibold">
                          {sample.totalBytes.toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </details>
              )
            })}
          <p className="text-xs text-muted-foreground">
            These are reproducible sample configurations, not universal handshake sizes or latency
            measurements. Look for production tools that capture both directions, identify the
            negotiated group and signature scheme, and measure the actual chain and extensions at a
            stated framing boundary. A KEM ciphertext alone cannot provide that total. In this
            capture the classical ClientHello also includes a six-byte EC point-format extension
            that the hybrid and PQC cases omit.
          </p>
        </section>
      )}

      {/* Feature Comparison */}
      <div className="space-y-3">
        <Button
          variant="ghost"
          onClick={() => setShowFeatures(!showFeatures)}
          className="text-sm font-bold text-foreground hover:text-primary transition-colors"
        >
          {showFeatures ? 'Hide' : 'Show'} Feature Comparison
        </Button>
        {showFeatures && (
          <div className="overflow-x-auto animate-fade-in">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 text-muted-foreground font-bold min-w-[140px]">
                    Feature
                  </th>
                  <th className="text-left p-2 text-primary font-bold">IKEv2</th>
                  <th className="text-left p-2 text-secondary font-bold">SSH</th>
                  <th className="text-left p-2 text-warning font-bold">WireGuard</th>
                  <th className="text-left p-2 text-success font-bold">TLS 1.3</th>
                </tr>
              </thead>
              <tbody>
                {PROTOCOL_FEATURE_COMPARISON.map((row) => (
                  <tr key={row.feature} className="border-b border-border/50">
                    <td className="p-2 font-medium text-foreground">{row.feature}</td>
                    <td className="p-2 text-muted-foreground">{row.ikev2}</td>
                    <td className="p-2 text-muted-foreground">{row.ssh}</td>
                    <td className="p-2 text-muted-foreground">{row.wireguard}</td>
                    <td className="p-2 text-muted-foreground">{row.tls13}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
