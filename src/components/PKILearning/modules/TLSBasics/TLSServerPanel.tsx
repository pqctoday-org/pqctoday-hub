// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useEffect } from 'react'
import {
  Settings,
  FileText,
  Check,
  Shield,
  Key,
  Import,
  Copy,
  Eye,
  AlertTriangle,
} from 'lucide-react'
import { clsx } from 'clsx'
import { useTLSStore } from '@/store/tls-learning.store'
import { FileSelectionModal } from './components/FileSelectionModal'
import { CertificateInspector } from './components/CertificateInspector'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { Input } from '@/components/ui/input'
import {
  DEFAULT_SERVER_CERT,
  DEFAULT_SERVER_KEY,
  DEFAULT_MLDSA_SERVER_CERT,
  DEFAULT_MLDSA_SERVER_KEY,
  DEFAULT_MLDSA87_SERVER_CERT,
  DEFAULT_MLDSA87_SERVER_KEY,
} from './utils/defaultCertificates'
import { Button } from '@/components/ui/button'

const CIPHER_SUITES = [
  'TLS_AES_256_GCM_SHA384',
  'TLS_AES_128_GCM_SHA256',
  'TLS_CHACHA20_POLY1305_SHA256',
  'TLS_AES_128_CCM_SHA256',
  'TLS_AES_128_CCM_8_SHA256',
]

// Key Exchange Groups organized by type
const CLASSICAL_GROUPS = ['X25519', 'P-256', 'P-384', 'P-521']
const PQC_GROUPS = ['ML-KEM-512', 'ML-KEM-768', 'ML-KEM-1024']
const HYBRID_GROUPS = ['X25519MLKEM768', 'SecP256r1MLKEM768', 'X448MLKEM1024', 'SecP384r1MLKEM1024']

const SIG_ALGS = [
  // PQC - ML-DSA (Dilithium)
  'mldsa44',
  'mldsa65',
  'mldsa87',
  // PQC - SLH-DSA SHA-2 variants (FIPS 205)
  'slhdsa-sha2-128s',
  'slhdsa-sha2-128f',
  'slhdsa-sha2-192s',
  'slhdsa-sha2-192f',
  'slhdsa-sha2-256s',
  'slhdsa-sha2-256f',
  // PQC - SLH-DSA SHAKE variants (FIPS 205)
  'slhdsa-shake-128s',
  'slhdsa-shake-128f',
  'slhdsa-shake-192s',
  'slhdsa-shake-192f',
  'slhdsa-shake-256s',
  'slhdsa-shake-256f',
  // Classical
  'ecdsa_secp256r1_sha256',
  'rsa_pss_rsae_sha256',
  'rsa_pss_pss_sha256',
  'ed25519',
]

const CERTS = [
  { id: 'default', label: 'Default (RSA 2048)' },
  { id: 'mldsa44', label: 'Default (ML-DSA-44)' },
  { id: 'mldsa87', label: 'Default (ML-DSA-87)' },
  { id: 'custom', label: 'Custom from OpenSSL Studio' },
]

// NIST security level labels — source: FIPS 203, 204, 205
const NIST_LEVEL: Record<string, string> = {
  'ML-KEM-512': 'NIST L1',
  'ML-KEM-768': 'NIST L3',
  'ML-KEM-1024': 'NIST L5',
  X25519MLKEM768: 'L3 hybrid',
  SecP256r1MLKEM768: 'L3 hybrid',
  X448MLKEM1024: 'L5 hybrid',
  SecP384r1MLKEM1024: 'L5 hybrid',
  mldsa44: 'NIST L2',
  mldsa65: 'NIST L3',
  mldsa87: 'NIST L5',
  'slhdsa-sha2-128s': 'NIST L1',
  'slhdsa-sha2-128f': 'NIST L1',
  'slhdsa-sha2-192s': 'NIST L3',
  'slhdsa-sha2-192f': 'NIST L3',
  'slhdsa-sha2-256s': 'NIST L5',
  'slhdsa-sha2-256f': 'NIST L5',
  'slhdsa-shake-128s': 'NIST L1',
  'slhdsa-shake-128f': 'NIST L1',
  'slhdsa-shake-192s': 'NIST L3',
  'slhdsa-shake-192f': 'NIST L3',
  'slhdsa-shake-256s': 'NIST L5',
  'slhdsa-shake-256f': 'NIST L5',
}

