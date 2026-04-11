// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import {
  Key,
  FileText,
  Shield,
  Settings,
  Lock,
  Database,
  FileArchive,
  Info,
  Hash,
} from 'lucide-react'
import clsx from 'clsx'
import { useOpenSSLStore } from '../store'
import { logEvent } from '../../../utils/analytics'
import { Button } from '@/components/ui/button'

export type WorkbenchCategory =
  | 'genpkey'
  | 'req'
  | 'x509'
  | 'enc'
  | 'dgst'
  | 'hash'
  | 'rand'
  | 'version'
  | 'files'
  | 'kem'
  | 'pkcs12'
  | 'lms'
  | 'configutl'
  | 'kdf'

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
      <div className="grid grid-cols-3 lg:grid-cols-2 gap-2">
        <Button
          variant="ghost"
          onClick={() => handleCategoryChange('genpkey', 'Key Generation')}
          className={clsx(
            'p-2 lg:p-3 rounded-lg border text-left transition-colors flex items-center gap-2 text-xs lg:text-sm',
            category === 'genpkey'
              ? 'bg-primary/20 border-primary/40 text-primary'
              : 'bg-muted border-border hover:bg-accent text-muted-foreground'
          )}
        >
          <Key size={16} /> Key Generation
        </Button>

        <Button
          variant="ghost"
          onClick={() => handleCategoryChange('req', 'CSR')}
          className={clsx(
            'p-2 lg:p-3 rounded-lg border text-left transition-colors flex items-center gap-2 text-xs lg:text-sm',
            category === 'req'
              ? 'bg-primary/20 border-primary/40 text-primary'
              : 'bg-muted border-border hover:bg-accent text-muted-foreground'
          )}
        >
          <FileText size={16} /> CSR (Request)
        </Button>
        <Button
          variant="ghost"
          onClick={() => handleCategoryChange('x509', 'Certificate')}
          className={clsx(
            'p-2 lg:p-3 rounded-lg border text-left transition-colors flex items-center gap-2 text-xs lg:text-sm',
            category === 'x509'
              ? 'bg-primary/20 border-primary/40 text-primary'
              : 'bg-muted border-border hover:bg-accent text-muted-foreground'
          )}
        >
          <Shield size={16} /> Certificate
        </Button>
        <Button
          variant="ghost"
          onClick={() => handleCategoryChange('dgst', 'Sign/Verify')}
          className={clsx(
            'p-2 lg:p-3 rounded-lg border text-left transition-colors flex items-center gap-2 text-xs lg:text-sm',
            category === 'dgst'
              ? 'bg-primary/20 border-primary/40 text-primary'
              : 'bg-muted border-border hover:bg-accent text-muted-foreground'
          )}
        >
          <Settings size={16} /> Sign / Verify
        </Button>
        <Button
          variant="ghost"
          onClick={() => handleCategoryChange('rand', 'Random Data')}
          className={clsx(
            'p-2 lg:p-3 rounded-lg border text-left transition-colors flex items-center gap-2 text-xs lg:text-sm',
            category === 'rand'
              ? 'bg-primary/20 border-primary/40 text-primary'
              : 'bg-muted border-border hover:bg-accent text-muted-foreground'
          )}
        >
          <Shield size={16} /> Random Data
        </Button>
        <Button
          variant="ghost"
          onClick={() => handleCategoryChange('enc', 'Encryption')}
          className={clsx(
            'p-2 lg:p-3 rounded-lg border text-left transition-colors flex items-center gap-2 text-xs lg:text-sm',
            category === 'enc'
              ? 'bg-primary/20 border-primary/40 text-primary'
              : 'bg-muted border-border hover:bg-accent text-muted-foreground'
          )}
        >
          <Lock size={16} /> Encryption
        </Button>
        <Button
          variant="ghost"
          onClick={() => handleCategoryChange('hash', 'Hashing')}
          className={clsx(
            'p-2 lg:p-3 rounded-lg border text-left transition-colors flex items-center gap-2 text-xs lg:text-sm',
            category === 'hash'
              ? 'bg-primary/20 border-primary/40 text-primary'
              : 'bg-muted border-border hover:bg-accent text-muted-foreground'
          )}
        >
          <Hash size={16} /> Hashing
        </Button>
        <Button
          variant="ghost"
          onClick={() => handleCategoryChange('kem', 'KEM')}
          className={clsx(
            'p-2 lg:p-3 rounded-lg border text-left transition-colors flex items-center gap-2 text-xs lg:text-sm',
            category === 'kem'
              ? 'bg-primary/20 border-primary/40 text-primary'
              : 'bg-muted border-border hover:bg-accent text-muted-foreground'
          )}
        >
          <Database size={16} /> Key Encap
        </Button>
        <Button
          variant="ghost"
          onClick={() => handleCategoryChange('pkcs12', 'PKCS#12')}
          className={clsx(
            'p-2 lg:p-3 rounded-lg border text-left transition-colors flex items-center gap-2 text-xs lg:text-sm',
            category === 'pkcs12'
              ? 'bg-primary/20 border-primary/40 text-primary'
              : 'bg-muted border-border hover:bg-accent text-muted-foreground'
          )}
        >
          <FileArchive size={16} /> PKCS#12 Bundle
        </Button>
        <Button
          variant="ghost"
          onClick={() => handleCategoryChange('lms', 'LMS (HSS)')}
          className={clsx(
            'p-2 lg:p-3 rounded-lg border text-left transition-colors flex items-center gap-2 text-xs lg:text-sm',
            category === 'lms'
              ? 'bg-primary/20 border-primary/40 text-primary'
              : 'bg-muted border-border hover:bg-accent text-muted-foreground'
          )}
        >
          <Shield size={16} /> LMS (HSS)
        </Button>
        <Button
          variant="ghost"
          onClick={() => handleCategoryChange('configutl', 'Config Audit')}
          className={clsx(
            'p-2 lg:p-3 rounded-lg border text-left transition-colors flex items-center gap-2 text-xs lg:text-sm',
            category === 'configutl'
              ? 'bg-primary/20 border-primary/40 text-primary'
              : 'bg-muted border-border hover:bg-accent text-muted-foreground'
          )}
        >
          <Settings size={16} /> Config Audit
        </Button>
        <Button
          variant="ghost"
          onClick={() => handleCategoryChange('kdf', 'Key Derivation')}
          className={clsx(
            'p-2 lg:p-3 rounded-lg border text-left transition-colors flex items-center gap-2 text-xs lg:text-sm',
            category === 'kdf'
              ? 'bg-primary/20 border-primary/40 text-primary'
              : 'bg-muted border-border hover:bg-accent text-muted-foreground'
          )}
        >
          <Key size={16} /> Key Derivation
        </Button>
        <Button
          variant="ghost"
          onClick={() => handleCategoryChange('version', 'Version Info')}
          className={clsx(
            'p-2 lg:p-3 rounded-lg border text-left transition-colors flex items-center gap-2 text-xs lg:text-sm',
            category === 'version'
              ? 'bg-primary/20 border-primary/40 text-primary'
              : 'bg-muted border-border hover:bg-accent text-muted-foreground'
          )}
        >
          <Info size={16} /> Version Info
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setActiveTab('logs')
            logEvent('OpenSSL Studio', 'Select Category', 'Logs')
          }}
          className={clsx(
            'p-2 lg:p-3 rounded-lg border text-left transition-colors flex items-center gap-2 text-xs lg:text-sm',
            activeTab === 'logs'
              ? 'bg-primary/20 border-primary/40 text-primary'
              : 'bg-muted border-border hover:bg-accent text-muted-foreground'
          )}
        >
          <FileText size={16} /> Operation Logs
        </Button>
      </div>
    </div>
  )
}
