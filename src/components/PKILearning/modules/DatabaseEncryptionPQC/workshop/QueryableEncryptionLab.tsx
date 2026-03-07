// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { Search, CheckCircle, XCircle, Clock } from 'lucide-react'
import { QUERYABLE_ENCRYPTION_SCHEMES } from '../data/databaseConstants'

type QueryType = 'equality' | 'range' | 'prefix' | 'regex' | 'aggregate'

const QUERY_TYPES: { id: QueryType; label: string }[] = [
  { id: 'equality', label: 'Equality (=)' },
  { id: 'range', label: 'Range (<, >, BETWEEN)' },
  { id: 'prefix', label: 'Prefix (LIKE x%)' },
  { id: 'regex', label: 'Regex / LIKE %x%' },
  { id: 'aggregate', label: 'Aggregate (SUM, COUNT)' },
]

const MATRIX: Record<string, Record<QueryType, boolean | 'partial'>> = {
  'mongodb-fle2': {
    equality: true,
    range: true,
    prefix: true,
    regex: false,
    aggregate: false,
  },
  'sqlserver-ae': {
    equality: true,
    range: 'partial',
    prefix: false,
    regex: false,
    aggregate: false,
  },
  'oracle-csqe': {
    equality: true,
    range: false,
    prefix: false,
    regex: false,
    aggregate: false,
  },
  'pg-tde': {
    equality: false,
    range: false,
    prefix: false,
    regex: false,
    aggregate: false,
  },
}

const MatrixCell: React.FC<{ value: boolean | 'partial' }> = ({ value }) => {
  if (value === true) return <CheckCircle size={16} className="text-status-success mx-auto" />
  if (value === 'partial')
    return (
      <span className="text-status-warning text-xs font-bold mx-auto block text-center">
        Enclave
      </span>
    )
  return <XCircle size={16} className="text-status-error mx-auto" />
}