// Key share sizes (bytes) sent in ClientHello — source: FIPS 203, draft-connolly-tls-mlkem-key-agreement-05
const GROUP_SIZE: Record<string, string> = {
  X25519: 'key share: 32 B',
  'P-256': 'key share: 65 B',
  'P-384': 'key share: 97 B',
  'P-521': 'key share: 133 B',
  'ML-KEM-512': 'pk: 800 B · ct: 768 B',
  'ML-KEM-768': 'pk: 1,184 B · ct: 1,088 B',
  'ML-KEM-1024': 'pk: 1,568 B · ct: 1,568 B',
  X25519MLKEM768: '~1,216 B combined (X25519 32 + ML-KEM-768 1,184)',
  SecP256r1MLKEM768: '~1,249 B combined (P-256 65 + ML-KEM-768 1,184)',
  X448MLKEM1024: '~1,624 B combined (X448 56 + ML-KEM-1024 1,568)',
  SecP384r1MLKEM1024: '~1,665 B combined (P-384 97 + ML-KEM-1024 1,568)',
}

// Signature and public key sizes — source: FIPS 204, FIPS 205 (Table 2)
const SIG_SIZE: Record<string, { sig: string; pub: string }> = {
  mldsa44: { sig: '2,420 B', pub: '1,312 B' },
  mldsa65: { sig: '3,293 B', pub: '1,952 B' },
  mldsa87: { sig: '4,595 B', pub: '2,592 B' },
  'slhdsa-sha2-128s': { sig: '7,856 B', pub: '32 B' },
  'slhdsa-sha2-128f': { sig: '17,088 B', pub: '32 B' },
  'slhdsa-sha2-192s': { sig: '16,224 B', pub: '48 B' },
  'slhdsa-sha2-192f': { sig: '35,664 B', pub: '48 B' },
  'slhdsa-sha2-256s': { sig: '29,792 B', pub: '64 B' },
  'slhdsa-sha2-256f': { sig: '49,856 B', pub: '64 B' },
  'slhdsa-shake-128s': { sig: '7,856 B', pub: '32 B' },
  'slhdsa-shake-128f': { sig: '17,088 B', pub: '32 B' },
  'slhdsa-shake-192s': { sig: '16,224 B', pub: '48 B' },
  'slhdsa-shake-192f': { sig: '35,664 B', pub: '48 B' },
  'slhdsa-shake-256s': { sig: '29,792 B', pub: '64 B' },
  'slhdsa-shake-256f': { sig: '49,856 B', pub: '64 B' },
  ecdsa_secp256r1_sha256: { sig: '~72 B', pub: '64 B' },
  rsa_pss_rsae_sha256: { sig: '256 B', pub: '256 B' },
  rsa_pss_pss_sha256: { sig: '256 B', pub: '256 B' },
  ed25519: { sig: '64 B', pub: '32 B' },
}

