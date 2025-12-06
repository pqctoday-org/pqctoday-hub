import {
  Play,
  Settings,
  Database,
  Activity,
  Lock,
  FileSignature,
  Key as KeyIcon,
  FileText,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react'
import clsx from 'clsx'
import { PlaygroundProvider } from './PlaygroundProvider'
import { useSettingsContext } from './contexts/SettingsContext'
import { useKeyStoreContext } from './contexts/KeyStoreContext'
import { ACVPTesting } from '../ACVP/ACVPTesting'
import { SettingsTab } from './tabs/SettingsTab'
import { DataTab } from './tabs/DataTab'
import { KemOpsTab } from './tabs/KemOpsTab'
import { SymmetricTab } from './tabs/SymmetricTab'
import { SignVerifyTab } from './tabs/SignVerifyTab'
import { KeyStoreTab } from './tabs/KeyStoreTab'
import { LogsTab } from './tabs/LogsTab'
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
          <div className="flex items-center gap-4 text-xs font-mono bg-black/20 px-3 py-1.5 rounded-lg border border-white/5 animate-fade-in">
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
                  ? 'text-green-400'
                  : lastLogEntry.executionTime < 500
                    ? 'text-yellow-400'
                    : 'text-red-400'
              )}
            >
              {lastLogEntry.executionTime.toFixed(2)} ms
            </span>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 bg-white/5 p-1 rounded-xl shrink-0 overflow-x-auto">
        <Button
          onClick={() => handleTabChange('keystore')}
          variant="ghost"
          size="sm"
          className={
            activeTab === 'keystore'
              ? 'bg-primary/20 text-primary shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
          }
        >
          <KeyIcon size={16} className="mr-2" /> Key Store ({keyStore.length})
        </Button>
        <Button
          onClick={() => handleTabChange('data')}
          variant="ghost"
          size="sm"
          className={
            activeTab === 'data'
              ? 'bg-primary/20 text-primary shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
          }
        >
          <Database size={16} className="mr-2" /> Data
        </Button>
        <Button
          onClick={() => handleTabChange('kem_ops')}
          variant="ghost"
          size="sm"
          className={
            activeTab === 'kem_ops'
              ? 'bg-primary/20 text-primary shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
          }
        >
          <Activity size={16} className="mr-2" /> KEM & Encrypt
        </Button>
        <Button
          onClick={() => handleTabChange('symmetric')}
          variant="ghost"
          size="sm"
          className={
            activeTab === 'symmetric'
              ? 'bg-primary/20 text-primary shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
          }
        >
          <Lock size={16} className="mr-2" /> Sym Encrypt
        </Button>
        <Button
          onClick={() => handleTabChange('sign_verify')}
          variant="ghost"
          size="sm"
          className={
            activeTab === 'sign_verify'
              ? 'bg-primary/20 text-primary shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
          }
        >
          <FileSignature size={16} className="mr-2" /> Sign & Verify
        </Button>
        <Button
          onClick={() => handleTabChange('acvp')}
          variant="ghost"
          size="sm"
          className={
            activeTab === 'acvp'
              ? 'bg-primary/20 text-primary shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
          }
        >
          <ShieldCheck size={16} className="mr-2" /> ACVP
        </Button>
        <Button
          onClick={() => handleTabChange('settings')}
          variant="ghost"
          size="sm"
          className={
            activeTab === 'settings'
              ? 'bg-primary/20 text-primary shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
          }
        >
          <Settings size={16} className="mr-2" /> Settings
        </Button>
        <Button
          onClick={() => handleTabChange('logs')}
          variant="ghost"
          size="sm"
          className={
            activeTab === 'logs'
              ? 'bg-primary/20 text-primary shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
          }
        >
          <FileText size={16} className="mr-2" /> Logs
        </Button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0 bg-white/5 rounded-xl border border-white/10 p-6 relative">
        {activeTab === 'settings' && <SettingsTab />}
        {activeTab === 'data' && <DataTab />}
        {activeTab === 'kem_ops' && <KemOpsTab />}
        {activeTab === 'symmetric' && <SymmetricTab />}
        {activeTab === 'sign_verify' && <SignVerifyTab />}
        {activeTab === 'keystore' && <KeyStoreTab />}
        {activeTab === 'logs' && <LogsTab />}
        {activeTab === 'acvp' && (
          <div className="h-full">
            <ACVPTesting keyStore={keyStore} setKeyStore={setKeyStore} />
          </div>
        )}
      </div>

      {error && (
        <div
          id="playground-error"
          role="alert"
          className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm shrink-0"
        >
          <AlertCircle size={20} aria-hidden="true" />
          <span className="font-medium">{error}</span>
        </div>
      )}
    </Card>
  )
}
