import React, { useState, useEffect } from 'react'
import { Settings, FileText, Check, Shield, Key, Import, Copy } from 'lucide-react'
import { clsx } from 'clsx'
import { useTLSStore } from '../../../../store/tls-learning.store'
import { FileSelectionModal } from './components/FileSelectionModal'

const CIPHER_SUITES = [
  'TLS_AES_256_GCM_SHA384',
  'TLS_AES_128_GCM_SHA256',
  'TLS_CHACHA20_POLY1305_SHA256',
]

const GROUPS = ['X25519', 'P-256', 'P-384', 'P-521']

const SIG_ALGS = ['ecdsa_secp256r1_sha256', 'rsa_pss_rsae_sha256', 'rsa_pss_pss_sha256', 'ed25519']

const CERTS = [{ id: 'default', label: 'Default (RSA 2048)' }]

export const TLSServerPanel: React.FC = () => {
  const {
    serverConfig,
    setServerConfig,
    setMode,
    sessionStatus,
    results,
    serverMessage,
    setServerMessage,
  } = useTLSStore()
  const [activeTab, setActiveTab] = useState<'ui' | 'raw'>('ui')
  const [certSelection, setCertSelection] = useState<string>('default')
  const [showImport, setShowImport] = useState<{ isOpen: boolean; type: 'cert' | 'key' }>({
    isOpen: false,
    type: 'cert',
  })
  const [messageView, setMessageView] = useState<'text' | 'hex'>('text')

  const isConnected = sessionStatus === 'connected'

  // Placeholder for future preset logic
  useEffect(() => {
    // No-op for now as we only have Default (already loaded) or Custom (user edits)
  }, [certSelection])

  const toggleCipher = (cipher: string) => {
    if (isConnected) return
    const current = serverConfig.cipherSuites
    const next = current.includes(cipher)
      ? current.filter((c) => c !== cipher)
      : [...current, cipher]
    setServerConfig({ cipherSuites: next })
  }

  const toggleGroup = (group: string) => {
    if (isConnected) return
    const current = serverConfig.groups
    const next = current.includes(group) ? current.filter((g) => g !== group) : [...current, group]
    setServerConfig({ groups: next })
  }

  const toggleSigAlg = (alg: string) => {
    if (isConnected) return
    const current = serverConfig.signatureAlgorithms
    const next = current.includes(alg) ? current.filter((a) => a !== alg) : [...current, alg]
    setServerConfig({ signatureAlgorithms: next })
  }

  return (
    <div
      className={clsx(
        'glass-panel p-0 overflow-hidden flex flex-col h-full border-t-4',
        isConnected ? 'border-t-success' : 'border-t-tertiary'
      )}
    >
      <div className="bg-muted/30 p-4 flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span
            className={clsx(
              'w-3 h-3 rounded-full',
              isConnected ? 'bg-success animate-pulse' : 'bg-tertiary'
            )}
          />
          Server Config{' '}
          {isConnected && (
            <span className="text-xs font-normal text-success bg-success/10 px-2 py-0.5 rounded ml-2">
              Active
            </span>
          )}
        </h2>
        <div className="flex bg-muted/50 rounded-lg p-1">
          <button
            onClick={() => {
              setActiveTab('ui')
              setMode('server', 'ui')
            }}
            className={clsx(
              'px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center gap-2',
              activeTab === 'ui'
                ? 'bg-tertiary/20 text-tertiary'
                : 'text-muted-foreground hover:text-foreground'
            )}
            disabled={isConnected}
          >
            <Settings size={14} /> UI
          </button>
          <button
            onClick={() => {
              setActiveTab('raw')
              setMode('server', 'raw')
            }}
            className={clsx(
              'px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center gap-2',
              activeTab === 'raw'
                ? 'bg-tertiary/20 text-tertiary'
                : 'text-muted-foreground hover:text-foreground'
            )}
            disabled={isConnected}
          >
            <FileText size={14} /> Config File
          </button>
        </div>
      </div>

      <div className="p-6 flex-grow overflow-auto min-h-[400px]">
        {activeTab === 'ui' ? (
          <div className="space-y-6">
            {/* Messages Section */}
            <div className="bg-tertiary/10 rounded-lg p-4 border border-tertiary/20 space-y-4">
              <h3 className="text-xs uppercase tracking-wider text-tertiary font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-tertiary"></span>
                Application Data (Messaging)
              </h3>

              <div>
                <label
                  htmlFor="server-message"
                  className="text-xs text-muted-foreground mb-1 block"
                >
                  Message to Send (in Full Flow)
                </label>
                <input
                  id="server-message"
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-tertiary transition-colors"
                  value={serverMessage}
                  onChange={(e) => setServerMessage(e.target.value)}
                  placeholder="Enter message..."
                />
              </div>

              {/* Received Messages Output */}
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Received from Client</span>
                  <div className="flex bg-muted rounded p-0.5 border border-border">
                    <button
                      onClick={() => setMessageView('text')}
                      className={clsx(
                        'px-2 py-0.5 text-[10px] rounded transition-colors',
                        messageView === 'text'
                          ? 'bg-tertiary/20 text-tertiary'
                          : 'text-muted-foreground hover:text-tertiary'
                      )}
                    >
                      TXT
                    </button>
                    <button
                      onClick={() => setMessageView('hex')}
                      className={clsx(
                        'px-2 py-0.5 text-[10px] rounded transition-colors',
                        messageView === 'hex'
                          ? 'bg-tertiary/20 text-tertiary'
                          : 'text-muted-foreground hover:text-tertiary'
                      )}
                    >
                      HEX
                    </button>
                  </div>
                </div>
                <div className="min-h-[60px] max-h-[100px] overflow-auto bg-muted/50 rounded p-2 text-xs font-mono">
                  {results?.trace.filter(
                    (t) => t.event === 'message_received' && t.side === 'server'
                  ).length === 0 ? (
                    <span className="text-muted-foreground/50 italic">
                      No messages received yet.
                    </span>
                  ) : (
                    results?.trace
                      .filter((t) => t.event === 'message_received' && t.side === 'server')
                      .map((t, i) => {
                        const msg = t.details.replace('Received: ', '')
                        const display =
                          messageView === 'hex'
                            ? Array.from(msg)
                                .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
                                .join('')
                            : msg
                        return (
                          <div key={i} className="flex items-start gap-2 mb-1 group">
                            <span className="text-primary break-all flex-grow font-mono leading-tight">
                              &lt; {display}
                            </span>
                            <button
                              onClick={() => navigator.clipboard.writeText(display)}
                              className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                              title="Copy"
                            >
                              <Copy size={12} />
                            </button>
                          </div>
                        )
                      })
                  )}
                </div>
              </div>
            </div>

            <hr className="border-border" />

            {/* Identity / Certificate */}
            <div>
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 block flex items-center gap-2">
                <Shield size={14} /> Server Identity
              </span>
              <select
                aria-label="Server Identity"
                className="w-full bg-muted border border-border rounded-lg p-3 text-sm focus:outline-none focus:border-tertiary mb-2"
                value={certSelection}
                onChange={(e) => setCertSelection(e.target.value)}
              >
                {CERTS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
                <option value="custom">Custom (Paste PEM)</option>
              </select>

              {certSelection === 'custom' && (
                <div className="space-y-3 mt-3 p-4 rounded-lg bg-muted border border-border">
                  <div>
                    <div className="text-xs text-muted-foreground flex items-center justify-between mb-1">
                      <label htmlFor="server-cert-pem" className="flex items-center gap-1">
                        <FileText size={12} /> Certificate (PEM)
                      </label>
                      <button
                        onClick={() => setShowImport({ isOpen: true, type: 'cert' })}
                        className="text-[10px] text-tertiary hover:text-tertiary/80 flex items-center gap-1 uppercase font-bold"
                      >
                        <Import size={10} /> Import
                      </button>
                    </div>
                    <textarea
                      id="server-cert-pem"
                      className="w-full h-24 bg-card border border-border rounded p-2 text-xs font-mono"
                      placeholder="-----BEGIN CERTIFICATE-----..."
                      value={serverConfig.certificates.certPem || ''}
                      onChange={(e) =>
                        setServerConfig({
                          certificates: { ...serverConfig.certificates, certPem: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground flex items-center justify-between mb-1">
                      <label htmlFor="server-key-pem" className="flex items-center gap-1">
                        <Key size={12} /> Private Key (PEM)
                      </label>
                      <button
                        onClick={() => setShowImport({ isOpen: true, type: 'key' })}
                        className="text-[10px] text-tertiary hover:text-tertiary/80 flex items-center gap-1 uppercase font-bold"
                      >
                        <Import size={10} /> Import
                      </button>
                    </div>
                    <textarea
                      id="server-key-pem"
                      className="w-full h-24 bg-card border border-border rounded p-2 text-xs font-mono"
                      placeholder="-----BEGIN PRIVATE KEY-----..."
                      value={serverConfig.certificates.keyPem || ''}
                      onChange={(e) =>
                        setServerConfig({
                          certificates: { ...serverConfig.certificates, keyPem: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground mt-2">
                Selects the Key/Certificate pair used by the server.
              </p>

              <div className="mt-4 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="verifyClient"
                  className="checkbox checkbox-sm checkbox-primary"
                  checked={serverConfig.verifyClient || false}
                  onChange={(e) => setServerConfig({ verifyClient: e.target.checked })}
                />
                <label htmlFor="verifyClient" className="text-sm font-medium cursor-pointer">
                  Request Client Certificate (mTLS)
                </label>
              </div>
            </div>

            <hr className="border-border" />

            {/* Cipher Suites */}
            <div>
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">
                Cipher Suites (TLS 1.3)
              </span>
              <div className="space-y-2">
                {CIPHER_SUITES.map((cipher) => (
                  <div
                    key={cipher}
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleCipher(cipher)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        toggleCipher(cipher)
                      }
                    }}
                    className={clsx(
                      'flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all',
                      serverConfig.cipherSuites.includes(cipher)
                        ? 'bg-tertiary/10 border-tertiary/50'
                        : 'bg-muted border-border hover:border-border/80'
                    )}
                  >
                    <span className="font-mono text-xs md:text-sm break-all">{cipher}</span>
                    {serverConfig.cipherSuites.includes(cipher) && (
                      <Check size={16} className="text-tertiary flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <hr className="border-border" />

            {/* Supported Groups */}
            <div>
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">
                Supported Groups
              </span>
              <div className="flex flex-wrap gap-2">
                {GROUPS.map((group) => (
                  <button
                    key={group}
                    onClick={() => toggleGroup(group)}
                    className={clsx(
                      'px-3 py-1.5 rounded-md text-sm font-mono border transition-all',
                      serverConfig.groups.includes(group)
                        ? 'bg-tertiary/10 border-tertiary/50 text-foreground'
                        : 'bg-muted border-border text-muted-foreground hover:border-border/80'
                    )}
                  >
                    {group}
                  </button>
                ))}
              </div>
            </div>

            <hr className="border-border" />

            {/* Signature Algorithms */}
            <div>
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">
                Signature Algorithms
              </span>
              <div className="flex flex-wrap gap-2 mb-2">
                {SIG_ALGS.map((alg) => (
                  <button
                    key={alg}
                    onClick={() => toggleSigAlg(alg)}
                    className={clsx(
                      'px-3 py-1.5 rounded-md text-xs font-mono border transition-all',
                      serverConfig.signatureAlgorithms.includes(alg)
                        ? 'bg-tertiary/10 border-tertiary/50 text-foreground'
                        : 'bg-muted border-border text-muted-foreground hover:border-border/80'
                    )}
                  >
                    {alg}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-tertiary/5 border border-tertiary/10 text-sm text-foreground/80">
              <p>Server preference will prioritize these ciphers.</p>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            <div className="text-xs text-muted-foreground mb-2 flex justify-between">
              <label htmlFor="server-raw-config">/ssl/server.cnf</label>
              <span className="text-warning">Experimental Editor</span>
            </div>
            <textarea
              id="server-raw-config"
              className="flex-grow w-full bg-muted border border-border rounded-lg p-4 font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-tertiary"
              value={serverConfig.rawConfig || '# OpenSSL Server Config\n[default]\n...'}
              onChange={(e) => setServerConfig({ rawConfig: e.target.value })}
              spellCheck={false}
            />
          </div>
        )}
      </div>

      <FileSelectionModal
        isOpen={showImport.isOpen}
        onClose={() => setShowImport({ ...showImport, isOpen: false })}
        title={`Import Server ${showImport.type === 'cert' ? 'Certificate' : 'Private Key'}`}
        onSelect={(content) => {
          if (showImport.type === 'cert') {
            setServerConfig({
              certificates: { ...serverConfig.certificates, certPem: content },
            })
          } else {
            setServerConfig({
              certificates: { ...serverConfig.certificates, keyPem: content },
            })
          }
        }}
      />
    </div>
  )
}
