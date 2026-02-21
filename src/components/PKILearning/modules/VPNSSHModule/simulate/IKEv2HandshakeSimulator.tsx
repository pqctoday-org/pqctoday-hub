/* eslint-disable security/detect-object-injection */
import React, { useState, useCallback } from 'react'
import { ArrowRight, ArrowLeft, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react'
import {
  IKE_V2_MODES,
  IKE_V2_EXCHANGES,
  type IKEv2Mode,
  type IKEv2Payload,
} from '../data/ikev2Constants'

interface IKEv2HandshakeSimulatorProps {
  initialMode?: IKEv2Mode
}

const PayloadCard: React.FC<{ payload: IKEv2Payload; index: number; highlighted: boolean }> = ({
  payload,
  highlighted,
}) => (
  <div
    className={`rounded-lg p-2 border text-xs transition-all duration-300 ${
      highlighted
        ? 'bg-primary/10 border-primary/40 shadow-[0_0_8px_hsl(var(--primary)/0.15)]'
        : 'bg-muted/50 border-border'
    }`}
  >
    <div className="flex items-center justify-between mb-1">
      <span className="font-bold text-foreground">{payload.abbreviation}</span>
      <span className="text-muted-foreground">{payload.sizeBytes} B</span>
    </div>
    <p className="text-muted-foreground text-[10px]">{payload.description}</p>
  </div>
)

export const IKEv2HandshakeSimulator: React.FC<IKEv2HandshakeSimulatorProps> = ({
  initialMode,
}) => {
  const [selectedMode, setSelectedMode] = useState<IKEv2Mode>(initialMode ?? 'classical')
  const [currentStep, setCurrentStep] = useState(0)
  const [showDetails, setShowDetails] = useState(false)

  const exchange = IKE_V2_EXCHANGES[selectedMode]
  const modeConfig = IKE_V2_MODES.find((m) => m.id === selectedMode)

  const steps = [
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
    {
      label: selectedMode === 'hybrid' ? 'IKE_INTERMEDIATE (AKE)' : 'IKE_AUTH Request',
      direction: 'right' as const,
      message: exchange.ikeAuth.initiator,
    },
    {
      label: selectedMode === 'hybrid' ? 'IKE_INTERMEDIATE + IKE_AUTH' : 'IKE_AUTH Response',
      direction: 'left' as const,
      message: exchange.ikeAuth.responder,
    },
  ]

  const handleReset = useCallback(() => {
    setCurrentStep(0)
  }, [])

  const handleModeChange = useCallback((mode: IKEv2Mode) => {
    setSelectedMode(mode)
    setCurrentStep(0)
  }, [])

  return (
    <div className="space-y-6">
      {/* Mode Selector */}
      <div className="flex flex-wrap gap-2">
        {IKE_V2_MODES.map((mode) => (
          <button
            key={mode.id}
            onClick={() => handleModeChange(mode.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
              selectedMode === mode.id
                ? 'bg-primary/20 border-primary/50 text-primary'
                : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {/* Mode Description */}
      {modeConfig && (
        <div className="bg-muted/50 rounded-lg p-3 border border-border text-xs text-foreground/80">
          {modeConfig.description}
        </div>
      )}

      {/* 2-Column Handshake Visualization */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-start">
        {/* Initiator Column */}
        <div>
          <div className="text-center mb-4">
            <div className="inline-block px-4 py-2 rounded-lg bg-primary/10 border border-primary/30">
              <span className="text-sm font-bold text-primary">Initiator</span>
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
                  <div className="text-xs font-bold text-foreground mb-2">{step.label}</div>
                  <div className="space-y-1.5">
                    {step.message.payloads.map((payload, pIdx) => (
                      <PayloadCard
                        key={`${step.label}-${pIdx}`}
                        payload={payload}
                        index={pIdx}
                        highlighted={idx === currentStep}
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

        {/* Center Arrow Column */}
        <div className="flex flex-col items-center gap-3 pt-14">
          {steps.map((step, idx) => (
            <div
              key={step.label}
              className={`flex items-center transition-all duration-300 ${
                idx <= currentStep ? 'opacity-100' : 'opacity-20'
              }`}
              style={{ minHeight: '60px' }}
            >
              {step.direction === 'right' ? (
                <ArrowRight size={20} className="text-primary" />
              ) : (
                <ArrowLeft size={20} className="text-secondary" />
              )}
            </div>
          ))}
        </div>

        {/* Responder Column */}
        <div>
          <div className="text-center mb-4">
            <div className="inline-block px-4 py-2 rounded-lg bg-secondary/10 border border-secondary/30">
              <span className="text-sm font-bold text-secondary">Responder</span>
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
                  <div className="text-xs font-bold text-foreground mb-2">{step.label}</div>
                  <div className="space-y-1.5">
                    {step.message.payloads.map((payload, pIdx) => (
                      <PayloadCard
                        key={`${step.label}-${pIdx}`}
                        payload={payload}
                        index={pIdx}
                        highlighted={idx === currentStep}
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

      {/* Step Controls */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
          disabled={currentStep === 0}
          className="px-4 py-2 rounded-lg border border-border hover:bg-muted disabled:opacity-50 transition-colors text-foreground text-sm"
        >
          &larr; Previous
        </button>
        <div className="text-xs text-muted-foreground">
          Step {currentStep + 1} of {steps.length}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleReset}
            className="p-2 rounded-lg border border-border hover:bg-muted transition-colors text-muted-foreground"
            title="Reset"
          >
            <RotateCcw size={14} />
          </button>
          <button
            onClick={() => setCurrentStep((s) => Math.min(steps.length - 1, s + 1))}
            disabled={currentStep === steps.length - 1}
            className="px-4 py-2 rounded-lg bg-primary text-black font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors text-sm"
          >
            Next &rarr;
          </button>
        </div>
      </div>

      {/* Size Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
          <div className="text-lg font-bold text-foreground">
            {exchange.totalBytes.toLocaleString()}
          </div>
          <div className="text-[10px] text-muted-foreground">Total Bytes</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
          <div className="text-lg font-bold text-foreground">{exchange.roundTrips}</div>
          <div className="text-[10px] text-muted-foreground">Round Trips</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
          <div className="text-lg font-bold text-foreground">
            {exchange.totalInitiatorBytes.toLocaleString()}
          </div>
          <div className="text-[10px] text-muted-foreground">Initiator Bytes</div>
        </div>
        <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
          <div className="text-lg font-bold text-foreground">
            {exchange.totalResponderBytes.toLocaleString()}
          </div>
          <div className="text-[10px] text-muted-foreground">Responder Bytes</div>
        </div>
      </div>

      {/* Expandable Details */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        {showDetails ? 'Hide' : 'Show'} Negotiated Parameters
      </button>

      {showDetails && modeConfig && (
        <div className="bg-muted/50 rounded-lg p-4 border border-border space-y-2 text-xs animate-fade-in">
          <div className="flex justify-between">
            <span className="text-muted-foreground">DH Group:</span>
            <span className="text-foreground font-medium">{modeConfig.dhGroup}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Encryption:</span>
            <span className="text-foreground font-medium">{modeConfig.encAlgorithm}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Integrity:</span>
            <span className="text-foreground font-medium">{modeConfig.integrityAlgorithm}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">PRF:</span>
            <span className="text-foreground font-medium">{modeConfig.prfAlgorithm}</span>
          </div>
        </div>
      )}
    </div>
  )
}
