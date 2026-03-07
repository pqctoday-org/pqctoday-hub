// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import { Layers, ChevronRight } from 'lucide-react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import {
  DATABASE_PROFILES,
  ENCRYPTION_LAYER_LABELS,
  type EncryptionLayer,
  type DatabaseEncryptionProfile,
} from '../data/databaseConstants'

interface LayerInfo {
  id: EncryptionLayer
  label: string
  shortLabel: string
  description: string
  whatItEncrypts: string
  classicalAlgorithm: string
  pqcUpgradePath: string
  depth: string
}

const LAYER_INFO: LayerInfo[] = [
  {
    id: 'application',
    label: 'Application Layer',
    shortLabel: 'Application',
    description: 'Encryption performed by the application before data reaches the database.',
    whatItEncrypts:
      'Individual fields, objects, or payloads — application controls all key material.',
    classicalAlgorithm: 'AES-256-GCM with RSA-OAEP or ECDH key exchange for key agreement.',
    pqcUpgradePath:
      'Replace ECDH key agreement with ML-KEM-768 or ML-KEM-1024. Update application crypto library (OpenSSL 3.4+, Bouncy Castle 1.78+). Symmetric AES-256-GCM unchanged.',
    depth: 'Outermost',
  },
  {
    id: 'queryable',
    label: 'Queryable Encryption Layer',
    shortLabel: 'Queryable',
    description:
      'Structured encryption that allows specific query types (equality, range) on encrypted data without full decryption.',
    whatItEncrypts:
      'Indexed fields using deterministic or structured encryption schemes; non-indexed fields use random encryption.',
    classicalAlgorithm:
      'MongoDB FLE 2.0: HMAC-SHA-256 tokens + AES-CBC. SQL Server AE: RSA-OAEP (CMK) + AES-256 (CEK).',
    pqcUpgradePath:
      'CMK/DEK wrapping: replace RSA-OAEP with ML-KEM-1024 (cloud KMS upgrade required). Token MAC: upgrade to HMAC-SHA3-256. Range query schemes under PQC standardization review.',
    depth: 'Upper-middle',
  },
  {
    id: 'column',
    label: 'Column-Level Encryption (CLE)',
    shortLabel: 'Column',
    description:
      'Specific database columns are encrypted individually, enabling granular access control independent of TDE.',
    whatItEncrypts:
      'Sensitive columns (PAN, SSN, PHI) — encrypted with per-column keys (CEK) wrapped by a Column Master Key (CMK).',
    classicalAlgorithm:
      'AES-256-CBC or AES-256-GCM for data; RSA-2048/4096 OAEP for CMK wrapping. SQL Server Always Encrypted, Oracle TCE.',
    pqcUpgradePath:
      'CMK wrapping algorithm: RSA-OAEP → ML-KEM-1024. Requires CMK rotation which triggers CEK re-wrapping. Data encryption (AES-256) unchanged. Timeline: 2026 (cloud KMS providers).',
    depth: 'Middle',
  },
  {
    id: 'field',
    label: 'Field-Level Encryption (FLE)',
    shortLabel: 'Field',
    description:
      'Client-side encryption of individual document fields before data is written to the database. The server never sees plaintext.',
    whatItEncrypts:
      'Individual document fields (MongoDB FLE 1.0/2.0) or row cells. Key material managed entirely by the client.',
    classicalAlgorithm:
      'AES-256-CBC (deterministic) or AES-256-AEAD (random). DEK wrapped by Customer Master Key using RSA-OAEP.',
    pqcUpgradePath:
      'CMK/DEK wrapping: migrate to ML-KEM-1024. Client encryption library must support PQC wrapping. MongoDB driver PQC support expected with MongoDB 8.x drivers.',
    depth: 'Inner',
  },
  {
    id: 'tde',
    label: 'Transparent Data Encryption (TDE)',
    shortLabel: 'TDE',
    description:
      'Database engine encrypts data files, log files, and backups transparently. Application code requires no changes.',
    whatItEncrypts:
      'Entire database files (data pages, log files, backups) at the storage I/O layer. Protects against physical theft.',
    classicalAlgorithm:
      'AES-256-CBC or AES-256-XTS for data files. DEK (256-bit AES) wrapped by master key using RSA-2048/4096 OAEP.',
    pqcUpgradePath:
      'AES-256 data encryption is already quantum-safe. Only the DEK wrapping (RSA-OAEP) needs upgrade to ML-KEM-1024 via external KMS/HSM. Online re-encryption supported (Oracle/SQL Server).',
    depth: 'Innermost (storage)',
  },
]

const DB_ITEMS = DATABASE_PROFILES.map((p) => ({ id: p.id, label: p.dbName }))

