import React from 'react'
import { useTLSStore } from '../../../../../store/tls-learning.store'
import type { TLSRunRecord } from '../../../../../store/tls-learning.store'
import { Trash2 } from 'lucide-react'

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
              <th className="px-3 py-2 text-right font-bold border-r border-border">Total Data</th>
              <th className="px-3 py-2 text-right font-bold border-r border-border">Handshake</th>
              <th className="px-3 py-2 text-right font-bold">App Data</th>
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
                    {run.keyExchange}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono border-r border-border">{run.cipher}</td>
                <td className="px-3 py-2 text-right font-mono font-bold border-r border-border">
                  {(run.totalBytes / 1024).toFixed(2)} KB
                </td>
                <td className="px-3 py-2 text-right font-mono border-r border-border">
                  {(run.handshakeBytes / 1024).toFixed(2)} KB
                </td>
                <td className="px-3 py-2 text-right font-mono">{run.appDataBytes} B</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
