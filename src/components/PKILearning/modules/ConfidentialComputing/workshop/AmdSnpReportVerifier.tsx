// SPDX-License-Identifier: AGPL-3.0-only
import React, { useCallback, useMemo, useState } from 'react'
import { CheckCircle, XCircle, Info, RotateCcw, ShieldCheck, FlaskConical } from 'lucide-react'
import { ml_kem768 } from '@noble/post-quantum/ml-kem.js'
import { bytesToHex } from '@noble/hashes/utils.js'
import { Button } from '@/components/ui/button'
import { AMD_SNP_SAMPLE_SOURCE } from '@/data/attestation-samples/amdSnpMilanSample'
import { loadAmdSnpSampleEvidence } from './amdSnpSampleEvidence'
import {
  ChallengeLedger,
  DEFAULT_POLICY,
  RECORDED_CHALLENGE,
  TAMPER_OFFSET_GUEST_SVN,
  buildAttackerEvidence,
  channelEstablished,
  flipBit,
  policyWithWrongMeasurement,
  verifySnpEvidence,
  type CheckResult,
  type VerificationResult,
} from './amdSnpVerifier'
import {
  SIMULATED_LABEL,
  bindingDigest,
  channelStatement,
  checkChannelBinding,
  type BindingCheck,
} from './channelBinding'

type Row = Pick<CheckResult, 'label' | 'passed' | 'attributedTo' | 'detail'> & { id: string }

const BINDING_CONTEXT = 'tee-hsm-kek-v1'

const ResultRows: React.FC<{ rows: Row[]; testIdPrefix: string }> = ({ rows, testIdPrefix }) => (
  <ul className="space-y-2">
    {rows.map((c) => (
      <li
        key={c.id}
        data-testid={`${testIdPrefix}-${c.id}`}
        className="flex items-start gap-2 text-xs border border-border rounded p-2"
      >
        {c.passed ? (
          <CheckCircle size={14} className="text-status-success shrink-0 mt-0.5" aria-hidden />
        ) : (
          <XCircle size={14} className="text-status-error shrink-0 mt-0.5" aria-hidden />
        )}
        <div className="min-w-0">
          <div className="font-bold text-foreground">
            <span className={c.passed ? 'text-status-success' : 'text-status-error'}>
              {c.passed ? 'PASS' : 'FAIL'}
            </span>{' '}
            {c.label}
          </div>
          <div className="text-muted-foreground">Ran: {c.attributedTo}</div>
          <div className="text-muted-foreground break-words">{c.detail}</div>
        </div>
      </li>
    ))}
  </ul>
)

interface BindingScenario {
  key: 'right' | 'wrong-key' | 'swapped-ciphertext'
  title: string
  checks: BindingCheck[]
  expectedToFail: boolean
}

