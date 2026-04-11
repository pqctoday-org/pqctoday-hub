// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import clsx from 'clsx'
import { useOpenSSLStore } from '../../store'
import { FilterDropdown } from '../../../common/FilterDropdown'
import { Button } from '@/components/ui/button'

interface Pkcs12ConfigProps {
  p12Action: 'export' | 'import'
  setP12Action: (value: 'export' | 'import') => void
  p12CertFile: string
  setP12CertFile: (value: string) => void
  p12KeyFile: string
  setP12KeyFile: (value: string) => void
  p12File: string
  setP12File: (value: string) => void
  p12Pass: string
  setP12Pass: (value: string) => void
}

export const Pkcs12Config: React.FC<Pkcs12ConfigProps> = ({
  p12Action,
  setP12Action,
  p12CertFile,
  setP12CertFile,
  p12KeyFile,
  setP12KeyFile,
  p12File,
  setP12File,
  p12Pass,
  setP12Pass,
}) => {
  const { files } = useOpenSSLStore()

  return (
    <div className="space-y-4 animate-fade-in">
      <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider block">
        2. Configuration
      </span>

      <div className="space-y-3">
        <span className="text-xs text-muted-foreground block">Action</span>
        <div className="flex bg-background rounded-lg p-1 border border-input">
          <Button
            variant="ghost"
            onClick={() => setP12Action('export')}
            className={clsx(
              'flex-1 py-1.5 rounded text-sm font-medium transition-colors',
              p12Action === 'export'
                ? 'bg-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Export (Create P12)
          </Button>
          <Button
            variant="ghost"
            onClick={() => setP12Action('import')}
            className={clsx(
              'flex-1 py-1.5 rounded text-sm font-medium transition-colors',
              p12Action === 'import'
                ? 'bg-primary text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Import (Read P12)
          </Button>
        </div>
      </div>

      {/* PKCS#12 flow hint */}
      <div className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 border border-border">
        {p12Action === 'export' ? (
          <>
            <span className="font-semibold text-foreground">Export:</span> Bundles a{' '}
            <span className="font-medium">certificate</span> +{' '}
            <span className="font-medium">private key</span> into a password-protected{' '}
            <span className="font-medium">.p12</span> container.
          </>
        ) : (
          <>
            <span className="font-semibold text-foreground">Import:</span> Extracts the certificate
            and key from a <span className="font-medium">.p12</span> file using the same{' '}
            <span className="font-medium">password</span>.
          </>
        )}
      </div>

      {p12Action === 'export' ? (
        <>
          <div className="space-y-3">
            <span className="text-xs text-muted-foreground block">Certificate File</span>
            <FilterDropdown
              selectedId={p12CertFile}
              onSelect={(id) => setP12CertFile(id)}
              items={files
                .filter((f) => f.name.endsWith('.crt') || f.name.endsWith('.cert'))
                .map((f) => ({ id: f.name, label: f.name }))}
              defaultLabel="Select Certificate..."
              noContainer
            />
          </div>

          <div className="space-y-3">
            <span className="text-xs text-muted-foreground block">Private Key File</span>
            <FilterDropdown
              selectedId={p12KeyFile}
              onSelect={(id) => setP12KeyFile(id)}
              items={files
                .filter((f) => f.name.endsWith('.key') || f.name.endsWith('.pem'))
                .map((f) => ({ id: f.name, label: f.name }))}
              defaultLabel="Select Private Key..."
              noContainer
            />
          </div>

          <div className="space-y-3">
            <label htmlFor="p12-file-input" className="text-xs text-muted-foreground block">
              Output Filename (Optional)
            </label>
            <input
              id="p12-file-input"
              type="text"
              value={p12File}
              onChange={(e) => setP12File(e.target.value)}
              className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              placeholder="bundle.p12"
            />
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <span className="text-xs text-muted-foreground block">PKCS#12 File</span>
          <FilterDropdown
            selectedId={p12File}
            onSelect={(id) => setP12File(id)}
            items={files
              .filter((f) => f.name.endsWith('.p12') || f.name.endsWith('.pfx'))
              .map((f) => ({ id: f.name, label: f.name }))}
            defaultLabel="Select .p12 or .pfx file..."
            noContainer
          />
        </div>
      )}

      <div className="space-y-3">
        <label htmlFor="p12-pass-input" className="text-xs text-muted-foreground block">
          Password
        </label>
        <input
          id="p12-pass-input"
          type="password"
          value={p12Pass}
          onChange={(e) => setP12Pass(e.target.value)}
          className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          placeholder="Export/Import Password"
        />
      </div>
    </div>
  )
}
