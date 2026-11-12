// SPDX-License-Identifier: AGPL-3.0-only
/**
 * MobilePlaygroundOps — reduced interactive Playground for mobile.
 * Provides KEM, Sign & Verify, Crypto Lab and Keys via a capability-checked carousel.
 */
import { useState, useRef, useEffect, useCallback, useId, lazy, Suspense } from 'react'
import { useLocation } from 'react-router'
import {
  AlertTriangle,
  Key,
  FileSignature,
  FlaskConical,
  ChevronUp,
  ChevronDown,
  Monitor,
} from 'lucide-react'
import { PlaygroundProvider } from './PlaygroundProvider'
import { KemOpsTab } from './tabs/KemOpsTab'
import { SignVerifyTab } from './tabs/SignVerifyTab'
import { WorkshopToolsTab } from './tabs/WorkshopToolsTab'
import { LogsTab } from './tabs/LogsTab'
import { Pkcs11LogPanel } from '../shared/Pkcs11LogPanel'
import { useHsmContext } from './hsm/HsmContext'
import { Button } from '../ui/button'
import { useDeviceCapabilities } from '@/hooks/useDeviceCapabilities'
import { useSettingsContext } from './contexts/SettingsContext'
import { InteractiveExecutionNotice } from './InteractiveExecutionNotice'
import { algorithmLaunchPhoneReason } from '@/data/algorithmLaunch'

const KeyStoreTab = lazy(() =>
  import('./tabs/KeyStoreTab').then((m) => ({ default: m.KeyStoreTab }))
)

const MobilePlaygroundView = lazy(() =>
  import('./MobilePlaygroundView').then((m) => ({ default: m.MobilePlaygroundView }))
)

type CapabilityStatus = 'checking' | 'supported' | 'unsupported' | 'dismissed'

const TABS = [
  { id: 'kem', label: 'KEM', icon: Key },
  { id: 'sign', label: 'Sign & Verify', icon: FileSignature },
  { id: 'workshop', label: 'Crypto Lab', icon: FlaskConical },
  { id: 'keystore', label: 'Keys', icon: Key },
] as const

type TabId = (typeof TABS)[number]['id']

function CapabilityWarning({
  onContinue,
  onFallback,
}: {
  onContinue: () => void
  onFallback: () => void
}) {
  return (
    <div className="glass-panel p-5 space-y-4 mx-4 my-6">
      <div className="flex items-start gap-3">
        <AlertTriangle size={20} className="text-status-warning shrink-0 mt-0.5" />
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Limited Device Support</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The Playground requires SharedArrayBuffer and sufficient memory for WebAssembly crypto
            operations. Your device may not support these features or may experience slow
            performance.
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="gradient" size="sm" onClick={onContinue} className="flex-1">
          Continue Anyway
        </Button>
        <Button variant="outline" size="sm" onClick={onFallback} className="flex-1">
          <Monitor size={14} className="mr-1.5" />
          View Info
        </Button>
      </div>
    </div>
  )
}

/** The explicit information-only fallback cannot execute an algorithm launch. */
function LaunchNotice() {
  const { search } = useLocation()
  const reason = algorithmLaunchPhoneReason('interactive', search, true)
  if (!reason) return null
  return (
    <div role="alert" className="glass-panel mx-3 my-2 p-3 flex items-start gap-2">
      <AlertTriangle size={16} className="text-status-warning shrink-0 mt-0.5" />
      <p className="text-xs text-foreground leading-relaxed">{reason}</p>
    </div>
  )
}

function phoneTab(search: string): TabId {
  const tab = new URLSearchParams(search).get('tab')
  if (tab === 'keystore') return 'keystore'
  if (tab === 'sign_verify') return 'sign'
  return 'kem'
}

