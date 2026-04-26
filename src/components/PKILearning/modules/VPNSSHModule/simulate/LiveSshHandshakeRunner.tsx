// SPDX-License-Identifier: GPL-3.0-only
//
// LiveSshHandshakeRunner — runs the same softhsmv3-driven SSH handshake the
// playground tool uses (sshEngine), and overlays the live byte-counts on the
// static spec values shown in the parent simulator. Wraps itself in a local
// HsmProvider so the Learn module doesn't need to share the playground's
// provider tree.

import { useCallback, useEffect, useState } from 'react'
import { Play, RotateCcw, ShieldCheck, ShieldAlert, AlertCircle, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { HsmProvider, useHsmContext } from '@/components/Playground/hsm/HsmContext'
import { sshEngine, type SshHandshakeResult } from '@/wasm/openssh'
import {
  SSH_KEX_SIZES,
  type SSHKexAlgorithm,
} from '@/components/PKILearning/modules/VPNSSHModule/data/sshConstants'

interface Props {
  algorithm: SSHKexAlgorithm
}

/** Map the data-layer algorithm id to the engine mode. The engine currently
 *  runs two real modes; sntrup761 falls back to spec-only because the KEM
 *  isn't bundled in this build. */
function algoToMode(algo: SSHKexAlgorithm): 'classical' | 'pqc' | 'spec-only' {
  if (algo === 'curve25519-sha256') return 'classical'
  if (algo === 'mlkem768x25519-sha256') return 'pqc'
  return 'spec-only'
}

function CompareCell({
  label,
  spec,
  live,
  unit = 'B',
}: {
  label: string
  spec: number
  live: number | null
  unit?: string
}) {
  const matches = live !== null && live === spec
  return (
    <div className="rounded border border-border/60 bg-muted/20 p-2.5 space-y-0.5">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-sm font-mono text-foreground">
        {spec.toLocaleString()} {unit}
        <span className="text-[10px] text-muted-foreground"> spec</span>
      </p>
      {live !== null && (
        <p
          className={`text-xs font-mono ${matches ? 'text-status-success' : 'text-status-warning'}`}
        >
          {matches ? '✓' : '≠'} {live.toLocaleString()} {unit}
          <span className="text-[10px]"> live</span>
        </p>
      )}
    </div>
  )
}

function RunnerInner({ algorithm }: Props) {
  const { moduleRef, hSessionRef, isReady, autoInit } = useHsmContext()
  const [phase, setPhase] = useState<'idle' | 'initializing' | 'running' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<SshHandshakeResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string>()

  const mode = algoToMode(algorithm)
  const sizes = SSH_KEX_SIZES.find((s) => s.id === algorithm)

  // Reset live result whenever the user picks a different algorithm.
  useEffect(() => {
    setResult(null)
    setErrorMsg(undefined)
    setPhase('idle')
  }, [algorithm])

  const run = useCallback(async () => {
    if (mode === 'spec-only') return
    setResult(null)
    setErrorMsg(undefined)
    sshEngine.terminate()

    try {
      if (!isReady || !moduleRef.current || !hSessionRef.current) {
        setPhase('initializing')
        const ok = await autoInit('rust')
        if (!ok || !moduleRef.current || !hSessionRef.current) {
          throw new Error('softhsmv3 initialization failed')
        }
      }
      sshEngine.bindHsm({ module: moduleRef.current, hSession: hSessionRef.current })
      setPhase('running')
      const r = await sshEngine.runHandshake(mode)
      setResult(r)
      setPhase('done')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err))
      setPhase('error')
    }
  }, [autoInit, hSessionRef, isReady, mode, moduleRef])

  const handleReset = useCallback(() => {
    sshEngine.terminate()
    setResult(null)
    setErrorMsg(undefined)
    setPhase('idle')
  }, [])

  if (!sizes) return null

  if (mode === 'spec-only') {
    return (
      <div className="rounded-lg border border-border/40 bg-muted/30 p-4 space-y-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-muted-foreground" />
          <h4 className="text-sm font-semibold text-foreground">Live execution unavailable</h4>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          The byte sizes shown above come from{' '}
          <span className="font-mono text-foreground">{sizes.id}</span>&apos;s spec
          (draft-josefsson-ntruprime-ssh). The sntrup761 KEM isn&apos;t bundled in this build (it
          would require an additional crypto library outside our dependency set), so the shared SSH
          engine can&apos;t execute it. Pick{' '}
          <span className="font-mono text-foreground">curve25519-sha256</span> or{' '}
          <span className="font-mono text-foreground">mlkem768x25519-sha256</span> above to run a
          real handshake.
        </p>
        <Link
          to="/playground/pqc-ssh-sim"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          <ExternalLink className="w-3 h-3" /> Open the full playground tool
        </Link>
      </div>
    )
  }

  const isRunning = phase === 'initializing' || phase === 'running'
  const runLabel =
    phase === 'initializing'
      ? 'Initializing softhsmv3…'
      : phase === 'running'
        ? 'Running real handshake…'
        : 'Run live handshake'

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <div>
            <h4 className="text-sm font-semibold text-foreground">Live execution</h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Same softhsmv3-driven engine the{' '}
              <Link
                to="/playground/pqc-ssh-sim"
                className="text-primary hover:underline inline-flex items-center gap-0.5"
              >
                playground tool
                <ExternalLink className="w-2.5 h-2.5" />
              </Link>{' '}
              uses. Confirms the spec values above against real PKCS#11 output.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="gradient"
            onClick={run}
            disabled={isRunning}
            aria-label="Run live SSH handshake"
          >
            <Play className="w-3 h-3 mr-1" /> {runLabel}
          </Button>
          <Button size="sm" variant="outline" onClick={handleReset} disabled={isRunning}>
            <RotateCcw className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-start gap-2 px-2.5 py-1.5 rounded bg-status-error/10 border border-status-error/30 text-status-error text-xs">
          <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
          <span className="font-mono">{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <CompareCell
          label="KEX init share"
          spec={sizes.clientKexDHInitBytes}
          live={result?.kex_share_bytes ?? null}
        />
        <CompareCell
          label="KEX reply share"
          spec={sizes.serverKexDHReplyBytes}
          live={result?.kex_reply_share_bytes ?? null}
        />
        <CompareCell
          label="Pub component"
          spec={sizes.publicKeyBytes}
          live={
            result ? (mode === 'pqc' ? result.kex_share_bytes - 32 : result.kex_share_bytes) : null
          }
        />
        <CompareCell
          label="Wall-time (live only)"
          spec={0}
          live={result ? Math.round(result.auth_ms) : null}
          unit="ms"
        />
      </div>

      {result && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-muted-foreground">
          <div className="rounded border border-border/40 bg-muted/30 p-2">
            <p>keygen: {result.keygen_ms.toFixed(1)} ms</p>
          </div>
          <div className="rounded border border-border/40 bg-muted/30 p-2">
            <p>kex: {result.kex_ms.toFixed(1)} ms</p>
          </div>
          <div className="rounded border border-border/40 bg-muted/30 p-2">
            <p>host sig: {result.host_sig_ms.toFixed(1)} ms</p>
          </div>
          <div className="rounded border border-border/40 bg-muted/30 p-2">
            <p>client sig: {result.client_sig_ms.toFixed(1)} ms</p>
          </div>
        </div>
      )}

      <p className="text-[10px] text-muted-foreground italic">
        Spec sizes from{' '}
        <span className="font-mono text-foreground">
          src/components/PKILearning/modules/VPNSSHModule/data/sshConstants.ts
        </span>
        . Live values come from the shared <span className="font-mono">sshEngine</span> (
        <span className="font-mono">src/wasm/openssh.ts</span>) — every byte and every millisecond
        is a real PKCS#11 call against softhsmv3.
      </p>
    </div>
  )
}

export function LiveSshHandshakeRunner(props: Props) {
  return (
    <HsmProvider>
      <RunnerInner {...props} />
    </HsmProvider>
  )
}
