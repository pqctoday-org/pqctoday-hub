// SPDX-License-Identifier: GPL-3.0-only
//
// SshSimulationPanel — Playground tool PT-SSH-PQC.
//
// Runs real softhsmv3 PKCS#11 SSH handshakes (classical baseline + a user-
// selectable PQC config) directly in the browser — no Web Workers, no network,
// no container required.

import { useState, useCallback, useMemo } from 'react'
import { ErrorAlert } from '@/components/ui/error-alert'
import { translateCryptoError } from '@/utils/cryptoErrorHint'
import {
  Terminal,
  Play,
  RotateCcw,
  BookOpen,
  ShieldCheck,
  Code,
  ArrowLeftRight,
  List,
  Columns,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'

import { ChromiumGateBanner, useChromiumGate } from '@/components/shared/ChromiumGateBanner'
import { SshComparisonPanel } from './SshComparisonPanel'
import { SshLearnSection } from './SshLearnSection'
import {
  sshEngine,
  SSH_KEX_OPTIONS,
  SSH_HOST_KEY_OPTIONS,
  type SshHandshakeResult,
  type SshWirePacket,
  type SshKexAlg,
  type SshHostKeyAlg,
} from '@/wasm/openssh'
import type { Pkcs11LogEntry } from '@/wasm/softhsm'
import { Pkcs11LogPanel } from '@/components/shared/Pkcs11LogPanel'
import { useHsmContext } from './HsmContext'

interface LogEntry {
  ts: string
  level: 'info' | 'error'
  text: string
}

function ts() {
  return new Date().toISOString().slice(11, 23)
}

const CLASSICAL_BASELINE = {
  kex: 'curve25519-sha256' as SshKexAlg,
  hostKey: 'ssh-ed25519' as SshHostKeyAlg,
}

export function SshSimulationPanel() {
  const { moduleRef, hSessionRef, isReady, autoInit } = useHsmContext()

  const [phase, setPhase] = useState<
    'idle' | 'initializing' | 'running-classical' | 'running-pqc' | 'done' | 'error'
  >('idle')
  const [pqcKex, setPqcKex] = useState<SshKexAlg>('mlkem768-curve25519-sha256')
  const [pqcHostKey, setPqcHostKey] = useState<SshHostKeyAlg>('ssh-mldsa-65')
  const [classicalResult, setClassicalResult] = useState<SshHandshakeResult | undefined>()
  const [pqcResult, setPqcResult] = useState<SshHandshakeResult | undefined>()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [pkcs11Log, setPkcs11Log] = useState<Pkcs11LogEntry[]>([])
  const [errorMsg, setErrorMsg] = useState<string>()
  const [pkcs11BeginnerMode, setPkcs11BeginnerMode] = useState(true)
  const [wirePacketsView, setWirePacketsView] = useState<'list' | 'diagram' | 'compare'>('diagram')

  // PQC-family KEX options excluding the classical baseline (which is the
  // implicit comparison run).
  const pqcKexOptions = useMemo(() => SSH_KEX_OPTIONS.filter((o) => o.family !== 'classical'), [])
  // ML-DSA host-key options. Ed25519 stays on the classical baseline run and
  // is never paired with a PQC KEX in this simulator.
  const pqcHostKeyOptions = useMemo(
    () => SSH_HOST_KEY_OPTIONS.filter((o) => o.id !== 'ssh-ed25519'),
    []
  )

  const appendLog = useCallback((text: string, level: 'info' | 'error' = 'info') => {
    setLogs((prev) => [...prev.slice(-200), { ts: ts(), level, text }])
  }, [])

  const runHandshakes = useCallback(async () => {
    setPhase('idle')
    setClassicalResult(undefined)
    setPqcResult(undefined)
    setLogs([])
    setPkcs11Log([])
    setErrorMsg(undefined)
    sshEngine.terminate()

    try {
      // Ensure softhsmv3 is initialized
      if (!isReady || !moduleRef.current || !hSessionRef.current) {
        setPhase('initializing')
        appendLog('Initializing softhsmv3…')
        const ok = await autoInit('rust')
        if (!ok || !moduleRef.current || !hSessionRef.current) {
          throw new Error('softhsmv3 init failed')
        }
        appendLog('softhsmv3 ready.')
      }

      sshEngine.bindHsm({
        module: moduleRef.current,
        hSession: hSessionRef.current,
        onPkcs11: (e) => setPkcs11Log((prev) => [...prev.slice(-200), e]),
      })

      // ── Run 1: classical baseline ─────────────────────────────────────────
      setPhase('running-classical')
      appendLog(
        `Starting classical handshake (${CLASSICAL_BASELINE.kex} + ${CLASSICAL_BASELINE.hostKey})…`
      )
      const classical = await sshEngine.runHandshake(CLASSICAL_BASELINE)
      setClassicalResult(classical)
      appendLog(
        `Classical done: connection_ok=${classical.connection_ok}, auth_ms=${classical.auth_ms.toFixed(1)}ms`
      )

      // Re-bind between runs so the PQC run gets a fresh logging proxy
      if (moduleRef.current && hSessionRef.current) {
        sshEngine.bindHsm({
          module: moduleRef.current,
          hSession: hSessionRef.current,
          onPkcs11: (e) => setPkcs11Log((prev) => [...prev.slice(-200), e]),
        })
      }

      // ── Run 2: user-selected PQC config ───────────────────────────────────
      setPhase('running-pqc')
      appendLog(`Starting PQC handshake (${pqcKex} + ${pqcHostKey})…`)
      const pqc = await sshEngine.runHandshake({ kex: pqcKex, hostKey: pqcHostKey })
      setPqcResult(pqc)
      appendLog(`PQC done: connection_ok=${pqc.connection_ok}, auth_ms=${pqc.auth_ms.toFixed(1)}ms`)

      setPhase('done')
    } catch (err) {
      const msg = translateCryptoError(err instanceof Error ? err.message : String(err))
      setErrorMsg(msg)
      setPhase('error')
      appendLog(`Error: ${msg}`, 'error')
    }
  }, [appendLog, autoInit, hSessionRef, isReady, moduleRef, pqcKex, pqcHostKey])

  const handleReset = useCallback(() => {
    sshEngine.terminate()
    setPhase('idle')
    setClassicalResult(undefined)
    setPqcResult(undefined)
    setLogs([])
    setPkcs11Log([])
    setErrorMsg(undefined)
  }, [])

  const browserSupport = useChromiumGate()
  const isRunning =
    phase === 'initializing' || phase === 'running-classical' || phase === 'running-pqc'

  const runLabel =
    phase === 'initializing'
      ? 'Initializing softhsmv3…'
      : phase === 'running-classical'
        ? 'Running classical handshake…'
        : phase === 'running-pqc'
          ? 'Running PQC handshake…'
          : 'Run both handshakes'

  const allWirePackets = [
    ...(classicalResult?.wire_packets ?? []),
    ...(pqcResult?.wire_packets ?? []),
  ]

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Terminal className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-gradient">PQC SSH Simulator</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real softhsmv3 PKCS#11 SSH handshakes — pick any ML-KEM KEX (hybrid or pure) plus an
            ML-DSA host-key variant and compare it against the classical curve25519 + Ed25519
            baseline. All key material lives inside the softhsmv3 WASM token; no network or
            container required.
          </p>
        </div>
        <Link to="/learn/network-security-pqc">
          <Button variant="ghost" size="sm" className="shrink-0">
            <BookOpen className="w-4 h-4 mr-1" />
            Learn
          </Button>
        </Link>
      </div>

      {/* Learn section */}
      <SshLearnSection />

      {/* Browser gate */}
      <ChromiumGateBanner feature="PQC SSH handshake" />

      {/* PQC algorithm selectors */}
      <div className="glass-panel p-3 space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              PQC KEX Algorithm
            </span>
            <span className="text-[10px] text-muted-foreground">
              hybrid = classical ECDH ⊕ ML-KEM; pure = ML-KEM only (CNSA 2.0)
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {pqcKexOptions.map((opt) => (
              <Button
                key={opt.id}
                variant={pqcKex === opt.id ? 'default' : 'outline'}
                size="sm"
                disabled={isRunning}
                onClick={() => setPqcKex(opt.id)}
                className="h-7 text-[11px] font-mono"
                aria-pressed={pqcKex === opt.id}
              >
                {opt.id}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              PQC Host-Key Algorithm
            </span>
            <span className="text-[10px] text-muted-foreground">
              softhsmv3 generates and signs with the chosen ML-DSA parameter set
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {pqcHostKeyOptions.map((opt) => (
              <Button
                key={opt.id}
                variant={pqcHostKey === opt.id ? 'default' : 'outline'}
                size="sm"
                disabled={isRunning}
                onClick={() => setPqcHostKey(opt.id)}
                className="h-7 text-[11px] font-mono"
                aria-pressed={pqcHostKey === opt.id}
              >
                {opt.id}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="gradient"
          onClick={runHandshakes}
          disabled={isRunning || !browserSupport.supported}
          aria-label="Run SSH handshakes"
        >
          <Play className="w-4 h-4 mr-1" />
          {runLabel}
        </Button>
        <Button variant="outline" size="sm" onClick={handleReset} disabled={isRunning}>
          <RotateCcw className="w-4 h-4 mr-1" />
          Reset
        </Button>
        {phase !== 'idle' && (
          <span className="text-xs text-muted-foreground ml-2">
            {phase === 'done' && 'Both handshakes complete'}
            {phase === 'error' && '✗ Error — see logs'}
            {isRunning && '⏳ Running…'}
          </span>
        )}
        {phase === 'done' && (
          <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5 ml-auto">
            <RotateCcw size={14} />
            Run Again
          </Button>
        )}
      </div>

      {/* Error banner */}
      {errorMsg && <ErrorAlert message={errorMsg} />}

      {/* Hybrid KEX rationale (shown for hybrid PQC runs only) */}
      {(phase === 'running-pqc' || phase === 'done') &&
        pqcKex.includes('-curve25519-') === false &&
        pqcKex.includes('-nistp256-') === false && (
          <div className="my-4 flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-primary" />
            <div className="space-y-1">
              <p className="font-medium text-foreground">
                Pure ML-KEM mode: no classical fallback.
              </p>
              <p className="text-muted-foreground text-xs">
                <strong className="text-foreground">{pqcKex}</strong> runs ML-KEM alone, with no
                classical Diffie-Hellman component. This matches the CNSA 2.0 SSH profile target
                end-state but offers no algorithmic defense in depth: if ML-KEM is broken, the
                session key is exposed.
              </p>
            </div>
          </div>
        )}
      {(phase === 'running-pqc' || phase === 'done') &&
        (pqcKex.includes('-curve25519-') || pqcKex.includes('-nistp256-')) && (
          <div className="my-4 flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-primary" />
            <div className="space-y-1">
              <p className="font-medium text-foreground">Why hybrid? Defense in depth.</p>
              <p className="text-muted-foreground text-xs">
                <strong className="text-foreground">{pqcKex}</strong> combines a classical ECDH
                exchange with ML-KEM in a single key exchange. Both algorithms must be broken for
                the session key to be compromised.
              </p>
              <p className="text-muted-foreground text-xs">
                The classical leg protects against classical adversaries today. The ML-KEM leg
                protects against &quot;harvest now, decrypt later&quot; (HNDL) attacks by quantum
                computers.
              </p>
              <a
                href="https://datatracker.ietf.org/doc/draft-ietf-sshm-hybrid/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary underline hover:text-primary/80 flex items-center gap-0.5 w-fit"
              >
                draft-ietf-sshm-hybrid <ExternalLink size={9} />
              </a>
            </div>
          </div>
        )}

      {/* Comparison */}
      <SshComparisonPanel classical={classicalResult} pqc={pqcResult} />

      {/* Tabs: logs + PKCS#11 + wire packets */}
      <Tabs defaultValue="logs">
        <TabsList>
          <TabsTrigger value="logs">Handshake Log</TabsTrigger>
          <TabsTrigger value="pkcs11">PKCS#11 Calls</TabsTrigger>
          <TabsTrigger value="wire">
            Wire Packets{allWirePackets.length > 0 ? ` (${allWirePackets.length})` : ''}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="logs">
          <div className="glass-panel p-3 h-48 overflow-y-auto font-mono text-xs space-y-0.5">
            {logs.length === 0 ? (
              <p className="text-muted-foreground italic">
                Click &quot;Run both handshakes&quot; to start.
              </p>
            ) : (
              logs.map((entry, i) => (
                <div
                  key={i}
                  className={
                    entry.level === 'error' ? 'text-status-error' : 'text-muted-foreground'
                  }
                >
                  <span className="text-muted-foreground mr-2">{entry.ts}</span>
                  {entry.text}
                </div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="pkcs11">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border mb-2">
            <span className="text-xs font-medium text-muted-foreground">PKCS#11 CALLS</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPkcs11BeginnerMode((v) => !v)}
              className="h-6 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
            >
              {pkcs11BeginnerMode ? (
                <>
                  <Code size={11} /> Show raw
                </>
              ) : (
                <>
                  <BookOpen size={11} /> Show descriptions
                </>
              )}
            </Button>
          </div>
          <Pkcs11LogPanel
            log={pkcs11Log}
            title="SSH Simulator — PKCS#11 trace"
            defaultOpen={true}
            showBeginnerMode={pkcs11BeginnerMode}
            emptyMessage="No PKCS#11 calls yet — run a handshake to see activity."
          />
        </TabsContent>

        <TabsContent value="wire" className="flex flex-col gap-2">
          <div className="flex gap-1 p-2 border-b border-border/50">
            <Button
              variant={wirePacketsView === 'diagram' ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setWirePacketsView('diagram')}
            >
              <ArrowLeftRight size={11} /> Diagram
            </Button>
            <Button
              variant={wirePacketsView === 'list' ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setWirePacketsView('list')}
            >
              <List size={11} /> List
            </Button>
            {classicalResult &&
              classicalResult.wire_packets.length > 0 &&
              pqcResult &&
              pqcResult.wire_packets.length > 0 && (
                <Button
                  variant={wirePacketsView === 'compare' ? 'default' : 'outline'}
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => setWirePacketsView('compare')}
                >
                  <Columns size={11} /> Compare
                </Button>
              )}
          </div>
          <div className="glass-panel h-64 overflow-y-auto">
            {allWirePackets.length === 0 ? (
              <div className="p-3 font-mono text-xs text-muted-foreground italic">
                Run a handshake to populate the wire packet trace.
              </div>
            ) : wirePacketsView === 'diagram' ? (
              <div className="flex flex-col">
                {classicalResult && classicalResult.wire_packets.length > 0 && (
                  <div className="mb-4">
                    <div className="px-3 pt-3 text-xs font-semibold text-muted-foreground">
                      Classical Handshake
                    </div>
                    <WirePacketLadder packets={classicalResult.wire_packets} />
                  </div>
                )}
                {pqcResult && pqcResult.wire_packets.length > 0 && (
                  <div className="border-t border-border/30">
                    <div className="px-3 pt-3 text-xs font-semibold text-muted-foreground">
                      PQC Handshake
                    </div>
                    <WirePacketLadder packets={pqcResult.wire_packets} />
                  </div>
                )}
              </div>
            ) : wirePacketsView === 'compare' ? (
              <WirePacketCompare
                classical={classicalResult?.wire_packets || []}
                pqc={pqcResult?.wire_packets || []}
              />
            ) : (
              <div className="p-3 font-mono text-xs space-y-2">
                {allWirePackets.map((pkt, i) => (
                  <div key={i} className="flex gap-3 items-start border-b border-border/30 pb-1.5">
                    <span
                      className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        pkt.direction === 'C→S'
                          ? 'bg-primary/20 text-primary'
                          : 'bg-accent/20 text-accent'
                      }`}
                    >
                      {pkt.direction}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground font-semibold">{pkt.msgType}</span>
                        <span className="text-muted-foreground">
                          ({pkt.sizeBytes.toLocaleString()} B)
                        </span>
                      </div>
                      <p className="text-muted-foreground truncate">{pkt.hexPreview}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <p className="text-xs text-muted-foreground">
        Keys are generated for educational purposes only and are discarded when the tool is reset.
      </p>
    </div>
  )
}

const WirePacketLadder: React.FC<{ packets: SshWirePacket[] }> = ({ packets }) => (
  <div className="p-3 space-y-1.5 font-mono text-xs overflow-x-auto">
    <div className="flex justify-between text-[10px] text-muted-foreground mb-3 px-1">
      <span>CLIENT</span>
      <span>SERVER</span>
    </div>
    {packets.map((pkt, i) => (
      <div
        key={i}
        className={`flex items-center gap-2 ${
          pkt.direction === 'C→S' ? 'flex-row' : 'flex-row-reverse'
        }`}
      >
        <span className="shrink-0 w-24 text-[10px] text-primary truncate" title={pkt.msgType}>
          {pkt.msgType}
        </span>
        <div className="flex-1 flex items-center gap-0 relative">
          <div className="flex-1 border-t border-dashed border-muted-foreground/40" />
          <ChevronRight
            size={10}
            className={`text-muted-foreground shrink-0 ${pkt.direction === 'S→C' ? 'rotate-180' : ''}`}
          />
        </div>
        <span className="shrink-0 w-12 text-right text-[10px] text-muted-foreground">
          {pkt.sizeBytes}B
        </span>
      </div>
    ))}
  </div>
)

const WirePacketCompare: React.FC<{
  classical: SshWirePacket[]
  pqc: SshWirePacket[]
}> = ({ classical, pqc }) => {
  const rows = []
  const maxLen = Math.max(classical.length, pqc.length)
  for (let i = 0; i < maxLen; i++) {
    const c = classical[i]
    const p = pqc[i]
    rows.push(
      <div key={i} className="flex gap-4 border-b border-border/30 py-1 text-[10px] font-mono">
        <div className="flex-1 flex justify-between pr-4">
          {c ? <span className="text-primary truncate max-w-[120px]">{c.msgType}</span> : <span />}
          {c && <span className="text-muted-foreground">{c.sizeBytes}B</span>}
        </div>
        <div className="flex-1 flex justify-between border-l border-border/50 pl-4">
          {p ? <span className="text-primary truncate max-w-[120px]">{p.msgType}</span> : <span />}
          {p && (
            <span
              className={
                c && p.sizeBytes > c.sizeBytes
                  ? 'text-status-warning font-bold'
                  : 'text-muted-foreground'
              }
            >
              {p.sizeBytes}B
              {c && p.sizeBytes !== c.sizeBytes && ` (+${p.sizeBytes - c.sizeBytes}B)`}
            </span>
          )}
        </div>
      </div>
    )
  }
  return (
    <div className="p-3">
      <div className="flex gap-4 border-b border-border text-[10px] text-muted-foreground font-semibold pb-2 mb-2">
        <div className="flex-1">CLASSICAL</div>
        <div className="flex-1 border-l border-border/50 pl-4">PQC</div>
      </div>
      {rows}
    </div>
  )
}