export const EncryptionLayerMapper: React.FC = () => {
  const [selectedLayer, setSelectedLayer] = useState<EncryptionLayer | null>(null)
  const [selectedDbId, setSelectedDbId] = useState<string>('oracle')

  const selectedDb: DatabaseEncryptionProfile | undefined = DATABASE_PROFILES.find(
    (p) => p.id === selectedDbId
  )

  const handleLayerClick = (layerId: EncryptionLayer) => {
    setSelectedLayer(selectedLayer === layerId ? null : layerId)
  }

  const activeLayerInfo = LAYER_INFO.find((l) => l.id === selectedLayer)

  return (
    <div className="space-y-6">
      {/* Database selector */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted-foreground font-medium">Database:</span>
        <FilterDropdown
          items={DB_ITEMS}
          selectedId={selectedDbId}
          onSelect={(id) => {
            if (id !== 'All') setSelectedDbId(id)
          }}
          defaultLabel="Select Database"
          label="Database"
          noContainer
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Layer cake diagram */}
        <div>
          <div className="text-sm font-bold text-foreground mb-3">
            Database Encryption Stack — click a layer to inspect
          </div>
          <div className="space-y-1.5">
            {LAYER_INFO.map((layer) => {
              const isSupported = selectedDb?.encryptionLayers.includes(layer.id)
              const isSelected = selectedLayer === layer.id
              return (
                <button
                  key={layer.id}
                  onClick={() => handleLayerClick(layer.id)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-all text-sm font-medium flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'border-primary bg-primary/10 text-primary'
                      : isSupported
                        ? 'border-border bg-muted/30 hover:bg-muted/60 text-foreground'
                        : 'border-border/40 bg-muted/10 text-muted-foreground opacity-50 cursor-default'
                  }`}
                  disabled={!isSupported}
                >
                  <span className="flex items-center gap-3">
                    <Layers
                      size={16}
                      className={isSelected ? 'text-primary' : 'text-muted-foreground'}
                    />
                    <span>{layer.label}</span>
                  </span>
                  <span className="flex items-center gap-2 shrink-0">
                    {isSupported ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-status-success/15 text-status-success border border-status-success/30 font-bold">
                        Supported
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border font-bold">
                        Not Available
                      </span>
                    )}
                    {isSelected && <ChevronRight size={14} className="rotate-90 text-primary" />}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Storage label */}
          <div className="mt-2 text-center">
            <div className="inline-block px-4 py-2 rounded bg-muted text-muted-foreground text-xs border border-border">
              Storage (Disk / Block / Object)
            </div>
          </div>
        </div>

        {/* Detail panel */}
        <div className="space-y-4">
          {activeLayerInfo ? (
            <div className="space-y-3">
              <div className="glass-panel p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Layers size={18} className="text-primary" />
                  <h3 className="text-base font-bold text-foreground">{activeLayerInfo.label}</h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-bold">
                    {activeLayerInfo.depth}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{activeLayerInfo.description}</p>
              </div>

              <div className="glass-panel p-4 space-y-3">
                <div>
                  <div className="text-xs font-bold text-foreground mb-1">What It Encrypts</div>
                  <p className="text-xs text-muted-foreground">{activeLayerInfo.whatItEncrypts}</p>
                </div>

                <div className="border-t border-border pt-3">
                  <div className="text-xs font-bold text-status-error mb-1">
                    Classical Algorithm
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {activeLayerInfo.classicalAlgorithm}
                  </p>
                </div>

                <div className="border-t border-border pt-3">
                  <div className="text-xs font-bold text-primary mb-1">PQC Upgrade Path</div>
                  <p className="text-xs text-muted-foreground">{activeLayerInfo.pqcUpgradePath}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-6 flex flex-col items-center justify-center min-h-[200px] text-center">
              <Layers size={32} className="text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">
                Select a layer from the stack to see details
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Gray layers are not supported by the selected database
              </p>
            </div>
          )}

          {/* Database coverage summary */}
          {selectedDb && (
            <div className="glass-panel p-4">
              <div className="text-xs font-bold text-foreground mb-3">
                {selectedDb.dbName} — Coverage Analysis
              </div>
              <div className="space-y-1.5">
                {LAYER_INFO.map((layer) => {
                  const supported = selectedDb.encryptionLayers.includes(layer.id)
                  return (
                    <div key={layer.id} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {ENCRYPTION_LAYER_LABELS[layer.id]}
                      </span>
                      <span
                        className={`font-bold ${supported ? 'text-status-success' : 'text-muted-foreground'}`}
                      >
                        {supported ? 'Yes' : 'No'}
                      </span>
                    </div>
                  )
                })}
                <div className="border-t border-border pt-2 mt-2 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">PQC Support</span>
                    <span
                      className={`font-bold ${selectedDb.pqcSupport === 'ga' ? 'text-status-success' : selectedDb.pqcSupport === 'planned' ? 'text-status-warning' : 'text-status-error'}`}
                    >
                      {selectedDb.pqcSupport === 'ga'
                        ? 'GA'
                        : selectedDb.pqcSupport === 'planned'
                          ? 'Planned'
                          : 'None'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">HSM Integration</span>
                    <span
                      className={`font-bold ${selectedDb.hsmIntegration ? 'text-status-success' : 'text-muted-foreground'}`}
                    >
                      {selectedDb.hsmIntegration ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">FIPS Validated</span>
                    <span
                      className={`font-bold ${selectedDb.fipsValidated ? 'text-status-success' : 'text-muted-foreground'}`}
                    >
                      {selectedDb.fipsValidated ? 'Yes' : 'No'}
                    </span>
                  </div>
                  {selectedDb.pqcTimeline && (
                    <div className="pt-1">
                      <div className="text-[10px] text-muted-foreground">PQC Timeline</div>
                      <div className="text-[10px] text-primary">{selectedDb.pqcTimeline}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
