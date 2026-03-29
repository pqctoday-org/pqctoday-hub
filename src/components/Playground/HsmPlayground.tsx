// SPDX-License-Identifier: GPL-3.0-only
import { useRef, useEffect, useState } from 'react'
import React from 'react'
import {
  Cpu,
  Key as KeyIcon,
  Lock,
  Layers,
  Hash,
  FileSignature,
  ArrowLeftRight,
  Filter,
  ShieldCheck,
  AlertCircle,
  Construction,
  FlaskConical,
} from 'lucide-react'
import clsx from 'clsx'
import { useSettingsContext } from './contexts/SettingsContext'
import { useHsmContext } from './hsm/HsmContext'
import { HsmSymmetricPanel } from './hsm/HsmSymmetricPanel'
import { HsmHashingPanel } from './hsm/HsmHashingPanel'
import { HsmKeyAgreementPanel } from './hsm/HsmKeyAgreementPanel'
import { HsmKdfPanel } from './hsm/HsmKdfPanel'
import { HsmMechanismPanel } from './hsm/HsmMechanismPanel'
import { KeyWrapPanel } from './hsm/symmetric/KeyWrapPanel'
import { HsmAcvpTesting } from './hsm/HsmAcvpTesting'
import { HsmTestMethodologyModal } from './hsm/HsmTestMethodologyModal'
import { TokenSetupPanel } from './components/TokenSetupPanel'
import { HsmKeyTable } from './keystore/HsmKeyTable'
import { PkcsLogPanel } from './components/PkcsLogPanel'
import { HsmSignCombinedPanel } from './tabs/SignVerifyTab'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { logEvent } from '../../utils/analytics'

type HsmTab =
  | 'keystore'
  | 'symmetric'
  | 'key_wrap'
  | 'hashing'
  | 'sign_verify'
  | 'key_agree'
  | 'key_derive'
  | 'mechanisms'
  | 'acvp'
  | 'logs'

