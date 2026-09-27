// SPDX-License-Identifier: GPL-3.0-only
import React, { Suspense, lazy, useRef, useState } from 'react'
import { Download, FileCheck2, Loader2, Upload } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { compareToExpected, type GoldenComparison } from '@/services/acvp/compare'
import { summarizeEvidence, type EvidenceSummary } from './workshopLogic'
import {
  PUBLIC_FIXTURES,
  PUBLIC_FIXTURE_IDS,
  readFileText,
  saveTextFile,
  type PublicFixtureId,
} from '../data/publicFixtures'

// The real WS-F panel, reused as-is (lazy: it pulls in the PKCS#11 WASM loaders).
const AcvpFormatPrototypePanel = lazy(() =>
  import('@/components/Playground/acvpio/AcvpFormatPrototypePanel').then((m) => ({
    default: m.AcvpFormatPrototypePanel,
  }))
)

const FilePick: React.FC<{ label: string; onText: (name: string, text: string) => void }> = ({
  label,
  onText,
}) => {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept="application/json,.json"
        aria-label={label}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void readFileText(f).then((t) => onText(f.name, t))
          e.target.value = ''
        }}
      />
      <Button variant="outline" size="sm" onClick={() => ref.current?.click()}>
        <Upload className="mr-1 h-3.5 w-3.5" aria-hidden="true" /> {label}
      </Button>
    </>
  )
}

/**
 * Workshop step 3 — produce and check a response artifact:
 *   1. save a public NIST sample prompt.json (exact upstream bytes);
 *   2. run it through the Hub's real ACVP-format prototype panel on either
 *      engine and download response.json + evidence.json;
 *   3. compare response.json with NIST's expectedResults.json (compare.ts —
 *      possible only because this is a public sample);
 *   4. read evidence.json the way a reviewer would.
 * Everything stays in this tab: no upload, no storage.
 */
