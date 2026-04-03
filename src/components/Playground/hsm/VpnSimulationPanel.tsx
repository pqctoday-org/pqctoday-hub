// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useCallback, useMemo } from 'react'
import { ArrowRight, ArrowLeft, RotateCcw, ShieldAlert, Cpu, CheckCircle } from 'lucide-react'
import {
  IKE_V2_MODES,
  IKE_V2_EXCHANGES,
  type IKEv2Mode,
  type IKEv2Payload,
} from '@/components/PKILearning/modules/VPNSSHModule/data/ikev2Constants'
import {
  strongSwanEngine,
  type StrongSwanLog,
  type StrongSwanState,
} from '@/wasm/strongswan/bridge'

export interface VpnSimulationPanelProps {
  initialMode?: IKEv2Mode
}

const PayloadCard: React.FC<{
  payload: IKEv2Payload
  index: number
  highlighted: boolean
  isFragmented?: boolean
}> = ({ payload, highlighted, isFragmented }) => (
  <div
    className={`rounded-lg p-2 border text-xs transition-all duration-300 ${
      highlighted
        ? isFragmented
          ? 'bg-destructive/10 border-destructive/40 shadow-[0_0_8px_hsl(var(--destructive)/0.15)] animate-pulse'
          : 'bg-primary/10 border-primary/40 shadow-[0_0_8px_hsl(var(--primary)/0.15)]'
        : 'bg-muted/50 border-border'
    }`}
  >
    <div className="flex items-center justify-between mb-1">
      <span className={`font-bold ${isFragmented ? 'text-destructive' : 'text-foreground'}`}>
        {payload.abbreviation}
      </span>
      <span className="text-muted-foreground">{payload.sizeBytes} B</span>
    </div>
    <p className="text-muted-foreground text-[10px]">{payload.description}</p>
    {isFragmented && (
      <div className="text-destructive text-[10px] mt-1 font-bold flex items-center gap-1">
        <ShieldAlert size={10} /> Packet dropped (Exceeds MTU)
      </div>
    )}
  </div>
)

