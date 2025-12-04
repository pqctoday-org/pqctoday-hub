import React from 'react'
import clsx from 'clsx'
import { useOpenSSLStore } from '../../store'

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
      <span className="text-sm font-bold text-muted uppercase tracking-wider block">
        2. Configuration
      </span>

      <div className="space-y-3">
        <span className="text-xs text-muted block">Action</span>
        <div className="flex bg-black/40 rounded-lg p-1 border border-white/20">
          <button
            onClick={() => setP12Action('export')}
            className={clsx(
              'flex-1 py-1.5 rounded text-sm font-medium transition-colors',
              p12Action === 'export' ? 'bg-primary text-white' : 'text-muted hover:text-white'
            )}
          >
            Export (Create P12)
          </button>
          <button
            onClick={() => setP12Action('import')}
            className={clsx(
              'flex-1 py-1.5 rounded text-sm font-medium transition-colors',
              p12Action === 'import' ? 'bg-primary text-white' : 'text-muted hover:text-white'
            )}
          >
            Import (Read P12)
          </button>
        </div>
      </div>

      {p12Action === 'export' ? (
        <>
          <div className="space-y-3">
            <label htmlFor="p12-cert-select" className="text-xs text-muted block">
              Certificate File
            </label>
            <select
              id="p12-cert-select"
              value={p12CertFile}
              onChange={(e) => setP12CertFile(e.target.value)}
              className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
            >
              <option value="">Select Certificate...</option>
              {files
                .filter((f) => f.name.endsWith('.crt') || f.name.endsWith('.cert'))
                .map((f) => (
                  <option key={f.name} value={f.name}>
                    {f.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="space-y-3">
            <label htmlFor="p12-key-select" className="text-xs text-muted block">
              Private Key File
            </label>
            <select
              id="p12-key-select"
              value={p12KeyFile}
              onChange={(e) => setP12KeyFile(e.target.value)}
              className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
            >
              <option value="">Select Private Key...</option>
              {files
                .filter((f) => f.name.endsWith('.key') || f.name.endsWith('.pem'))
                .map((f) => (
                  <option key={f.name} value={f.name}>
                    {f.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="space-y-3">
            <label htmlFor="p12-file-input" className="text-xs text-muted block">
              Output Filename (Optional)
            </label>
            <input
              id="p12-file-input"
              type="text"
              value={p12File}
              onChange={(e) => setP12File(e.target.value)}
              className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
              placeholder="bundle.p12"
            />
          </div>
        </>
      ) : (
        <div className="space-y-3">
          <label htmlFor="p12-infile-select" className="text-xs text-muted block">
            PKCS#12 File
          </label>
          <select
            id="p12-infile-select"
            value={p12File}
            onChange={(e) => setP12File(e.target.value)}
            className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
          >
            <option value="">Select .p12 or .pfx file...</option>
            {files
              .filter((f) => f.name.endsWith('.p12') || f.name.endsWith('.pfx'))
              .map((f) => (
                <option key={f.name} value={f.name}>
                  {f.name}
                </option>
              ))}
          </select>
        </div>
      )}

      <div className="space-y-3">
        <label htmlFor="p12-pass-input" className="text-xs text-muted block">
          Password
        </label>
        <input
          id="p12-pass-input"
          type="password"
          value={p12Pass}
          onChange={(e) => setP12Pass(e.target.value)}
          className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
          placeholder="Export/Import Password"
        />
      </div>
    </div>
  )
}
