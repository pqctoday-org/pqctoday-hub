import React from 'react'
import { Key, FileSignature, Shield, Lock, RefreshCw } from 'lucide-react'

const STAGES = [
  {
    label: 'Key Generation',
    sublabel: 'Generate asymmetric key pair',
    icon: Key,
    color: 'text-primary',
    bg: 'bg-primary/10 border-primary/30',
  },
  {
    label: 'CSR Creation',
    sublabel: 'Subject info + public key',
    icon: FileSignature,
    color: 'text-warning',
    bg: 'bg-warning/10 border-warning/30',
  },
  {
    label: 'CA Signing',
    sublabel: 'Validate identity & sign',
    icon: Shield,
    color: 'text-success',
    bg: 'bg-success/10 border-success/30',
  },
  {
    label: 'Certificate Use',
    sublabel: 'TLS, code signing, S/MIME',
    icon: Lock,
    color: 'text-tertiary',
    bg: 'bg-tertiary/10 border-tertiary/30',
  },
  {
    label: 'Revocation / Renewal',
    sublabel: 'CRL, OCSP, or re-issue',
    icon: RefreshCw,
    color: 'text-destructive',
    bg: 'bg-destructive/10 border-destructive/30',
  },
]

export const PKICertificateLifecycleDiagram: React.FC = () => {
  return (
    <div className="bg-muted/30 rounded-lg border border-border p-6 overflow-x-auto">
      <div className="min-w-[600px]">
        {/* Horizontal flow */}
        <div className="flex items-center justify-between">
          {STAGES.map((stage, i) => {
            const Icon = stage.icon
            return (
              <React.Fragment key={stage.label}>
                {/* Stage node */}
                <div className="flex flex-col items-center text-center w-28">
                  <div
                    className={`w-14 h-14 rounded-xl border-2 ${stage.bg} flex items-center justify-center mb-2`}
                  >
                    <Icon size={24} className={stage.color} />
                  </div>
                  <span className={`text-xs font-bold ${stage.color}`}>{stage.label}</span>
                  <span className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                    {stage.sublabel}
                  </span>
                </div>

                {/* Arrow connector */}
                {i < STAGES.length - 1 && (
                  <div className="flex-1 flex items-center mx-1">
                    <div className="flex-1 h-px bg-muted-foreground/30" />
                    <div className="w-0 h-0 border-l-[6px] border-y-[4px] border-y-transparent border-l-muted-foreground/50" />
                  </div>
                )}
              </React.Fragment>
            )
          })}
        </div>

        {/* Lifecycle loop arrow */}
        <div className="mt-4 flex items-center justify-center">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <RefreshCw size={12} />
            <span>Certificates expire or are revoked — the lifecycle repeats</span>
          </div>
        </div>
      </div>
    </div>
  )
}
