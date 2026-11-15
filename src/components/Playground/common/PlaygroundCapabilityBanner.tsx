// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import { ShieldCheck, ChevronDown, CheckCircle2, AlertTriangle, Binary } from 'lucide-react'
import { getPlaygroundCapabilityChecklist } from '@/data/playgroundCapabilityChecklists'

export interface PlaygroundCapabilityBannerProps {
  toolId: string
  defaultOpen?: boolean
}

export const PlaygroundCapabilityBanner: React.FC<PlaygroundCapabilityBannerProps> = ({
  toolId,
  defaultOpen = false,
}) => {
  const spec = getPlaygroundCapabilityChecklist(toolId)
  const [isTampered, setIsTampered] = useState(false)

  const { tamperVerification } = spec
  const activeHex = isTampered
    ? tamperVerification.tamperedVectorHex
    : tamperVerification.validVectorHex

  return (
    <details
      open={defaultOpen}
      data-testid="playground-capability-banner"
      aria-label="Production Tool Capabilities and Sandbox Boundary"
      className="group rounded-lg border border-primary/25 bg-card/80 p-3 text-sm"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 font-semibold text-foreground select-none">
        <span className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <span>Production Tool Capabilities &amp; Verification Requirements</span>
        </span>
        <ChevronDown
          className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>

      <div className="mt-3 space-y-2.5 border-t border-border/60 pt-3 text-muted-foreground">
        <p className="text-xs sm:text-sm leading-relaxed">
          <span className="font-semibold text-foreground">What this sample check establishes:</span>{' '}
          {spec.whatCheckEstablishes}
        </p>
        <p className="text-xs sm:text-sm leading-relaxed">
          <span className="font-semibold text-foreground">
            Browser sandbox limitation (non-certification boundary):
          </span>{' '}
          {spec.sandboxLimitation}
        </p>
        <div>
          <p className="text-xs sm:text-sm font-semibold text-foreground">
            What to require and test in your production tools:
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-xs sm:text-sm">
            {spec.productionToolRequirements.map((req, idx) => (
              <li key={idx}>{req}</li>
            ))}
          </ul>
        </div>

        <div
          data-testid="playground-tamper-panel"
          className="rounded-md border border-primary/30 bg-muted/30 p-2.5 space-y-2"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Binary className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              1-Bit Tamper &amp; Negative Verification Check ({tamperVerification.artifactLabel})
            </span>
            <button
              type="button"
              data-testid="playground-tamper-toggle-btn"
              onClick={() => setIsTampered((prev) => !prev)}
              className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                isTampered
                  ? 'border-amber-500/60 bg-amber-500/15 text-foreground'
                  : 'border-emerald-500/60 bg-emerald-500/15 text-foreground'
              }`}
            >
              {isTampered
                ? 'Restore Intact Sample Vector'
                : 'Inject 1-Bit Tamper / Fault (^ 0x01)'}
            </button>
          </div>

          <div className="rounded bg-background/80 p-2 font-mono text-[11px] break-all border border-border/50">
            <span className="text-muted-foreground mr-2">
              {isTampered ? 'MUTATED_HEX:' : 'VALID_HEX:'}
            </span>
            {Array.from({ length: Math.ceil(activeHex.length / 2) }, (_, idx) => {
              const byteStr = activeHex.slice(idx * 2, idx * 2 + 2)
              const refByteStr = tamperVerification.validVectorHex.slice(idx * 2, idx * 2 + 2)
              const diff = isTampered && byteStr !== refByteStr
              return (
                <span
                  key={idx}
                  data-testid={diff ? 'tampered-byte-diff' : undefined}
                  className={
                    diff
                      ? 'rounded bg-amber-500/30 px-0.5 font-bold text-foreground underline'
                      : 'text-foreground'
                  }
                >
                  {byteStr}
                </span>
              )
            })}
          </div>

          {isTampered ? (
            <div
              data-testid="playground-tamper-status"
              className="flex items-start gap-2 rounded border border-amber-500/40 bg-amber-500/10 p-2 text-xs text-foreground"
            >
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" aria-hidden="true" />
              <div>
                <span className="font-semibold">TAMPER / FAULT DETECTED — </span>
                <span>{tamperVerification.expectedFailureBehavior}</span>
              </div>
            </div>
          ) : (
            <div
              data-testid="playground-tamper-status"
              className="flex items-start gap-2 rounded border border-emerald-500/40 bg-emerald-500/10 p-2 text-xs text-foreground"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" aria-hidden="true" />
              <div>
                <span className="font-semibold">INTACT SAMPLE VECTOR — </span>
                <span>
                  Cryptographic structure matches expected baseline. Click &ldquo;Inject 1-Bit Tamper
                  / Fault&rdquo; to inspect deterministic FIPS/RFC refusal behavior.
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </details>
  )
}
