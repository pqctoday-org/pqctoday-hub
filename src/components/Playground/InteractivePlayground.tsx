// SPDX-License-Identifier: GPL-3.0-only
import { useRef, useEffect, useState } from 'react'
import {
  Play,
  Database,
  Activity,
  Lock,
  FileSignature,
  Key as KeyIcon,
  FileText,
  ShieldCheck,
  AlertCircle,
  Hash,
  Cpu,
  ArrowLeftRight,
  Filter,
  Layers,
  FlaskConical,
  Construction,
} from 'lucide-react'
import clsx from 'clsx'
import { PlaygroundProvider } from './PlaygroundProvider'
import { useSettingsContext } from './contexts/SettingsContext'
import { useKeyStoreContext } from './contexts/KeyStoreContext'
import { useHsmContext } from './hsm/HsmContext'
import { HsmTestMethodologyModal } from './hsm/HsmTestMethodologyModal'
import { ACVPTesting } from '../ACVP/ACVPTesting'
import { DataTab } from './tabs/DataTab'
import { KemOpsTab } from './tabs/KemOpsTab'
import { SymmetricTab } from './tabs/SymmetricTab'
import { HashingTab } from './tabs/HashingTab'
import { SignVerifyTab } from './tabs/SignVerifyTab'
import { KeyStoreTab } from './tabs/KeyStoreTab'
import { LogsTab } from './tabs/LogsTab'
import { HsmSymmetricPanel } from './hsm/HsmSymmetricPanel'
import { HsmHashingPanel } from './hsm/HsmHashingPanel'
import { HsmKeyAgreementPanel } from './hsm/HsmKeyAgreementPanel'
import { HsmKdfPanel } from './hsm/HsmKdfPanel'
import { HsmMechanismPanel } from './hsm/HsmMechanismPanel'
import { KeyWrapPanel } from './hsm/symmetric/KeyWrapPanel'
import { HsmAcvpTesting } from './hsm/HsmAcvpTesting'
import { logEvent } from '../../utils/analytics'
import { usePersonaStore } from '../../store/usePersonaStore'
import { Button } from '../ui/button'
import { Card } from '../ui/card'

export const InteractivePlayground = () => {
  return (
    <PlaygroundProvider>
      <PlaygroundContent />
    </PlaygroundProvider>
  )
}