export const ResponseArtifactLab: React.FC = () => {
  const [fixtureId, setFixtureId] = useState<PublicFixtureId>('ML-KEM-encapDecap-FIPS203')
  const [saving, setSaving] = useState(false)
  const [comparison, setComparison] = useState<GoldenComparison | null>(null)
  const [compareError, setCompareError] = useState<string | null>(null)
  const [evidence, setEvidence] = useState<EvidenceSummary | null>(null)
  const [evidenceError, setEvidenceError] = useState<string | null>(null)

  const savePrompt = async () => {
    setSaving(true)
    try {
      saveTextFile(`${fixtureId}.prompt.json`, await PUBLIC_FIXTURES[fixtureId].loadPrompt())
    } finally {
      setSaving(false)
    }
  }

  const compare = async (_name: string, text: string) => {
    setComparison(null)
    setCompareError(null)
    try {
      const expected = JSON.parse(await PUBLIC_FIXTURES[fixtureId].loadExpected())
      setComparison(compareToExpected(JSON.parse(text), expected))
    } catch (e) {
      setCompareError(e instanceof Error ? e.message : String(e))
    }
  }

  const inspect = (_name: string, text: string) => {
    setEvidence(null)
    setEvidenceError(null)
    try {
      setEvidence(summarizeEvidence(JSON.parse(text)))
    } catch (e) {
      setEvidenceError(e instanceof Error ? e.message : String(e))
    }
  }

  return (
    <div className="space-y-4">
      <section className="glass-panel space-y-3 p-4 text-sm" aria-labelledby="ral-step-a">
        <h3 id="ral-step-a" className="font-semibold text-foreground">
          A. Save a public sample prompt
        </h3>
        <p className="text-foreground/80">
          Pick the vector set, then save its prompt.json exactly as NIST published it.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Public sample vector set" className="flex flex-wrap gap-1">
            {PUBLIC_FIXTURE_IDS.map((id) => (
              <Button
                key={id}
                size="sm"
                variant={fixtureId === id ? 'secondary' : 'ghost'}
                aria-pressed={fixtureId === id}
                onClick={() => {
                  setFixtureId(id)
                  setComparison(null)
                  setCompareError(null)
                }}
              >
                {PUBLIC_FIXTURES[id].label}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={() => void savePrompt()} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Download className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
            )}
            Save prompt.json
          </Button>
        </div>
      </section>

      <section className="space-y-2" aria-labelledby="ral-step-b">
        <div className="glass-panel p-4 text-sm">
          <h3 id="ral-step-b" className="font-semibold text-foreground">
            B. Generate the response on a real engine
          </h3>
          <p className="text-foreground/80">
            This is the Hub’s ACVP-format prototype itself — the same panel as in the{' '}
            <Link
              to="/playground/hsm?tab=developer&dtab=acvp"
              className="text-primary hover:underline"
            >
              Playground’s validation workbench
            </Link>
            . Import the file you saved, choose an engine, run it, then download both response.json
            and evidence.json.
          </p>
        </div>
        <Suspense
          fallback={
            <p className="text-xs text-muted-foreground">Loading the ACVP-format prototype…</p>
          }
        >
          <AcvpFormatPrototypePanel />
        </Suspense>
      </section>

      <section className="glass-panel space-y-3 p-4 text-sm" aria-labelledby="ral-step-c">
        <h3 id="ral-step-c" className="font-semibold text-foreground">
          C. Check response.json against NIST’s expected results
        </h3>
        <p className="text-foreground/80">
          Load the response.json you downloaded. It is compared, test case by test case, with the
          expectedResults.json NIST published for the same sample (the vector set chosen in A). This
          local check exists only because the sample is public: for a vector set issued to an ACVTS
          session, only the server holds the expected answers.
        </p>
        <FilePick label="Load response.json" onText={(n, t) => void compare(n, t)} />
        <div aria-live="polite">
          {compareError ? (
            <p role="alert" className="text-status-error">
              Comparison failed: {compareError}
            </p>
          ) : null}
          {comparison ? (
            <div
              className="space-y-1 rounded-md border border-border bg-muted/30 p-3 text-xs"
              data-testid="ral-comparison"
            >
              <p className="font-semibold text-foreground">
                <FileCheck2 className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
                {comparison.matched} matched · {comparison.mismatched.length} mismatched ·{' '}
                {comparison.unanswered} unanswered · {comparison.unexpected.length} unexpected (of{' '}
                {comparison.expectedTotal} expected)
              </p>
              <p className="text-muted-foreground">
                “Unanswered” cases are the groups the prototype marked unsupported (or errored).
                They are not failures, and they are not passes: a vector set with unanswered cases
                could not reach the “passed” disposition on an ACVP server.
              </p>
              {comparison.mismatched.slice(0, 10).map((m) => (
                <p key={`${m.tgId}-${m.tcId}-${m.field}`} className="text-status-error">
                  tgId {m.tgId} / tcId {m.tcId}: {m.field} differs
                </p>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="glass-panel space-y-3 p-4 text-sm" aria-labelledby="ral-step-d">
        <h3 id="ral-step-d" className="font-semibold text-foreground">
          D. Read evidence.json like a reviewer
        </h3>
        <p className="text-foreground/80">
          The evidence sidecar is separate from the protocol response: it identifies the prompt and
          response by SHA-256 only, names the engine, and lists every unsupported case with its
          reason. Load yours to see the fields a reviewer reads first.
        </p>
        <FilePick label="Load evidence.json" onText={inspect} />
        <div aria-live="polite">
          {evidenceError ? (
            <p role="alert" className="text-status-error">
              {evidenceError}
            </p>
          ) : null}
          {evidence ? (
            <dl
              className="grid grid-cols-1 gap-1 rounded-md border border-border bg-muted/30 p-3 text-xs sm:grid-cols-[max-content_1fr] sm:gap-x-3"
              data-testid="ral-evidence"
            >
              <dt className="text-muted-foreground">evidenceClass</dt>
              <dd className="font-mono text-foreground">{evidence.evidenceClass}</dd>
              <dt className="text-muted-foreground">known public fixture</dt>
              <dd className="font-mono text-foreground">{evidence.knownFixture ?? 'none'}</dd>
              <dt className="text-muted-foreground">engine</dt>
              <dd className="text-foreground">{evidence.engine}</dd>
              <dt className="text-muted-foreground">answered / unsupported / error</dt>
              <dd className="text-foreground">
                {evidence.answered} / {evidence.unsupported} / {evidence.error}
              </dd>
              {evidence.artifactSha256Note ? (
                <>
                  <dt className="text-muted-foreground">engine artifact hash</dt>
                  <dd className="text-foreground/80">{evidence.artifactSha256Note}</dd>
                </>
              ) : null}
            </dl>
          ) : null}
        </div>
        <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-xs text-foreground/80">
          <p className="font-semibold text-primary">Try this</p>
          <p>
            Save the ML-DSA sample, open it in a text editor, change one hex digit of any test
            case’s <code>message</code>, save it under a new name and run it through B again. A
            response still generates — but evidence.json now says{' '}
            <code>unverified-imported-vector-set</code>, because the file’s SHA-256 no longer
            matches the pinned NIST sample. The response is a faithful answer to the edited prompt;
            what is gone is any source that vouches for the prompt — and with it, the evidence.
          </p>
        </div>
      </section>
    </div>
  )
}
