// SPDX-License-Identifier: AGPL-3.0-only
import React, { Suspense, lazy, useRef, useState } from 'react'
import { Download, FileCheck2, Loader2, Upload } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import {
  compareToExpected,
  isFullMatch,
  nonmatchingCaseCount,
  type GoldenComparison,
  type GoldenMismatch,
} from '@/services/acvp/compare'
import { sha256Hex } from '@/services/acvp/ir'
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

const FilePick: React.FC<{
  label: string
  onFile: (file: File) => void
}> = ({ label, onFile }) => {
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
          const file = e.target.files?.[0]
          if (file) onFile(file)
          e.target.value = ''
        }}
      />
      <Button variant="outline" size="sm" onClick={() => ref.current?.click()}>
        <Upload className="mr-1 h-3.5 w-3.5" aria-hidden="true" /> {label}
      </Button>
    </>
  )
}

const plural = (n: number, one: string, many: string): string => `${n} ${n === 1 ? one : many}`

const describeMismatch = (m: GoldenMismatch): string => {
  const where = `tgId ${m.tgId} / tcId ${m.tcId}`
  switch (m.problem) {
    case 'missing':
      return `${where}: ${m.field} is missing from the response`
    case 'different':
      return `${where}: ${m.field} differs from the published answer`
    case 'invalid':
      return `${where}: ${m.field} is not ${m.field === 'testPassed' ? 'true or false' : 'valid even-length hex text'}`
    case 'unexpected':
      return `${where}: ${m.field} is not an answer field for this test`
  }
}

/** The text a learner sees when a file cannot be compared at all. */
const describeCompareFailure = (e: unknown): string => (e instanceof Error ? e.message : String(e))

const MAX_LISTED = 10

/**
 * Workshop step 3 — produce and check a response artifact:
 *   1. save a public NIST sample prompt.json (exact upstream bytes);
 *   2. run it through the Hub's real ACVP-format prototype panel on either
 *      engine and download response.json + evidence.json;
 *   3. compare response.json with NIST's expectedResults.json (compare.ts —
 *      possible only because this is a public sample);
 *   4. inspect evidence.json and check the exact bytes of the associated response.
 * Everything stays in this tab: no upload, no storage.
 */
