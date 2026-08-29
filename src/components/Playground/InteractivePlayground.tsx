// SPDX-License-Identifier: GPL-3.0-only
import { useRef, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import {
  Play,
  Database,
  Activity,
  Lock,
  FileSignature,
  Key as KeyIcon,
  FileText,
  AlertCircle,
  Hash,
  X,
  Sparkles,
} from 'lucide-react'
import clsx from 'clsx'
import { useSettingsContext } from './contexts/SettingsContext'
import { useKeyStoreContext } from './contexts/KeyStoreContext'
import { DataTab } from './tabs/DataTab'
import { KemOpsTab } from './tabs/KemOpsTab'
import { SymmetricTab } from './tabs/SymmetricTab'
import { HashingTab } from './tabs/HashingTab'
import { SignVerifyTab } from './tabs/SignVerifyTab'
import { KeyStoreTab } from './tabs/KeyStoreTab'
import { LogsTab } from './tabs/LogsTab'
import { logEvent } from '../../utils/analytics'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { usePageActionsStore } from '@/store/usePageActionsStore'
import { ExecutiveRedirectBanner } from '../common/ExecutiveRedirectBanner'
import { usePersonaStore } from '@/store/usePersonaStore'
import { SimplifiedViewNotice } from '../common/SimplifiedViewNotice'

export const InteractivePlayground = () => {
  const role = usePersonaStore((s) => s.selectedPersona)
  const { activeTab, setActiveTab, algorithm, error, lastLogEntry } = useSettingsContext()
  const { keyStore } = useKeyStoreContext()
  const [, setSearchParams] = useSearchParams()

  // Sync activeTab + algorithm → URL whenever either changes
  useEffect(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (activeTab !== 'keystore') next.set('tab', activeTab)
        else next.delete('tab')
        if (algorithm) next.set('algo', algorithm)
        else next.delete('algo')
        return next
      },
      { replace: true }
    )
  }, [activeTab, algorithm, setSearchParams])

  const [showQuickStart, setShowQuickStart] = useState(() => {
    try {
      return sessionStorage.getItem('pqc-playground-qs-dismissed') !== '1'
    } catch {
      return true
    }
  })
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

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab)
    logEvent('Playground', 'Switch Tab', tab)
  }

  // Share lives ONLY in the top bar (2026-08-27 remediation) — register this
  // page's title/text so the global ShareButton (MainLayout.tsx) shows the
  // right copy instead of the generic route fallback. No URL override
  // needed: tab/algo are already synced to the URL above.
  useEffect(() => {
    const { setPageActions, clearPageActions } = usePageActionsStore.getState()
    setPageActions({
      shareTitle: 'Interactive Playground — PQC Today',
      shareText: 'Run real PQC crypto operations in your browser',
    })
    return () => clearPageActions()
  }, [])

  return (
    <Card className="p-3 md:p-6 min-h-[60vh] md:min-h-[85vh] flex flex-col">
      {role === 'executive' && (
        <ExecutiveRedirectBanner
          className="mb-4 shrink-0"
          title="Interactive Playground is a hands-on engineering workbench."
          subtitle="This surface runs real key generation, encryption and signing operations in your browser — useful for your engineering team, not for board-level PQC decisions. For executive context:"
          ctas={[
            { label: 'Command Center →', to: '/business' },
            { label: 'Compliance landscape →', to: '/compliance' },
            { label: 'Migration framework →', to: '/migrate' },
          ]}
        />
      )}
      {/* B+ remediation 1.6 (2026-08-10): the curious build of this page is
          deliberately reduced and never said so, so a missing control read as
          a broken one. Renders only while that reduction is actually in
          effect — see SimplifiedViewNotice. */}
      <SimplifiedViewNotice
        className="mb-4 shrink-0"
        what="Some advanced controls — hardware-backed keys, ACVP test vectors and raw parameter tuning — are folded away."
        stillReal="Every operation you run here is genuine ML-KEM and ML-DSA, executing in your browser."
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 shrink-0 gap-2">
        <h3 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <Play className="text-secondary" aria-hidden="true" />
          Interactive Playground
        </h3>
      </div>

      {/* Last log entry strip */}
      {lastLogEntry && (
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

      {/* Quick Start banner */}
      {showQuickStart && (
        <div className="relative bg-primary/10 border border-primary/20 rounded-xl p-3 md:p-4 mb-4 shrink-0 animate-fade-in">
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2 h-6 w-6 p-0"
            aria-label="Dismiss quick start"
            onClick={() => {
              setShowQuickStart(false)
              try {
                sessionStorage.setItem('pqc-playground-qs-dismissed', '1')
              } catch {
                /* ignore */
              }
            }}
          >
            <X size={14} />
          </Button>
          <div className="flex items-start gap-3 pr-6">
            <Sparkles size={18} className="text-primary shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1.5">
              <p className="text-sm font-semibold text-foreground">Quick Start</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Start with the <strong>Key Store</strong> tab to generate a key pair, then switch to{' '}
                <strong>Sign &amp; Verify</strong> to create and verify a digital signature. The log
                panel at the bottom shows every operation in real time.
              </p>
            </div>
          </div>
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
              <span className="sm:hidden">Keys</span>
              <span className="hidden sm:inline">Key Store ({keyStore.length})</span>
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
            <FileText size={16} className="shrink-0" aria-hidden="true" />{' '}
            <span className="text-xs ml-1">Logs</span>
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
        {activeTab === 'symmetric' && <SymmetricTab />}
        {activeTab === 'hashing' && <HashingTab />}
        {activeTab === 'sign_verify' && <SignVerifyTab />}
        {activeTab === 'keystore' && <KeyStoreTab />}
        {activeTab === 'logs' && <LogsTab />}
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