const SLH_DSA_ALGS = [
  'slhdsa-sha2-128s',
  'slhdsa-sha2-128f',
  'slhdsa-sha2-192s',
  'slhdsa-sha2-192f',
  'slhdsa-sha2-256s',
  'slhdsa-sha2-256f',
  'slhdsa-shake-128s',
  'slhdsa-shake-128f',
  'slhdsa-shake-192s',
  'slhdsa-shake-192f',
  'slhdsa-shake-256s',
  'slhdsa-shake-256f',
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
        },
      })
    } else if (certSelection === 'mldsa44') {
      setServerConfig({
        certificates: {
          ...serverConfig.certificates,
          certPem: DEFAULT_MLDSA_SERVER_CERT,
          keyPem: DEFAULT_MLDSA_SERVER_KEY,
        },
      })
    } else if (certSelection === 'mldsa87') {
      setServerConfig({
        certificates: {
          ...serverConfig.certificates,
          certPem: DEFAULT_MLDSA87_SERVER_CERT,
          keyPem: DEFAULT_MLDSA87_SERVER_KEY,
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
          TLS Server{' '}
          {isConnected && (
            <span className="text-xs font-normal text-success bg-success/10 px-2 py-0.5 rounded ml-2">
              Active
            </span>
          )}
        </h2>
        <div role="tablist" className="flex bg-muted/50 rounded-lg p-1">
          <Button
            variant="ghost"
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
            role="tab"
            aria-selected={activeTab === 'ui'}
            aria-controls="server-tab-panel"
          >
            <Settings size={14} /> UI
          </Button>
          <Button
            variant="ghost"
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
            role="tab"
            aria-selected={activeTab === 'raw'}
            aria-controls="server-tab-panel"
          >
            <FileText size={14} /> Config File
          </Button>
        </div>
      </div>

      <div id="server-tab-panel" className="p-6 flex-grow overflow-auto min-h-[400px]">
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
                <Input
                  id="server-message"
                  className="w-full text-sm"
                  value={serverMessage}
                  onChange={(e) => setServerMessage(e.target.value)}
                  placeholder="Enter message..."
                />
              </div>

              {/* Received Messages Output */}
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Received from Client</span>
                  <div role="tablist" className="flex bg-muted rounded p-0.5 border border-border">
                    <Button
                      variant="ghost"
                      onClick={() => setMessageView('text')}
                      className={clsx(
                        'px-2 py-0.5 text-[10px] rounded transition-colors',
                        messageView === 'text'
                          ? 'bg-tertiary/20 text-tertiary'
                          : 'text-muted-foreground hover:text-tertiary'
                      )}
                      role="tab"
                      aria-selected={messageView === 'text'}
                    >
                      TXT
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setMessageView('hex')}
                      className={clsx(
                        'px-2 py-0.5 text-[10px] rounded transition-colors',
                        messageView === 'hex'
                          ? 'bg-tertiary/20 text-tertiary'
                          : 'text-muted-foreground hover:text-tertiary'
                      )}
                      role="tab"
                      aria-selected={messageView === 'hex'}
                    >
                      HEX
                    </Button>
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
                            <Button
                              variant="ghost"
                              onClick={() => navigator.clipboard.writeText(display)}
                              className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                              title="Copy"
                              aria-label="Copy to clipboard"
                            >
                              <Copy size={12} />
                            </Button>
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
                <FilterDropdown
                  label="Server Identity"
                  items={CERTS.map((c) => ({ id: c.id, label: c.label }))}
                  selectedId={certSelection}
                  onSelect={setCertSelection}
                  noContainer
                  className="flex-grow"
                />
                {serverConfig.certificates.certPem && (
                  <Button
                    variant="ghost"
                    onClick={() =>
                      setInspectCert({
                        pem: serverConfig.certificates.certPem!,
                        title: 'Server Identity Certificate',
                      })
                    }
                    className="p-3 bg-muted hover:bg-muted/80 rounded-lg border border-border text-tertiary transition-colors"
                    title="Inspect Identity Certificate"
                    aria-label="Inspect certificate"
                  >
                    <Eye size={18} />
                  </Button>
                )}
              </div>

              {certSelection === 'custom' && (
                <div className="space-y-3 mt-3 p-4 rounded-lg bg-muted border border-border">
                  <div>
                    <div className="text-xs text-muted-foreground flex items-center justify-between mb-1">
                      <label htmlFor="server-cert-pem" className="flex items-center gap-1">
                        <FileText size={12} /> Certificate (PEM)
                      </label>
                      <Button
                        variant="ghost"
                        onClick={() => setShowImport({ isOpen: true, type: 'cert' })}
                        className="text-[10px] text-tertiary hover:text-tertiary/80 flex items-center gap-1 uppercase font-bold"
                      >
                        <Import size={10} /> Import
                      </Button>
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
                      <Button
                        variant="ghost"
                        onClick={() => setShowImport({ isOpen: true, type: 'key' })}
                        className="text-[10px] text-tertiary hover:text-tertiary/80 flex items-center gap-1 uppercase font-bold"
                      >
                        <Import size={10} /> Import
                      </Button>
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
                  Require Client Certificate (mTLS)
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
                        <Button
                          variant="ghost"
                          onClick={() =>
                            setInspectCert({
                              pem: serverConfig.certificates.caPem!,
                              title: 'Trusted Root CA (mTLS)',
                            })
                          }
                          className="text-[10px] text-tertiary hover:text-tertiary/80 flex items-center gap-1 uppercase font-bold"
                          title="Inspect Root CA"
                          aria-label="Inspect root CA certificate"
                        >
                          <Eye size={10} className="mr-1" /> Inspect
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        onClick={() => setShowImport({ isOpen: true, type: 'ca' })}
                        className="text-[10px] text-tertiary hover:text-tertiary/80 flex items-center gap-1 uppercase font-bold"
                      >
                        <Import size={10} /> Import from Studio
                      </Button>
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
                    aria-pressed={serverConfig.cipherSuites.includes(cipher)}
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
                Key Exchange Groups
              </span>

              {/* Classical */}
              <div className="mb-3">
                <span className="text-xs text-muted-foreground mb-2 block">Classical (ECDH)</span>
                <div className="flex flex-wrap gap-2">
                  {CLASSICAL_GROUPS.map((group) => (
                    <Button
                      variant="ghost"
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
                    </Button>
                  ))}
                </div>
              </div>

              {/* PQC */}
              <div className="mb-3">
                <span className="text-xs text-muted-foreground mb-2 block">PQC (ML-KEM)</span>
                <div className="flex flex-wrap gap-2">
                  {PQC_GROUPS.map((group) => (
                    <Button
                      variant="ghost"
                      key={group}
                      onClick={() => toggleGroup(group)}
                      title={GROUP_SIZE[group]}
                      className={clsx(
                        'px-3 py-1.5 rounded-md text-sm font-mono border transition-all flex items-center gap-1',
                        serverConfig.groups.includes(group)
                          ? 'bg-success/20 border-success/50 text-foreground'
                          : 'bg-muted border-border text-muted-foreground hover:border-border/80'
                      )}
                    >
                      {group}
                      <span className="text-[9px] font-sans font-normal opacity-60">
                        ({NIST_LEVEL[group]})
                      </span>
                    </Button>
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
                    <Button
                      variant="ghost"
                      key={group}
                      onClick={() => toggleGroup(group)}
                      title={GROUP_SIZE[group]}
                      className={clsx(
                        'px-3 py-1.5 rounded-md text-sm font-mono border transition-all flex items-center gap-1',
                        serverConfig.groups.includes(group)
                          ? 'bg-warning/20 border-warning/50 text-foreground'
                          : 'bg-muted border-border text-muted-foreground hover:border-border/80'
                      )}
                    >
                      {group}
                      <span className="text-[9px] font-sans font-normal opacity-60">
                        ({NIST_LEVEL[group]})
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
              {/* Key share size reference */}
              <details className="mt-2 text-xs">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground list-none select-none py-0.5">
                  ▸ Key share size reference (FIPS 203, RFC 8446)
                </summary>
                <div className="mt-1 rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="bg-muted text-muted-foreground">
                        <th className="p-1.5 text-left font-medium">Group</th>
                        <th className="p-1.5 text-right font-medium">Key Share (ClientHello)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...CLASSICAL_GROUPS, ...PQC_GROUPS, ...HYBRID_GROUPS].map((group, i) => (
                        <tr
                          key={group}
                          className={clsx(
                            'border-t border-border',
                            i % 2 === 0 ? 'bg-card' : 'bg-muted/30'
                          )}
                        >
                          <td
                            className={clsx(
                              'p-1.5 font-mono',
                              serverConfig.groups.includes(group) && 'text-tertiary font-bold'
                            )}
                          >
                            {group}
                          </td>
                          <td className="p-1.5 text-right font-mono text-muted-foreground">
                            {GROUP_SIZE[group] ?? '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </div>

            <hr className="border-border" />

            {/* Signature Algorithms */}
            <div>
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 block">
                Signature Algorithms
              </span>
              <div className="flex flex-wrap gap-2 mb-2">
                {SIG_ALGS.map((alg) => (
                  <Button
                    variant="ghost"
                    key={alg}
                    onClick={() => toggleSigAlg(alg)}
                    title={
                      SIG_SIZE[alg]
                        ? `sig: ${SIG_SIZE[alg].sig} · pub key: ${SIG_SIZE[alg].pub}`
                        : undefined
                    }
                    className={clsx(
                      'px-3 py-1.5 rounded-md text-xs font-mono border transition-all flex items-center gap-1',
                      serverConfig.signatureAlgorithms.includes(alg)
                        ? 'bg-tertiary/10 border-tertiary/50 text-foreground'
                        : 'bg-muted border-border text-muted-foreground hover:border-border/80'
                    )}
                  >
                    {SLH_DSA_ALGS.includes(alg) && (
                      <AlertTriangle size={10} className="text-warning shrink-0" />
                    )}
                    {alg}
                    {NIST_LEVEL[alg] && (
                      <span className="text-[9px] font-sans font-normal opacity-60">
                        ({NIST_LEVEL[alg]})
                      </span>
                    )}
                  </Button>
                ))}
              </div>
              {serverConfig.signatureAlgorithms.some((a) => SLH_DSA_ALGS.includes(a)) && (
                <div className="flex items-start gap-2 p-2 rounded-lg bg-warning/10 border border-warning/30 text-xs mb-2">
                  <AlertTriangle size={12} className="text-warning shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-warning">SLH-DSA is experimental in TLS.</strong>{' '}
                    Signatures are 7–50 KB — far larger than ML-DSA. No IETF draft standardizes
                    SLH-DSA for TLS 1.3. Selecting it may cause oversized handshakes or negotiation
                    failures.
                  </span>
                </div>
              )}
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground hover:text-foreground list-none select-none py-0.5">
                  ▸ Signature size reference (FIPS 204/205)
                </summary>
                <div className="mt-1 rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="bg-muted text-muted-foreground">
                        <th className="p-1.5 text-left font-medium">Algorithm</th>
                        <th className="p-1.5 text-right font-medium">Signature</th>
                        <th className="p-1.5 text-right font-medium">Public Key</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SIG_ALGS.filter((a) => SIG_SIZE[a]).map((alg, i) => (
                        <tr
                          key={alg}
                          className={clsx(
                            'border-t border-border',
                            i % 2 === 0 ? 'bg-card' : 'bg-muted/30'
                          )}
                        >
                          <td
                            className={clsx(
                              'p-1.5 font-mono',
                              serverConfig.signatureAlgorithms.includes(alg) &&
                                'text-tertiary font-bold'
                            )}
                          >
                            {alg}
                          </td>
                          <td className="p-1.5 text-right font-mono">{SIG_SIZE[alg].sig}</td>
                          <td className="p-1.5 text-right font-mono">{SIG_SIZE[alg].pub}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
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
                <Button
                  variant="ghost"
                  onClick={() => {
                    navigator.clipboard.writeText(serverConfig.rawConfig || '')
                  }}
                  className="px-2 py-0.5 text-[10px] bg-muted hover:bg-muted/80 border border-border rounded flex items-center gap-1 text-tertiary hover:text-tertiary/80 transition-colors"
                  title="Copy Config"
                >
                  <Copy size={10} />
                  Copy
                </Button>
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
