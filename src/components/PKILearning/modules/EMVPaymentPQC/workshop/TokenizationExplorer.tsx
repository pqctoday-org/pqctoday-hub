// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import {
  Play,
  Pause,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  CreditCard,
  Fingerprint,
  Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { TOKENIZATION_FLOWS, MOBILE_WALLETS } from '../data/tokenizationData'
import type { TokenizationStep, MobileWalletId } from '../data/emvConstants'

// ── Helpers ──────────────────────────────────────────────────────────────

const TSP_ITEMS = TOKENIZATION_FLOWS.map((flow) => ({
  id: flow.id,
  label: flow.name,
  icon: <CreditCard size={16} className="text-primary" />,
}))

const WALLET_ITEMS = MOBILE_WALLETS.map((w) => ({
  id: w.id,
  label: w.name,
  icon: <Smartphone size={16} className="text-primary" />,
}))

// ── Component ────────────────────────────────────────────────────────────

export const TokenizationExplorer: React.FC = () => {
  const [selectedTspId, setSelectedTspId] = useState(TOKENIZATION_FLOWS[0].id)
  const [selectedWalletId, setSelectedWalletId] = useState<MobileWalletId>(MOBILE_WALLETS[0].id)
  const [visibleStepCount, setVisibleStepCount] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const selectedFlow = useMemo(
    () => TOKENIZATION_FLOWS.find((f) => f.id === selectedTspId) ?? TOKENIZATION_FLOWS[0],
    [selectedTspId]
  )

  const selectedWallet = useMemo(
    () => MOBILE_WALLETS.find((w) => w.id === selectedWalletId) ?? MOBILE_WALLETS[0],
    [selectedWalletId]
  )

  const totalSteps = selectedFlow.steps.length
  const vulnerableCount = selectedFlow.steps.filter((s) => s.quantumVulnerable).length

  // Animation timer
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    setIsPlaying(false)
  }, [])

  useEffect(() => {
    if (!isPlaying) return
    timerRef.current = setInterval(() => {
      setVisibleStepCount((prev) => {
        if (prev >= totalSteps) {
          stopTimer()
          return totalSteps
        }
        return prev + 1
      })
    }, 900)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isPlaying, totalSteps, stopTimer])

  const handleTspChange = useCallback(
    (id: string) => {
      stopTimer()
      setVisibleStepCount(0)
      setSelectedTspId(id)
    },
    [stopTimer]
  )

  const handlePlay = () => {
    if (visibleStepCount >= totalSteps) {
      setVisibleStepCount(0)
    }
    setIsPlaying(true)
  }

  const handleReset = () => {
    stopTimer()
    setVisibleStepCount(0)
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-foreground/80">
        Explore how Token Service Providers (TSPs) provision payment tokens to mobile wallets, and
        identify quantum-vulnerable steps in the provisioning sequence.
      </p>

      {/* ── Selectors ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <FilterDropdown
          items={TSP_ITEMS}
          selectedId={selectedTspId}
          onSelect={handleTspChange}
          label="TSP"
          defaultLabel="Select TSP"
          defaultIcon={<CreditCard size={16} className="text-primary" />}
          noContainer
        />
        <FilterDropdown
          items={WALLET_ITEMS}
          selectedId={selectedWalletId}
          onSelect={(id) => setSelectedWalletId(id as MobileWalletId)}
          label="Wallet"
          defaultLabel="Select Wallet"
          defaultIcon={<Smartphone size={16} className="text-primary" />}
          noContainer
        />
      </div>

      {/* ── TSP Flow Description ───────────────────────────────────── */}
      <div className="glass-panel p-4">
        <div className="text-sm font-bold text-foreground mb-1">{selectedFlow.name}</div>
        <p className="text-xs text-muted-foreground">{selectedFlow.description}</p>
      </div>

      {/* ── Animated Provisioning Sequence ─────────────────────────── */}
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-bold text-foreground">Provisioning Flow</div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="h-8 px-2 text-xs"
              aria-label="Reset animation"
            >
              <RotateCcw size={14} className="mr-1" />
              Reset
            </Button>
            <Button
              variant={isPlaying ? 'secondary' : 'default'}
              size="sm"
              onClick={isPlaying ? stopTimer : handlePlay}
              className="h-8 px-3 text-xs"
              aria-label={isPlaying ? 'Pause animation' : 'Play animation'}
            >
              {isPlaying ? (
                <Pause size={14} className="mr-1" />
              ) : (
                <Play size={14} className="mr-1" />
              )}
              {isPlaying ? 'Pause' : 'Play'}
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {selectedFlow.steps.map((step, idx) => (
            <ProvisioningStepCard
              key={step.id}
              step={step}
              index={idx}
              isVisible={idx < visibleStepCount}
            />
          ))}
        </div>

        {visibleStepCount === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">
            Press Play to animate the provisioning sequence step by step.
          </p>
        )}
      </div>

      {/* ── Mobile Wallet Detail Card ──────────────────────────────── */}
      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-3">
          <Smartphone size={16} className="text-primary" />
          <div className="text-sm font-bold text-foreground">{selectedWallet.name}</div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
              Secure Element
            </div>
            <p className="text-xs text-foreground">{selectedWallet.secureElement}</p>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
              Token Protocol
            </div>
            <p className="text-xs text-foreground">{selectedWallet.tokenProtocol}</p>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
              <span className="inline-flex items-center gap-1">
                <Fingerprint size={10} className="text-muted-foreground" />
                Biometric Auth
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {selectedWallet.biometricAuth.map((method) => (
                <span
                  key={method}
                  className="text-[10px] bg-muted rounded px-1.5 py-0.5 text-foreground border border-border"
                >
                  {method}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
              <span className="inline-flex items-center gap-1">
                <Lock size={10} className="text-muted-foreground" />
                Crypto Capabilities
              </span>
            </div>
            <ul className="space-y-0.5">
              {selectedWallet.cryptoCapabilities.map((cap) => (
                <li key={cap} className="text-[10px] text-foreground">
                  {cap}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-border">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
            PQC Status
          </div>
          <p className="text-xs text-foreground">{selectedWallet.pqcStatus}</p>
        </div>
      </div>

      {/* ── Summary Panel ──────────────────────────────────────────── */}
      <div className="glass-panel p-4">
        <div className="text-sm font-bold text-foreground mb-3">Vulnerability Summary</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="text-center p-3 bg-muted/30 rounded-lg border border-border">
            <div className="text-lg font-bold text-foreground">{totalSteps}</div>
            <div className="text-[10px] text-muted-foreground">Total Steps</div>
          </div>
          <div className="text-center p-3 bg-status-error/10 rounded-lg border border-status-error/30">
            <div className="text-lg font-bold text-status-error">{vulnerableCount}</div>
            <div className="text-[10px] text-muted-foreground">Quantum-Vulnerable</div>
          </div>
          <div className="text-center p-3 bg-status-success/10 rounded-lg border border-status-success/30">
            <div className="text-lg font-bold text-status-success">
              {totalSteps - vulnerableCount}
            </div>
            <div className="text-[10px] text-muted-foreground">Quantum-Safe</div>
          </div>
        </div>

        <div className="mt-3 bg-muted/20 rounded-lg p-3 border border-border">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
            PQC Replacement Overview
          </div>
          <ul className="space-y-1">
            {selectedFlow.steps
              .filter((s) => s.quantumVulnerable && s.pqcReplacement)
              .map((s) => (
                <li key={s.id} className="text-xs text-foreground flex items-start gap-1.5">
                  <ShieldCheck size={12} className="text-status-success shrink-0 mt-0.5" />
                  <span>
                    <span className="font-medium">{s.label}:</span>{' '}
                    <span className="text-muted-foreground">{s.pqcReplacement}</span>
                  </span>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────

function ProvisioningStepCard({
  step,
  index,
  isVisible,
}: {
  step: TokenizationStep
  index: number
  isVisible: boolean
}) {
  if (!isVisible) return null

  return (
    <div
      className={`rounded-lg p-3 border transition-all animate-in fade-in slide-in-from-left-2 duration-300 ${
        step.quantumVulnerable
          ? 'border-status-error/40 bg-status-error/5'
          : 'border-border bg-muted/20'
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold text-muted-foreground w-5 text-center">
            {index + 1}
          </span>
          <span className="text-sm font-bold text-foreground">{step.label}</span>
        </div>
        {step.quantumVulnerable ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold rounded px-1.5 py-0.5 bg-status-error/20 text-status-error border border-status-error/50">
            <ShieldAlert size={10} />
            Vulnerable
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold rounded px-1.5 py-0.5 bg-status-success/20 text-status-success border border-status-success/50">
            <ShieldCheck size={10} />
            Safe
          </span>
        )}
      </div>

      <div className="text-[10px] text-primary font-medium mb-1">{step.actor}</div>
      <p className="text-xs text-muted-foreground mb-2">{step.description}</p>

      <div className="flex flex-wrap gap-1 mb-1">
        {step.cryptoUsed.map((crypto) => (
          <span
            key={crypto}
            className="text-[10px] font-mono bg-muted rounded px-1.5 py-0.5 text-foreground border border-border"
          >
            {crypto}
          </span>
        ))}
      </div>

      {step.quantumVulnerable && step.pqcReplacement && (
        <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-status-success">
          <ShieldCheck size={10} className="shrink-0" />
          <span className="font-medium">PQC: {step.pqcReplacement}</span>
        </div>
      )}
    </div>
  )
}