export const VpnSimulationPanel: React.FC<VpnSimulationPanelProps> = ({ initialMode }) => {
  const [selectedMode, setSelectedMode] = useState<IKEv2Mode>(initialMode ?? 'classical')
  const [currentStep, setCurrentStep] = useState(0)
  const [mtu, setMtu] = useState<number>(1500)
  const [allowFragmentation, setAllowFragmentation] = useState<boolean>(true)
  const [ssState, setSsState] = useState<StrongSwanState>('UNINITIALIZED')
  const [ssLogs, setSsLogs] = useState<StrongSwanLog[]>([])

  const scrollRef = React.useRef<HTMLDivElement>(null)

  const defaultConfig = `charon {
  load = pkcs11
  modules {
    pkcs11 {
      path = libsofthsmv3.so
    }
  }
  filelog {
    /dev/stdout {
      time_format = %H:%M:%S
      default = 1
      mgr = 2
      ike = 2
      enc = 2
      cfg = 2
    }
  }
}`
  const defaultIpsec = `config setup
  strictcrlpolicy=no
conn %default
  ikelifetime=60m
  keylife=20m
  rekeymargin=3m
  keyingtries=1
conn host-host
  left=192.168.0.1
  right=192.168.0.2
  ike=aes256-mlkem768-sha384!
  esp=aes256gcm16!
  auto=start`

  const [activeConfig, setActiveConfig] = useState(defaultConfig)
  const [activeIpsec, setActiveIpsec] = useState(defaultIpsec)

  // Bidirectional UI -> Config sync
  React.useEffect(() => {
    let modeike = 'aes256-mlkem768-sha384!'
    if (selectedMode === 'classical') modeike = 'aes256-sha256-modp3072!'
    if (selectedMode === 'hybrid') modeike = 'aes256-mlkem768-x25519-sha384!'

    setActiveIpsec((prev) => {
      if (/ike=.*/.test(prev)) {
        return prev.replace(/ike=.*/, `ike=${modeike}`)
      } else {
        // If the user deleted the ike= line, we safely inject it back under the host-host connection block
        return prev.replace(/conn host-host/, `conn host-host\n  ike=${modeike}`)
      }
    })
  }, [selectedMode])

  React.useEffect(() => {
    const handleLog = (log: StrongSwanLog) => {
      setSsLogs((prev) => {
        const next = [...prev, log]
        return next.length > 500 ? next.slice(next.length - 500) : next
      })
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    }
    const handleState = (state: StrongSwanState) => setSsState(state)

    strongSwanEngine.addLogListener(handleLog)
    strongSwanEngine.addStateListener(handleState)
    // Do NOT call init() here — configs must be passed at init time (preRun).
    // The daemon starts when the user clicks "Start Daemon".

    return () => {
      strongSwanEngine.removeLogListener(handleLog)
      strongSwanEngine.removeStateListener(handleState)
      strongSwanEngine.destroy()
    }
  }, [])

  const exchange = IKE_V2_EXCHANGES[selectedMode]
  const modeConfig = IKE_V2_MODES.find((m) => m.id === selectedMode)

  const steps = useMemo(() => {
    if (!exchange) return []
    const result = [
      {
        label: 'IKE_SA_INIT Request',
        direction: 'right' as const,
        message: exchange.ikeSaInit.initiator,
      },
      {
        label: 'IKE_SA_INIT Response',
        direction: 'left' as const,
        message: exchange.ikeSaInit.responder,
      },
    ]

    if (exchange.ikeIntermediate) {
      result.push(
        {
          label: 'IKE_INTERMEDIATE Request',
          direction: 'right' as const,
          message: exchange.ikeIntermediate.initiator,
        },
        {
          label: 'IKE_INTERMEDIATE Response',
          direction: 'left' as const,
          message: exchange.ikeIntermediate.responder,
        }
      )
    }

    result.push(
      {
        label: 'IKE_AUTH Request',
        direction: 'right' as const,
        message: exchange.ikeAuth.initiator,
      },
      {
        label: 'IKE_AUTH Response',
        direction: 'left' as const,
        message: exchange.ikeAuth.responder,
      }
    )
    return result
  }, [exchange])

  const hasCrashed = useMemo(() => {
    if (exchange && steps.length > 0) {
      const stepData = steps[currentStep]
      if (stepData) {
        const payloadSize = stepData.message.payloads.reduce((acc, p) => acc + p.sizeBytes, 0)
        if (payloadSize > mtu && !allowFragmentation) {
          return true
        }
      }
    }
    return false
  }, [currentStep, mtu, allowFragmentation, exchange, steps])

  const handleReset = useCallback(() => {
    setCurrentStep(0)
    setSsLogs([])
    strongSwanEngine.destroy()
    // Don't re-init here — user must click "Start Daemon" to pass configs.
  }, [])

  const handleModeChange = useCallback((mode: IKEv2Mode) => {
    setSelectedMode(mode)
    setCurrentStep(0)
  }, [])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-card border border-border p-4 rounded-xl">
        <div className="space-y-3">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Key Exchange Mode
          </div>
          <div className="flex flex-wrap gap-2">
            {IKE_V2_MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => handleModeChange(mode.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                  selectedMode === mode.id
                    ? 'bg-primary/20 border-primary/50 text-primary'
                    : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
          {modeConfig && (
            <p className="text-[11px] text-muted-foreground">{modeConfig.description}</p>
          )}
        </div>

        <div className="space-y-4">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Network Constraints
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <label htmlFor="mtuSlider">Maximum Transmission Unit (MTU)</label>
              <span className="font-bold font-mono">{mtu} Bytes</span>
            </div>
            <input
              type="range"
              id="mtuSlider"
              min="500"
              max="4000"
              step="100"
              value={mtu}
              onChange={(e) => setMtu(parseInt(e.target.value))}
              className="w-full accent-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="fragToggle"
              checked={allowFragmentation}
              onChange={(e) => setAllowFragmentation(e.target.checked)}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary"
            />
            <label htmlFor="fragToggle" className="text-sm font-medium">
              Enable Application-Layer Fragmentation (RFC 7383)
            </label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <span>strongswan.conf</span>
          </div>
          <textarea
            value={activeConfig}
            onChange={(e) => setActiveConfig(e.target.value)}
            className="w-full h-32 bg-transparent border border-border rounded-lg text-[10px] font-mono p-3 text-muted-foreground focus:outline-none focus:border-primary"
            spellCheck={false}
          />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
            <span>ipsec.conf</span>
          </div>
          <textarea
            value={activeIpsec}
            onChange={(e) => setActiveIpsec(e.target.value)}
            className="w-full h-32 bg-transparent border border-border rounded-lg text-[10px] font-mono p-3 text-muted-foreground focus:outline-none focus:border-primary"
            spellCheck={false}
          />
        </div>
      </div>

      {hasCrashed && (
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl flex items-center justify-between text-destructive animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <ShieldAlert size={24} />
            <div>
              <h4 className="font-bold">MTU Exceeded - Packet Dropped</h4>
              <p className="text-xs opacity-80">
                The current payload size exceeds the MTU of {mtu} bytes, and fragmentation is
                disabled. The VPN tunnel has failed to initialize.
              </p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="px-3 py-1.5 bg-destructive/20 rounded hover:bg-destructive/30 text-sm font-bold transition-colors"
          >
            Reset
          </button>
        </div>
      )}

      <div
        className={`overflow-x-auto relative ${hasCrashed ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-start min-w-[480px]">
          <div>
            <div className="text-center mb-4">
              <div className="inline-block px-4 py-2 rounded-lg bg-primary/10 border border-primary/30">
                <span className="text-sm font-bold text-primary">Initiator (Client)</span>
              </div>
            </div>
            <div className="space-y-3">
              {steps.map((step, idx) =>
                step.direction === 'right' ? (
                  <div
                    key={step.label}
                    className={`transition-all duration-300 ${
                      idx <= currentStep ? 'opacity-100' : 'opacity-30'
                    }`}
                  >
                    <div className="text-xs font-bold text-foreground mb-2 flex items-center gap-2">
                      {step.label}
                      {idx === currentStep &&
                        allowFragmentation &&
                        step.message.payloads.reduce((a, p) => a + p.sizeBytes, 0) > mtu && (
                          <span className="px-1.5 py-0.5 bg-warning/20 text-warning text-[9px] rounded uppercase font-bold border border-warning/30">
                            Fragmented
                          </span>
                        )}
                    </div>
                    <div className="space-y-1.5 relative">
                      {step.message.payloads.map((payload, pIdx) => (
                        <PayloadCard
                          key={`${step.label}-${pIdx}`}
                          payload={payload}
                          index={pIdx}
                          highlighted={idx === currentStep}
                          isFragmented={hasCrashed && idx === currentStep}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div key={step.label} className="h-4" />
                )
              )}
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 pt-14 border-x border-border/30 px-4">
            {steps.map((step, idx) => (
              <div
                key={step.label}
                className={`flex flex-col items-center justify-center transition-all duration-300 ${
                  idx <= currentStep ? 'opacity-100' : 'opacity-20'
                }`}
                style={{ minHeight: '60px' }}
              >
                {step.direction === 'right' ? (
                  <ArrowRight size={20} className="text-primary mb-1" />
                ) : (
                  <ArrowLeft size={20} className="text-secondary mb-1" />
                )}

                {idx === currentStep &&
                  allowFragmentation &&
                  step.message.payloads.reduce((a, p) => a + p.sizeBytes, 0) > mtu && (
                    <div className="flex gap-1 animate-pulse">
                      <span className="w-1.5 h-1.5 bg-warning rounded-full"></span>
                      <span className="w-1.5 h-1.5 bg-warning rounded-full delay-75"></span>
                      <span className="w-1.5 h-1.5 bg-warning rounded-full delay-150"></span>
                    </div>
                  )}
              </div>
            ))}
          </div>

          <div>
            <div className="text-center mb-4">
              <div className="inline-block px-4 py-2 rounded-lg bg-secondary/10 border border-secondary/30">
                <span className="text-sm font-bold text-secondary">Responder (Gateway)</span>
              </div>
            </div>
            <div className="space-y-3">
              {steps.map((step, idx) =>
                step.direction === 'left' ? (
                  <div
                    key={step.label}
                    className={`transition-all duration-300 ${
                      idx <= currentStep ? 'opacity-100' : 'opacity-30'
                    }`}
                  >
                    <div className="text-xs font-bold text-foreground mb-2 flex items-center gap-2">
                      {step.label}
                      {idx === currentStep &&
                        allowFragmentation &&
                        step.message.payloads.reduce((a, p) => a + p.sizeBytes, 0) > mtu && (
                          <span className="px-1.5 py-0.5 bg-warning/20 text-warning text-[9px] rounded uppercase font-bold border border-warning/30">
                            Assembled
                          </span>
                        )}
                    </div>
                    <div className="space-y-1.5">
                      {step.message.payloads.map((payload, pIdx) => (
                        <PayloadCard
                          key={`${step.label}-${pIdx}`}
                          payload={payload}
                          index={pIdx}
                          highlighted={idx === currentStep}
                          isFragmented={hasCrashed && idx === currentStep}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div key={step.label} className="h-4" />
                )
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 bg-muted/30 p-2 rounded-lg border border-border">
        <button
          onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
          disabled={currentStep === 0 || hasCrashed}
          className="px-4 py-2 rounded border border-border hover:bg-muted disabled:opacity-50 text-sm transition-colors"
        >
          &larr; Previous Phase
        </button>
        <div className="text-xs font-semibold text-muted-foreground bg-background px-3 py-1 rounded-full border border-border flex items-center gap-2">
          <span>
            Sequence {currentStep + 1} of {steps.length}
          </span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] uppercase ${ssState === 'RUNNING' ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}
          >
            Daemon: {ssState}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="p-2 border border-border rounded hover:bg-muted"
            title="Restart Simulation"
          >
            <RotateCcw size={16} />
          </button>
          {currentStep === 0 && ssState === 'UNINITIALIZED' ? (
            <button
              onClick={() => {
                strongSwanEngine.init({
                  'strongswan.conf': activeConfig,
                  'ipsec.conf': activeIpsec,
                })
                setCurrentStep(1)
              }}
              className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded shadow-sm hover:bg-primary/90 text-sm transition-colors"
            >
              Start Daemon
            </button>
          ) : (
            <button
              onClick={() => setCurrentStep((s) => Math.min(steps.length - 1, s + 1))}
              disabled={currentStep === steps.length - 1 || hasCrashed}
              className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded shadow-sm hover:bg-primary/90 disabled:opacity-50 text-sm transition-colors"
            >
              {currentStep === steps.length - 1 ? 'Tunnel Established' : 'Next Phase \u2192'}
            </button>
          )}
        </div>
      </div>

      <div className="border border-border/50 rounded-xl overflow-hidden bg-black/90 pb-2">
        <div className="bg-muted px-4 py-1.5 text-xs font-mono font-bold border-b border-border text-muted-foreground flex justify-between">
          <span>charon.log</span>
          <span>WASM IKEv2 KEM Daemon</span>
        </div>
        <div
          ref={scrollRef}
          className="p-3 h-[180px] overflow-y-auto font-mono text-[11px] leading-relaxed"
        >
          {ssLogs.length === 0 ? (
            <div className="text-muted-foreground/50 italic">Awaiting daemon initialization...</div>
          ) : (
            ssLogs.map((log, i) => (
              <div
                key={i}
                className={log.level === 'error' ? 'text-destructive' : 'text-success/80'}
              >
                <span className="opacity-50 mr-2">
                  [{new Date().toISOString().split('T')[1]?.split('.')[0]}]
                </span>
                {log.text}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <h4 className="text-sm font-bold flex items-center gap-2 mb-3">
          <Cpu size={16} /> Tunnel Statistics
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div
            className={`p-3 rounded-xl border flex flex-col justify-center items-center ${currentStep === steps.length - 1 && !hasCrashed ? 'bg-success/10 border-success/30' : 'bg-card border-border'}`}
          >
            <span
              className={`text-2xl font-bold ${currentStep === steps.length - 1 && !hasCrashed ? 'text-success' : ''}`}
            >
              {hasCrashed ? (
                '--'
              ) : currentStep === steps.length - 1 ? (
                <CheckCircle className="inline-block text-success" />
              ) : (
                '...'
              )}
            </span>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">
              Status
            </span>
          </div>
          <div className="p-3 rounded-xl bg-card border border-border flex flex-col justify-center items-center">
            <span className="text-xl font-bold">{exchange.totalBytes.toLocaleString()}</span>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">
              Total Bytes
            </span>
          </div>
          <div className="p-3 rounded-xl bg-card border border-border flex flex-col justify-center items-center">
            <span className="text-xl font-bold">
              {exchange.totalInitiatorBytes.toLocaleString()}
            </span>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">
              Initiator Bytes
            </span>
          </div>
          <div className="p-3 rounded-xl bg-card border border-border flex flex-col justify-center items-center">
            <span className="text-xl font-bold">{exchange.roundTrips}</span>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">
              Round Trips
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
