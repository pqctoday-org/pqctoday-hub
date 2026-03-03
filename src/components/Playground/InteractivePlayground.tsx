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
  Shield,
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
import { SoftHsmTab } from './tabs/SoftHsmTab'
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
  const { activeTab, setActiveTab, error, lastLogEntry } = useSettingsContext()
  const { keyStore, setKeyStore } = useKeyStoreContext()

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab)
    logEvent('Playground', 'Switch Tab', tab)
  }

  return (
    <Card className="p-6 h-[85vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <h3 className="text-2xl font-bold flex items-center gap-2">
          <Play className="text-secondary" aria-hidden="true" />
          Interactive Playground
        </h3>
        {lastLogEntry && (
          <div className="flex items-center gap-4 text-xs font-mono bg-muted px-3 py-1.5 rounded-lg border border-border animate-fade-in">
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
      </div>

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
          <KeyIcon size={16} className="mr-2" /> Key Store ({keyStore.length})
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
          <Activity size={16} className="mr-2" /> KEM & Encrypt
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
          <FileSignature size={16} className="mr-2" /> Sign & Verify
        </Button>
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
          <FileText size={16} className="mr-2" /> Logs
        </Button>
        <Button
          onClick={() => handleTabChange('softhsm')}
          variant="ghost"
          size="sm"
          className={clsx(
            'whitespace-nowrap',
            activeTab === 'softhsm'
              ? 'bg-primary/20 text-primary shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
          )}
        >
          <Shield size={16} className="mr-2" /> PKCS#11
        </Button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 bg-card rounded-xl border border-border p-6 relative">
        {activeTab === 'data' && <DataTab />}
        {activeTab === 'kem_ops' && <KemOpsTab />}
        {activeTab === 'symmetric' && <SymmetricTab />}
        {activeTab === 'hashing' && <HashingTab />}
        {activeTab === 'sign_verify' && <SignVerifyTab />}
        {activeTab === 'keystore' && <KeyStoreTab />}
        {activeTab === 'logs' && <LogsTab />}
        {activeTab === 'acvp' && (
          <div className="h-full">
            <ACVPTesting keyStore={keyStore} setKeyStore={setKeyStore} />
          </div>
        )}
        {activeTab === 'softhsm' && <SoftHsmTab />}
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
