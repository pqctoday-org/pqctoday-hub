// SPDX-License-Identifier: AGPL-3.0-only
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

class PrototypeBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean; message: string }
> {
  state = { failed: false, message: '' }

  static getDerivedStateFromError(error: unknown) {
    return {
      failed: true,
      message: error instanceof Error ? error.message : 'The ACVP engine panel could not load.',
    }
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div
        role="alert"
        className="rounded-lg border border-status-error/30 bg-status-error/10 p-4 text-sm"
      >
        <p className="font-semibold text-foreground">The ACVP engine panel is unavailable.</p>
        <p className="mt-1 text-foreground/80">{this.state.message}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Reload the module and confirm that browser WASM is enabled. You can still inspect the
          pinned vector-set structure in Step 2; do not report a response or disposition from this
          incomplete run.
        </p>
      </div>
    )
  }
}

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
    <div className="min-w-0 max-w-full space-y-4 overflow-x-hidden">
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
            and evidence.json. Answers that needed a test-only input, a value computed outside the
            engine, or what an engine does when a key is imported are counted and labelled
            separately.
          </p>
          <p className="mt-2 text-xs text-muted-foreground" role="note">
            Preflight: this step needs browser WASM and a successfully loaded C++ or Rust engine.
            Engine identity, prompt/response hashes and unsupported cases belong in evidence.json;
            loading the panel alone proves nothing.
          </p>
        </div>
        <PrototypeBoundary>
          <Suspense
            fallback={
              <p className="text-xs text-muted-foreground">Loading the ACVP-format prototype…</p>
            }
          >
            <AcvpFormatPrototypePanel />
          </Suspense>
        </PrototypeBoundary>
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
        <details
          className="rounded-md border border-border bg-muted/20 p-3 text-xs text-foreground/80"
          data-testid="ral-evidence-explainer"
        >
          <summary className="cursor-pointer font-semibold text-foreground">
            What is in evidence.json, and why it exists
          </summary>
          <p className="mt-2">
            response.json is the answer sheet: only the answers, in the format ACVP defines. The
            evidence file is the receipt that lets a reviewer ask four questions: what was run, on
            which engine build, how was each answer obtained, and what was left out. It holds no
            vector data: no keys, messages, signatures or secrets, only fingerprints (SHA-256) and
            return codes, so it can be shared.
          </p>
          <dl className="mt-2 grid grid-cols-1 gap-1 sm:grid-cols-[max-content_1fr] sm:gap-x-3">
            <dt className="font-mono text-foreground">evidenceVersion, label, disclaimers</dt>
            <dd>
              The edition of the file layout (2: every answer made from the prompt&rsquo;s own
              inputs; 3: also labels how each answer was obtained), and what the file is not: it is
              not a validation, not a verdict from the NIST server, and nothing is sent to NIST.
            </dd>
            <dt className="font-mono text-foreground">evidenceClass</dt>
            <dd>
              Whether the prompt is byte-identical to a published NIST sample
              (nist-acvp-reference-sample) or any other file (unverified-imported-vector-set).
            </dd>
            <dt className="font-mono text-foreground">generator</dt>
            <dd>Which code made the file (browser or command line) and the Hub version.</dd>
            <dt className="font-mono text-foreground">prompt</dt>
            <dd>
              The SHA-256 of the prompt file, where the sample comes from (NIST repository and exact
              commit), the algorithm, mode and revision, and the pinned specification and schema
              files the prompt was checked against.
            </dd>
            <dt className="font-mono text-foreground">response</dt>
            <dd>
              The SHA-256 of response.json. It ties the two files together, so neither can be
              swapped without the mismatch showing.
            </dd>
            <dt className="font-mono text-foreground">engine, startedAt, finishedAt</dt>
            <dd>
              Which engine ran, its build commit and date, and the SHA-256 of the exact WebAssembly
              file loaded, with the time the run took. A file made in the browser leaves the build
              commit, build date and WebAssembly hash empty (the command-line tool fills them).
            </dd>
            <dt className="font-mono text-foreground">summary</dt>
            <dd>
              How many tests were answered, unsupported and in error. A version 3 file also counts
              the answers by how they were obtained: from the prompt&rsquo;s own inputs alone, with
              NIST&rsquo;s random value as a test-only input, with a value computed outside the
              engine, or from the result of importing a key.
            </dd>
            <dt className="font-mono text-foreground">cases</dt>
            <dd>
              One entry per test: its outcome, the mechanism used and whether that mechanism is
              standard, vendor-defined or relying on a PKCS#11 v3.3 working-draft allowance, how the
              value was obtained, and the engine&rsquo;s return code (for a rejected key, the exact
              code that made it invalid).
            </dd>
            <dt className="font-mono text-foreground">vendorDefinedMechanisms</dt>
            <dd>Every non-standard mechanism the run used, with its code and source.</dd>
            <dt className="font-mono text-foreground">unsupported</dt>
            <dd>
              What was left out of response.json and why. Nothing is guessed or defaulted to fill a
              gap.
            </dd>
            <dt className="font-mono text-foreground">goldenComparison</dt>
            <dd>
              For a public sample only: how many answers match NIST&rsquo;s published expected
              results, and how many differ or are missing. For a prompt issued to a laboratory the
              expected answers are not supplied: the ACVTS server holds them. A file made in the
              browser carries no NIST comparison; step C shows the match count instead.
            </dd>
          </dl>
        </details>
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
              {evidence.answerKinds ? (
                <>
                  <dt className="text-muted-foreground">how the answers were obtained</dt>
                  <dd className="text-foreground" data-testid="ral-evidence-kinds">
                    {evidence.answerKinds.standardV32} standard PKCS#11 v3.2 calls ·{' '}
                    {evidence.answerKinds.vendorDefined} through the vendor-defined external-μ
                    mechanism (answered from the μ NIST supplies) ·{' '}
                    {evidence.answerKinds.v33Draft > 0
                      ? `${evidence.answerKinds.v33Draft} through a PKCS#11 v3.3 draft mechanism · `
                      : ''}
                    {evidence.answerKinds.testInputM} with a test-only input ·{' '}
                    {evidence.answerKinds.computed} computed outside the engine ·{' '}
                    {evidence.answerKinds.keyImportResult} from a key import result
                  </dd>
                </>
              ) : null}
              {evidence.golden ? (
                <>
                  <dt className="text-muted-foreground">compared with NIST</dt>
                  <dd className="text-foreground">
                    {evidence.golden.matched} matched · {evidence.golden.mismatched} mismatched ·{' '}
                    {evidence.golden.unanswered} unanswered (of {evidence.golden.expectedTotal})
                  </dd>
                </>
              ) : null}
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
