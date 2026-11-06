// SPDX-License-Identifier: AGPL-3.0-only
import React, { useState } from 'react'
import { Search, CheckCircle, XCircle, Clock } from 'lucide-react'
import { QUERYABLE_ENCRYPTION_SCHEMES } from '../data/databaseConstants'
import { Button } from '@/components/ui/button'

type QueryType = 'equality' | 'range' | 'prefix' | 'substring' | 'regex' | 'aggregate' | 'groupby'

const QUERY_TYPES: { id: QueryType; label: string }[] = [
  { id: 'equality', label: 'Equality (=)' },
  { id: 'range', label: 'Range (<, >, BETWEEN)' },
  { id: 'prefix', label: 'Prefix (LIKE x%)' },
  { id: 'substring', label: 'Substring (LIKE %x%)' },
  { id: 'regex', label: 'Regular expression' },
  { id: 'aggregate', label: 'Aggregate functions (SUM, AVG)' },
  { id: 'groupby', label: 'GROUP BY' },
]

// 'conditional' = supported only under the version, key-type or enclave condition in the note.
// 'unknown' = not verified against a vendor document here; it is not the same as unsupported.
type CellState = 'yes' | 'conditional' | 'no' | 'unknown'
interface MatrixEntry {
  state: CellState
  label?: string
  note: string
}

const yes = (note: string): MatrixEntry => ({ state: 'yes', note })
const conditional = (label: string, note: string): MatrixEntry => ({
  state: 'conditional',
  label,
  note,
})
const no = (note: string): MatrixEntry => ({ state: 'no', note })
const unknown = (note: string): MatrixEntry => ({ state: 'unknown', note })

const MONGO_STRING_QUERIES =
  'Prefix, suffix and substring queries on string fields: public preview in MongoDB 8.2, generally available in MongoDB 9.0.'
const SQL_LIKE_ENCLAVE =
  'LIKE is supported inside the secure enclave, on enclave-enabled columns that use randomized encryption. Escape characters are not supported in LIKE parameters.'
const ORACLE_UNVERIFIED =
  'Not verified here: no Oracle documentation for this scheme was located. Check Oracle documentation.'
const PG_TDE_NOTE =
  'pg_tde is transparent data encryption that protects data at rest: the storage layer encrypts and decrypts files, so it is not a queryable-encryption scheme.'

// Capabilities depend on product version, key/encryption type and enclave availability.
// Sources: MongoDB manual (Queryable Encryption supported operations; 7.0, 8.0, 8.2 and 9.0
// release notes); Microsoft Learn (Always Encrypted; Always Encrypted with secure enclaves).
const MATRIX: Record<string, Record<QueryType, MatrixEntry>> = {
  'mongodb-fle2': {
    equality: yes('Equality queries on encrypted fields are generally available from MongoDB 7.0.'),
    range: conditional(
      '8.0+',
      '$lt, $lte, $gt and $gte on encrypted fields from MongoDB 8.0. A field is configured for equality or range queries, not both.'
    ),
    prefix: conditional('GA 9.0', MONGO_STRING_QUERIES),
    substring: conditional(
      'GA 9.0',
      `${MONGO_STRING_QUERIES} Query lengths are bounded by schema parameters.`
    ),
    regex: no(
      'Queries that compare an encrypted field to a regular expression always return an error.'
    ),
    aggregate: no(
      'Only $cond, $eq, $ifNull, $in, $let, $literal, $ne and $switch are listed as aggregation expressions on encrypted fields; all other expressions return an error. The $count stage is supported.'
    ),
    groupby: no('$group is documented only for unencrypted fields.'),
  },
  'sqlserver-ae': {
    equality: yes(
      'Deterministic encryption allows point lookups (=, IN) without an enclave. Enclave-enabled columns with randomized encryption also support comparison operators.'
    ),
    range: conditional(
      'Enclave',
      'Comparison operators and BETWEEN need an enclave-enabled column with randomized encryption: VBS enclaves in SQL Server 2019 and later, VBS or Intel SGX enclaves in Azure SQL Database. Intel SGX enclaves reach end of support on October 31, 2027.'
    ),
    prefix: conditional('Enclave', SQL_LIKE_ENCLAVE),
    substring: conditional('Enclave', SQL_LIKE_ENCLAVE),
    regex: unknown(
      'Regular expressions are not among the operations Microsoft lists as supported inside enclaves; not verified here.'
    ),
    aggregate: unknown(
      'SUM, AVG and similar functions are not among the operations Microsoft lists for encrypted columns; not verified here.'
    ),
    groupby: conditional(
      'Cond.',
      'GROUP BY works on deterministically encrypted columns without an enclave. On enclave-enabled columns with randomized encryption it is supported in SQL Server 2022 and Azure SQL Database, not in SQL Server 2019.'
    ),
  },
  'oracle-csqe': {
    equality: unknown(ORACLE_UNVERIFIED),
    range: unknown(ORACLE_UNVERIFIED),
    prefix: unknown(ORACLE_UNVERIFIED),
    substring: unknown(ORACLE_UNVERIFIED),
    regex: unknown(ORACLE_UNVERIFIED),
    aggregate: unknown(ORACLE_UNVERIFIED),
    groupby: unknown(ORACLE_UNVERIFIED),
  },
  'pg-tde': {
    equality: no(PG_TDE_NOTE),
    range: no(PG_TDE_NOTE),
    prefix: no(PG_TDE_NOTE),
    substring: no(PG_TDE_NOTE),
    regex: no(PG_TDE_NOTE),
    aggregate: no(PG_TDE_NOTE),
    groupby: no(PG_TDE_NOTE),
  },
}