const PlaygroundContent = () => {
  const { activeTab, setActiveTab, error, lastLogEntry, hsmMode, toggleHsmMode } =
    useSettingsContext()
  const { keyStore, setKeyStore } = useKeyStoreContext()
  const { engineMode, setEngineMode, phase } = useHsmContext()
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const isSimplifiedPersona = selectedPersona === 'curious' || selectedPersona === 'executive'
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

  // Reset HSM mode if persona changes to simplified while HSM is active
  useEffect(() => {
    if (isSimplifiedPersona && hsmMode) toggleHsmMode()
  }, [isSimplifiedPersona]) // eslint-disable-line react-hooks/exhaustive-deps

  // Reset ACVP tab if persona changes to simplified while viewing it
  useEffect(() => {
    if (isSimplifiedPersona && activeTab === 'acvp') setActiveTab('keystore')
  }, [isSimplifiedPersona, activeTab, setActiveTab])

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab)
    logEvent('Playground', 'Switch Tab', tab)
  }

  const handleToggleHsmMode = () => {
    toggleHsmMode() // resets to keystore tab
    logEvent('Playground', hsmMode ? 'Disable HSM Mode' : 'Enable HSM Mode', activeTab)
  }

  return (
    <Card className="p-3 md:p-6 min-h-[60vh] md:min-h-[85vh] flex flex-col">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 shrink-0 gap-2">
        <h3 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <Play className="text-secondary" aria-hidden="true" />
          Interactive Playground
        </h3>

        {/* HSM mode toggle pill — hidden for curious/executive personas */}
        {!isSimplifiedPersona && (
          <div className="flex flex-wrap items-center gap-2">
            {hsmMode && (
              <div className="flex items-center gap-2 sm:gap-4 sm:mr-4 sm:border-r border-border sm:pr-4 bg-muted/50 px-2 sm:px-3 py-1.5 rounded-full shadow-inner w-full sm:w-auto order-last sm:order-first justify-center sm:justify-start">
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
                      name="engineMode-global"
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
            )}
            <span
              className={clsx(
                'text-xs',
                !hsmMode ? 'text-foreground font-medium' : 'text-muted-foreground'
              )}
            >
              Software
            </span>
            <button
              role="switch"
              aria-checked={hsmMode}
              aria-label="Toggle HSM mode"
              onClick={handleToggleHsmMode}
              className={clsx(
                'relative w-11 h-6 rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none',
                hsmMode ? 'bg-primary' : 'bg-muted border border-border'
              )}
            >
              <span
                className={clsx(
                  'absolute top-1 left-1 w-4 h-4 rounded-full bg-background shadow transition-transform',
                  hsmMode ? 'translate-x-5' : ''
                )}
              />
            </button>
            <span
              className={clsx(
                'text-xs',
                hsmMode ? 'text-primary font-medium' : 'text-muted-foreground'
              )}
            >
              PKCS#11 HSM
            </span>
            {hsmMode && (
              <button
                onClick={() => setShowMethodologyModal(true)}
                className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30 hover:bg-amber-500/20 transition-colors"
                aria-label="View PKCS#11 test methodology"
              >
                <Construction size={11} />
                WIP
                <FlaskConical size={11} />
              </button>
            )}
          </div>
        )}
      </div>

      {showMethodologyModal && (
        <HsmTestMethodologyModal onClose={() => setShowMethodologyModal(false)} />
      )}

      {/* Last log entry strip */}
      {lastLogEntry && !hsmMode && (
        <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs font-mono bg-muted px-3 py-1.5 rounded-lg border border-border animate-fade-in mb-4 shrink-0">
          <span className="text-muted-foreground">{lastLogEntry.operation}</span>
          <span className="text-foreground/50">|</span>
          <span className="text-accent max-w-[200px] truncate" title={lastLogEntry.result}>
            {lastLogEntry.result}
          </span>
          <span className="text-foreground/50">|</span>
          <span
            className={clsx(
              'font-bold',
              lastLogEntry.executionTime < 100
                ? 'text-status-success'
                : lastLogEntry.executionTime < 500
                  ? 'text-status-warning'
                  : 'text-status-error'
            )}
          >
            {lastLogEntry.executionTime.toFixed(2)} ms
          </span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="relative shrink-0 mb-4 sm:mb-6">
        <div
          ref={tabListRef}
          role="tablist"
          aria-label="Playground operations"
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
          <Button
            role="tab"
            id="tab-keystore"
            aria-selected={activeTab === 'keystore'}
            aria-controls="playground-tabpanel"
            onClick={() => handleTabChange('keystore')}
            variant="ghost"
            size="sm"
            className={clsx(
              'whitespace-nowrap',
              activeTab === 'keystore'
                ? 'bg-primary/20 text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
          >
            <KeyIcon size={16} className="shrink-0" aria-hidden="true" />
            <span className="text-xs ml-1">
              {hsmMode ? (
                <>
                  <span className="sm:hidden">Keys</span>
                  <span className="hidden sm:inline">HSM Keys</span>
                </>
              ) : (
                <>
                  <span className="sm:hidden">Keys</span>
                  <span className="hidden sm:inline">Key Store ({keyStore.length})</span>
                </>
              )}
            </span>
          </Button>
          <Button
            role="tab"
            id="tab-data"
            aria-selected={activeTab === 'data'}
            aria-controls="playground-tabpanel"
            onClick={() => handleTabChange('data')}
            variant="ghost"
            size="sm"
            className={clsx(
              'whitespace-nowrap',
              activeTab === 'data'
                ? 'bg-primary/20 text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
          >
            <Database size={16} className="shrink-0" aria-hidden="true" />{' '}
            <span className="text-xs ml-1">Data</span>
          </Button>
          <Button
            role="tab"
            id="tab-kem_ops"
            aria-selected={activeTab === 'kem_ops'}
            aria-controls="playground-tabpanel"
            onClick={() => handleTabChange('kem_ops')}
            variant="ghost"
            size="sm"
            className={clsx(
              'whitespace-nowrap',
              activeTab === 'kem_ops'
                ? 'bg-primary/20 text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
          >
            <Activity size={16} className="shrink-0" aria-hidden="true" />{' '}
            <span className="text-xs ml-1">
              <span className="sm:hidden">KEM</span>
              <span className="hidden sm:inline">KEM &amp; Encrypt</span>
            </span>
          </Button>

          <Button
            role="tab"
            id="tab-symmetric"
            aria-selected={activeTab === 'symmetric'}
            aria-controls="playground-tabpanel"
            onClick={() => handleTabChange('symmetric')}
            variant="ghost"
            size="sm"
            className={clsx(
              'whitespace-nowrap',
              activeTab === 'symmetric'
                ? 'bg-primary/20 text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
          >
            <Lock size={16} className="shrink-0" aria-hidden="true" />{' '}
            <span className="text-xs ml-1">
              <span className="sm:hidden">Sym</span>
              <span className="hidden sm:inline">Sym Encrypt</span>
            </span>
          </Button>
          {hsmMode && (
            <Button
              role="tab"
              id="tab-key_wrap"
              aria-selected={activeTab === 'key_wrap'}
              aria-controls="playground-tabpanel"
              onClick={() => handleTabChange('key_wrap')}
              variant="ghost"
              size="sm"
              className={clsx(
                'whitespace-nowrap',
                activeTab === 'key_wrap'
                  ? 'bg-primary/20 text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <Layers size={16} className="shrink-0" aria-hidden="true" />{' '}
              <span className="text-xs ml-1">
                <span className="sm:hidden">Wrap</span>
                <span className="hidden sm:inline">Wrap / Unwrap</span>
              </span>
            </Button>
          )}
          <Button
            role="tab"
            id="tab-hashing"
            aria-selected={activeTab === 'hashing'}
            aria-controls="playground-tabpanel"
            onClick={() => handleTabChange('hashing')}
            variant="ghost"
            size="sm"
            className={clsx(
              'whitespace-nowrap',
              activeTab === 'hashing'
                ? 'bg-primary/20 text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
          >
            <Hash size={16} className="shrink-0" aria-hidden="true" />{' '}
            <span className="text-xs ml-1">Hash</span>
          </Button>

          <Button
            role="tab"
            id="tab-sign_verify"
            aria-selected={activeTab === 'sign_verify'}
            aria-controls="playground-tabpanel"
            onClick={() => handleTabChange('sign_verify')}
            variant="ghost"
            size="sm"
            className={clsx(
              'whitespace-nowrap',
              activeTab === 'sign_verify'
                ? 'bg-primary/20 text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
          >
            <FileSignature size={16} className="shrink-0" aria-hidden="true" />{' '}
            <span className="text-xs ml-1">
              <span className="sm:hidden">Sign</span>
              <span className="hidden sm:inline">Sign &amp; Verify</span>
            </span>
          </Button>

          {hsmMode && (
            <>
              <Button
                role="tab"
                id="tab-key_agree"
                aria-selected={activeTab === 'key_agree'}
                aria-controls="playground-tabpanel"
                onClick={() => handleTabChange('key_agree')}
                variant="ghost"
                size="sm"
                className={clsx(
                  'whitespace-nowrap',
                  activeTab === 'key_agree'
                    ? 'bg-primary/20 text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                <ArrowLeftRight size={16} className="shrink-0" aria-hidden="true" />{' '}
                <span className="text-xs ml-1">
                  <span className="sm:hidden">Agree</span>
                  <span className="hidden sm:inline">Key Agree</span>
                </span>
              </Button>
              <Button
                role="tab"
                id="tab-key_derive"
                aria-selected={activeTab === 'key_derive'}
                aria-controls="playground-tabpanel"
                onClick={() => handleTabChange('key_derive')}
                variant="ghost"
                size="sm"
                className={clsx(
                  'whitespace-nowrap',
                  activeTab === 'key_derive'
                    ? 'bg-primary/20 text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                <Filter size={16} className="shrink-0" aria-hidden="true" />{' '}
                <span className="text-xs ml-1">KDF</span>
              </Button>
              <Button
                role="tab"
                id="tab-mechanisms"
                aria-selected={activeTab === 'mechanisms'}
                aria-controls="playground-tabpanel"
                onClick={() => handleTabChange('mechanisms')}
                variant="ghost"
                size="sm"
                className={clsx(
                  'whitespace-nowrap',
                  activeTab === 'mechanisms'
                    ? 'bg-primary/20 text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                <Layers size={16} className="shrink-0" aria-hidden="true" />{' '}
                <span className="text-xs ml-1">
                  <span className="sm:hidden">Mechs</span>
                  <span className="hidden sm:inline">Mechanisms</span>
                </span>
              </Button>
              {!isSimplifiedPersona && (
                <Button
                  role="tab"
                  id="tab-acvp"
                  aria-selected={activeTab === 'acvp'}
                  aria-controls="playground-tabpanel"
                  onClick={() => handleTabChange('acvp')}
                  variant="ghost"
                  size="sm"
                  className={clsx(
                    'whitespace-nowrap',
                    activeTab === 'acvp'
                      ? 'bg-primary/20 text-primary shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  )}
                >
                  <ShieldCheck size={16} className="shrink-0" aria-hidden="true" />{' '}
                  <span className="text-xs ml-1">ACVP</span>
                </Button>
              )}
            </>
          )}

          {!hsmMode && !isSimplifiedPersona && (
            <Button
              role="tab"
              id="tab-acvp"
              aria-selected={activeTab === 'acvp'}
              aria-controls="playground-tabpanel"
              onClick={() => handleTabChange('acvp')}
              variant="ghost"
              size="sm"
              className={clsx(
                'whitespace-nowrap',
                activeTab === 'acvp'
                  ? 'bg-primary/20 text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <ShieldCheck size={16} className="shrink-0" aria-hidden="true" />{' '}
              <span className="text-xs ml-1">ACVP</span>
            </Button>
          )}

          <Button
            role="tab"
            id="tab-logs"
            aria-selected={activeTab === 'logs'}
            aria-controls="playground-tabpanel"
            onClick={() => handleTabChange('logs')}
            variant="ghost"
            size="sm"
            className={clsx(
              'whitespace-nowrap',
              activeTab === 'logs'
                ? 'bg-primary/20 text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            )}
          >
            {hsmMode ? (
              <>
                <Cpu size={16} className="shrink-0" aria-hidden="true" />{' '}
                <span className="text-xs ml-1">
                  <span className="sm:hidden">P11</span>
                  <span className="hidden sm:inline">PKCS#11 Log</span>
                </span>
              </>
            ) : (
              <>
                <FileText size={16} className="shrink-0" aria-hidden="true" />{' '}
                <span className="text-xs ml-1">Logs</span>
              </>
            )}
          </Button>
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
        id="playground-tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        className="flex-1 overflow-y-auto custom-scrollbar min-h-0 bg-card rounded-xl border border-border p-3 md:p-6 relative"
      >
        {activeTab === 'data' && <DataTab />}
        {activeTab === 'kem_ops' && <KemOpsTab />}
        {activeTab === 'symmetric' && (hsmMode ? <HsmSymmetricPanel /> : <SymmetricTab />)}
        {activeTab === 'key_wrap' && hsmMode && <KeyWrapPanel />}
        {activeTab === 'hashing' && (hsmMode ? <HsmHashingPanel /> : <HashingTab />)}
        {activeTab === 'sign_verify' && <SignVerifyTab />}
        {activeTab === 'key_agree' && hsmMode && <HsmKeyAgreementPanel />}
        {activeTab === 'key_derive' && hsmMode && <HsmKdfPanel />}
        {activeTab === 'mechanisms' && hsmMode && <HsmMechanismPanel />}
        {activeTab === 'keystore' && <KeyStoreTab />}
        {activeTab === 'logs' && <LogsTab />}
        {activeTab === 'acvp' && !hsmMode && !isSimplifiedPersona && (
          <div className="h-full">
            <ACVPTesting keyStore={keyStore} setKeyStore={setKeyStore} />
          </div>
        )}
        {activeTab === 'acvp' && hsmMode && !isSimplifiedPersona && (
          <div className="h-full">
            <HsmAcvpTesting />
          </div>
        )}
      </div>

      {error && (
        <div
          ref={errorRef}
          id="playground-error"
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