function MobileOpsContent() {
  const { search } = useLocation()
  const { executionMode, wasmLoaded } = useSettingsContext()
  const { hsmLog, clearHsmLog } = useHsmContext()
  const [activeTab, setActiveTab] = useState<TabId>(() => phoneTab(search))
  const [previousSearch, setPreviousSearch] = useState(search)
  if (previousSearch !== search) {
    setPreviousSearch(search)
    setActiveTab(phoneTab(search))
  }
  const [logOpen, setLogOpen] = useState(false)
  const [logSource, setLogSource] = useState<'software' | 'pkcs11'>('software')
  const logPanelId = useId()
  const logTitle = logSource === 'software' ? 'Software playground log' : 'Shared PKCS#11 log'
  const scrollRef = useRef<HTMLDivElement>(null)

  // Sync scroll position to active tab indicator
  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const idx = Math.round(el.scrollLeft / el.clientWidth)
    const tabId = TABS[idx]?.id
    if (tabId && tabId !== activeTab) setActiveTab(tabId)
  }, [activeTab])

  // Scroll to tab on dot click
  const scrollToTab = useCallback((id: TabId, behavior: ScrollBehavior = 'smooth') => {
    const el = scrollRef.current
    if (!el) return
    const idx = TABS.findIndex((t) => t.id === id)
    el.scrollTo({ left: idx * el.clientWidth, behavior })
    setActiveTab(id)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const idx = TABS.findIndex((tab) => tab.id === phoneTab(search))
    el.scrollTo({ left: idx * el.clientWidth, behavior: 'auto' })
  }, [search])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scrollend', handleScroll, { passive: true })
    return () => el.removeEventListener('scrollend', handleScroll)
  }, [handleScroll])

  return (
    <div className="flex min-w-0 flex-col h-full">
      <InteractiveExecutionNotice executionMode={executionMode} wasmLoaded={wasmLoaded} />
      {/* Tab indicator dots */}
      <div className="flex flex-wrap items-center justify-center gap-2 px-3 py-3 border-b border-border shrink-0">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <Button
              variant="ghost"
              key={tab.id}
              onClick={() => scrollToTab(tab.id)}
              aria-pressed={isActive}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </Button>
          )
        })}
      </div>

      {/* Swipeable carousel */}
      <div
        ref={scrollRef}
        className="min-w-0 flex-1 flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
      >
        <div
          inert={activeTab !== 'kem'}
          className="snap-center shrink-0 min-w-0 w-full overflow-y-auto p-3"
        >
          <KemOpsTab />
        </div>
        <div
          inert={activeTab !== 'sign'}
          className="snap-center shrink-0 min-w-0 w-full overflow-y-auto p-3"
        >
          <SignVerifyTab />
        </div>
        <div
          inert={activeTab !== 'workshop'}
          className="snap-center shrink-0 min-w-0 w-full overflow-y-auto p-3"
        >
          <WorkshopToolsTab />
        </div>
        <div
          inert={activeTab !== 'keystore'}
          className="snap-center shrink-0 min-w-0 w-full overflow-y-auto p-3"
        >
          {activeTab === 'keystore' && (
            <Suspense fallback={<p role="status">Loading Keys…</p>}>
              <KeyStoreTab />
            </Suspense>
          )}
        </div>
      </div>

      {/* Collapsible log panel */}
      <div className="border-t border-border shrink-0">
        <Button
          variant="ghost"
          type="button"
          onClick={() => setLogOpen((o) => !o)}
          aria-expanded={logOpen}
          aria-controls={logPanelId}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {logOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          {logOpen ? 'Hide' : 'Show'} {logTitle.toLowerCase()}
        </Button>
        {logOpen && (
          <div
            id={logPanelId}
            role="region"
            aria-label={logTitle}
            className="max-h-[30vh] overflow-auto border-t border-border/50 px-3 pb-3"
          >
            <div role="group" aria-label="Log source" className="flex flex-wrap gap-2 py-2">
              <Button
                variant="ghost"
                type="button"
                aria-pressed={logSource === 'software'}
                onClick={() => setLogSource('software')}
                className="text-xs"
              >
                Software
              </Button>
              <Button
                variant="ghost"
                type="button"
                aria-pressed={logSource === 'pkcs11'}
                onClick={() => setLogSource('pkcs11')}
                className="text-xs"
              >
                Shared PKCS#11
              </Button>
            </div>
            <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
              {logSource === 'software'
                ? 'Software-provider records, including initialization. Changing the selected mode does not reclassify earlier entries.'
                : 'A separate shared PKCS#11 trace. Clearing it leaves the software log and keys unchanged. Some workshop tools keep their own logs.'}
            </p>
            {logSource === 'software' ? (
              <LogsTab />
            ) : (
              <Pkcs11LogPanel
                log={hsmLog}
                onClear={clearHsmLog}
                title="Shared PKCS#11 trace"
                defaultOpen
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export const MobilePlaygroundOps = () => {
  // WS8b (2026-08-02): the probe that used to be inlined here now lives in
  // useDeviceCapabilities, so the catalogue's device badges and this warning
  // read the same source instead of two implementations that could disagree.
  // Behaviour is unchanged — same trigger (no SAB, or reported memory < 2 GB),
  // same warning, same *Continue Anyway* escape.
  const caps = useDeviceCapabilities()
  const [status, setStatus] = useState<CapabilityStatus>(() =>
    !caps.sab || caps.lowMemory ? 'unsupported' : 'supported'
  )
  const [showFallback, setShowFallback] = useState(false)

  if (showFallback) {
    return (
      <>
        <LaunchNotice />
        <Suspense fallback={null}>
          <MobilePlaygroundView />
        </Suspense>
      </>
    )
  }

  if (status === 'checking') {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (status === 'unsupported') {
    return (
      <>
        <CapabilityWarning
          onContinue={() => setStatus('dismissed')}
          onFallback={() => setShowFallback(true)}
        />
      </>
    )
  }

  return (
    <PlaygroundProvider>
      <div className="min-h-[60vh]">
        <MobileOpsContent />
      </div>
    </PlaygroundProvider>
  )
}
