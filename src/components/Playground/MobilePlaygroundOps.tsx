// SPDX-License-Identifier: GPL-3.0-only
/**
 * MobilePlaygroundOps — reduced interactive Playground for mobile.
 * Provides KEM + Sign & Verify tabs via scroll-snap carousel with WASM capability check.
 */
import { useState, useRef, useEffect, useCallback, lazy, Suspense } from 'react'
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
import { Pkcs11LogPanel } from '../shared/Pkcs11LogPanel'
import { useHsmContext } from './hsm/HsmContext'
import { Button } from '../ui/button'

const MobilePlaygroundView = lazy(() =>
  import('./MobilePlaygroundView').then((m) => ({ default: m.MobilePlaygroundView }))
)

type CapabilityStatus = 'checking' | 'supported' | 'unsupported' | 'dismissed'

const TABS = [
  { id: 'kem', label: 'KEM', icon: Key },
  { id: 'sign', label: 'Sign & Verify', icon: FileSignature },
  { id: 'workshop', label: 'Crypto Lab', icon: FlaskConical },
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

function MobileOpsContent() {
  const { hsmLog, clearHsmLog } = useHsmContext()
  const [activeTab, setActiveTab] = useState<TabId>('kem')
  const [logOpen, setLogOpen] = useState(false)
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
  const scrollToTab = useCallback((id: TabId) => {
    const el = scrollRef.current
    if (!el) return
    const idx = TABS.findIndex((t) => t.id === id)
    el.scrollTo({ left: idx * el.clientWidth, behavior: 'smooth' })
    setActiveTab(id)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scrollend', handleScroll, { passive: true })
    return () => el.removeEventListener('scrollend', handleScroll)
  }, [handleScroll])

  return (
    <div className="flex flex-col h-full">
      {/* Tab indicator dots */}
      <div className="flex items-center justify-center gap-4 py-3 border-b border-border shrink-0">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <Button
              variant="ghost"
              key={tab.id}
              onClick={() => scrollToTab(tab.id)}
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
        className="flex-1 flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
      >
        <div className="snap-center shrink-0 w-full overflow-y-auto p-3">
          <KemOpsTab />
        </div>
        <div className="snap-center shrink-0 w-full overflow-y-auto p-3">
          <SignVerifyTab />
        </div>
        <div className="snap-center shrink-0 w-full overflow-y-auto p-3">
          <WorkshopToolsTab />
        </div>
      </div>

      {/* Collapsible log panel */}
      <div className="border-t border-border shrink-0">
        <Button
          variant="ghost"
          type="button"
          onClick={() => setLogOpen((o) => !o)}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {logOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          PKCS#11 Log
        </Button>
        {logOpen && (
          <div className="max-h-[30vh] overflow-y-auto border-t border-border/50 px-3 pb-3">
            <Pkcs11LogPanel log={hsmLog} onClear={clearHsmLog} />
          </div>
        )}
      </div>
    </div>
  )
}

export const MobilePlaygroundOps = () => {
  const [status, setStatus] = useState<CapabilityStatus>(() => {
    const hasSharedArrayBuffer = typeof SharedArrayBuffer !== 'undefined'
    const deviceMemory = (navigator as { deviceMemory?: number }).deviceMemory
    const lowMemory = deviceMemory !== undefined && deviceMemory < 2
    return !hasSharedArrayBuffer || lowMemory ? 'unsupported' : 'supported'
  })
  const [showFallback, setShowFallback] = useState(false)

  if (showFallback) {
    return (
      <Suspense fallback={null}>
        <MobilePlaygroundView />
      </Suspense>
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
      <CapabilityWarning
        onContinue={() => setStatus('dismissed')}
        onFallback={() => setShowFallback(true)}
      />
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
