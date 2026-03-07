// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import { Code2 } from 'lucide-react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { CODE_EXAMPLES, OPERATION_LABELS, type CryptoOperation } from '../data/codeExamplesData'
import { CRYPTO_APIS } from '../data/apiData'

const OPERATION_ITEMS: { id: string; label: string }[] = [
  { id: 'keygen', label: 'Key Generation' },
  { id: 'sign', label: 'Sign' },
  { id: 'verify', label: 'Verify' },
  { id: 'encrypt', label: 'Encrypt' },
  { id: 'kem-encapsulate', label: 'KEM Encapsulate' },
]

const API_ITEMS = [
  { id: 'All', label: 'All APIs' },
  ...CRYPTO_APIS.map((a) => ({ id: a.id, label: a.name })),
]

const PROVIDER_PATTERNS: Record<string, { pattern: string; description: string }> = {
  'jca-jce': {
    pattern: 'Security.addProvider(new BouncyCastleProvider())',
    description:
      'JCA provider registered once at startup. Algorithm selection by string name and provider ID.',
  },
  openssl: {
    pattern: 'OSSL_PROVIDER_load(NULL, "oqsprovider")',
    description:
      'OpenSSL 3.x provider loaded by name. All subsequent EVP calls use configured providers.',
  },
  pkcs11: {
    pattern: 'C_Initialize() → C_GetSlotList() → C_OpenSession()',
    description:
      'PKCS#11 initialized via shared library. Slot/token selected; session opened before any operations.',
  },
  'ksp-cng': {
    pattern: 'NCryptOpenStorageProvider(&hProvider, MS_KEY_STORAGE_PROVIDER, 0)',
    description:
      'CNG opens a named key storage provider. Provider handle used for all key operations.',
  },
  'bouncy-castle': {
    pattern: 'Direct class instantiation — no provider registration needed',
    description: 'Bouncy Castle standalone API uses concrete classes directly. No provider system.',
  },
  jcprov: {
    pattern: 'JCProv.initialize(config) → Security.addProvider(jcprovProvider)',
    description:
      'JCProv wraps PKCS#11 as a JCA provider. Once registered, standard JCA calls hit the HSM.',
  },
}

export const ProviderPatternWorkshop: React.FC = () => {
  const [operation, setOperation] = useState<CryptoOperation>('keygen')
  const [apiFilter, setApiFilter] = useState('All')

  const examples = useMemo(() => {
    return CODE_EXAMPLES.filter((ex) => {
      if (ex.operation !== operation) return false
      if (apiFilter !== 'All' && ex.apiId !== apiFilter) return false
      return true
    })
  }, [operation, apiFilter])

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-3">
        <FilterDropdown
          label="Operation"
          items={OPERATION_ITEMS}
          selectedId={operation}
          onSelect={(id) => setOperation(id as CryptoOperation)}
        />
        <FilterDropdown
          label="API"
          items={API_ITEMS}
          selectedId={apiFilter}
          onSelect={setApiFilter}
        />
      </div>

      {/* Provider Pattern Explainer */}
      <div className="glass-panel p-4">
        <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
          <Code2 size={18} className="text-primary" />
          Provider Registration Patterns
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.entries(PROVIDER_PATTERNS)
            .filter(([id]) => apiFilter === 'All' || id === apiFilter)
            .map(([id, { pattern, description }]) => {
              const api = CRYPTO_APIS.find((a) => a.id === id)
              return (
                <div key={id} className="border border-border rounded-lg p-3">
                  <div className="font-semibold text-sm text-foreground mb-1">
                    {api?.name ?? id}
                  </div>
                  <code className="text-xs font-mono text-primary block bg-muted/50 rounded p-2 mb-2 break-all">
                    {pattern}
                  </code>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
              )
            })}
        </div>
      </div>

      {/* Code Examples */}
      <div className="space-y-4">
        <h3 className="font-bold text-foreground">
          {OPERATION_LABELS[operation]} — Code Examples
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            ({examples.length} APIs)
          </span>
        </h3>
        {examples.length === 0 && (
          <div className="glass-panel p-8 text-center text-muted-foreground">
            No code examples for this combination. Try a different operation or API.
          </div>
        )}
        {examples.map((ex) => {
          const api = CRYPTO_APIS.find((a) => a.id === ex.apiId)
          return (
            <div key={`${ex.apiId}-${ex.operation}`} className="glass-panel overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-muted/30">
                <span className="font-semibold text-foreground">{api?.name ?? ex.apiId}</span>
                <span className="text-xs px-2 py-0.5 rounded border border-border text-muted-foreground">
                  {ex.language}
                </span>
                <span className="text-xs text-primary ml-auto font-mono">{ex.algorithm}</span>
              </div>
              <pre className="overflow-x-auto p-4 text-sm font-mono text-foreground leading-relaxed">
                <code>{ex.code}</code>
              </pre>
              {ex.notes && (
                <div className="px-4 py-2 border-t border-border bg-status-info/5 text-xs text-muted-foreground">
                  <span className="font-semibold text-status-info">Note: </span>
                  {ex.notes}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Key Insight */}
      <div className="glass-panel p-4 border-l-4 border-primary">
        <h4 className="font-semibold text-primary mb-2">
          Key Insight: Algorithm-Agnostic Business Logic
        </h4>
        <p className="text-sm text-muted-foreground">
          Notice how all examples follow the same structure: configure the provider once at startup,
          then use the API&apos;s high-level objects (Signature, EVP_PKEY, CK_MECHANISM) for the
          actual operation. The algorithm name is the only thing that changes between RSA-2048 and
          ML-DSA-65. This is the foundation of crypto agility.
        </p>
      </div>
    </div>
  )
}
