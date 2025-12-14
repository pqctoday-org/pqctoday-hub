import React, { useState, useEffect } from 'react'
import { Settings, FileText, Check, Shield, Key, Import, Copy } from 'lucide-react'
import { clsx } from 'clsx'
import { useTLSStore } from '../../../../store/tls-learning.store'
import { FileSelectionModal } from './components/FileSelectionModal'
import {
  DEFAULT_CLIENT_CERT,
  DEFAULT_CLIENT_KEY,
  DEFAULT_MLDSA_CLIENT_CERT,
  DEFAULT_MLDSA_CLIENT_KEY,
  DEFAULT_SERVER_CERT,
  DEFAULT_MLDSA87_SERVER_CERT,
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
  { id: 'mldsa', label: 'Default (ML-DSA-44)' },
  { id: 'none', label: 'None' },
  { id: 'custom', label: 'Custom from OpenSSL Studio' },
]

export const TLSClientPanel: React.FC = () => {
  const {
    clientConfig,
    setClientConfig,
    setMode,
    sessionStatus,
    results,
    clientMessage,
    setClientMessage,
  } = useTLSStore()
  const [activeTab, setActiveTab] = useState<'ui' | 'raw'>('ui')
  const [certSelection, setCertSelection] = useState<string>('default')
  const [showImport, setShowImport] = useState<{ isOpen: boolean; type: 'cert' | 'key' | 'ca' }>({
    isOpen: false,
    type: 'cert',
  })
  const [messageView, setMessageView] = useState<'text' | 'hex'>('text')

  const isConnected = sessionStatus === 'connected'

  // Handle Cert Selection
  // Handle Cert Selection
  useEffect(() => {
    if (certSelection === 'none') {
      // Clear certificates
      if (clientConfig.certificates.certPem || clientConfig.certificates.keyPem) {
        setClientConfig({
          certificates: {
            ...clientConfig.certificates,
            certPem: undefined,
            keyPem: undefined,
          },
        })
      }
    } else if (certSelection === 'default') {
      setClientConfig({
        certificates: {
          ...clientConfig.certificates,
          certPem: DEFAULT_CLIENT_CERT,
          keyPem: DEFAULT_CLIENT_KEY,
          caPem: DEFAULT_SERVER_CERT, // Trust RSA server cert
        },
      })
    } else if (certSelection === 'mldsa') {
      setClientConfig({
        certificates: {
          ...clientConfig.certificates,
          certPem: DEFAULT_MLDSA_CLIENT_CERT,
          keyPem: DEFAULT_MLDSA_CLIENT_KEY,
          caPem: DEFAULT_MLDSA87_SERVER_CERT, // Trust ML-DSA87 server cert (matches what server uses)
        },
      })
    }
  }, [certSelection, setClientConfig])

  const toggleCipher = (cipher: string) => {
    if (isConnected) return
    const current = clientConfig.cipherSuites
    const next = current.includes(cipher)
      ? current.filter((c) => c !== cipher)
      : [...current, cipher]
    setClientConfig({ cipherSuites: next })
  }

  const toggleGroup = (group: string) => {
    if (isConnected) return
    const current = clientConfig.groups
    const next = current.includes(group) ? current.filter((g) => g !== group) : [...current, group]
    setClientConfig({ groups: next })
  }

  const toggleSigAlg = (alg: string) => {
    if (isConnected) return
    const current = clientConfig.signatureAlgorithms
    const next = current.includes(alg) ? current.filter((a) => a !== alg) : [...current, alg]
    setClientConfig({ signatureAlgorithms: next })
  }

  return (
    <div
      className={clsx(
        'glass-panel p-0 overflow-hidden flex flex-col h-full border-t-4',
        isConnected ? 'border-t-success' : 'border-t-primary'
      )}
    >
      <div className="bg-muted/30 p-4 flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span
            className={clsx(
              'w-3 h-3 rounded-full',
              isConnected ? 'bg-success animate-pulse' : 'bg-primary'
            )}
          />
          TLS Client{' '}
          {isConnected && (
            <span className="text-xs font-normal text-success bg-success/10 px-2 py-0.5 rounded ml-2">
              Connected
            </span>
          )}
        </h2>
        <div className="flex bg-muted/50 rounded-lg p-1">
          <button
            onClick={() => {
              setActiveTab('ui')
              setMode('client', 'ui')
            }}
            className={clsx(
              'px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center gap-2',
              activeTab === 'ui'
                ? 'bg-primary/20 text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
            disabled={isConnected}
          >
            <Settings size={14} /> UI
          </button>
          <button
            onClick={() => {
              setActiveTab('raw')
              setMode('client', 'raw')
            }}
            className={clsx(
              'px-3 py-1 rounded-md text-sm font-medium transition-colors flex items-center gap-2',
              activeTab === 'raw'
                ? 'bg-primary/20 text-primary'
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
            <div className="bg-primary/10 rounded-lg p-4 border border-primary/20 space-y-4">
              <h3 className="text-xs uppercase tracking-wider text-primary font-semibold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                Application Data (Messaging)
              </h3>

              <div>
                <label
                  htmlFor="client-message"
                  className="text-xs text-muted-foreground mb-1 block"
                >
                  Message to Send (in Full Flow)
                </label>
                <input
                  id="client-message"
                  className="w-full bg-muted border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
                  value={clientMessage}
                  onChange={(e) => setClientMessage(e.target.value)}
                  placeholder="Enter message..."
                />
              </div>

              {/* Received Messages Output */}
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Received from Server</span>
                  <div className="flex bg-muted rounded p-0.5 border border-border">
                    <button
                      onClick={() => setMessageView('text')}
                      className={clsx(
                        'px-2 py-0.5 text-[10px] rounded transition-colors',
                        messageView === 'text'
                          ? 'bg-primary/20 text-primary'
                          : 'text-muted-foreground hover:text-primary'
                      )}
                    >
                      TXT
                    </button>
                    <button
                      onClick={() => setMessageView('hex')}
                      className={clsx(
                        'px-2 py-0.5 text-[10px] rounded transition-colors',
                        messageView === 'hex'
                          ? 'bg-primary/20 text-primary'
                          : 'text-muted-foreground hover:text-primary'
                      )}
                    >
                      HEX
                    </button>
                  </div>
                </div>
                <div className="min-h-[60px] max-h-[100px] overflow-auto bg-muted/50 rounded p-2 text-xs font-mono">
                  {results?.trace.filter(
                    (t) => t.event === 'message_received' && t.side === 'client'
                  ).length === 0 ? (
                    <span className="text-muted-foreground/50 italic">
                      No messages received yet.
                    </span>
                  ) : (
                    results?.trace
                      .filter((t) => t.event === 'message_received' && t.side === 'client')
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
                            <span className="text-tertiary break-all flex-grow font-mono leading-tight">
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

            {/* Client Identity */}
            <div>
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 block flex items-center gap-2">
                <Shield size={14} /> Client Identity (mTLS)
              </span>
              <select
                aria-label="Client Identity"
                className="w-full bg-muted border border-border rounded-lg p-3 text-sm focus:outline-none focus:border-primary mb-2"
                value={certSelection}
                onChange={(e) => setCertSelection(e.target.value)}
              >
                {CERTS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>

              {certSelection === 'custom' && (
                <div className="space-y-3 mt-3 p-4 rounded-lg bg-muted border border-border">
                  <div>
                    <div className="text-xs text-muted-foreground flex items-center justify-between mb-1">
                      <label htmlFor="client-cert-pem" className="flex items-center gap-1">
                        <FileText size={12} /> Certificate (PEM)
                      </label>
                      <button
                        onClick={() => setShowImport({ isOpen: true, type: 'cert' })}
                        className="text-[10px] text-primary hover:text-primary/80 flex items-center gap-1 uppercase font-bold"
                      >
                        <Import size={10} /> Import
                      </button>
                    </div>
                    <textarea
                      id="client-cert-pem"
                      className="w-full h-24 bg-card border border-border rounded p-2 text-xs font-mono"
                      placeholder="-----BEGIN CERTIFICATE-----..."
                      value={clientConfig.certificates.certPem || ''}
                      onChange={(e) =>
                        setClientConfig({
                          certificates: { ...clientConfig.certificates, certPem: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground flex items-center justify-between mb-1">
                      <label htmlFor="client-key-pem" className="flex items-center gap-1">
                        <Key size={12} /> Private Key (PEM)
                      </label>
                      <button
                        onClick={() => setShowImport({ isOpen: true, type: 'key' })}
                        className="text-[10px] text-primary hover:text-primary/80 flex items-center gap-1 uppercase font-bold"
                      >
                        <Import size={10} /> Import
                      </button>
                    </div>
                    <textarea
                      id="client-key-pem"
                      className="w-full h-24 bg-card border border-border rounded p-2 text-xs font-mono"
                      placeholder="-----BEGIN PRIVATE KEY-----..."
                      value={clientConfig.certificates.keyPem || ''}
                      onChange={(e) =>
                        setClientConfig({
                          certificates: { ...clientConfig.certificates, keyPem: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>
              )}

              <p className="text-xs text-muted-foreground mt-2">
                Needed if the Server requests a client certificate (mTLS).
              </p>

              {/* Verify Server Certificate Checkbox - matches Server panel's mTLS checkbox position */}
              <div className="flex items-center gap-2 mt-3">
                <input
                  type="checkbox"
                  id="verifyServer"
                  className="checkbox checkbox-sm checkbox-primary"
                  checked={true}
                  disabled
                  title="Server certificate verification is always required for secure TLS"
                />
                <label htmlFor="verifyServer" className="text-sm font-medium text-muted-foreground">
                  Verify Server Certificate <span className="text-success">(Always On)</span>
                </label>
              </div>

              {/* Trusted Root CA for verifying server certificate - matches Server panel layout */}
              <div className="mt-3 p-3 rounded-lg bg-muted/50 border border-border">
                <div className="text-xs text-muted-foreground flex items-center justify-between mb-1">
                  <label htmlFor="client-ca-pem" className="flex items-center gap-1">
                    <Shield size={12} className="text-warning" /> Trusted Root CA
                  </label>
                  <button
                    onClick={() => setShowImport({ isOpen: true, type: 'ca' })}
                    className="text-[10px] text-primary hover:text-primary/80 flex items-center gap-1 uppercase font-bold"
                  >
                    <Import size={10} /> Import from Studio
                  </button>
                </div>
                <textarea
                  id="client-ca-pem"
                  className="w-full h-16 bg-card border border-border rounded p-2 text-xs font-mono"
                  placeholder="-----BEGIN CERTIFICATE-----... (CA that signed server cert)"
                  value={clientConfig.certificates.caPem || ''}
                  onChange={(e) =>
                    setClientConfig({
                      certificates: { ...clientConfig.certificates, caPem: e.target.value },
                    })
                  }
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Import the Root CA that signed the server's certificate.
                </p>
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
                      clientConfig.cipherSuites.includes(cipher)
                        ? 'bg-primary/10 border-primary/50'
                        : 'bg-muted border-border hover:border-border/80'
                    )}
                  >
                    <span className="font-mono text-xs md:text-sm break-all">{cipher}</span>
                    {clientConfig.cipherSuites.includes(cipher) && (
                      <Check size={16} className="text-primary" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <hr className="border-border" />

            {/* Supported Groups */}
            <div>
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">
                Key Exchange Groups
              </span>

              {/* Classical */}
              <div className="mb-3">
                <span className="text-xs text-muted-foreground mb-2 block">Classical (ECDH)</span>
                <div className="flex flex-wrap gap-2">
                  {CLASSICAL_GROUPS.map((group) => (
                    <button
                      key={group}
                      onClick={() => toggleGroup(group)}
                      className={clsx(
                        'px-3 py-1.5 rounded-md text-sm font-mono border transition-all',
                        clientConfig.groups.includes(group)
                          ? 'bg-primary/10 border-primary/50 text-foreground'
                          : 'bg-muted border-border text-muted-foreground hover:border-border/80'
                      )}
                    >
                      {group}
                    </button>
                  ))}
                </div>
              </div>

              {/* PQC */}
              <div className="mb-3">
                <span className="text-xs text-muted-foreground mb-2 block">PQC (ML-KEM)</span>
                <div className="flex flex-wrap gap-2">
                  {PQC_GROUPS.map((group) => (
                    <button
                      key={group}
                      onClick={() => toggleGroup(group)}
                      className={clsx(
                        'px-3 py-1.5 rounded-md text-sm font-mono border transition-all',
                        clientConfig.groups.includes(group)
                          ? 'bg-success/20 border-success/50 text-foreground'
                          : 'bg-muted border-border text-muted-foreground hover:border-border/80'
                      )}
                    >
                      {group}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hybrid */}
              <div>
                <span className="text-xs text-muted-foreground mb-2 block">
                  Hybrid (Classical + PQC)
                </span>
                <div className="flex flex-wrap gap-2">
                  {HYBRID_GROUPS.map((group) => (
                    <button
                      key={group}
                      onClick={() => toggleGroup(group)}
                      className={clsx(
                        'px-3 py-1.5 rounded-md text-sm font-mono border transition-all',
                        clientConfig.groups.includes(group)
                          ? 'bg-warning/20 border-warning/50 text-foreground'
                          : 'bg-muted border-border text-muted-foreground hover:border-border/80'
                      )}
                    >
                      {group}
                    </button>
                  ))}
                </div>
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
                      clientConfig.signatureAlgorithms.includes(alg)
                        ? 'bg-primary/10 border-primary/50 text-foreground'
                        : 'bg-muted border-border text-muted-foreground hover:border-border/80'
                    )}
                  >
                    {alg}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 text-sm text-foreground/80">
              <p>Configuration will be generated automatically based on selection.</p>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            <div className="text-xs text-muted-foreground mb-2 flex justify-between">
              <label htmlFor="client-raw-config">/ssl/client.cnf</label>
              <span className="text-warning">Experimental Editor</span>
            </div>
            <textarea
              id="client-raw-config"
              className="flex-grow w-full bg-muted border border-border rounded-lg p-4 font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              value={clientConfig.rawConfig || '# OpenSSL Client Config\n[default]\n...'}
              onChange={(e) => setClientConfig({ rawConfig: e.target.value })}
              spellCheck={false}
            />
          </div>
        )}
      </div>

      <FileSelectionModal
        isOpen={showImport.isOpen}
        onClose={() => setShowImport({ ...showImport, isOpen: false })}
        title={`Import ${showImport.type === 'cert' ? 'Certificate' : showImport.type === 'key' ? 'Private Key' : 'Root CA Certificate'}`}
        onSelect={(content) => {
          if (showImport.type === 'cert') {
            setClientConfig({
              certificates: { ...clientConfig.certificates, certPem: content },
            })
          } else if (showImport.type === 'key') {
            setClientConfig({
              certificates: { ...clientConfig.certificates, keyPem: content },
            })
          } else {
            // 'ca' type - Root CA for verifying server cert
            setClientConfig({
              certificates: { ...clientConfig.certificates, caPem: content },
            })
          }
        }}
      />
    </div>
  )
}