export const ResponseArtifactLab: React.FC = () => {
  const [fixtureId, setFixtureId] = useState<PublicFixtureId>('ML-KEM-encapDecap-FIPS203')
  const [saving, setSaving] = useState(false)
  const [comparison, setComparison] = useState<GoldenComparison | null>(null)
  const [compareError, setCompareError] = useState<string | null>(null)
  const [evidence, setEvidence] = useState<EvidenceSummary | null>(null)
  const [evidenceError, setEvidenceError] = useState<string | null>(null)
  const [binding, setBinding] = useState<'match' | 'mismatch' | 'error' | null>(null)
  // Invalidate old asynchronous results at selection time, before a file read starts.
  const compareRun = useRef(0)
  const evidenceRun = useRef(0)

  const clearComparison = () => {
    compareRun.current++
    setComparison(null)
    setCompareError(null)
  }

  const chooseFixture = (id: PublicFixtureId) => {
    setFixtureId(id)
    clearComparison()
  }

  const savePrompt = async () => {
    setSaving(true)
    try {
      saveTextFile(`${fixtureId}.prompt.json`, await PUBLIC_FIXTURES[fixtureId].loadPrompt())
    } finally {
      setSaving(false)
    }
  }

  const compare = async (file: File) => {
    clearComparison()
    const run = compareRun.current
    let text: string
    try {
      text = await readFileText(file)
    } catch (error) {
      if (run === compareRun.current) {
        setCompareError(`The file could not be read: ${describeCompareFailure(error)}`)
      }
      return
    }
    if (run !== compareRun.current) return

    let response: unknown
    try {
      response = JSON.parse(text)
    } catch (error) {
      setCompareError(`The file is not valid JSON: ${describeCompareFailure(error)}`)
      return
    }
    try {
      const expected: unknown = JSON.parse(await PUBLIC_FIXTURES[fixtureId].loadExpected())
      if (run === compareRun.current) setComparison(compareToExpected(response, expected))
    } catch (error) {
      if (run === compareRun.current) setCompareError(describeCompareFailure(error))
    }
  }

  const inspect = async (file: File) => {
    const run = ++evidenceRun.current
    setEvidence(null)
    setEvidenceError(null)
    setBinding(null)
    try {
      const text = await readFileText(file)
      if (run === evidenceRun.current) setEvidence(summarizeEvidence(JSON.parse(text)))
    } catch (error) {
      if (run === evidenceRun.current) setEvidenceError(describeCompareFailure(error))
    }
  }

  const checkResponseBytes = async (file: File) => {
    const expected = evidence?.responseSha256
    if (!expected) return
    const run = ++evidenceRun.current
    setBinding(null)
    try {
      const actual = await sha256Hex(new Uint8Array(await file.arrayBuffer()))
      if (run === evidenceRun.current) setBinding(actual === expected ? 'match' : 'mismatch')
    } catch {
      if (run === evidenceRun.current) setBinding('error')
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
                onClick={() => chooseFixture(id)}
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
            <Link to="/playground/hsm?tab=build&dtab=acvp" className="text-primary hover:underline">
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
          expectedResults.json NIST published for the same sample (the vector set chosen in A).
          Every answer NIST lists for a case must be present and equal: a case that has only its id,
          or lacks one answer, does not match. This local check exists only because the sample is
          public: for a vector set issued to an ACVTS session, only the server holds the expected
          answers.
        </p>
        <FilePick label="Load response.json" onFile={(file) => void compare(file)} />
        <div aria-live="polite" data-testid="ral-compare-live">
          {compareError ? (
            <div
              role="alert"
              className="space-y-1 text-status-error"
              data-testid="ral-compare-error"
            >
              <p>{compareError}</p>
              <p className="text-xs text-muted-foreground">
                Nothing was compared, so nothing is counted as a match. Fix the file, or load a
                response.json produced in step B.
              </p>
            </div>
          ) : null}
          {comparison ? (
            <div
              className="space-y-1 rounded-md border border-border bg-muted/30 p-3 text-xs"
              data-testid="ral-comparison"
            >
              <p className="font-semibold text-foreground" data-testid="ral-comparison-verdict">
                <FileCheck2 className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
                {isFullMatch(comparison)
                  ? `All ${comparison.expectedTotal} expected cases match NIST’s published sample answers.`
                  : `Not a full match: ${comparison.matched} of ${comparison.expectedTotal} expected cases match NIST’s published sample answers.`}
              </p>
              <p className="text-foreground" data-testid="ral-comparison-counts">
                {comparison.matched} matched ·{' '}
                {plural(nonmatchingCaseCount(comparison), 'case differs', 'cases differ')} (
                {plural(comparison.mismatched.length, 'field difference', 'field differences')}) ·{' '}
                {comparison.unanswered} unanswered · {comparison.unexpected.length} unexpected (of{' '}
                {comparison.expectedTotal} expected, {PUBLIC_FIXTURES[fixtureId].label})
              </p>
              <p className="text-muted-foreground">
                A case differs when an answer is missing, wrong, or not valid for its type. The
                number of field differences counts answers, not cases. “Unanswered” cases are
                expected cases that response.json does not contain, for example groups the prototype
                marked unsupported; their absence alone does not say why. They are neither passes
                nor wrong answers, and a vector set with unanswered cases could not reach the
                “passed” disposition on an ACVP server. “Unexpected” cases are in your file but not
                in the sample.
              </p>
              <p className="text-muted-foreground">
                This compares only with NIST’s published sample answers. It is not an ACVTS server
                verdict, a validation or a certificate.
              </p>
              {comparison.mismatched.slice(0, MAX_LISTED).map((m) => (
                <p key={`${m.tgId}-${m.tcId}-${m.field}`} className="text-status-error">
                  {describeMismatch(m)}
                </p>
              ))}
              {comparison.mismatched.length > MAX_LISTED ? (
                <p className="text-muted-foreground">
                  …and {comparison.mismatched.length - MAX_LISTED} more field differences.
                </p>
              ) : null}
              {comparison.unexpected.slice(0, MAX_LISTED).map((u) => (
                <p key={`unexpected-${u.tgId}-${u.tcId}`} className="text-status-error">
                  tgId {u.tgId} / tcId {u.tcId}: not in the sample
                </p>
              ))}
              {comparison.unexpected.length > MAX_LISTED ? (
                <p className="text-muted-foreground">
                  …and {comparison.unexpected.length - MAX_LISTED} more cases not in the sample.
                </p>
              ) : null}
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
              The SHA-256 of the exact response.json bytes. Comparing it with a response file can
              detect changes while the reviewer keeps the same evidence file.
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
              For a public sample only: how many cases match NIST&rsquo;s published expected
              results, how many answer fields differ or are missing (a count of fields, not cases)
              and how many cases are unanswered. For a prompt issued to a laboratory the expected
              answers are not supplied: the ACVTS server holds them. A file made in the browser
              carries no NIST comparison; step C shows the match count instead.
            </dd>
          </dl>
        </details>
        <FilePick label="Load evidence.json" onFile={(file) => void inspect(file)} />
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
              <dt className="text-muted-foreground">recorded response SHA-256</dt>
              <dd className="min-w-0 break-all font-mono text-foreground">
                {evidence.responseSha256 ?? 'No valid response SHA-256 in this file'}
              </dd>
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
                    {evidence.golden.matched} matched ·{' '}
                    {plural(evidence.golden.mismatched, 'field difference', 'field differences')} ·{' '}
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
        {evidence?.responseSha256 ? (
          <div className="space-y-2">
            <p className="text-foreground/80">
              Check the downloaded response against this evidence file. The digest checks byte
              consistency. Engine identity and official ACVTS results require separate evidence.
            </p>
            <FilePick
              label="Check response.json bytes"
              onFile={(file) => void checkResponseBytes(file)}
            />
            <div aria-live="polite" data-testid="ral-response-binding">
              {binding === 'match' && (
                <p className="font-semibold text-foreground">
                  The selected response bytes match the SHA-256 in this evidence file.
                </p>
              )}
              {binding === 'mismatch' && (
                <p className="font-semibold text-status-error">
                  The selected response bytes differ from the SHA-256 in this evidence file.
                </p>
              )}
              {binding === 'error' && (
                <p className="text-status-error">The response could not be read or hashed.</p>
              )}
            </div>
          </div>
        ) : null}
        <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-xs text-foreground/80">
          <p className="font-semibold text-primary">Try this</p>
          <p>
            Save the ML-DSA sample, open it in a text editor, change one hex digit of any test
            case’s <code>message</code>, save it under a new name and run it through B again. A
            response still generates — but evidence.json now says{' '}
            <code>unverified-imported-vector-set</code>, because the file’s SHA-256 no longer
            matches the pinned NIST sample. The evidence still describes the run. The edited prompt
            has lost its byte match to the published sample.
          </p>
        </div>
      </section>
    </div>
  )
}
