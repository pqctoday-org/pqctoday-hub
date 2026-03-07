// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo } from 'react'
import {
  AlertTriangle,
  Fingerprint,
  Shield,
  Lock,
  Database,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import {
  BIOMETRIC_PROFILES,
  REVOCABILITY_MATRIX,
  REVOCABILITY_COLORS,
  SEVERITY_COLORS,
  type BiometricType,
} from '../data/healthcareConstants'

// ── Helpers ──────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)} KB`
  return `${bytes} B`
}

function formatNumber(n: number): string {
  return n.toLocaleString()
}

const biometricItems = BIOMETRIC_PROFILES.map((p) => ({ id: p.id, label: p.name }))

// ── Component ────────────────────────────────────────────────────────────

export const BiometricVaultAssessor: React.FC = () => {
  const [selectedBiometric, setSelectedBiometric] = useState<BiometricType>('fingerprint')
  const [selectedEncryption, setSelectedEncryption] = useState(0)
  const [selectedStorage, setSelectedStorage] = useState(0)
  const [recordCount, setRecordCount] = useState(10000)
  const [crqcYear, setCrqcYear] = useState(2035)
  const [showRecommendation, setShowRecommendation] = useState(false)

  const profile = useMemo(
    () => BIOMETRIC_PROFILES.find((p) => p.id === selectedBiometric)!,
    [selectedBiometric]
  )

  const encryptionItems = useMemo(
    () => profile.commonEncryption.map((enc, i) => ({ id: String(i), label: enc })),
    [profile]
  )

  const storageItems = useMemo(
    () => profile.storageLocations.map((loc, i) => ({ id: String(i), label: loc })),
    [profile]
  )

  const isVulnerable = useMemo(() => {
    // eslint-disable-next-line security/detect-object-injection
    const enc = profile.commonEncryption[selectedEncryption] || ''
    return (
      enc.includes('RSA') ||
      enc.includes('ECDH') ||
      enc.includes('None') ||
      enc.includes('plaintext')
    )
  }, [profile, selectedEncryption])

  const totalDataAtRisk = useMemo(() => {
    return recordCount * profile.templateSizeBytes
  }, [recordCount, profile])

  const yearsUntilCrqc = useMemo(() => {
    const currentYear = new Date().getFullYear()
    return Math.max(0, crqcYear - currentYear)
  }, [crqcYear])

  // Reset encryption/storage indices when biometric type changes
  const handleBiometricChange = (id: string) => {
    setSelectedBiometric(id as BiometricType)
    setSelectedEncryption(0)
    setSelectedStorage(0)
    setShowRecommendation(false)
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-foreground/80">
        Assess the quantum risk of biometric data in healthcare systems. Biometric identifiers are
        unique because they cannot be revoked or reissued &mdash; once compromised by a quantum
        attack, the breach is permanent.
      </p>

      {/* ── Section 1: Biometric Selector + Config ─────────────────── */}
      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-4">
          <Fingerprint size={16} className="text-primary" />
          <div className="text-sm font-bold text-foreground">Biometric Data Profile</div>
        </div>

        <div className="space-y-4">
          {/* Biometric Type Selector */}
          <div>
            <span className="block text-xs text-muted-foreground mb-1.5">Biometric Type</span>
            <FilterDropdown
              items={biometricItems}
              selectedId={selectedBiometric}
              onSelect={handleBiometricChange}
              defaultLabel="Select biometric type"
              defaultIcon={<Fingerprint size={16} className="text-primary" />}
              noContainer
            />
          </div>

          {/* Profile Description */}
          <div className="bg-muted/30 rounded-lg p-3 border border-border">
            <p className="text-xs text-foreground">{profile.description}</p>
            <div className="flex flex-wrap gap-4 mt-2">
              <div className="flex items-center gap-1.5">
                <Database size={12} className="text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">
                  Template size: {formatBytes(profile.templateSizeBytes)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock size={12} className="text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">
                  Revocability:{' '}
                  <span
                    className={`inline-block rounded px-1 py-0.5 ${REVOCABILITY_COLORS[profile.revocability]}`}
                  >
                    {profile.revocability}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Configuration Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Encryption */}
            <div>
              <span className="block text-xs text-muted-foreground mb-1.5">Current Encryption</span>
              <FilterDropdown
                items={encryptionItems}
                selectedId={String(selectedEncryption)}
                onSelect={(id) => setSelectedEncryption(Number(id))}
                defaultLabel="Select encryption"
                defaultIcon={<Lock size={16} className="text-primary" />}
                noContainer
              />
            </div>

            {/* Storage Location */}
            <div>
              <span className="block text-xs text-muted-foreground mb-1.5">Storage Location</span>
              <FilterDropdown
                items={storageItems}
                selectedId={String(selectedStorage)}
                onSelect={(id) => setSelectedStorage(Number(id))}
                defaultLabel="Select storage"
                defaultIcon={<Database size={16} className="text-primary" />}
                noContainer
              />
            </div>

            {/* Record Count */}
            <div>
              <label htmlFor="record-count" className="block text-xs text-muted-foreground mb-1.5">
                Records in Vault
              </label>
              <input
                id="record-count"
                type="number"
                min={100}
                max={10_000_000}
                step={1000}
                value={recordCount}
                onChange={(e) => setRecordCount(Math.max(100, parseInt(e.target.value) || 100))}
                className="w-full bg-muted border border-border rounded px-3 py-2 text-sm text-foreground"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: HNDL Exposure Calculator ────────────────────── */}
      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} className="text-status-warning" />
          <div className="text-sm font-bold text-foreground">
            Harvest Now, Decrypt Later (HNDL) Exposure
          </div>
        </div>

        <div className="bg-muted/30 rounded-lg p-3 border border-border mb-4">
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} className="text-status-warning shrink-0 mt-0.5" />
            <p className="text-xs text-foreground">
              Biometric data has <span className="font-bold">indefinite retention</span> &mdash; it
              cannot be changed or reissued. Unlike passwords or certificates, a compromised
              biometric is compromised forever.
            </p>
          </div>
        </div>

        {/* CRQC Year Slider */}
        <div className="mb-4">
          <label htmlFor="crqc-year" className="block text-xs text-muted-foreground mb-1.5">
            Estimated CRQC Availability Year
          </label>
          <input
            id="crqc-year"
            type="range"
            min={2030}
            max={2040}
            step={1}
            value={crqcYear}
            onChange={(e) => setCrqcYear(parseInt(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>2030</span>
            <span className="text-sm font-mono text-primary">{crqcYear}</span>
            <span>2040</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1">
            {yearsUntilCrqc > 0
              ? `Approximately ${yearsUntilCrqc} years until a cryptographically relevant quantum computer`
              : 'CRQC may already be available'}
          </p>
        </div>

        {/* Exposure Result */}
        <div
          className={`rounded-lg p-4 border ${
            isVulnerable
              ? 'bg-status-error/10 border-status-error/30'
              : 'bg-status-success/10 border-status-success/30'
          }`}
        >
          <div className="flex items-start gap-3">
            {isVulnerable ? (
              <XCircle size={18} className="text-status-error shrink-0 mt-0.5" />
            ) : (
              <CheckCircle size={18} className="text-status-success shrink-0 mt-0.5" />
            )}
            <div className="space-y-2 flex-1">
              <div className="text-sm font-bold text-foreground">
                {isVulnerable ? 'VULNERABLE to Quantum Attack' : 'Resistant to Quantum Attack'}
              </div>

              {isVulnerable ? (
                <>
                  <p className="text-xs text-foreground">
                    <span className="font-bold font-mono text-status-error">
                      {formatNumber(recordCount)} records
                    </span>{' '}
                    at <span className="font-bold">PERMANENT</span> risk &bull;{' '}
                    {formatBytes(totalDataAtRisk)} of biometric data
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Current encryption (
                    {/* eslint-disable-next-line security/detect-object-injection */}
                    {profile.commonEncryption[selectedEncryption]}) is vulnerable to Shor&apos;s
                    algorithm. Adversaries can harvest encrypted biometric data{' '}
                    <span className="font-medium text-foreground">today</span> and decrypt it when a
                    CRQC becomes available (~{crqcYear}). Since biometric data is irrevocable, the
                    breach window is infinite.
                  </p>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Current encryption (
                  {/* eslint-disable-next-line security/detect-object-injection */}
                  {profile.commonEncryption[selectedEncryption]}) uses symmetric cryptography that
                  is not directly vulnerable to Shor&apos;s algorithm. However, key wrapping and
                  transport layers should still be migrated to PQC.
                </p>
              )}

              {/* Severity Badge */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground">HNDL Severity:</span>
                <span
                  className={`text-[10px] font-bold rounded px-1.5 py-0.5 border ${SEVERITY_COLORS[profile.hndlSeverity]}`}
                >
                  {profile.hndlSeverity.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 3: Revocability Matrix ─────────────────────────── */}
      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={16} className="text-status-error" />
          <div className="text-sm font-bold text-foreground">
            Credential Revocability Comparison
          </div>
        </div>

        <p className="text-xs text-muted-foreground mb-3">
          Unlike passwords or certificates, biometric data cannot be revoked or reissued. This
          matrix compares credential types by their quantum risk and remediation options.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-2 text-muted-foreground font-medium text-xs">
                  Category
                </th>
                <th className="text-left p-2 text-muted-foreground font-medium text-xs hidden sm:table-cell">
                  Examples
                </th>
                <th className="text-center p-2 text-muted-foreground font-medium text-xs">
                  Revocability
                </th>
                <th className="text-left p-2 text-muted-foreground font-medium text-xs hidden md:table-cell">
                  Reissue Cost
                </th>
                <th className="text-left p-2 text-muted-foreground font-medium text-xs">
                  Quantum Impact
                </th>
              </tr>
            </thead>
            <tbody>
              {REVOCABILITY_MATRIX.map((item) => {
                const isBiometric = item.category === 'Biometric Data'
                return (
                  <tr
                    key={item.category}
                    className={`border-b border-border/50 transition-colors ${
                      isBiometric
                        ? 'bg-status-error/10 ring-1 ring-status-error/30 ring-inset'
                        : 'hover:bg-muted/30'
                    }`}
                  >
                    <td className="p-2">
                      <div className="flex items-center gap-1.5">
                        {isBiometric && (
                          <Fingerprint size={12} className="text-status-error shrink-0" />
                        )}
                        <span
                          className={`text-xs font-medium ${
                            isBiometric ? 'text-status-error' : 'text-foreground'
                          }`}
                        >
                          {item.category}
                        </span>
                      </div>
                    </td>
                    <td className="p-2 text-xs text-muted-foreground hidden sm:table-cell">
                      {item.examples.join(', ')}
                    </td>
                    <td className="p-2 text-center">
                      <span
                        className={`text-[10px] font-bold rounded px-1.5 py-0.5 ${REVOCABILITY_COLORS[item.revocability]}`}
                      >
                        {item.revocability}
                      </span>
                    </td>
                    <td className="p-2 text-xs text-muted-foreground hidden md:table-cell">
                      {item.reissueCost}
                    </td>
                    <td className="p-2 text-xs text-foreground">
                      <span className={isBiometric ? 'font-medium text-status-error' : ''}>
                        {item.quantumImpact}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section 4: PQC Recommendation ──────────────────────────── */}
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-status-success" />
            <div className="text-sm font-bold text-foreground">PQC Migration Recommendation</div>
          </div>
          <Button
            variant={showRecommendation ? 'default' : 'gradient'}
            size="sm"
            onClick={() => setShowRecommendation(!showRecommendation)}
            className="text-xs"
          >
            {showRecommendation ? 'Hide' : 'Generate'} Recommendation
          </Button>
        </div>

        {showRecommendation && (
          <div className="space-y-4">
            {/* Algorithm Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* KEM Recommendation */}
              <div className="bg-muted/30 rounded-lg p-3 border border-border">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  Key Encapsulation (KEM)
                </div>
                <div className="text-sm font-bold font-mono text-primary">
                  {profile.pqcRecommendation.kem}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Lock size={10} className="text-status-success" />
                  <span className="text-[10px] text-status-success">
                    Quantum-resistant key exchange
                  </span>
                </div>
              </div>

              {/* Signature Recommendation */}
              <div className="bg-muted/30 rounded-lg p-3 border border-border">
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                  Digital Signature
                </div>
                <div className="text-sm font-bold font-mono text-primary">
                  {profile.pqcRecommendation.signature}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Shield size={10} className="text-status-success" />
                  <span className="text-[10px] text-status-success">
                    Quantum-resistant authentication
                  </span>
                </div>
              </div>
            </div>

            {/* Rationale */}
            <div className="bg-muted/20 rounded-lg p-3 border border-border">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                Rationale
              </div>
              <p className="text-xs text-foreground">{profile.pqcRecommendation.rationale}</p>
            </div>

            {/* Action Summary */}
            <div className="bg-status-success/10 rounded-lg p-3 border border-status-success/30">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                Recommended Actions for {profile.name}
              </div>
              <ul className="space-y-1.5">
                <li className="flex items-start gap-2 text-xs text-foreground">
                  <CheckCircle size={12} className="text-status-success shrink-0 mt-0.5" />
                  <span>
                    Migrate storage encryption key wrapping from{' '}
                    {/* eslint-disable-next-line security/detect-object-injection */}
                    {profile.commonEncryption[selectedEncryption] ||
                      profile.commonEncryption[0]} to {profile.pqcRecommendation.kem}
                  </span>
                </li>
                <li className="flex items-start gap-2 text-xs text-foreground">
                  <CheckCircle size={12} className="text-status-success shrink-0 mt-0.5" />
                  <span>
                    Implement {profile.pqcRecommendation.signature} for enrollment authentication
                    and template integrity verification
                  </span>
                </li>
                <li className="flex items-start gap-2 text-xs text-foreground">
                  <CheckCircle size={12} className="text-status-success shrink-0 mt-0.5" />
                  <span>
                    Re-encrypt {formatNumber(recordCount)} existing records in{' '}
                    {/* eslint-disable-next-line security/detect-object-injection */}
                    {profile.storageLocations[selectedStorage] || profile.storageLocations[0]} with
                    PQC-wrapped keys
                  </span>
                </li>
                <li className="flex items-start gap-2 text-xs text-foreground">
                  <CheckCircle size={12} className="text-status-success shrink-0 mt-0.5" />
                  <span>
                    Prioritize migration before {crqcYear} to close the HNDL exposure window
                  </span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
