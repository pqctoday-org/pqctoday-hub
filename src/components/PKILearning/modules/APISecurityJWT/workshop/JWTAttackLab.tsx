// SPDX-License-Identifier: GPL-3.0-only

import React, { useCallback, useState } from 'react'
import { ShieldAlert, ShieldCheck, CheckCircle, XCircle, MinusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  LAB_ALG,
  LAB_AUDIENCE,
  LAB_ISSUER,
  LAB_TYP,
  type Scenario,
  type ScenarioId,
  buildScenarios,
  generateLabKey,
  labPolicy,
} from '../attackScenarios'
import { type ValidationResult, naiveVerify, validateJwt } from '../jwtValidation'
import { base64urlDecode, type JwsKeyPair } from '../jwtUtils'

interface Outcome {
  strict: ValidationResult
  naive: { accepted: boolean; reason: string }
}

function decode(b64: string): string {
  try {
    return JSON.stringify(JSON.parse(new TextDecoder().decode(base64urlDecode(b64))), null, 2)
  } catch {
    return '(not JSON)'
  }
}

export const JWTAttackLab: React.FC = () => {
  const [key, setKey] = useState<JwsKeyPair | null>(null)
  const [scenarios, setScenarios] = useState<Scenario[] | null>(null)
  const [now, setNow] = useState(0)
  const [selected, setSelected] = useState<ScenarioId>('legit')
  const [outcome, setOutcome] = useState<Outcome | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const run = useCallback(async (id: ScenarioId, k: JwsKeyPair, list: Scenario[], t: number) => {
    const s = list.find((x) => x.id === id)
    if (!s) return
    const [strict, naive] = await Promise.all([
      validateJwt(s.token, labPolicy(k.publicKey, t)),
      naiveVerify(s.token, k.publicKey),
    ])
    setOutcome({ strict, naive })
  }, [])

  const handleStart = useCallback(async () => {
    setBusy(true)
    setError(null)
    try {
      const t = Math.floor(Date.now() / 1000)
      const k = await generateLabKey()
      const list = await buildScenarios(k, t)
      setKey(k)
      setScenarios(list)
      setNow(t)
      setSelected('legit')
      await run('legit', k, list, t)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }, [run])

  const handleSelect = useCallback(
    async (id: ScenarioId) => {
      if (!key || !scenarios) return
      setSelected(id)
      setOutcome(null)
      await run(id, key, scenarios, now)
    },
    [key, scenarios, now, run]
  )

  const current = scenarios?.find((s) => s.id === selected)
  const [h, p, sig] = current ? current.token.split('.') : ['', '', '']

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-2">Attack Lab: Validating a JWT</h3>
        <p className="text-sm text-muted-foreground">
          A post-quantum signature only helps if the API checks it, and checks the right things.
          Each attack below is aimed at an API that accepts {LAB_ALG} access tokens from{' '}
          <code>{LAB_ISSUER}</code> for <code>{LAB_AUDIENCE}</code>. Two verifiers look at the same
          token: a <strong>strict validator</strong> that follows RFC 8725 (algorithm pinned to the
          key, then issuer, audience, expiry and token type), and a <strong>naive verifier</strong>{' '}
          that trusts the token&apos;s own <code>&quot;alg&quot;</code> and checks no claims. All
          signing and verification is real ML-DSA-65 in your browser.
        </p>
      </div>

      {!scenarios ? (
        <div className="flex justify-center">
          <Button
            variant="gradient"
            onClick={() => void handleStart()}
            disabled={busy}
            className="px-6 py-3 font-bold rounded-lg"
          >
            {busy ? 'Issuing tokens…' : 'Issue tokens and start the lab'}
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {scenarios.map((s) => (
            <Button
              key={s.id}
              variant="ghost"
              onClick={() => void handleSelect(s.id)}
              className={`px-3 py-1.5 rounded text-xs font-medium border ${
                selected === s.id
                  ? 'bg-primary/20 text-primary border-primary/50'
                  : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/30'
              }`}
            >
              {s.title}
            </Button>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-lg p-3 border border-destructive/50 bg-destructive/10 text-xs text-status-error">
          {error}
        </div>
      )}

      {current && (
        <div className="glass-panel p-4 space-y-3">
          <div className="text-sm text-foreground">
            <strong>{current.title}.</strong> {current.attack}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-[10px] font-bold text-primary mb-1">Header</div>
              <pre className="text-[10px] font-mono text-foreground/80 whitespace-pre-wrap break-all">
                {decode(h)}
              </pre>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="text-[10px] font-bold text-primary mb-1">Claims</div>
              <pre className="text-[10px] font-mono text-foreground/80 whitespace-pre-wrap break-all">
                {decode(p)}
              </pre>
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground">
            Signature:{' '}
            {sig ? `${base64urlDecode(sig).length.toLocaleString()} bytes` : 'empty (no signature)'}
          </div>
        </div>
      )}

      {outcome && current && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            className={`glass-panel p-4 border ${
              outcome.strict.valid ? 'border-success/40' : 'border-destructive/40'
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck size={16} className="text-primary" />
              <h4 className="text-sm font-bold text-foreground">Strict validator</h4>
              <span
                className={`ml-auto text-[10px] px-2 py-0.5 rounded border font-bold ${
                  outcome.strict.valid
                    ? 'bg-success/20 text-success border-success/50'
                    : 'bg-destructive/20 text-status-error border-destructive/50'
                }`}
              >
                {outcome.strict.valid ? 'Accepted' : 'Rejected'}
              </span>
            </div>
            <ul className="space-y-1.5">
              {outcome.strict.checks.map((c) => (
                <li key={c.id} className="flex items-start gap-2 text-xs">
                  {c.passed ? (
                    <CheckCircle size={14} className="text-success shrink-0 mt-0.5" />
                  ) : (
                    <XCircle size={14} className="text-status-error shrink-0 mt-0.5" />
                  )}
                  <span>
                    <span className="font-medium text-foreground">{c.label}</span>
                    <span className="text-muted-foreground"> — {c.detail}</span>
                  </span>
                </li>
              ))}
              {!outcome.strict.valid && (
                <li className="flex items-start gap-2 text-xs text-muted-foreground">
                  <MinusCircle size={14} className="shrink-0 mt-0.5" />
                  Later checks are not run once one fails.
                </li>
              )}
            </ul>
          </div>

          <div
            className={`glass-panel p-4 border ${
              outcome.naive.accepted && current.id !== 'legit'
                ? 'border-destructive/40'
                : 'border-border'
            }`}
          >
            <div className="flex items-center gap-2 mb-3">
              <ShieldAlert size={16} className="text-warning" />
              <h4 className="text-sm font-bold text-foreground">Naive verifier</h4>
              <span
                className={`ml-auto text-[10px] px-2 py-0.5 rounded border font-bold ${
                  outcome.naive.accepted
                    ? current.id === 'legit'
                      ? 'bg-success/20 text-success border-success/50'
                      : 'bg-destructive/20 text-status-error border-destructive/50'
                    : 'bg-muted text-muted-foreground border-border'
                }`}
              >
                {outcome.naive.accepted
                  ? current.id === 'legit'
                    ? 'Accepted'
                    : 'Fooled: accepted'
                  : 'Rejected'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{outcome.naive.reason}.</p>
            <p className="text-[10px] text-muted-foreground mt-3">
              The anti-pattern: it reads <code>&quot;alg&quot;</code> from the token and stops at
              the signature. RFC 8725 §3.1 says to pin the algorithm to the key instead, and to
              check issuer, audience and expiry on every token.
            </p>
          </div>
        </div>
      )}

      <div className="bg-muted/50 rounded-lg p-4 border border-border">
        <p className="text-xs text-muted-foreground">
          <strong>Key insight:</strong> moving from ES256 to ML-DSA protects the signature against a
          quantum computer, but none of these attacks touch the signature algorithm. They exploit
          what the API forgets to check. Explicit typing (<code>{`"typ": "${LAB_TYP}"`}</code>, RFC
          9068) is what stops an ID token being replayed as an access token.
        </p>
      </div>
    </div>
  )
}
