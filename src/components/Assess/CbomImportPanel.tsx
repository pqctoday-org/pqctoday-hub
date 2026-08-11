// SPDX-License-Identifier: GPL-3.0-only
/**
 * "Import a CBOM instead" — B+ remediation 4.4 (2026-08-10).
 *
 * Sits above the crypto question for the developer persona. The wizard's most
 * abandoned stretch asks what cryptography you run; a developer can usually
 * produce that as a file, and this repo already emits the format
 * (`scripts/generate-cbom.ts`, CycloneDX 1.7).
 *
 * Three deliberate constraints, all about not overreaching:
 *
 *  - It fills ONE field. A CBOM knows your algorithms and nothing about your
 *    retention, your regulators or your team size. Filling the rest by
 *    inference would produce a confident report on invented premises.
 *  - It reports what it could NOT match, rather than dropping it. If a reader's
 *    file contains six algorithms this wizard has no option for, they should
 *    learn that from us and not discover it in the report.
 *  - Nothing is applied until the reader presses Apply. The file is read in the
 *    browser and never uploaded.
 */
import { useRef, useState } from 'react'
import { FileUp, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { parseCbom, CbomParseError, type CbomImportResult } from './cbomImport'

interface Props {
  /** The crypto step's own option vocabulary — it owns the list, and it changes. */
  options: string[]
  /** Algorithms already selected, so Apply is additive rather than destructive. */
  selected: string[]
  onApply: (algorithms: string[]) => void
}

export function CbomImportPanel({ options, selected, onApply }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [result, setResult] = useState<CbomImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [applied, setApplied] = useState(false)

  const handleFile = async (file: File) => {
    setError(null)
    setResult(null)
    setApplied(false)
    try {
      const text = await file.text()
      setResult(parseCbom(text, options))
    } catch (e) {
      setError(
        e instanceof CbomParseError ? e.message : 'Could not read that file. Is it a JSON CBOM?'
      )
    }
  }

  const apply = () => {
    if (!result) return
    // Additive: never clears an answer the reader gave by hand.
    const toAdd = result.recognised.filter((a) => !selected.includes(a))
    onApply(toAdd)
    setApplied(true)
  }

  return (
    <section className="mb-4 rounded-lg border border-border bg-muted/20 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <FileUp size={15} className="shrink-0 text-primary" aria-hidden="true" />
        <p className="flex-1 text-sm font-medium text-foreground">
          Have a CBOM? Import it instead of answering by hand.
        </p>
        <Button variant="outline" size="sm" onClick={() => inputRef.current?.click()}>
          Choose file
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          aria-label="Import a CycloneDX CBOM"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void handleFile(f)
            e.target.value = ''
          }}
        />
      </div>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        CycloneDX 1.6 or later, with cryptographic assets. Read in your browser — nothing is
        uploaded. It fills this question only; the rest of the wizard still needs you.
      </p>

      {error && (
        <p className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-status-warning">
          <AlertTriangle size={13} className="mt-px shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}

      {result && (
        <div className="mt-2 rounded-md border border-border bg-card/60 p-2.5">
          <p className="text-xs leading-relaxed text-foreground">
            Read <span className="font-semibold">{result.assetsSeen}</span> cryptographic{' '}
            {result.assetsSeen === 1 ? 'asset' : 'assets'} from your {result.format} file, and
            matched <span className="font-semibold">{result.recognised.length}</span> to the options
            below.
          </p>
          {result.recognised.length > 0 && (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {result.recognised.join(', ')}
            </p>
          )}
          {result.unrecognised.length > 0 && (
            <p className="mt-1.5 text-xs leading-relaxed text-status-warning">
              Not matched, so not imported: {result.unrecognised.join(', ')}. Add them by hand if
              they matter — we would rather tell you than quietly drop them.
            </p>
          )}
          <div className="mt-2 flex items-center gap-2">
            <Button
              variant="gradient"
              size="sm"
              onClick={apply}
              disabled={result.recognised.length === 0 || applied}
            >
              {applied ? 'Applied' : `Apply ${result.recognised.length} to my answer`}
            </Button>
            {applied && (
              <span className="inline-flex items-center gap-1 text-xs text-status-success">
                <CheckCircle2 size={13} aria-hidden="true" />
                Added — review and adjust below.
              </span>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