export const QueryableEncryptionLab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('mongodb-fle2')

  const scheme = QUERYABLE_ENCRYPTION_SCHEMES.find((s) => s.id === activeTab)

  return (
    <div className="space-y-6">
      {/* Tab selector */}
      <div className="flex flex-wrap gap-2">
        {QUERYABLE_ENCRYPTION_SCHEMES.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveTab(s.id)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
              activeTab === s.id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground'
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Scheme detail */}
      {scheme && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Details */}
          <div className="space-y-4">
            {/* Header */}
            <div className="glass-panel p-5">
              <div className="flex items-center gap-2 mb-2">
                <Search size={18} className="text-primary" />
                <h3 className="text-base font-bold text-foreground">{scheme.name}</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border font-bold">
                  {scheme.vendor}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${
                    scheme.pqcCompatible
                      ? 'bg-status-success/10 text-status-success border-status-success/30'
                      : 'bg-status-error/10 text-status-error border-status-error/30'
                  }`}
                >
                  {scheme.pqcCompatible ? 'PQC Compatible' : 'Not PQC'}
                </span>
              </div>

              {/* Query type badges */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {QUERY_TYPES.map((qt) => {
                  const supported = scheme.queryTypes.includes(qt.id)
                  return (
                    <span
                      key={qt.id}
                      className={`text-[10px] px-2 py-0.5 rounded border font-medium ${
                        supported
                          ? 'bg-primary/10 text-primary border-primary/30'
                          : 'bg-muted text-muted-foreground border-border'
                      }`}
                    >
                      {qt.label}
                    </span>
                  )
                })}
              </div>

              <div className="text-xs text-muted-foreground">{scheme.encryptionScheme}</div>
            </div>

            {/* Limitations */}
            <div className="glass-panel p-4">
              <div className="text-xs font-bold text-status-warning mb-2 flex items-center gap-1">
                <Clock size={12} />
                Limitations
              </div>
              <p className="text-xs text-muted-foreground">{scheme.limitations}</p>
            </div>

            {/* PQC Roadmap */}
            <div className="glass-panel p-4">
              <div className="text-xs font-bold text-primary mb-2 flex items-center gap-1">
                <CheckCircle size={12} />
                PQC Roadmap
              </div>
              <p className="text-xs text-muted-foreground">{scheme.pqcRoadmap}</p>
            </div>
          </div>

          {/* Right: Deep dive */}
          <div className="space-y-4">
            <div className="glass-panel p-4">
              <div className="text-xs font-bold text-foreground mb-3">
                How It Works — Key Lifecycle
              </div>
              {scheme.id === 'mongodb-fle2' && (
                <div className="space-y-2 text-center font-mono">
                  <div className="p-2 rounded bg-muted text-foreground text-xs">
                    Customer Master Key (CMK) in KMS
                  </div>
                  <div className="text-muted-foreground text-xs">&darr; RSA-OAEP wrap</div>
                  <div className="p-2 rounded bg-primary/10 text-primary text-xs">
                    Data Encryption Key (DEK) per collection
                  </div>
                  <div className="text-muted-foreground text-xs">&darr; AES-CBC encrypt</div>
                  <div className="p-2 rounded bg-muted text-foreground text-xs">
                    Encrypted document field
                  </div>
                  <div className="text-muted-foreground text-xs">&darr; HMAC-SHA-256 token</div>
                  <div className="p-2 rounded bg-status-info/10 text-status-info text-xs">
                    Queryable index (equality / range)
                  </div>
                </div>
              )}
              {scheme.id === 'sqlserver-ae' && (
                <div className="space-y-2 text-center font-mono">
                  <div className="p-2 rounded bg-muted text-foreground text-xs">
                    Column Master Key (CMK) in Azure KV / HSM
                  </div>
                  <div className="text-muted-foreground text-xs">&darr; RSA-OAEP wrap</div>
                  <div className="p-2 rounded bg-primary/10 text-primary text-xs">
                    Column Encryption Key (CEK) per column
                  </div>
                  <div className="text-muted-foreground text-xs">&darr; AES-256 encrypt</div>
                  <div className="p-2 rounded bg-muted text-foreground text-xs">
                    Encrypted column value
                  </div>
                  <div className="text-muted-foreground text-xs">
                    &darr; Secure Enclave (VBS/SGX)
                  </div>
                  <div className="p-2 rounded bg-status-warning/10 text-status-warning text-xs">
                    Range queries executed inside enclave
                  </div>
                </div>
              )}
              {scheme.id === 'oracle-csqe' && (
                <div className="space-y-2 text-center font-mono">
                  <div className="p-2 rounded bg-muted text-foreground text-xs">
                    Application Key in Oracle KV / Wallet
                  </div>
                  <div className="text-muted-foreground text-xs">&darr; HMAC-SHA-256 token</div>
                  <div className="p-2 rounded bg-primary/10 text-primary text-xs">
                    Equality query token (deterministic)
                  </div>
                  <div className="text-muted-foreground text-xs">&darr; AES-256-GCM encrypt</div>
                  <div className="p-2 rounded bg-muted text-foreground text-xs">
                    Ciphertext stored in DB
                  </div>
                  <div className="text-muted-foreground text-xs">&darr; Server compares tokens</div>
                  <div className="p-2 rounded bg-status-success/10 text-status-success text-xs">
                    Equality results (no plaintext exposed)
                  </div>
                </div>
              )}
              {scheme.id === 'pg-tde' && (
                <div className="space-y-2 text-center font-mono">
                  <div className="p-2 rounded bg-muted text-foreground text-xs">
                    Master Key in KMIP Provider
                  </div>
                  <div className="text-muted-foreground text-xs">&darr; AES-256 wrap</div>
                  <div className="p-2 rounded bg-primary/10 text-primary text-xs">
                    Tablespace Key (AES-256-XTS)
                  </div>
                  <div className="text-muted-foreground text-xs">
                    &darr; Block-level decrypt on read
                  </div>
                  <div className="p-2 rounded bg-muted text-foreground text-xs">
                    Plaintext data pages in memory
                  </div>
                  <div className="text-muted-foreground text-xs">
                    &darr; All queries on plaintext
                  </div>
                  <div className="p-2 rounded bg-muted/50 text-muted-foreground text-xs border border-dashed border-border">
                    No queryable encryption (TDE only)
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Compatibility Matrix */}
      <div className="glass-panel p-4">
        <div className="text-sm font-bold text-foreground mb-3">Query Compatibility Matrix</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Scheme</th>
                {QUERY_TYPES.map((qt) => (
                  <th
                    key={qt.id}
                    className="text-center py-2 px-2 text-muted-foreground font-medium"
                  >
                    {qt.label}
                  </th>
                ))}
                <th className="text-center py-2 px-2 text-muted-foreground font-medium">
                  PQC Ready
                </th>
              </tr>
            </thead>
            <tbody>
              {QUERYABLE_ENCRYPTION_SCHEMES.map((s) => (
                <tr
                  key={s.id}
                  className={`border-b border-border/50 ${activeTab === s.id ? 'bg-primary/5' : ''}`}
                >
                  <td className="py-2 px-3 font-medium text-foreground">{s.name}</td>
                  {QUERY_TYPES.map((qt) => (
                    <td key={qt.id} className="py-2 px-2">
                      <MatrixCell value={MATRIX[s.id]?.[qt.id] ?? false} />
                    </td>
                  ))}
                  <td className="py-2 px-2 text-center">
                    {s.pqcCompatible ? (
                      <CheckCircle size={16} className="text-status-success mx-auto" />
                    ) : (
                      <Clock size={16} className="text-status-warning mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[10px] text-muted-foreground mt-2">
            &ldquo;Enclave&rdquo; = range queries require secure enclave (VBS/SGX). &ldquo;
            <Clock size={9} className="inline" />
            &rdquo; = PQC roadmap announced but not yet GA.
          </p>
        </div>
      </div>
    </div>
  )
}
