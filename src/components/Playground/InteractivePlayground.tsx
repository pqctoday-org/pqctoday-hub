// SPDX-License-Identifier: GPL-3.0-only
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
  PenLine,
} from 'lucide-react'
import clsx from 'clsx'
import { PlaygroundProvider } from './PlaygroundProvider'
import { useSettingsContext } from './contexts/SettingsContext'
import { useKeyStoreContext } from './contexts/KeyStoreContext'
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
import { HsmClassicalSignPanel } from './hsm/HsmClassicalSignPanel'
import { logEvent } from '../../utils/analytics'
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

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab)
    logEvent('Playground', 'Switch Tab', tab)
  }

  const handleToggleHsmMode = () => {
    toggleHsmMode() // resets to keystore tab
    logEvent('Playground', hsmMode ? 'Disable HSM Mode' : 'Enable HSM Mode', activeTab)
  }

  return (
    <Card className="p-6 h-[85vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h3 className="text-2xl font-bold flex items-center gap-2">
          <Play className="text-secondary" aria-hidden="true" />
          Interactive Playground
        </h3>

        {/* HSM mode toggle pill */}
        <div className="flex items-center gap-2">
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
        </div>
      </div>

      {/* Last log entry strip */}
      {lastLogEntry && !hsmMode && (
        <div className="flex items-center gap-4 text-xs font-mono bg-muted px-3 py-1.5 rounded-lg border border-border animate-fade-in mb-4 shrink-0">
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
      <div className="flex space-x-1 mb-6 bg-muted p-1 rounded-xl shrink-0 overflow-x-auto scrollbar-hide -mx-2 px-2 sm:mx-0 sm:px-1">
        <Button
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
          <KeyIcon size={16} className="mr-2" />
          {hsmMode ? 'HSM Keys' : `Key Store (${keyStore.length})`}
        </Button>
        <Button
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
          <Database size={16} className="mr-2" /> Data
        </Button>
        <Button
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
          <Activity size={16} className="mr-2" /> KEM &amp; Encrypt
        </Button>

        <Button
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
          <Lock size={16} className="mr-2" /> Sym Encrypt
        </Button>
        <Button
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
          <Hash size={16} className="mr-2" /> Hashing
        </Button>

        <Button
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
          <FileSignature size={16} className="mr-2" /> Sign &amp; Verify
        </Button>

        {hsmMode && (
          <>
            <Button
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
              <ArrowLeftRight size={16} className="mr-2" /> Key Agree
            </Button>
            <Button
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
              <Filter size={16} className="mr-2" /> KDF
            </Button>
            <Button
              onClick={() => handleTabChange('classical_sign')}
              variant="ghost"
              size="sm"
              className={clsx(
                'whitespace-nowrap',
                activeTab === 'classical_sign'
                  ? 'bg-primary/20 text-primary shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <PenLine size={16} className="mr-2" /> Classical
            </Button>
          </>
        )}

        {!hsmMode && (
          <Button
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
            <ShieldCheck size={16} className="mr-2" /> ACVP
          </Button>
        )}

        <Button
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
              <Cpu size={16} className="mr-2" /> PKCS#11 Log
            </>
          ) : (
            <>
              <FileText size={16} className="mr-2" /> Logs
            </>
          )}
        </Button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 bg-card rounded-xl border border-border p-6 relative">
        {activeTab === 'data' && <DataTab />}
        {activeTab === 'kem_ops' && <KemOpsTab />}
        {activeTab === 'symmetric' && (hsmMode ? <HsmSymmetricPanel /> : <SymmetricTab />)}
        {activeTab === 'hashing' && (hsmMode ? <HsmHashingPanel /> : <HashingTab />)}
        {activeTab === 'sign_verify' && <SignVerifyTab />}
        {activeTab === 'key_agree' && hsmMode && <HsmKeyAgreementPanel />}
        {activeTab === 'key_derive' && hsmMode && <HsmKdfPanel />}
        {activeTab === 'classical_sign' && hsmMode && <HsmClassicalSignPanel />}
        {activeTab === 'keystore' && <KeyStoreTab />}
        {activeTab === 'logs' && <LogsTab />}
        {activeTab === 'acvp' && !hsmMode && (
          <div className="h-full">
            <ACVPTesting keyStore={keyStore} setKeyStore={setKeyStore} />
          </div>
        )}
      </div>

      {error && (
        <div
          id="playground-error"
          role="alert"
          className="mt-6 p-4 bg-status-error border border-status-error rounded-xl flex items-center gap-3 text-status-error text-sm shrink-0"
        >
          <AlertCircle size={20} aria-hidden="true" />
          <span className="font-medium">{error}</span>
        </div>
      )}
    </Card>
  )
}
