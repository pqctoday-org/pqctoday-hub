import React, { useState, useCallback } from 'react'
import { ArrowRight, ArrowLeft, RotateCcw, Shield, ShieldCheck } from 'lucide-react'
import {
  SSH_KEX_ALGORITHMS,
  SSH_KEX_SIZES,
  SSH_HANDSHAKE_STEPS,
  type SSHKexAlgorithm,
} from '../data/sshConstants'

interface SSHKeyExchangeSimulatorProps {
  initialKex?: SSHKexAlgorithm
}

export const SSHKeyExchangeSimulator: React.FC<SSHKeyExchangeSimulatorProps> = ({ initialKex }) => {
  const [selectedKex, setSelectedKex] = useState<SSHKexAlgorithm>(initialKex ?? 'curve25519-sha256')
  const [currentStep, setCurrentStep] = useState(0)

  const kexConfig = SSH_KEX_ALGORITHMS.find((k) => k.id === selectedKex)
  const kexSizes = SSH_KEX_SIZES.find((k) => k.id === selectedKex)

  const handleKexChange = useCallback((kex: SSHKexAlgorithm) => {
    setSelectedKex(kex)
    setCurrentStep(0)
  }, [])

  const handleReset = useCallback(() => {
    setCurrentStep(0)
  }, [])

  return (
    <div className="space-y-6">
      {/* KEX Algorithm Selector */}
      <div className="flex flex-wrap gap-2">
        {SSH_KEX_ALGORITHMS.map((kex) => (
          <button
            key={kex.id}
            onClick={() => handleKexChange(kex.id)}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors border flex items-center gap-2 ${
              selectedKex === kex.id
                ? 'bg-primary/20 border-primary/50 text-primary'
                : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            {kex.quantumSafe ? (
              <ShieldCheck size={14} className="text-success" />
            ) : (
              <Shield size={14} className="text-destructive" />
            )}
            <code>{kex.label}</code>
          </button>
        ))}
      </div>

      {/* KEX Description */}
      {kexConfig && (
        <div className="bg-muted/50 rounded-lg p-3 border border-border text-xs text-foreground/80 space-y-2">
          <p>{kexConfig.description}</p>
          <div className="flex flex-wrap gap-4">
            <span>
              <strong className="text-muted-foreground">Hash:</strong> {kexConfig.hashFunction}
            </span>
            <span>
              <strong className="text-muted-foreground">OpenSSH:</strong> {kexConfig.opensshVersion}
            </span>
            <span>
              <strong className="text-muted-foreground">Spec:</strong> {kexConfig.rfcOrDraft}
            </span>
          </div>
        </div>
      )}

      {/* Components Breakdown */}
      {kexConfig && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-primary mb-1">Classical Component</div>
            <p className="text-xs text-muted-foreground">
              {kexConfig.classicalComponent ?? 'None'}
            </p>
          </div>
          <div className="bg-muted/50 rounded-lg p-3 border border-border">
            <div className="text-xs font-bold text-success mb-1">PQC Component</div>
            <p className="text-xs text-muted-foreground">{kexConfig.pqcComponent ?? 'None'}</p>
          </div>
        </div>
      )}

      {/* Handshake Step Visualization */}
      <div className="space-y-2">
        {SSH_HANDSHAKE_STEPS.map((step, idx) => {
          const isActive = idx <= currentStep
          const isCurrent = idx === currentStep
          return (
            <button
              key={step.id}
              onClick={() => setCurrentStep(idx)}
              className={`w-full text-left rounded-lg p-3 border transition-all duration-300 ${
                isCurrent
                  ? 'bg-primary/10 border-primary/40 shadow-[0_0_8px_hsl(var(--primary)/0.15)]'
                  : isActive
                    ? 'bg-muted/50 border-border'
                    : 'bg-muted/30 border-border/50 opacity-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center justify-center w-6 h-6 rounded-full border text-[10px] font-bold shrink-0 ${
                    isCurrent
                      ? 'border-primary text-primary bg-primary/10'
                      : isActive
                        ? 'border-success text-success'
                        : 'border-border text-muted-foreground'
                  }`}
                >
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {step.direction === 'client' ? (
                      <ArrowRight size={12} className="text-primary" />
                    ) : (
                      <ArrowLeft size={12} className="text-secondary" />
                    )}
                    <span className="text-xs font-bold text-foreground">{step.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${
                        step.direction === 'client'
                          ? 'bg-primary/10 text-primary border-primary/30'
                          : 'bg-secondary/10 text-secondary border-secondary/30'
                      }`}
                    >
                      {step.direction === 'client' ? 'Client' : 'Server'}
                    </span>
                  </div>
                  {isCurrent && (
                    <p className="text-[10px] text-muted-foreground mt-1 animate-fade-in">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>
            </button>
          )
        })}
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
          Step {currentStep + 1} of {SSH_HANDSHAKE_STEPS.length}
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
            onClick={() => setCurrentStep((s) => Math.min(SSH_HANDSHAKE_STEPS.length - 1, s + 1))}
            disabled={currentStep === SSH_HANDSHAKE_STEPS.length - 1}
            className="px-4 py-2 rounded-lg bg-primary text-black font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors text-sm"
          >
            Next &rarr;
          </button>
        </div>
      </div>

      {/* Size Comparison */}
      {kexSizes && (
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-foreground">Key Exchange Sizes</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
              <div className="text-lg font-bold text-foreground">
                {kexSizes.publicKeyBytes.toLocaleString()}
              </div>
              <div className="text-[10px] text-muted-foreground">Public Key (B)</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
              <div className="text-lg font-bold text-foreground">
                {kexSizes.ciphertextOrShareBytes.toLocaleString()}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {kexConfig?.pqcComponent ? 'Ciphertext' : 'Share'} (B)
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
              <div className="text-lg font-bold text-foreground">{kexSizes.sharedSecretBytes}</div>
              <div className="text-[10px] text-muted-foreground">Shared Secret (B)</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 border border-border text-center">
              <div className="text-lg font-bold text-foreground">
                {kexSizes.totalHandshakeBytes.toLocaleString()}
              </div>
              <div className="text-[10px] text-muted-foreground">Total Handshake (B)</div>
            </div>
          </div>

          {/* Message Breakdown */}
          <div className="bg-muted/50 rounded-lg p-4 border border-border space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Client KEXINIT:</span>
              <span className="text-foreground font-medium">
                {kexSizes.clientKexInitBytes} bytes
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Server KEXINIT:</span>
              <span className="text-foreground font-medium">
                {kexSizes.serverKexInitBytes} bytes
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Client KEX_ECDH_INIT:</span>
              <span className="text-foreground font-medium">
                {kexSizes.clientKexDHInitBytes} bytes
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Server KEX_ECDH_REPLY:</span>
              <span className="text-foreground font-medium">
                {kexSizes.serverKexDHReplyBytes} bytes
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
