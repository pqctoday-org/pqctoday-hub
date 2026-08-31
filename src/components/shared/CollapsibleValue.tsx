// SPDX-License-Identifier: GPL-3.0-only
/**
 * CollapsibleValue — click-to-expand hex payload, extracted out of
 * Pkcs11InspectPanel.tsx so the pipeline builders' Inspect views can reuse
 * the same pattern instead of a second copy. `showModeToggle` is opt-in and
 * defaults to off, so Pkcs11InspectPanel's existing callers render exactly
 * as before — the hex/text toggle only appears for callers that ask for it
 * (the pipeline Inspect panels, which show real op output where a text
 * payload — e.g. a decrypted plaintext — is common).
 */
import { useState } from 'react'
import { Button } from '../ui/button'
import { guessDefaultMode, hexToPrintableText } from './byteFormat'

export function CollapsibleValue({
  value,
  isOutput = false,
  showModeToggle = false,
}: {
  value: string
  isOutput?: boolean
  showModeToggle?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const [mode, setMode] = useState<'hex' | 'text'>(() => guessDefaultMode(value))
  const colorClass = isOutput ? 'text-status-success' : 'text-foreground'
  const displayed = showModeToggle && mode === 'text' ? hexToPrintableText(value) : value

  // Only collapse long payload strings
  if (value.length <= 40) {
    return <span className={colorClass}>{displayed}</span>
  }

  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center gap-2">
        <div
          role="button"
          tabIndex={0}
          className={`flex items-center gap-1 text-[11px] select-none text-left appearance-none bg-transparent border-none p-0 cursor-pointer hover:underline ${colorClass}`}
          onClick={() => setExpanded(!expanded)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setExpanded(!expanded)
            }
          }}
        >
          <span className="text-[9px] opacity-70">{expanded ? '▼' : '▶'}</span>
          {expanded ? 'Hide payload' : 'Show payload'}
          <span className="text-muted-foreground opacity-50 ml-1">
            ({Math.floor(value.length / 2)} bytes)
          </span>
        </div>
        {showModeToggle && expanded && (
          <div className="flex text-[9px] rounded border border-border/40 overflow-hidden">
            {(['hex', 'text'] as const).map((m) => (
              <Button
                key={m}
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setMode(m)}
                className={`h-auto rounded-none px-1.5 py-0.5 text-[9px] ${mode === m ? 'bg-primary/20 text-primary' : 'text-muted-foreground'}`}
              >
                {m}
              </Button>
            ))}
          </div>
        )}
      </div>
      {expanded && (
        <div className="mt-1.5 p-2 bg-background/50 rounded border border-border/30 max-h-40 overflow-y-auto break-all font-mono text-[10px] leading-relaxed select-text">
          {displayed}
        </div>
      )}
    </div>
  )
}
