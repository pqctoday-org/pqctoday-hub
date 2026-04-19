// SPDX-License-Identifier: GPL-3.0-only
//
// SshSimulationPanel — Playground tool PT-SSH-PQC.
//
// Faithful in-browser port of sandbox's SSH scenario:
//   OpenSSH 10.x WASM + softhsmv3 PKCS#11 + SAB socket shim.
// Two workers (ssh client + sshd) run back-to-back: classical then PQC.
// Results fed into SshComparisonPanel, wire packets shown in a hex tab.

import { useState, useCallback, useRef } from 'react'
import { Terminal, Play, RotateCcw, AlertCircle, BookOpen } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'

import { ChromiumGateBanner, useChromiumGate } from '@/components/shared/ChromiumGateBanner'
import { SshComparisonPanel } from './SshComparisonPanel'
import { SshLearnSection } from './SshLearnSection'
import { sshEngine, type SshHandshakeEvent, type SshHandshakeResult } from '@/wasm/openssh'
import type { Pkcs11LogEntry } from '@/wasm/softhsm'
import { Pkcs11LogPanel } from '@/components/shared/Pkcs11LogPanel'

interface LogEntry {
  ts: string
  level: 'info' | 'error'
  text: string
}

function ts() {
  return new Date().toISOString().slice(11, 23)
}

export function SshSimulationPanel() {
  const [phase, setPhase] = useState<
    'idle' | 'running-classical' | 'running-pqc' | 'done' | 'error'
  >('idle')
  const [classicalResult, setClassicalResult] = useState<SshHandshakeResult | undefined>()
  const [pqcResult, setPqcResult] = useState<SshHandshakeResult | undefined>()
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [pkcs11Calls, setPkcs11Calls] = useState<Pkcs11LogEntry[]>([])
  const [errorMsg, setErrorMsg] = useState<string>()
  const eventListenerRef = useRef<((e: SshHandshakeEvent) => void) | null>(null)

  const appendLog = useCallback((text: string, level: 'info' | 'error' = 'info') => {
    setLogs((prev) => [...prev.slice(-200), { ts: ts(), level, text }])
  }, [])

  const appendPkcs11 = useCallback((entry: Pkcs11LogEntry) => {
    setPkcs11Calls((prev) => [...prev.slice(-200), entry])
  }, [])

  const runHandshakes = useCallback(async () => {
    setPhase('idle')
    setClassicalResult(undefined)
    setPqcResult(undefined)
    setLogs([])
    setPkcs11Calls([])
    setErrorMsg(undefined)
    sshEngine.terminate()

    if (eventListenerRef.current) {
      sshEngine.removeEventListener(eventListenerRef.current)
    }

    const handler = (e: SshHandshakeEvent) => {
      if (e.type === 'pkcs11_structured') {
        try {
          const entry = JSON.parse(e.payload) as Pkcs11LogEntry
          appendPkcs11(entry)
        } catch {
          // malformed structured event — ignore
        }
        return
      }
      appendLog(`[${e.type}] ${e.payload}`)
    }
    eventListenerRef.current = handler
    sshEngine.addEventListener(handler)

    try {
      // ── Run 1: classical ──────────────────────────────────────────────────
      setPhase('running-classical')
      appendLog('Starting classical handshake (curve25519-sha256 + ssh-ed25519)…')
      const classical = await sshEngine.runHandshake('classical')
      setClassicalResult(classical)
      appendLog(
        `Classical done: connection_ok=${classical.connection_ok}, auth_ms=${classical.auth_ms.toFixed(1)}ms`
      )

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
    } finally {
      if (eventListenerRef.current) {
        sshEngine.removeEventListener(eventListenerRef.current)
        eventListenerRef.current = null
      }
    }
  }, [appendLog, appendPkcs11])

  const handleReset = useCallback(() => {
    sshEngine.terminate()
    setPhase('idle')
    setClassicalResult(undefined)
    setPqcResult(undefined)
    setLogs([])
    setPkcs11Calls([])
    setErrorMsg(undefined)
  }, [])

  const browserSupport = useChromiumGate()
  const isRunning = phase === 'running-classical' || phase === 'running-pqc'
  const runLabel =
    phase === 'running-classical'
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
            OpenSSH 10.x WASM — ML-KEM-768 × X25519 KEX (OpenSSH built-in PQC) + ML-DSA-65 host auth
            via softhsmv3 PKCS#11. Both client and server run in browser workers; no network or
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
            {phase === 'done' && '✓ Both handshakes complete'}
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
          {allWirePackets.length > 0 && (
            <TabsTrigger value="wire">Wire Packets ({allWirePackets.length})</TabsTrigger>
          )}
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
            log={pkcs11Calls}
            title="PKCS#11 Call Log"
            defaultOpen={true}
            showBeginnerMode={false}
            emptyMessage="No PKCS#11 calls yet — run a handshake to see activity."
          />
        </TabsContent>

        {allWirePackets.length > 0 && (
          <TabsContent value="wire">
            <div className="glass-panel p-3 h-64 overflow-y-auto font-mono text-xs space-y-2">
              {allWirePackets.map((pkt, i) => (
                <div key={i} className="flex gap-3 items-start border-b border-border/30 pb-1.5">
                  <span
                    className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      pkt.direction === 'c2s'
                        ? 'bg-primary/20 text-primary'
                        : 'bg-accent/20 text-accent'
                    }`}
                  >
                    {pkt.direction}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-foreground font-semibold">{pkt.msg_name}</span>
                      <span className="text-muted-foreground">({pkt.length} B)</span>
                    </div>
                    <p className="text-muted-foreground truncate">{pkt.hex_preview}</p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>

      <p className="text-xs text-muted-foreground">
        Keys are generated for educational purposes only and are discarded when the tool is reset.
      </p>
    </div>
  )
}
