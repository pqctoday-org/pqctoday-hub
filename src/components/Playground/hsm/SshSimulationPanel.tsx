// SPDX-License-Identifier: GPL-3.0-only
//
// SshSimulationPanel — Playground tool PT-SSH-PQC.
//
// Runs real softhsmv3 PKCS#11 SSH handshakes (classical + PQC) directly in
// the browser — no Web Workers, no network, no container required.

import { useState, useCallback } from 'react'
import { Terminal, Play, RotateCcw, AlertCircle, BookOpen } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'

import { ChromiumGateBanner, useChromiumGate } from '@/components/shared/ChromiumGateBanner'
import { SshComparisonPanel } from './SshComparisonPanel'
import { SshLearnSection } from './SshLearnSection'
import { sshEngine, type SshHandshakeResult } from '@/wasm/openssh'
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

export function SshSimulationPanel() {
  const { moduleRef, hSessionRef, isReady, autoInit } = useHsmContext()

  const [phase, setPhase] = useState<
    'idle' | 'initializing' | 'running-classical' | 'running-pqc' | 'done' | 'error'
  >('idle')
  const [classicalResult, setClassicalResult] = useState<SshHandshakeResult | undefined>()
  const [pqcResult, setPqcResult] = useState<SshHandshakeResult | undefined>()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [pkcs11Log, setPkcs11Log] = useState<Pkcs11LogEntry[]>([])
  const [errorMsg, setErrorMsg] = useState<string>()

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

      // ── Run 1: classical ──────────────────────────────────────────────────
      setPhase('running-classical')
      appendLog('Starting classical handshake (curve25519-sha256 + ssh-ed25519)…')
      const classical = await sshEngine.runHandshake('classical')
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

      // ── Run 2: PQC ────────────────────────────────────────────────────────
      setPhase('running-pqc')
      appendLog('Starting PQC handshake (mlkem768x25519-sha256 + ssh-mldsa-65)…')
      const pqc = await sshEngine.runHandshake('pqc')
      setPqcResult(pqc)
      appendLog(`PQC done: connection_ok=${pqc.connection_ok}, auth_ms=${pqc.auth_ms.toFixed(1)}ms`)

      setPhase('done')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setErrorMsg(msg)
      setPhase('error')
      appendLog(`Error: ${msg}`, 'error')
    }
  }, [appendLog, autoInit, hSessionRef, isReady, moduleRef])

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
            Real softhsmv3 PKCS#11 SSH handshakes — ML-KEM-768 × X25519 hybrid KEX + ML-DSA-65 host
            auth. All key material lives inside the softhsmv3 WASM token; no network or container
            required.
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
      </div>

      {/* Error banner */}
      {errorMsg && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-status-error/10 border border-status-error/30 text-status-error text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="font-mono">{errorMsg}</span>
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
                  className={entry.level === 'error' ? 'text-status-error' : 'text-foreground/80'}
                >
                  <span className="text-muted-foreground mr-2">{entry.ts}</span>
                  {entry.text}
                </div>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="pkcs11">
          <Pkcs11LogPanel
            log={pkcs11Log}
            title="PKCS#11 Call Log"
            defaultOpen={true}
            showBeginnerMode={false}
            emptyMessage="No PKCS#11 calls yet — run a handshake to see activity."
          />
        </TabsContent>

        <TabsContent value="wire">
          <div className="glass-panel p-3 h-64 overflow-y-auto font-mono text-xs space-y-2">
            {allWirePackets.length === 0 ? (
              <p className="text-muted-foreground italic">
                Run a handshake to populate the wire packet trace.
              </p>
            ) : (
              allWirePackets.map((pkt, i) => (
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
              ))
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
