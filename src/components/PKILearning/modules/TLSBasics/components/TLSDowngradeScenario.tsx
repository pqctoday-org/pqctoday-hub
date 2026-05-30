// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState } from 'react'
import { Shield, ShieldOff, AlertTriangle, CheckCircle2, ArrowRight, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'

type ScenarioMode = 'normal' | 'attack' | 'defended'

interface Step {
  actor: 'client' | 'attacker' | 'server' | 'system'
  label: string
  detail: string
  isCompromised?: boolean
  isBlocked?: boolean
}

const SCENARIO_STEPS: Record<ScenarioMode, Step[]> = {
  normal: [
    {
      actor: 'client',
      label: 'ClientHello',
      detail:
        'Client advertises key_share entries: X25519 + ML-KEM-768 (hybrid X25519MLKEM768). Both classical and PQC options offered.',
    },
    {
      actor: 'server',
      label: 'ServerHello',
      detail:
        'Server selects X25519MLKEM768. Responds with its own key_share using both X25519 and ML-KEM-768 encapsulated key.',
    },
    {
      actor: 'system',
      label: 'Key derivation',
      detail:
        'Both sides derive the same shared secret: KDF(X25519_ss ∥ ML-KEM_ss). Session is quantum-safe — breaking X25519 alone is insufficient.',
    },
    {
      actor: 'client',
      label: 'Finished',
      detail:
        'Handshake completes. Session uses AES-256-GCM-SHA384 with a hybrid-derived key. Protected against both classical and quantum adversaries.',
    },
  ],
  attack: [
    {
      actor: 'client',
      label: 'ClientHello (original)',
      detail:
        'Client sends key_share with X25519 + ML-KEM-768. Client supports PQC and intends a hybrid connection.',
    },
    {
      actor: 'attacker',
      label: 'MITM intercept & strip',
      detail:
        'Attacker-in-the-middle intercepts the ClientHello and removes the ML-KEM-768 key_share entry before forwarding. The server only sees X25519.',
      isCompromised: true,
    },
    {
      actor: 'server',
      label: 'ServerHello (degraded)',
      detail:
        'Server sees only X25519 offered — it has no ML-KEM entry to select. Falls back to classical ECDH X25519 per TLS 1.3 negotiation rules.',
      isCompromised: true,
    },
    {
      actor: 'system',
      label: 'Classical session established',
      detail:
        'Session key derived from X25519 only. No ML-KEM contribution. This session is vulnerable to Harvest-Now-Decrypt-Later: an adversary recording the handshake can decrypt it with a quantum computer.',
      isCompromised: true,
    },
    {
      actor: 'attacker',
      label: 'Traffic harvested',
      detail:
        'Attacker records the ciphertext. Today it is unreadable — but once a CRQC (cryptographically-relevant quantum computer) exists, the X25519 key exchange can be broken and all session data decrypted.',
      isCompromised: true,
    },
  ],
  defended: [
    {
      actor: 'client',
      label: 'ClientHello',
      detail:
        'Client has PQ Lock cached from a prior session: server previously signalled PQC support. ClientHello includes X25519 + ML-KEM-768 as before.',
    },
    {
      actor: 'attacker',
      label: 'MITM attempts strip',
      detail:
        'Attacker intercepts and removes ML-KEM-768 from key_share, forwarding only X25519 to the server. Same attack as before.',
      isCompromised: true,
    },
    {
      actor: 'server',
      label: 'ServerHello (degraded)',
      detail:
        'Server falls back to X25519, unaware of the strip. Responds with a classical ServerHello.',
      isCompromised: true,
    },
    {
      actor: 'client',
      label: 'PQ Lock check',
      detail:
        'Client notices the server negotiated only X25519 but has PQ Lock cached for this server. The cached signal says: "this server supports PQC." A classical-only ServerHello is inconsistent.',
      isBlocked: true,
    },
    {
      actor: 'system',
      label: 'Connection aborted',
      detail:
        'Client aborts with a TLS alert. The downgrade attack is detected and blocked. The attacker cannot force a classical session without triggering the cache check. PQC Continuity (draft-sheffer-tls-pqc-continuity) extends this: the server pre-declares a downgrade limit (e.g. 1 year), cached by the client, closing the first-visit gap.',
      isBlocked: true,
    },
  ],
}

const ACTOR_COLORS: Record<Step['actor'], string> = {
  client: 'border-primary/50 bg-primary/5',
  server: 'border-accent/50 bg-accent/5',
  attacker: 'border-status-error/50 bg-status-error/5',
  system: 'border-border bg-muted/30',
}

const ACTOR_LABELS: Record<Step['actor'], string> = {
  client: 'Client (Browser)',
  server: 'Server',
  attacker: 'Attacker (MITM)',
  system: 'System',
}

function StepCard({ step, index }: { step: Step; index: number }) {
  const base = ACTOR_COLORS[step.actor]
  const borderExtra = step.isCompromised
    ? 'border-status-error'
    : step.isBlocked
      ? 'border-status-success'
      : ''

  return (
    <div className={`glass-panel p-4 border-l-4 ${base} ${borderExtra} space-y-1`}>
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          {ACTOR_LABELS[step.actor]}
        </span>
        {step.isCompromised && <AlertTriangle className="w-3.5 h-3.5 text-status-error" />}
        {step.isBlocked && <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">{index + 1}.</span>
        <span className="text-sm font-semibold text-foreground">{step.label}</span>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">{step.detail}</p>
    </div>
  )
}

export function TLSDowngradeScenario() {
  const [mode, setMode] = useState<ScenarioMode>('normal')

  const steps = SCENARIO_STEPS[mode]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-5">
        <div className="flex items-start gap-3">
          <ShieldOff className="w-5 h-5 text-status-error mt-0.5 shrink-0" />
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Quantum Downgrade Attack Scenario
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              An active MITM adversary intercepts the TLS ClientHello and removes the ML-KEM
              key_share entry, forcing both endpoints to negotiate a classical-only session — even
              when both support PQC. This is distinct from passive HNDL harvesting: the attack
              actively prevents PQC from being used.
            </p>
            <p className="text-xs text-muted-foreground mt-2 italic">
              Analysis by Bas Westerbaan (Cloudflare Research) · PQCrypto 2025 · Root Causes Podcast
              ep. 614
            </p>
          </div>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={mode === 'normal' ? 'gradient' : 'outline'}
          onClick={() => setMode('normal')}
          className="gap-2"
        >
          <CheckCircle2 className="w-4 h-4" />
          Normal Connection
        </Button>
        <Button
          variant={mode === 'attack' ? 'destructive' : 'outline'}
          onClick={() => setMode('attack')}
          className="gap-2"
        >
          <AlertTriangle className="w-4 h-4" />
          Under Attack
        </Button>
        <Button
          variant={mode === 'defended' ? 'secondary' : 'outline'}
          onClick={() => setMode('defended')}
          className="gap-2"
        >
          <Shield className="w-4 h-4" />
          With PQ Lock + Continuity
        </Button>
      </div>

      {/* Scenario description banner */}
      {mode === 'normal' && (
        <div className="glass-panel p-4 border-l-4 border-primary/50">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-status-success" />
            <span className="text-sm font-semibold">Hybrid X25519MLKEM768 — no attacker</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Both client and server negotiate X25519MLKEM768. The session is quantum-safe: an
            adversary recording the ciphertext cannot break it without both a classical compute
            break of X25519 AND a quantum break of ML-KEM-768.
          </p>
        </div>
      )}

      {mode === 'attack' && (
        <div className="glass-panel p-4 border-l-4 border-status-error">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-status-error" />
            <span className="text-sm font-semibold text-status-error">
              Downgrade attack — ML-KEM stripped from ClientHello
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            The attacker exploits <span className="font-semibold">maximum compatibility mode</span>:
            the server is configured to serve the best option offered by the client. By removing
            ML-KEM from the offer, the attacker forces the server to fall back to X25519 — and the
            server has no way to know the strip occurred. The resulting session is
            quantum-vulnerable.
          </p>
        </div>
      )}

      {mode === 'defended' && (
        <div className="glass-panel p-4 border-l-4 border-status-success">
          <div className="flex items-center gap-2 mb-1">
            <Lock className="w-4 h-4 text-status-success" />
            <span className="text-sm font-semibold">
              PQ Lock + PQC Continuity — attack detected and blocked
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold">PQ Lock</span> (HTTP-layer, Chromium): browser caches
            that this server supports PQC; future classical-only negotiations are rejected.{' '}
            <span className="font-semibold">PQC Continuity</span> (
            <code>draft-sheffer-tls-pqc-continuity</code>, Sheffer; Westerbaan et al.): server
            pre-declares a "downgrade limit" duration; client caches and enforces it across browser
            restarts, closing the first-visit attack gap that PQ Lock alone cannot address.
          </p>
        </div>
      )}

      {/* Step flow */}
      <div className="space-y-2">
        {steps.map((step, i) => (
          <React.Fragment key={i}>
            <StepCard step={step} index={i} />
            {i < steps.length - 1 && (
              <div className="flex justify-center">
                <ArrowRight className="w-4 h-4 text-muted-foreground rotate-90" />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Concept summary table */}
      <div className="glass-panel p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Mitigation Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Mechanism</th>
                <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Layer</th>
                <th className="text-left py-2 pr-4 text-muted-foreground font-medium">
                  Protects first visit?
                </th>
                <th className="text-left py-2 text-muted-foreground font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              <tr>
                <td className="py-2 pr-4 font-medium text-foreground">
                  Maximum Compatibility Mode
                </td>
                <td className="py-2 pr-4 text-muted-foreground">TLS negotiation</td>
                <td className="py-2 pr-4 text-status-error">✗ No protection</td>
                <td className="py-2 text-muted-foreground">Current default</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-medium text-foreground">PQ Lock / PQC HSTS</td>
                <td className="py-2 pr-4 text-muted-foreground">HTTP header (browser cache)</td>
                <td className="py-2 pr-4 text-status-warning">⚠ Only after first success</td>
                <td className="py-2 text-muted-foreground">Chromium (in-progress)</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-medium text-foreground">
                  PQC Continuity (downgrade limit)
                </td>
                <td className="py-2 pr-4 text-muted-foreground">TLS extension (server-signed)</td>
                <td className="py-2 pr-4 text-status-success">✓ Yes (cached duration)</td>
                <td className="py-2 text-muted-foreground">IETF draft (Sheffer; Westerbaan)</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-medium text-foreground">MTC public log audit</td>
                <td className="py-2 pr-4 text-muted-foreground">PKI transparency layer</td>
                <td className="py-2 pr-4 text-status-warning">⚠ Detection, not prevention</td>
                <td className="py-2 text-muted-foreground">IETF PLANTS WG (draft)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
