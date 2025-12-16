import React, { useState, useEffect } from 'react'
import { Settings, FileText, Check, Shield, Key, Import, Copy, Eye } from 'lucide-react'
import { clsx } from 'clsx'
import { useTLSStore } from '../../../../store/tls-learning.store'
import { FileSelectionModal } from './components/FileSelectionModal'
import { CertificateInspector } from './components/CertificateInspector'
import {
  DEFAULT_SERVER_CERT,
  DEFAULT_SERVER_KEY,
  DEFAULT_MLDSA87_SERVER_CERT,
  DEFAULT_MLDSA87_SERVER_KEY,
  DEFAULT_CLIENT_CERT,
  DEFAULT_MLDSA_CLIENT_CERT,
} from './utils/defaultCertificates'

const CIPHER_SUITES = [
  'TLS_AES_256_GCM_SHA384',
  'TLS_AES_128_GCM_SHA256',
  'TLS_CHACHA20_POLY1305_SHA256',
]

// Key Exchange Groups organized by type
const CLASSICAL_GROUPS = ['X25519', 'P-256', 'P-384', 'P-521']
const PQC_GROUPS = ['ML-KEM-512', 'ML-KEM-768', 'ML-KEM-1024']
const HYBRID_GROUPS = ['X25519MLKEM768', 'SecP256r1MLKEM768']
const GROUPS = [...CLASSICAL_GROUPS, ...PQC_GROUPS, ...HYBRID_GROUPS]

const SIG_ALGS = [
  // PQC - ML-DSA (Dilithium)
  'mldsa44',
  'mldsa65',
  'mldsa87',
  // PQC - SLH-DSA (SPHINCS+)
  'slhdsa-sha2-128s',
  'slhdsa-sha2-128f',
  // Classical
  'ecdsa_secp256r1_sha256',
  'rsa_pss_rsae_sha256',
  'rsa_pss_pss_sha256',
  'ed25519',
]

const CERTS = [
  { id: 'default', label: 'Default (RSA 2048)' },
  { id: 'mldsa', label: 'Default (ML-DSA-87)' },
  { id: 'custom', label: 'Custom from OpenSSL Studio' },
]

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
  const [showImport, setShowImport] = useState<{ isOpen: boolean; type: 'cert' | 'key' | 'ca' }>({
    isOpen: false,
    type: 'cert',
  })
  const [messageView, setMessageView] = useState<'text' | 'hex'>('text')
  const [inspectCert, setInspectCert] = useState<{ pem: string; title: string } | null>(null)

  const isConnected = sessionStatus === 'connected'

  // Handle Cert Selection
  useEffect(() => {
    if (certSelection === 'default') {
      setServerConfig({
        certificates: {
          ...serverConfig.certificates,
          certPem: DEFAULT_SERVER_CERT,
          keyPem: DEFAULT_SERVER_KEY,
          caPem: DEFAULT_CLIENT_CERT, // Trust RSA client cert for mTLS
        },
      })
    } else if (certSelection === 'mldsa') {
      setServerConfig({
        certificates: {
          ...serverConfig.certificates,
          certPem: DEFAULT_MLDSA87_SERVER_CERT,
          keyPem: DEFAULT_MLDSA87_SERVER_KEY,
          caPem: DEFAULT_MLDSA_CLIENT_CERT, // Trust ML-DSA client cert for mTLS
        },
      })
    }
    // 'custom' - user will paste/import their own
    // eslint-disable-next-line react-hooks/exhaustive-deps -- Controlled update: adding serverConfig.certificates would cause infinite loop
  }, [certSelection, setServerConfig])

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
              <div className="flex gap-2">
                <select
                  aria-label="Server Identity"
                  className="flex-grow bg-muted border border-border rounded-lg p-3 text-sm focus:outline-none focus:border-tertiary"
                  value={certSelection}
                  onChange={(e) => setCertSelection(e.target.value)}
                >
                  {CERTS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
                {serverConfig.certificates.certPem && (
                  <button
                    onClick={() =>
                      setInspectCert({
                        pem: serverConfig.certificates.certPem!,
                        title: 'Server Identity Certificate',
                      })
                    }
                    className="p-3 bg-muted hover:bg-muted/80 rounded-lg border border-border text-tertiary transition-colors"
                    title="Inspect Identity Certificate"
                  >
                    <Eye size={18} />
                  </button>
                )}
              </div>

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

              {/* Root CA for verifying client certificates (mTLS) */}
              {serverConfig.verifyClient && (
                <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border">
                  <div className="text-xs text-muted-foreground flex items-center justify-between mb-1">
                    <label htmlFor="server-ca-pem" className="flex items-center gap-1">
                      <Shield size={12} className="text-warning" /> Root CA (to verify client certs)
                    </label>
                    <div className="flex gap-2">
                      {serverConfig.certificates.caPem && (
                        <button
                          onClick={() =>
                            setInspectCert({
                              pem: serverConfig.certificates.caPem!,
                              title: 'Trusted Root CA (mTLS)',
                            })
                          }
                          className="text-[10px] text-tertiary hover:text-tertiary/80 flex items-center gap-1 uppercase font-bold"
                          title="Inspect Root CA"
                        >
                          <Eye size={10} className="mr-1" /> Inspect
                        </button>
                      )}
                      <button
                        onClick={() => setShowImport({ isOpen: true, type: 'ca' })}
                        className="text-[10px] text-tertiary hover:text-tertiary/80 flex items-center gap-1 uppercase font-bold"
                      >
                        <Import size={10} /> Import from Studio
                      </button>
                    </div>
                  </div>
                  <textarea
                    id="server-ca-pem"
                    className="w-full h-16 bg-card border border-border rounded p-2 text-xs font-mono"
                    placeholder="-----BEGIN CERTIFICATE-----... (CA that signed client certs)"
                    value={serverConfig.certificates.caPem || ''}
                    onChange={(e) =>
                      setServerConfig({
                        certificates: { ...serverConfig.certificates, caPem: e.target.value },
                      })
                    }
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Import the Root CA that signed your client certificates.
                  </p>
                </div>
              )}
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
            <div className="text-xs text-muted-foreground mb-2 flex justify-between items-center">
              <label htmlFor="server-raw-config">/ssl/server.cnf</label>
              <div className="flex items-center gap-2">
                <span className="text-warning">Experimental Editor</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(serverConfig.rawConfig || '')
                  }}
                  className="px-2 py-0.5 text-[10px] bg-muted hover:bg-muted/80 border border-border rounded flex items-center gap-1 text-tertiary hover:text-tertiary/80 transition-colors"
                  title="Copy Config"
                >
                  <Copy size={10} />
                  Copy
                </button>
              </div>
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
        title={`Import ${showImport.type === 'cert' ? 'Server Certificate' : showImport.type === 'key' ? 'Server Private Key' : 'Root CA Certificate'}`}
        onSelect={(content) => {
          if (showImport.type === 'cert') {
            setServerConfig({
              certificates: { ...serverConfig.certificates, certPem: content },
            })
          } else if (showImport.type === 'key') {
            setServerConfig({
              certificates: { ...serverConfig.certificates, keyPem: content },
            })
          } else {
            // 'ca' type - Root CA for verifying client certs (mTLS)
            setServerConfig({
              certificates: { ...serverConfig.certificates, caPem: content },
            })
          }
        }}
      />
      {/* Inspector Modal */}
      <CertificateInspector
        isOpen={!!inspectCert}
        onClose={() => setInspectCert(null)}
        pem={inspectCert?.pem || ''}
        title={inspectCert?.title || ''}
      />
    </div>
  )
}
