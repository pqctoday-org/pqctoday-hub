// SPDX-License-Identifier: GPL-3.0-only
import React, { useState } from 'react'
import {
  Layers,
  KeyRound,
  ArrowRightLeft,
  Search,
  BookOpen,
  ChevronRight,
  ArrowRight,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { InlineTooltip } from '@/components/ui/InlineTooltip'
import { ReadingCompleteButton } from '@/components/PKILearning/ReadingCompleteButton'
import { VendorCoverageNotice } from '@/components/PKILearning/common/VendorCoverageNotice'

interface DatabaseEncryptionIntroductionProps {
  onNavigateToWorkshop: () => void
}

interface CollapsibleSectionProps {
  icon: React.ReactNode
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  icon,
  title,
  defaultOpen = false,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <section className="glass-panel p-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 w-full text-left"
      >
        <div className="p-2 rounded-lg bg-primary/10 shrink-0">{icon}</div>
        <h2 className="text-xl font-bold text-gradient flex-1">{title}</h2>
        <ChevronRight
          size={18}
          className={`text-muted-foreground transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-90' : ''}`}
        />
      </button>
      {isOpen && <div className="mt-4 space-y-4 text-sm text-foreground/80">{children}</div>}
    </section>
  )
}

export const DatabaseEncryptionIntroduction: React.FC<DatabaseEncryptionIntroductionProps> = ({
  onNavigateToWorkshop,
}) => {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Section 1 */}
      <CollapsibleSection
        icon={<Layers size={24} className="text-primary" />}
        title="Encryption Layers: TDE, CLE, Field-Level, Queryable"
        defaultOpen
      >
        <p>
          Database encryption is not a single switch &mdash; it is a layered architecture. Each
          layer addresses a different threat model. From outermost to innermost:
        </p>

        <div className="space-y-3">
          <div className="bg-muted/30 rounded-lg p-4 border border-border">
            <div className="text-xs font-bold text-foreground mb-2">
              1. Transparent Data Encryption (TDE) &mdash; Innermost
            </div>
            <p>
              <InlineTooltip term="Transparent Data Encryption (TDE)">TDE</InlineTooltip> encrypts
              database files on disk (data pages, log files, backups) using AES-256. It protects
              against physical theft of storage media or backup exfiltration &mdash; but provides{' '}
              <strong>no protection against a privileged DBA</strong> who has direct database
              access. The database engine decrypts data transparently on read.
            </p>
            <div className="mt-2 text-xs bg-background rounded p-3 border border-border font-mono">
              Threat covered: stolen backup tapes, cloud storage breach, decommissioned disks
              <br />
              Threat NOT covered: DBA with SELECT privilege, memory scraping, SQL injection
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-4 border border-border">
            <div className="text-xs font-bold text-foreground mb-2">
              2. Column-Level Encryption (CLE) &mdash; Middle Layer
            </div>
            <p>
              <InlineTooltip term="Column-Level Encryption (CLE)">CLE</InlineTooltip> encrypts
              specific columns (PAN, SSN, date-of-birth) using per-column keys. In{' '}
              <InlineTooltip term="Always Encrypted">Always Encrypted</InlineTooltip> (SQL Server),
              the Column Master Key (CMK) lives in Azure Key Vault or an HSM &mdash; the database
              engine never sees the plaintext CMK, only the Column Encryption Key (CEK) wrapped by
              it. A DBA querying the column sees only ciphertext.
            </p>
          </div>

          <div className="bg-muted/30 rounded-lg p-4 border border-border">
            <div className="text-xs font-bold text-foreground mb-2">
              3. Field-Level Encryption (FLE) &mdash; Application-Controlled
            </div>
            <p>
              FLE is performed by the application before data reaches the database wire. MongoDB FLE
              1.0/2.0 encrypts document fields client-side; the server stores only ciphertext. Key
              material never leaves the application. This provides the strongest protection but
              limits server-side query capabilities.
            </p>
          </div>

          <div className="bg-muted/30 rounded-lg p-4 border border-border">
            <div className="text-xs font-bold text-foreground mb-2">
              4. Queryable Encryption &mdash; Structured Encryption
            </div>
            <p>
              <InlineTooltip term="Queryable Encryption">Queryable Encryption</InlineTooltip>{' '}
              (MongoDB FLE 2.0, SQL Server{' '}
              <InlineTooltip term="Always Encrypted">Always Encrypted</InlineTooltip> with secure
              enclaves) allows specific query types (equality, range) to execute on encrypted data
              without full decryption. MongoDB uses HMAC-SHA-256 equality tokens and
              order-preserving encryption for range queries. SQL Server uses secure enclaves (VBS or
              SGX) to execute queries on plaintext inside a trusted execution environment.
            </p>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="text-xs font-bold text-foreground mb-2">
            PQC Impact on Encryption Layers
          </div>
          <p className="text-xs text-muted-foreground">
            AES-256 symmetric encryption used at every layer is already quantum-safe (Grover&apos;s
            algorithm reduces effective security to 128 bits &mdash; still above the 112-bit
            minimum). The quantum vulnerability lies entirely in the <strong>key wrapping</strong>{' '}
            layer: RSA-OAEP and ECDH used to protect CMKs, CEKs, and DEKs. Migrating those wrapping
            algorithms to ML-KEM-1024 is the scope of PQC database migration.
          </p>
        </div>
      </CollapsibleSection>

      {/* Section 2 */}
      <CollapsibleSection
        icon={<KeyRound size={24} className="text-primary" />}
        title="BYOK, HYOK, and External PQC Key Managers"
      >
        <p>
          Key ownership architecture determines who can access plaintext key material &mdash; and
          therefore who can decrypt your database. Three models exist, with dramatically different
          PQC readiness:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-status-error/5 rounded-lg p-4 border border-status-error/20">
            <div className="text-xs font-bold text-status-error mb-2">
              Provider-Managed (Weakest)
            </div>
            <p className="text-xs text-muted-foreground">
              Cloud provider generates and stores all key material. PQC migration timeline is
              entirely at the provider&apos;s discretion. No customer control over ML-KEM adoption
              date.
            </p>
          </div>
          <div className="bg-status-warning/5 rounded-lg p-4 border border-status-warning/20">
            <div className="text-xs font-bold text-status-warning mb-2">
              <InlineTooltip term="BYOK">BYOK</InlineTooltip> (Bring Your Own Key)
            </div>
            <p className="text-xs text-muted-foreground">
              Customer generates keys in on-prem HSM, uploads to cloud KMS. Can enforce ML-KEM-1024
              wrapping for CMK import on customer&apos;s own schedule. Cloud KMS must support ML-KEM
              import format (AWS/Azure: planned 2026).
            </p>
          </div>
          <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
            <div className="text-xs font-bold text-primary mb-2">
              <InlineTooltip term="HYOK">HYOK</InlineTooltip> (Hold Your Own Key) — Strongest
            </div>
            <p className="text-xs text-muted-foreground">
              Customer key never leaves on-prem infrastructure. Cloud receives only encrypted{' '}
              <InlineTooltip term="Data Encryption Key (DEK)">DEKs</InlineTooltip>. HYOK with Thales
              CipherTrust or Utimaco HSM supporting PKCS#11 v3.2 is already PQC-ready today &mdash;
              firmware upgrade to enable ML-KEM-1024 mechanism.
            </p>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="text-xs font-bold text-foreground mb-2">PQC BYOK Migration Path</div>
          <div className="space-y-2 text-center font-mono text-xs">
            <div className="p-2 rounded bg-muted border border-border text-foreground">
              Cloud KMS provides ML-KEM public key (ek); Customer generates 256-bit CMK on-prem
            </div>
            <div className="text-muted-foreground">&darr;</div>
            <div className="p-2 rounded bg-primary/10 border border-primary/20 text-primary">
              Run ML-KEM.Encaps(ek) &rarr; shared_secret + KEM ciphertext
            </div>
            <div className="text-muted-foreground">&darr;</div>
            <div className="p-2 rounded bg-muted border border-border text-foreground">
              Wrap 256-bit CMK with shared_secret (AES-KWP); Upload KEM ciphertext + wrapped CMK
            </div>
            <div className="text-muted-foreground">&darr;</div>
            <div className="p-2 rounded bg-muted/50 border border-border text-foreground">
              Cloud KMS: decapsulates to recover shared_secret, unwraps CMK, uses it for DEKs
            </div>
          </div>
        </div>

        <p>
          For regulated industries (financial services under DORA, defense under NSM-8), HYOK with
          on-prem <InlineTooltip term="Column Master Key (CMK)">CMK</InlineTooltip> custody is the
          required architecture. The key lifetime of RSA-2048 wrapped CMKs is approximately
          7&ndash;10 years before harvest-now-decrypt-later attacks become practical. Databases with
          HYOK architecture can upgrade immediately by rotating to ML-KEM-1024 master keys.
        </p>
      </CollapsibleSection>

      {/* Section 3 */}
      <CollapsibleSection
        icon={<ArrowRightLeft size={24} className="text-primary" />}
        title="Online vs Offline Migration, Performance Overhead"
      >
        <p>
          The good news for database PQC migration: AES-256, used to encrypt actual data files, is{' '}
          <strong>already quantum-safe</strong>. The migration effort targets only the DEK wrapping
          algorithm. Oracle and SQL Server both support <strong>online TDE re-keying</strong> with
          zero application downtime.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-status-success/5 rounded-lg p-4 border border-status-success/20">
            <div className="text-xs font-bold text-status-success mb-2">Online Migration</div>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>
                &bull; Oracle:{' '}
                <code className="bg-muted px-1 rounded">ALTER TABLESPACE ... REKEY</code>
              </li>
              <li>
                &bull; SQL Server:{' '}
                <code className="bg-muted px-1 rounded">
                  ALTER DATABASE ENCRYPTION KEY REGENERATE
                </code>
              </li>
              <li>
                &bull; MongoDB: <code className="bg-muted px-1 rounded">rotateMasterKey</code>
              </li>
              <li>&bull; No application downtime; runs in background</li>
              <li>&bull; CPU overhead: 5&ndash;15% during re-encryption window</li>
            </ul>
          </div>
          <div className="bg-status-warning/5 rounded-lg p-4 border border-status-warning/20">
            <div className="text-xs font-bold text-status-warning mb-2">Offline Migration</div>
            <ul className="space-y-1 text-xs text-muted-foreground">
              <li>&bull; Required for PostgreSQL pg_tde (no online rekey yet)</li>
              <li>&bull; MySQL InnoDB: requires ALTER TABLE for each encrypted table</li>
              <li>&bull; Typical maintenance window: 2&ndash;8 hours for 1TB database</li>
              <li>&bull; Rollback by restoring old backup if failure occurs</li>
            </ul>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="text-xs font-bold text-foreground mb-3">
            Key Size Overhead: RSA vs ML-KEM
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-1.5 px-2 text-muted-foreground font-medium">
                    Algorithm
                  </th>
                  <th className="text-right py-1.5 px-2 text-muted-foreground font-medium">
                    Public Key
                  </th>
                  <th className="text-right py-1.5 px-2 text-muted-foreground font-medium">
                    Ciphertext
                  </th>
                  <th className="text-left py-1.5 px-2 text-muted-foreground font-medium">
                    Use Case
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    alg: 'RSA-2048',
                    pub: '256 B',
                    ct: '256 B',
                    use: 'Current TDE DEK wrap',
                    color: 'text-status-error',
                  },
                  {
                    alg: 'ECDH P-256',
                    pub: '64 B',
                    ct: '65 B',
                    use: 'Current CMK exchange',
                    color: 'text-status-error',
                  },
                  {
                    alg: 'ML-KEM-768',
                    pub: '1,184 B',
                    ct: '1,088 B',
                    use: 'Recommended hybrid',
                    color: 'text-primary',
                  },
                  {
                    alg: 'ML-KEM-1024',
                    pub: '1,568 B',
                    ct: '1,568 B',
                    use: 'NSM-8 / CNSA 2.0',
                    color: 'text-primary',
                  },
                ].map((row) => (
                  <tr key={row.alg} className="border-b border-border/50">
                    <td className={`py-1.5 px-2 font-mono font-bold ${row.color}`}>{row.alg}</td>
                    <td className="py-1.5 px-2 text-right text-foreground">{row.pub}</td>
                    <td className="py-1.5 px-2 text-right text-foreground">{row.ct}</td>
                    <td className="py-1.5 px-2 text-muted-foreground">{row.use}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            The ML-KEM ciphertext (stored in KMS metadata per DEK) increases from 256 bytes to 1,568
            bytes &mdash; a 6&times; increase in key metadata storage, not data file size. This
            overhead is negligible relative to multi-TB database sizes.
          </p>
        </div>

        <p>
          The actual data encryption layer uses{' '}
          <InlineTooltip term="Transparent Data Encryption (TDE)">AES-256-XTS</InlineTooltip> or
          AES-256-GCM regardless of classical or PQC key wrapping. Only the KEM ciphertext stored in
          KMS metadata grows. Performance overhead on OLTP query paths is zero after the
          re-encryption window.
        </p>
      </CollapsibleSection>

      {/* Section 4 */}
      <CollapsibleSection
        icon={<Search size={24} className="text-primary" />}
        title="Queryable Encryption Patterns with PQC"
      >
        <p>
          Standard encryption prevents queries on ciphertext &mdash; you cannot{' '}
          <code className="text-xs bg-muted px-1.5 py-0.5 rounded border border-border">
            WHERE encrypted_ssn = :value
          </code>{' '}
          if the field is randomly encrypted. Queryable encryption solves this by using structured
          encryption schemes that preserve query semantics while hiding plaintext values from the
          server.
        </p>

        <div className="space-y-3">
          <div className="bg-muted/30 rounded-lg p-4 border border-border">
            <div className="text-xs font-bold text-foreground mb-2">
              MongoDB FLE 2.0: Queryable Encryption Indexes
            </div>
            <p className="text-xs text-muted-foreground">
              For equality queries, FLE 2.0 stores an HMAC-SHA-256 token of the plaintext alongside
              the ciphertext. The server compares tokens without seeing plaintext. For range
              queries, an order-preserving encryption (OPE) scheme is used for the index &mdash;
              range queries work by comparing encrypted values directly.
            </p>
            <div className="mt-2 text-[10px] bg-background rounded p-2 border border-border font-mono text-muted-foreground">
              PQC Impact: HMAC-SHA-256 is quantum-safe. OPE scheme under PQC review. DEK wrapping
              upgrade path: RSA-OAEP → ML-KEM-1024 (MongoDB 8.x roadmap).
            </div>
          </div>

          <div className="bg-muted/30 rounded-lg p-4 border border-border">
            <div className="text-xs font-bold text-foreground mb-2">
              SQL Server <InlineTooltip term="Always Encrypted">Always Encrypted</InlineTooltip>{' '}
              with Enclaves
            </div>
            <p className="text-xs text-muted-foreground">
              Secure enclaves (VBS/SGX) execute queries on plaintext decrypted inside the enclave.
              The database engine never sees plaintext outside the enclave boundary. Range queries,
              pattern matching, and aggregations are all possible. The enclave attestation uses
              RSA-2048 certificates &mdash; a PQC upgrade point.
            </p>
          </div>

          <div className="bg-status-warning/5 rounded-lg p-4 border border-status-warning/20">
            <div className="text-xs font-bold text-status-warning mb-2">
              PQC Challenge for{' '}
              <InlineTooltip term="Queryable Encryption">Queryable Encryption</InlineTooltip>
            </div>
            <p className="text-xs text-muted-foreground">
              Equality queries are straightforward to make PQC-safe: HMAC-SHA-256 tokens are
              quantum-safe, and DEK wrapping upgrades are independent. Range query encryption is
              harder: order-preserving encryption (OPE) and range-revealing encryption schemes are
              not yet standardized for PQC. Expect formal standards from NIST by 2028 for
              PQC-compatible queryable encryption.
            </p>
          </div>
        </div>
      </CollapsibleSection>

      {/* Section 5 */}
      <CollapsibleSection
        icon={<BookOpen size={24} className="text-primary" />}
        title="GDPR, HIPAA, and Regulatory Requirements"
      >
        <p>
          Multiple regulatory frameworks mandate encryption of sensitive data at rest. The PQC
          transition introduces a &ldquo;state of the art&rdquo; obligation &mdash; as PQC matures,
          failing to adopt it may constitute a regulatory violation.
        </p>

        <div className="space-y-3">
          {[
            {
              framework: 'GDPR Art. 32',
              requirement: '"State of the art" technical measures for personal data.',
              pqcNote:
                'ENISA recommendations will make PQC mandatory for long-lived personal data by 2026. HYOK architecture strongly preferred for GDPR compliance. Databases retaining PII beyond 2030 should prioritize ML-KEM DEK wrapping.',
              color: 'border-primary/30 bg-primary/5',
              labelColor: 'text-primary',
            },
            {
              framework: 'HIPAA § 164.312',
              requirement: 'Encryption and decryption of ePHI at rest.',
              pqcNote:
                'ePHI (medical records, biometrics) may be retained for 50+ years — extreme HNDL risk. Healthcare databases are the highest-priority migration target. HHS has not issued PQC-specific HIPAA guidance yet; NSM-10 applies to federal healthcare.',
              color: 'border-status-warning/30 bg-status-warning/5',
              labelColor: 'text-status-warning',
            },
            {
              framework: 'DORA Art. 9',
              requirement:
                'ICT risk: state-of-the-art cryptographic controls for financial entities.',
              pqcNote:
                'DORA applies from Jan 2025. EBA/ESMA/EIOPA guidelines expected 2026 will specify PQC timelines. Financial databases require HYOK with PQC-capable HSM to satisfy "state of the art" obligations under DORA.',
              color: 'border-status-warning/30 bg-status-warning/5',
              labelColor: 'text-status-warning',
            },
            {
              framework: 'NSM-8 / CNSA 2.0',
              requirement: 'ML-KEM-1024 exclusively for US federal/NSS key establishment by 2033.',
              pqcNote:
                'Databases holding classified data or supporting federal systems must use ML-KEM-1024 DEK wrapping. New capabilities: PQC by 2027. All legacy: PQC-only by 2033. HYOK with FIPS 140-3 Level 3+ HSM mandatory.',
              color: 'border-status-error/30 bg-status-error/5',
              labelColor: 'text-status-error',
            },
          ].map((item) => (
            <div key={item.framework} className={`rounded-lg p-4 border ${item.color}`}>
              <div className={`text-xs font-bold mb-1 ${item.labelColor}`}>{item.framework}</div>
              <div className="text-xs text-foreground mb-2">{item.requirement}</div>
              <div className="text-xs text-muted-foreground">{item.pqcNote}</div>
            </div>
          ))}
        </div>

        <div className="bg-muted/50 rounded-lg p-4 border border-border">
          <div className="text-xs font-bold text-foreground mb-2">
            HNDL Risk Window for Databases
          </div>
          <p className="text-xs text-muted-foreground">
            A database with RSA-2048 wrapped DEKs and customer records retained for 15 years has a
            HNDL exposure window of up to 15 years from first collection. If a CRQC arrives in 2030,
            data collected today could be decrypted by 2030 via harvested ciphertext. Using{' '}
            <InlineTooltip term="BYOK">BYOK</InlineTooltip> or{' '}
            <InlineTooltip term="HYOK">HYOK</InlineTooltip> with ML-KEM wrapping eliminates this
            risk for new data immediately; historical records require re-encryption.
          </p>
        </div>
      </CollapsibleSection>

      <VendorCoverageNotice migrateLayer="Database" />

      {/* Related Modules */}
      <div className="glass-panel p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Related Modules</h3>
        <div className="flex flex-wrap gap-2">
          {[
            { path: '/learn/kms-pqc', label: 'KMS & PQC' },
            { path: '/learn/hsm-pqc', label: 'HSM & PQC' },
            { path: '/learn/crypto-agility', label: 'Crypto Agility' },
            { path: '/learn/secrets-management-pqc', label: 'Secrets Management' },
          ].map((m) => (
            <Link
              key={m.path}
              to={m.path}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs text-primary hover:text-primary/80 bg-primary/10 border border-primary/20 transition-colors"
            >
              <ArrowRight size={10} />
              {m.label}
            </Link>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <button
          onClick={onNavigateToWorkshop}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-black font-bold rounded-lg hover:bg-primary/90 transition-colors"
        >
          Start Workshop <ArrowRight size={18} />
        </button>
        <p className="text-xs text-muted-foreground mt-2">
          Map encryption layers, plan TDE migration, design BYOK architecture, and assess your fleet
          readiness.
        </p>
      </div>

      <ReadingCompleteButton />
    </div>
  )
}