export const HsmPlayground = () => {
  const { error } = useSettingsContext()
  const { engineMode, setEngineMode, phase } = useHsmContext()
  const [activeTab, setActiveTab] = useState<HsmTab>('keystore')
  const [showMethodologyModal, setShowMethodologyModal] = useState(false)
  const errorRef = useRef<HTMLDivElement>(null)
  const tabListRef = useRef<HTMLDivElement>(null)
  const [showTabFade, setShowTabFade] = useState(false)

  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])

  useEffect(() => {
    const el = tabListRef.current
    if (!el) return
    const update = () => {
      setShowTabFade(
        el.scrollWidth > el.clientWidth + 1 && el.scrollLeft < el.scrollWidth - el.clientWidth - 1
      )
    }
    update()
    el.addEventListener('scroll', update, { passive: true })
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', update)
      ro.disconnect()
    }
  }, [])

  const handleTabChange = (tab: HsmTab) => {
    setActiveTab(tab)
    logEvent('HSM Playground', 'Switch Tab', tab)
  }

  const tabBtn = (id: HsmTab, label: React.ReactNode) => (
    <Button
      key={id}
      role="tab"
      id={`hsm-tab-${id}`}
      aria-selected={activeTab === id}
      aria-controls="hsm-tabpanel"
      onClick={() => handleTabChange(id)}
      variant="ghost"
      size="sm"
      className={clsx(
        'whitespace-nowrap',
        activeTab === id
          ? 'bg-primary/20 text-primary shadow-sm'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
      )}
    >
      {label}
    </Button>
  )

  return (
    <Card className="p-3 md:p-6 min-h-[60vh] md:min-h-[85vh] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 shrink-0 gap-2">
        <h3 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <Cpu className="text-secondary" aria-hidden="true" />
          PKCS#11 HSM Playground
        </h3>

        <div className="flex flex-wrap items-center gap-2">
          {/* Engine mode selector */}
          <div className="flex items-center gap-2 sm:gap-4 bg-muted/50 px-2 sm:px-3 py-1.5 rounded-full shadow-inner">
            <span className="text-xs font-semibold text-muted-foreground mr-1 hidden sm:inline">
              Engine:
            </span>
            {(['cpp', 'rust', 'dual'] as const).map((mode) => (
              <label
                key={mode}
                className={`flex items-center gap-1 sm:gap-1.5 text-xs min-h-[36px] ${phase === 'idle' ? 'cursor-pointer hover:text-primary' : 'opacity-60 cursor-not-allowed'}`}
              >
                <input
                  type="radio"
                  name="engineMode-hsm"
                  value={mode}
                  checked={engineMode === mode}
                  onChange={() => {
                    if (phase === 'idle') setEngineMode(mode)
                  }}
                  disabled={phase !== 'idle'}
                  className="accent-primary w-3 h-3"
                />
                <span
                  className={
                    engineMode === mode ? 'text-primary font-bold' : 'text-muted-foreground'
                  }
                >
                  {mode === 'cpp' && 'C++'}
                  {mode === 'rust' && 'Rust'}
                  {mode === 'dual' && (
                    <>
                      <span className="hidden sm:inline">Dual Parity</span>
                      <span className="sm:hidden">Dual</span>
                    </>
                  )}
                </span>
              </label>
            ))}
          </div>

          {/* WIP badge */}
          <button
            onClick={() => setShowMethodologyModal(true)}
            className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-warning/10 text-warning border border-warning/30 hover:bg-warning/20 transition-colors"
            aria-label="View PKCS#11 test methodology"
          >
            <Construction size={11} />
            WIP
            <FlaskConical size={11} />
          </button>
        </div>
      </div>

      {showMethodologyModal && (
        <HsmTestMethodologyModal onClose={() => setShowMethodologyModal(false)} />
      )}

      {/* Tab Navigation */}
      <div className="relative shrink-0 mb-4 sm:mb-6">
        <div
          ref={tabListRef}
          role="tablist"
          aria-label="HSM Playground operations"
          tabIndex={-1}
          className="flex space-x-1 bg-muted p-1 rounded-xl overflow-x-auto no-scrollbar -mx-2 px-2 sm:mx-0 sm:px-1"
          onKeyDown={(e) => {
            const tabs = Array.from(
              e.currentTarget.querySelectorAll('[role="tab"]')
            ) as HTMLElement[]
            const idx = tabs.findIndex((t) => t === document.activeElement)
            if (idx === -1) return
            let next = idx
            if (e.key === 'ArrowRight') next = (idx + 1) % tabs.length
            else if (e.key === 'ArrowLeft') next = (idx - 1 + tabs.length) % tabs.length
            else if (e.key === 'Home') next = 0
            else if (e.key === 'End') next = tabs.length - 1
            else return
            e.preventDefault()
            tabs[next].focus()
            tabs[next].click()
          }}
        >
          {tabBtn(
            'keystore',
            <>
              <KeyIcon size={16} className="shrink-0" aria-hidden="true" />
              <span className="text-xs ml-1">
                <span className="sm:hidden">Keys</span>
                <span className="hidden sm:inline">HSM Keys</span>
              </span>
            </>
          )}
          {tabBtn(
            'symmetric',
            <>
              <Lock size={16} className="shrink-0" aria-hidden="true" />
              <span className="text-xs ml-1">
                <span className="sm:hidden">Sym</span>
                <span className="hidden sm:inline">Sym Encrypt</span>
              </span>
            </>
          )}
          {tabBtn(
            'key_wrap',
            <>
              <Layers size={16} className="shrink-0" aria-hidden="true" />
              <span className="text-xs ml-1">
                <span className="sm:hidden">Wrap</span>
                <span className="hidden sm:inline">Wrap / Unwrap</span>
              </span>
            </>
          )}
          {tabBtn(
            'hashing',
            <>
              <Hash size={16} className="shrink-0" aria-hidden="true" />
              <span className="text-xs ml-1">Hash</span>
            </>
          )}
          {tabBtn(
            'sign_verify',
            <>
              <FileSignature size={16} className="shrink-0" aria-hidden="true" />
              <span className="text-xs ml-1">
                <span className="sm:hidden">Sign</span>
                <span className="hidden sm:inline">Sign &amp; Verify</span>
              </span>
            </>
          )}
          {tabBtn(
            'key_agree',
            <>
              <ArrowLeftRight size={16} className="shrink-0" aria-hidden="true" />
              <span className="text-xs ml-1">
                <span className="sm:hidden">Agree</span>
                <span className="hidden sm:inline">Key Agree</span>
              </span>
            </>
          )}
          {tabBtn(
            'key_derive',
            <>
              <Filter size={16} className="shrink-0" aria-hidden="true" />
              <span className="text-xs ml-1">KDF</span>
            </>
          )}
          {tabBtn(
            'mechanisms',
            <>
              <Layers size={16} className="shrink-0" aria-hidden="true" />
              <span className="text-xs ml-1">
                <span className="sm:hidden">Mechs</span>
                <span className="hidden sm:inline">Mechanisms</span>
              </span>
            </>
          )}
          {tabBtn(
            'acvp',
            <>
              <ShieldCheck size={16} className="shrink-0" aria-hidden="true" />
              <span className="text-xs ml-1">ACVP</span>
            </>
          )}
          {tabBtn(
            'logs',
            <>
              <Cpu size={16} className="shrink-0" aria-hidden="true" />
              <span className="text-xs ml-1">
                <span className="sm:hidden">P11</span>
                <span className="hidden sm:inline">PKCS#11 Log</span>
              </span>
            </>
          )}
        </div>
        <div
          className={clsx(
            'pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-muted to-transparent rounded-r-xl transition-opacity duration-200 sm:hidden',
            showTabFade ? 'opacity-100' : 'opacity-0'
          )}
          aria-hidden="true"
        />
      </div>

      {/* Content Area */}
      <div
        role="tabpanel"
        id="hsm-tabpanel"
        aria-labelledby={`hsm-tab-${activeTab}`}
        className="flex-1 overflow-y-auto custom-scrollbar min-h-0 bg-card rounded-xl border border-border p-3 md:p-6 relative"
      >
        {activeTab === 'keystore' && (
          <div className="space-y-4">
            <TokenSetupPanel />
            <HsmKeyTable />
          </div>
        )}
        {activeTab === 'symmetric' && <HsmSymmetricPanel />}
        {activeTab === 'key_wrap' && <KeyWrapPanel />}
        {activeTab === 'hashing' && <HsmHashingPanel />}
        {activeTab === 'sign_verify' && <HsmSignCombinedPanel />}
        {activeTab === 'key_agree' && <HsmKeyAgreementPanel />}
        {activeTab === 'key_derive' && <HsmKdfPanel />}
        {activeTab === 'mechanisms' && <HsmMechanismPanel />}
        {activeTab === 'acvp' && <HsmAcvpTesting />}
        {activeTab === 'logs' && <PkcsLogPanel />}
      </div>

      {error && (
        <div
          ref={errorRef}
          id="hsm-playground-error"
          role="alert"
          tabIndex={-1}
          className="mt-6 p-4 bg-status-error border border-status-error rounded-xl flex items-center gap-3 text-status-error text-sm shrink-0"
        >
          <AlertCircle size={20} aria-hidden="true" />
          <span className="font-medium">{error}</span>
        </div>
      )}
    </Card>
  )
}
