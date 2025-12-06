import React from 'react'
import {
  Key,
  FileKey,
  FileText,
  Shield,
  Settings,
  Lock,
  Database,
  FileArchive,
  Info,
} from 'lucide-react'
import clsx from 'clsx'
import { useOpenSSLStore } from '../store'
import { logEvent } from '../../../utils/analytics'

export type WorkbenchCategory =
  | 'genpkey'
  | 'req'
  | 'x509'
  | 'enc'
  | 'dgst'
  | 'rand'
  | 'version'
  | 'files'
  | 'kem'
  | 'pkcs12'

interface WorkbenchToolbarProps {
  category: string
  setCategory: (category: WorkbenchCategory) => void
}

export const WorkbenchToolbar: React.FC<WorkbenchToolbarProps> = ({ category, setCategory }) => {
  const { activeTab, setActiveTab } = useOpenSSLStore()

  const handleCategoryChange = (newCategory: WorkbenchCategory, label: string) => {
    setCategory(newCategory)
    setActiveTab('terminal')
    logEvent('OpenSSL Studio', 'Select Category', label)
  }

  return (
    <div className="space-y-4">
      <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider block">
        1. Select Operation
      </span>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => handleCategoryChange('genpkey', 'Key Generation')}
          className={clsx(
            'p-3 rounded-lg border text-left transition-colors flex items-center gap-2',
            category === 'genpkey'
              ? 'bg-primary/20 border-primary/40 text-primary'
              : 'bg-white/5 border-white/10 hover:bg-white/10 text-muted-foreground'
          )}
        >
          <Key size={16} /> Key Generation
        </button>
        <button
          onClick={() => handleCategoryChange('files', 'Key Files')}
          className={clsx(
            'p-3 rounded-lg border text-left transition-colors flex items-center gap-2',
            category === 'files'
              ? 'bg-primary/20 border-primary/40 text-primary'
              : 'bg-white/5 border-white/10 hover:bg-white/10 text-muted-foreground'
          )}
        >
          <FileKey size={16} /> Key Files
        </button>
        <button
          onClick={() => handleCategoryChange('req', 'CSR')}
          className={clsx(
            'p-3 rounded-lg border text-left transition-colors flex items-center gap-2',
            category === 'req'
              ? 'bg-primary/20 border-primary/40 text-primary'
              : 'bg-white/5 border-white/10 hover:bg-white/10 text-muted-foreground'
          )}
        >
          <FileText size={16} /> CSR (Request)
        </button>
        <button
          onClick={() => handleCategoryChange('x509', 'Certificate')}
          className={clsx(
            'p-3 rounded-lg border text-left transition-colors flex items-center gap-2',
            category === 'x509'
              ? 'bg-primary/20 border-primary/40 text-primary'
              : 'bg-white/5 border-white/10 hover:bg-white/10 text-muted-foreground'
          )}
        >
          <Shield size={16} /> Certificate
        </button>
        <button
          onClick={() => handleCategoryChange('dgst', 'Sign/Verify')}
          className={clsx(
            'p-3 rounded-lg border text-left transition-colors flex items-center gap-2',
            category === 'dgst'
              ? 'bg-primary/20 border-primary/40 text-primary'
              : 'bg-white/5 border-white/10 hover:bg-white/10 text-muted-foreground'
          )}
        >
          <Settings size={16} /> Sign / Verify
        </button>
        <button
          onClick={() => handleCategoryChange('rand', 'Random Data')}
          className={clsx(
            'p-3 rounded-lg border text-left transition-colors flex items-center gap-2',
            category === 'rand'
              ? 'bg-primary/20 border-primary/40 text-primary'
              : 'bg-white/5 border-white/10 hover:bg-white/10 text-muted-foreground'
          )}
        >
          <Shield size={16} /> Random Data
        </button>
        <button
          onClick={() => handleCategoryChange('enc', 'Encryption')}
          className={clsx(
            'p-3 rounded-lg border text-left transition-colors flex items-center gap-2',
            category === 'enc'
              ? 'bg-primary/20 border-primary/40 text-primary'
              : 'bg-white/5 border-white/10 hover:bg-white/10 text-muted-foreground'
          )}
        >
          <Lock size={16} /> Encryption
        </button>
        <button
          onClick={() => handleCategoryChange('kem', 'KEM')}
          className={clsx(
            'p-3 rounded-lg border text-left transition-colors flex items-center gap-2',
            category === 'kem'
              ? 'bg-primary/20 border-primary/40 text-primary'
              : 'bg-white/5 border-white/10 hover:bg-white/10 text-muted-foreground'
          )}
        >
          <Database size={16} /> Key Encap (KEM)
        </button>
        <button
          onClick={() => handleCategoryChange('pkcs12', 'PKCS#12')}
          className={clsx(
            'p-3 rounded-lg border text-left transition-colors flex items-center gap-2',
            category === 'pkcs12'
              ? 'bg-primary/20 border-primary/40 text-primary'
              : 'bg-white/5 border-white/10 hover:bg-white/10 text-muted-foreground'
          )}
        >
          <FileArchive size={16} /> PKCS#12 Bundle
        </button>
        <button
          onClick={() => handleCategoryChange('version', 'Version Info')}
          className={clsx(
            'p-3 rounded-lg border text-left transition-colors flex items-center gap-2',
            category === 'version'
              ? 'bg-primary/20 border-primary/40 text-primary'
              : 'bg-white/5 border-white/10 hover:bg-white/10 text-muted-foreground'
          )}
        >
          <Info size={16} /> Version Info
        </button>
        <button
          onClick={() => {
            setActiveTab('logs')
            logEvent('OpenSSL Studio', 'Select Category', 'Logs')
          }}
          className={clsx(
            'p-3 rounded-lg border text-left transition-colors flex items-center gap-2',
            activeTab === 'logs'
              ? 'bg-primary/20 border-primary/40 text-primary'
              : 'bg-white/5 border-white/10 hover:bg-white/10 text-muted-foreground'
          )}
        >
          <FileText size={16} /> Operation Logs
        </button>
      </div>
    </div>
  )
}
