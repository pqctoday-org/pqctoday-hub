// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { useTLSStore } from '@/store/tls-learning.store'
import type { TLSRunRecord } from '@/store/tls-learning.store'
import { Trash2 } from 'lucide-react'

const ALGO_DISPLAY: Record<string, string> = {
  mldsa44: 'ML-DSA-44',
  mldsa65: 'ML-DSA-65',
  mldsa87: 'ML-DSA-87',
  'slhdsa-sha2-128s': 'SLH-DSA-128s',
  'slhdsa-sha2-128f': 'SLH-DSA-128f',
  ecdsa_secp256r1_sha256: 'ECDSA P-256',
  ecdsa_secp384r1_sha384: 'ECDSA P-384',
  rsa_pss_rsae_sha256: 'RSA-PSS 2048',
  rsa_pss_rsae_sha384: 'RSA-PSS 3072',
  rsa_pss_pss_sha256: 'RSA-PSS-PSS 2048',
  ed25519: 'Ed25519',
  X25519MLKEM768: 'X25519+ML-KEM-768',
  SecP256r1MLKEM768: 'P-256+ML-KEM-768',
  'ML-KEM-512': 'ML-KEM-512',
  'ML-KEM-768': 'ML-KEM-768',
  'ML-KEM-1024': 'ML-KEM-1024',
  TLS_AES_256_GCM_SHA384: 'AES-256-GCM-SHA384',
  TLS_AES_128_GCM_SHA256: 'AES-128-GCM-SHA256',
  TLS_CHACHA20_POLY1305_SHA256: 'ChaCha20-Poly1305',
}
const fmt = (name: string) => ALGO_DISPLAY[name] ?? name

export const TLSComparisonTable: React.FC = () => {
  const { runHistory, clearRunHistory } = useTLSStore()

  if (runHistory.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm border border-dashed border-border rounded-lg">
        Run simulations with different configurations to compare overhead.
      </div>
    )
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-b border-border">
        <h3 className="font-bold text-sm">Protocol Crypto Overhead</h3>
        <button
          onClick={clearRunHistory}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 size={12} />
          Clear
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-3 py-2 text-left font-bold border-r border-border">#</th>
              <th className="px-3 py-2 text-left font-bold border-r border-border">
                Client Identity
              </th>
              <th className="px-3 py-2 text-left font-bold border-r border-border">Client CA</th>
              <th className="px-3 py-2 text-left font-bold border-r border-border">
                Server Identity
              </th>
              <th className="px-3 py-2 text-left font-bold border-r border-border">Server CA</th>
              <th className="px-3 py-2 text-left font-bold border-r border-border">Key Exchange</th>
              <th className="px-3 py-2 text-left font-bold border-r border-border">Cipher</th>
              <th className="px-3 py-2 text-center font-bold border-r border-border">RTT</th>
              <th className="px-3 py-2 text-right font-bold border-r border-border">Total Data</th>
              <th className="px-3 py-2 text-right font-bold border-r border-border">Handshake</th>
              <th className="px-3 py-2 text-right font-bold border-r border-border">App Data</th>
              <th className="px-3 py-2 text-right font-bold">vs #1</th>
            </tr>
          </thead>
          <tbody>
            {runHistory.map((run: TLSRunRecord, idx: number) => (
              <tr
                key={run.id}
                className={`border-t border-border ${idx % 2 === 0 ? 'bg-background' : 'bg-muted/20'} ${!run.success ? 'opacity-50' : ''}`}
              >
                <td className="px-3 py-2 text-muted-foreground border-r border-border">{run.id}</td>
                <td className="px-3 py-2 font-mono border-r border-border">
                  <span
                    className={
                      run.clientIdentity.includes('ML-DSA') ? 'text-primary font-bold' : ''
                    }
                  >
                    {run.clientIdentity}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-muted-foreground border-r border-border">
                  <span className={run.clientCaKeyType.includes('ML-DSA') ? 'text-primary' : ''}>
                    {run.clientCaKeyType}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono border-r border-border">
                  <span
                    className={
                      run.serverIdentity.includes('ML-DSA') ? 'text-tertiary font-bold' : ''
                    }
                  >
                    {run.serverIdentity}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono text-muted-foreground border-r border-border">
                  <span className={run.serverCaKeyType.includes('ML-DSA') ? 'text-tertiary' : ''}>
                    {run.serverCaKeyType}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono border-r border-border">
                  <span
                    className={run.keyExchange.includes('ML-KEM') ? 'text-success font-bold' : ''}
                  >
                    {fmt(run.keyExchange)}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono border-r border-border">{fmt(run.cipher)}</td>
                <td className="px-3 py-2 text-center font-mono border-r border-border">
                  <span className={run.hrrDetected ? 'text-status-warning font-bold' : ''}>
                    {run.roundTrips ?? 1}
                    {run.hrrDetected ? ' (HRR)' : ''}
                  </span>
                </td>
                <td className="px-3 py-2 text-right font-mono font-bold border-r border-border">
                  {(run.totalBytes / 1024).toFixed(2)} KB
                </td>
                <td className="px-3 py-2 text-right font-mono border-r border-border">
                  {(run.handshakeBytes / 1024).toFixed(2)} KB
                </td>
                <td className="px-3 py-2 text-right font-mono border-r border-border">
                  {run.appDataBytes} B
                </td>
                <td className="px-3 py-2 text-right font-mono">
                  {idx === 0 ? (
                    <span className="text-muted-foreground">base</span>
                  ) : runHistory[0].handshakeBytes > 0 ? (
                    <span
                      className={
                        run.handshakeBytes > runHistory[0].handshakeBytes
                          ? 'text-status-warning font-bold'
                          : 'text-status-success'
                      }
                    >
                      {run.handshakeBytes >= runHistory[0].handshakeBytes ? '+' : ''}
                      {(
                        ((run.handshakeBytes - runHistory[0].handshakeBytes) /
                          runHistory[0].handshakeBytes) *
                        100
                      ).toFixed(0)}
                      %
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
