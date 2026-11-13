// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import { ShieldCheck } from 'lucide-react'
import { SMIME_CERT_EXTENSIONS } from '../data/emailSigningConstants'
import { Button } from '@/components/ui/button'
import { EmailSizeComparison } from './EmailSizeComparison'

type ViewMode = 'comparison' | 'extensions'

export const SMIMECertViewer: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('comparison')

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">S/MIME Certificate Structure</h3>
        <p className="text-sm text-muted-foreground">
          Compare captured RSA-3072 / CMS RSA-PSS and ML-DSA-65 software outputs, then inspect the
          separate email-purpose extension examples.
        </p>
      </div>

      {/* View Toggle */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant="ghost"
          onClick={() => setViewMode('comparison')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'comparison'
              ? 'bg-primary/20 text-primary border border-primary/50'
              : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
          }`}
        >
          RSA vs ML-DSA Fields
        </Button>
        <Button
          variant="ghost"
          onClick={() => setViewMode('extensions')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'extensions'
              ? 'bg-primary/20 text-primary border border-primary/50'
              : 'bg-muted/50 text-muted-foreground border border-border hover:border-primary/30'
          }`}
        >
          S/MIME Extensions
        </Button>
      </div>

      {viewMode === 'comparison' && <EmailSizeComparison />}

      {/* S/MIME Extensions */}
      {viewMode === 'extensions' && (
        <div className="space-y-4">
          <h4 className="text-sm font-bold text-foreground">Certificate Extension Examples</h4>
          <p className="text-sm text-muted-foreground">
            These examples are not a universal list of required extensions. The applicable
            certificate profile and intended use determine which extensions and values are needed.
            The critical flags shown are example settings; critical does not mean required to be
            present. This view does not validate a certificate against a profile.
          </p>
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
          <div className="glass-panel p-4 space-y-2">
            <h4 className="text-sm font-bold text-foreground">Two capability contexts</h4>
            <p className="text-sm text-muted-foreground">
              <code>smimeCapabilities</code> can be an optional, noncritical certificate extension
              under{' '}
              <a
                href="https://www.rfc-editor.org/rfc/rfc4262.html#section-2"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                RFC 4262
              </a>
              . It can also appear in an S/MIME message as a CMS signed attribute under{' '}
              <a
                href="https://www.rfc-editor.org/rfc/rfc8551.html#section-2.5.2"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                RFC 8551
              </a>
              . These are different containing structures; the certificate extension complements the
              message attribute rather than replacing it.
            </p>
          </div>
        </div>
      )}

      {/* Educational note */}
      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <p className="text-xs text-muted-foreground">
          <strong>Key takeaway:</strong> Inspect the applicable certificate profile, message
          attributes and peer capabilities with your production tools. A capabilities advertisement
          alone does not establish usable algorithm support or successful interoperability.
        </p>
      </div>
    </div>
  )
}
