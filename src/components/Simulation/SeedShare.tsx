// SPDX-License-Identifier: GPL-3.0-only
/**
 * SeedShare (PR7) — cash the determinism: copy the run's "scenario code" (the
 * seed, base36) so anyone can load it and get the identical run, or paste a code
 * to replay a shared scenario. Same seed + turn reproduces every quarter roll.
 */
import { useState } from 'react'
import { Copy, Check, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSimulationStore } from '@/store/useSimulationStore'
import { encodeScenario, decodeScenario } from './scenarioCode'

export function SeedShare() {
  const seed = useSimulationStore((s) => s.seed)
  const setSeed = useSimulationStore((s) => s.setSeed)
  const [copied, setCopied] = useState(false)
  const [draft, setDraft] = useState('')
  const code = encodeScenario(seed)
  const draftValid = draft.trim() === '' || decodeScenario(draft) !== null

  const copy = () => {
    void navigator.clipboard?.writeText(code).then(
      () => {
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1500)
      },
      () => setCopied(false)
    )
  }

  const load = () => {
    const decoded = decodeScenario(draft)
    if (decoded === null) return
    setSeed(decoded)
    setDraft('')
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="font-semibold uppercase tracking-wide text-muted-foreground">Scenario</span>
      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sim-body font-semibold text-foreground">
        {code}
      </code>
      <Button
        type="button"
        variant="ghost"
        onClick={copy}
        aria-label="Copy scenario code"
        className="h-auto rounded-md border border-border px-2 py-1 text-xs text-foreground hover:bg-muted"
      >
        {copied ? (
          <>
            <Check className="mr-1 inline h-3 w-3 text-status-success" />
            Copied
          </>
        ) : (
          <>
            <Copy className="mr-1 inline h-3 w-3" />
            Copy code
          </>
        )}
      </Button>
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Load code…"
        aria-label="Load a scenario code"
        aria-invalid={!draftValid}
        className={`h-7 w-28 px-2 py-1 text-xs ${draftValid ? '' : 'border-status-error'}`}
      />
      <Button
        type="button"
        variant="ghost"
        onClick={load}
        disabled={draft.trim() === '' || !draftValid}
        aria-label="Load scenario code"
        className="h-auto rounded-md border border-primary/40 px-2 py-1 text-xs font-medium text-primary hover:bg-primary/10 disabled:opacity-40"
      >
        <Play className="mr-1 inline h-3 w-3" />
        Load
      </Button>
    </div>
  )
}