export const AmdSnpReportVerifier: React.FC = () => {
  const evidence = useMemo(() => loadAmdSnpSampleEvidence(), [])
  const newLedger = useCallback(() => {
    const l = new ChallengeLedger()
    l.issue(RECORDED_CHALLENGE)
    return l
  }, [])
  const [ledger, setLedger] = useState<ChallengeLedger>(newLedger)
  const [scenario, setScenario] = useState<string | null>(null)
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [binding, setBinding] = useState<BindingScenario[] | null>(null)

  const run = useCallback(
    async (name: string, task: (l: ChallengeLedger) => Promise<VerificationResult>, own = true) => {
      setError(null)
      try {
        const l = own ? newLedger() : ledger
        const r = await task(l)
        if (own) setLedger(l)
        setScenario(name)
        setResult(r)
      } catch (e) {
        setError(`Could not run "${name}": ${(e as Error).message}`)
      }
    },
    [ledger, newLedger]
  )

  const appraiseAsIs = () =>
    run(
      "Appraise the recorded report (uses the verifier's one outstanding challenge)",
      (l) => verifySnpEvidence(evidence, DEFAULT_POLICY, l),
      false
    )
  const reset = () => {
    setLedger(newLedger())
    setResult(null)
    setScenario(null)
    setError(null)
  }
  const flip = () =>
    run('One bit of the signed report flipped (guest_svn, byte 0x04)', (l) =>
      verifySnpEvidence(flipBit(evidence, TAMPER_OFFSET_GUEST_SVN), DEFAULT_POLICY, l)
    )
  const wrongMeasurement = () =>
    run('Verifier pins a different measurement (one bit differs)', (l) =>
      verifySnpEvidence(evidence, policyWithWrongMeasurement(DEFAULT_POLICY), l)
    )
  const attacker = () =>
    run(
      'Report re-signed with a key generated in this browser, with a certificate for that key',
      async (l) => verifySnpEvidence(await buildAttackerEvidence(evidence), DEFAULT_POLICY, l)
    )

  const runBinding = () => {
    setError(null)
    try {
      const enclave = ml_kem768.keygen()
      const stranger = ml_kem768.keygen()
      const reportData = bindingDigest(enclave.publicKey, RECORDED_CHALLENGE, BINDING_CONTEXT)
      const sent = ml_kem768.encapsulate(enclave.publicKey)
      const committed = channelStatement(reportData, sent.cipherText)
      const swapped = ml_kem768.encapsulate(enclave.publicKey).cipherText
      const base = {
        reportData,
        recipientEk: enclave.publicKey,
        challenge: RECORDED_CHALLENGE,
        context: BINDING_CONTEXT,
        ciphertext: sent.cipherText,
        committedStatement: committed,
      }
      setBinding([
        {
          key: 'right',
          title: 'Right recipient key, the ciphertext that was committed',
          checks: checkChannelBinding(base).checks,
          expectedToFail: false,
        },
        {
          key: 'wrong-key',
          title: 'Wrong recipient key (a different ML-KEM-768 key)',
          checks: checkChannelBinding({ ...base, recipientEk: stranger.publicKey }).checks,
          expectedToFail: true,
        },
        {
          key: 'swapped-ciphertext',
          title: `Different ciphertext of the same length (${swapped.length} bytes)`,
          checks: checkChannelBinding({ ...base, ciphertext: swapped }).checks,
          expectedToFail: true,
        },
      ])
    } catch (e) {
      setError(`Could not run the simulated binding step: ${(e as Error).message}`)
    }
  }

  const gate = useMemo(() => {
    if (!result || !binding) return null
    return channelEstablished(result, binding[0].checks)
  }, [result, binding])

  const r = result?.report
  return (
    <div className="glass-panel p-4 space-y-4" data-testid="amd-snp-verifier">
      <div>
        <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
          <ShieldCheck size={16} className="text-primary" aria-hidden />
          Verify a real AMD SEV-SNP attestation report
        </h4>
        <p className="text-xs text-muted-foreground mt-1">
          The checks below run in your browser on the recorded bytes, with WebCrypto and the
          Hub&apos;s certificate library. Each check passes or fails on its own and says what ran.
        </p>
      </div>

      <div
        className="bg-status-warning/10 border border-status-warning/30 rounded p-3 text-xs text-foreground space-y-1"
        data-testid="amd-sample-disclosure"
      >
        <div className="flex items-center gap-1 font-bold">
          <Info size={12} aria-hidden /> What this sample is
        </div>
        <p>
          This is a recorded AMD SEV-SNP report from the open-source project{' '}
          <a
            className="text-primary underline"
            href={AMD_SNP_SAMPLE_SOURCE.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {AMD_SNP_SAMPLE_SOURCE.project}
          </a>{' '}
          (Apache-2.0, commit {AMD_SNP_SAMPLE_SOURCE.commit.slice(0, 8)}). It is not produced by PQC
          Today, not a live report from a machine you control, and not a vendor claim about this
          page. The challenge in it is therefore the recorded one (bytes 01 02 03 04 05, then
          zeros), not a fresh value issued by this page, so the page is replaying a recorded
          session.
        </p>
        <p>
          AMD signs the report with ECDSA P-384 and its certificates use RSA-4096 with PSS padding.
          Nothing in this real evidence is ML-DSA or ML-KEM: today&apos;s vendor attestation is not
          post-quantum. The pinned measurement is only what that one recorded VM measured; it is not
          a known-good image from a vendor registry. The sample&apos;s VCEK certificate is valid
          until 2029-09-24; after that date the validity check fails, as it should.
        </p>
        <p data-testid="amd-not-appraised">
          Not appraised here: the guest policy (this sample&apos;s policy allows debugging, bit 19,
          which a real relying party would normally refuse), revocation lists, a minimum TCB level,
          the certificate product and CA fields, and VLEK-signed reports. Passing the checks below
          shows the report is genuine and matches this page&apos;s pins, not that the guest is safe
          to trust.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="gradient" size="sm" onClick={appraiseAsIs}>
          Appraise recorded report
        </Button>
        <Button variant="outline" size="sm" onClick={flip}>
          Flip one bit
        </Button>
        <Button variant="outline" size="sm" onClick={wrongMeasurement}>
          Pin a different measurement
        </Button>
        <Button variant="outline" size="sm" onClick={attacker}>
          Re-sign with an attacker key
        </Button>
        <Button variant="outline" size="sm" onClick={reset}>
          <RotateCcw size={14} className="mr-1" aria-hidden />
          Reset verifier
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground">
        The verifier holds one outstanding challenge and accepts it once. Press &quot;Appraise
        recorded report&quot; twice to see the second presentation rejected as a replay; &quot;Reset
        verifier&quot; issues the recorded challenge again. The three negative buttons each start
        from a fresh verifier so only the one thing they change can fail.
      </p>

      {error && (
        <div role="alert" className="text-xs text-status-error">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-2" data-testid="amd-snp-result" aria-live="polite">
          <div className="text-xs font-bold text-foreground">{scenario}</div>
          <ResultRows rows={result.checks} testIdPrefix="amd-check" />
          <div
            className={`text-xs font-bold ${result.allPassed ? 'text-status-success' : 'text-status-error'}`}
            data-testid="amd-overall"
          >
            {result.allPassed
              ? 'All six real checks passed.'
              : `Not accepted: ${result.checks
                  .filter((c) => !c.passed)
                  .map((c) => c.id)
                  .join(', ')} failed.`}
          </div>
          {r && (
            <div className="text-[11px] text-muted-foreground font-mono break-all">
              measurement {bytesToHex(r.measurement).slice(0, 32)}... · policy 0x
              {r.policy.toString(16)} (debug allowed: {(r.policy >> 19n) & 1n ? 'yes' : 'no'}) ·
              VMPL {r.vmpl} · TCB bootloader {r.reportedTcb.bl}, TEE {r.reportedTcb.tee}, SNP{' '}
              {r.reportedTcb.snp}, microcode {r.reportedTcb.ucode}
            </div>
          )}
        </div>
      )}

      <div className="border-t border-border pt-4 space-y-3" data-testid="amd-binding-section">
        <h5 className="text-sm font-bold text-foreground flex items-center gap-2">
          <FlaskConical size={14} className="text-status-warning" aria-hidden />
          Channel binding to a post-quantum key (SIMULATED)
        </h5>
        <p className="text-xs text-muted-foreground" data-testid="amd-binding-label">
          {SIMULATED_LABEL}. The recorded report&apos;s report_data is fixed, so this step computes
          the value a TEE would place there: report_data = SHA-512(ML-KEM-768 encapsulation key ||
          challenge || context). The ML-KEM keys and ciphertexts are real (generated here); the
          report_data is computed by this page, not signed by AMD hardware.
        </p>
        <Button variant="outline" size="sm" onClick={runBinding}>
          Run simulated binding step
        </Button>
        {binding && (
          <div className="space-y-3" data-testid="amd-binding-result" aria-live="polite">
            {binding.map((s) => (
              <div key={s.key}>
                <div className="text-xs font-bold text-foreground mb-1">
                  {s.title}{' '}
                  <span className="text-muted-foreground font-normal">
                    ({s.expectedToFail ? 'expected to fail' : 'expected to pass'}; simulated)
                  </span>
                </div>
                <ResultRows rows={s.checks} testIdPrefix={`binding-${s.key}`} />
              </div>
            ))}
          </div>
        )}
        {gate && (
          <div
            data-testid="amd-gate"
            className={`text-xs font-bold ${gate.established ? 'text-status-success' : 'text-status-error'}`}
          >
            Key-transport gate for the last appraisal: {gate.established ? 'OPEN' : 'CLOSED'}
            {gate.failed.length > 0 && ` (failed: ${gate.failed.join(', ')})`}
            {gate.missing.length > 0 && ` (not run: ${gate.missing.join(', ')})`}. The gate needs
            all six real checks and both simulated binding checks; a signature check on its own
            never opens it.
          </div>
        )}
        {!gate && (
          <div className="text-[11px] text-muted-foreground" data-testid="amd-gate-pending">
            The key-transport gate opens only after an appraisal and the binding step have both run
            and every check passed.
          </div>
        )}
      </div>
    </div>
  )
}