const SUPPORTED_STATES: CellState[] = ['yes', 'conditional']

const MatrixCell: React.FC<{ entry?: MatrixEntry }> = ({ entry }) => {
  if (!entry || entry.state === 'unknown')
    return (
      <span
        className="text-muted-foreground text-xs font-bold mx-auto block text-center"
        title={entry?.note}
      >
        Unknown
      </span>
    )
  if (entry.state === 'yes')
    return (
      <CheckCircle
        size={16}
        className="text-status-success mx-auto"
        aria-label="Supported"
        role="img"
      />
    )
  if (entry.state === 'conditional')
    return (
      <span
        className="text-status-warning text-xs font-bold mx-auto block text-center"
        title={entry.note}
      >
        {entry.label}
      </span>
    )
  return (
    <XCircle
      size={16}
      className="text-status-error mx-auto"
      aria-label="Not supported"
      role="img"
    />
  )
}

export const QueryableEncryptionLab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('mongodb-fle2')

  const scheme = QUERYABLE_ENCRYPTION_SCHEMES.find((s) => s.id === activeTab)

  return (
    <div className="space-y-6">
      {/* Tab selector */}
      <div className="flex flex-wrap gap-2">
        {QUERYABLE_ENCRYPTION_SCHEMES.map((s) => (
          <Button
            variant="ghost"
            key={s.id}
            onClick={() => setActiveTab(s.id)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border ${
              activeTab === s.id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground'
            }`}
          >
            {s.name}
          </Button>
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
                  const entry = MATRIX[scheme.id]?.[qt.id]
                  const supported = !!entry && SUPPORTED_STATES.includes(entry.state)
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
                    &darr; Secure enclave (VBS; SGX in Azure SQL)
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
                    Principal Key in an external key provider
                  </div>
                  <div className="text-muted-foreground text-xs">&darr; protects</div>
                  <div className="p-2 rounded bg-primary/10 text-primary text-xs">
                    Internal keys (files: AES-CBC, WAL: AES-CTR)
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
                      <MatrixCell entry={MATRIX[s.id]?.[qt.id]} />
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
            Cells with a label (&ldquo;Enclave&rdquo;, &ldquo;8.0+&rdquo;, &ldquo;GA 9.0&rdquo;,
            &ldquo;Cond.&rdquo;) are supported only under the version, key-type or enclave condition
            in the notes below. &ldquo;Unknown&rdquo; means not verified here, not unsupported;
            check the vendor documentation for your release. &ldquo;
            <Clock size={9} className="inline" />
            &rdquo; = no PQC support is claimed for the scheme; the PQC roadmap notes are this
            module&rsquo;s projection, not vendor statements.
          </p>
          {scheme && (
            <div className="mt-3">
              <div className="text-[10px] font-bold text-foreground mb-1">
                {scheme.name}: conditions per operation
              </div>
              <ul className="space-y-1">
                {QUERY_TYPES.map((qt) => (
                  <li key={qt.id} className="text-[10px] text-muted-foreground">
                    <span className="font-medium text-foreground">{qt.label}:</span>{' '}
                    {MATRIX[scheme.id]?.[qt.id]?.note ?? 'Not verified here.'}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
