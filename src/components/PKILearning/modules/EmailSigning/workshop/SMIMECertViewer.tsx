import React, { useState } from 'react'
import { ShieldCheck, Eye, EyeOff } from 'lucide-react'
import { CERT_FIELD_COMPARISON, SMIME_CERT_EXTENSIONS } from '../data/emailSigningConstants'

type ViewMode = 'comparison' | 'extensions'

export const SMIMECertViewer: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('comparison')
  const [showNotes, setShowNotes] = useState(true)

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">S/MIME Certificate Structure</h3>
        <p className="text-sm text-muted-foreground">
          Compare classical RSA-2048 and post-quantum ML-DSA-65 S/MIME certificates. Examine the key
          extensions required for email signing and encryption.
        </p>
      </div>

      {/* View Toggle */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setViewMode('comparison')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'comparison'
              ? 'bg-primary/20 text-primary border border-primary/50'
              : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
          }`}
        >
          RSA vs ML-DSA Fields
        </button>
        <button
          onClick={() => setViewMode('extensions')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'extensions'
              ? 'bg-primary/20 text-primary border border-primary/50'
              : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
          }`}
        >
          S/MIME Extensions
        </button>
      </div>

      {/* Certificate Field Comparison */}
      {viewMode === 'comparison' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-foreground">Certificate Field Comparison</h4>
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {showNotes ? <EyeOff size={14} /> : <Eye size={14} />}
              {showNotes ? 'Hide Notes' : 'Show Notes'}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 text-muted-foreground font-medium">Field</th>
                  <th className="text-left p-2 font-bold">
                    <span className="text-warning">RSA-2048</span>
                  </th>
                  <th className="text-left p-2 font-bold">
                    <span className="text-success">ML-DSA-65</span>
                  </th>
                  {showNotes && (
                    <th className="text-left p-2 text-muted-foreground font-medium">Notes</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {CERT_FIELD_COMPARISON.map((row) => (
                  <tr key={row.field} className="border-b border-border/50">
                    <td className="p-2 text-muted-foreground font-medium whitespace-nowrap">
                      {row.field}
                    </td>
                    <td className="p-2 font-mono text-xs text-foreground">{row.rsaValue}</td>
                    <td className="p-2 font-mono text-xs text-foreground">{row.mlDsaValue}</td>
                    {showNotes && (
                      <td className="p-2 text-xs text-muted-foreground">{row.notes}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Size Impact Visual */}
          <div className="glass-panel p-4">
            <h4 className="text-sm font-bold text-foreground mb-3">Size Impact Visualization</h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">RSA-2048 Certificate</span>
                  <span className="font-mono text-warning">~1,200 bytes</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div
                    className="bg-warning/60 h-3 rounded-full transition-all"
                    style={{ width: '20%' }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">ML-DSA-65 Certificate</span>
                  <span className="font-mono text-success">~6,000 bytes</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3">
                  <div
                    className="bg-success/60 h-3 rounded-full transition-all"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              PQC certificates are approximately 5x larger, primarily due to the 1,952-byte public
              key and 3,309-byte signature in ML-DSA-65.
            </p>
          </div>
        </div>
      )}

      {/* S/MIME Extensions */}
      {viewMode === 'extensions' && (
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-foreground">
            Required S/MIME Certificate Extensions
          </h4>
          <div className="space-y-3">
            {SMIME_CERT_EXTENSIONS.map((ext) => (
              <div key={ext.name} className="glass-panel p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-primary" />
                    <span className="font-bold text-foreground text-sm">{ext.name}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">({ext.oid})</span>
                  </div>
                  {ext.critical && (
                    <span className="text-[10px] px-2 py-0.5 rounded border font-bold bg-destructive/20 text-destructive border-destructive/50">
                      CRITICAL
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-2">{ext.description}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="bg-muted/50 rounded p-2 border border-border">
                    <div className="text-[10px] font-bold text-primary mb-1">For Signing</div>
                    <p className="text-[10px] font-mono text-foreground/80">{ext.signingValue}</p>
                  </div>
                  <div className="bg-muted/50 rounded p-2 border border-border">
                    <div className="text-[10px] font-bold text-secondary mb-1">For Encryption</div>
                    <p className="text-[10px] font-mono text-foreground/80">
                      {ext.encryptionValue}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Educational note */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <p className="text-xs text-muted-foreground">
          <strong>Key takeaway:</strong> S/MIME certificates for PQC use the same X.509 extensions
          as classical certificates. The primary differences are the algorithm OIDs, key sizes, and
          signature sizes. The <code className="text-foreground/70">smimeCapabilities</code>{' '}
          attribute becomes especially important during migration to advertise PQC algorithm support
          to peers.
        </p>
      </div>
    </div>
  )
}
