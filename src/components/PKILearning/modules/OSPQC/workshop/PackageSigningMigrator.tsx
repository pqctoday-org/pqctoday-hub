// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState } from 'react'
import {
  Package,
  Shield,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
} from 'lucide-react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { PACKAGE_FORMATS } from '../data/osConstants'

type PackageType = 'rpm' | 'deb'

interface SigningWorkflow {
  id: string
  type: PackageType
  title: string
  currentFlow: {
    steps: Array<{ id: string; step: string; command: string; artifact: string }>
    keyAlgorithm: string
    sigSize: number
  }
  pqcFlow: {
    steps: Array<{ id: string; step: string; command: string; artifact: string }>
    keyAlgorithm: string
    sigSize: number
    method: string
  }
  trustChain: Array<{ level: string; component: string; algorithm: string; notes: string }>
  compatibility: Array<{ tool: string; currentSupport: boolean; pqcStatus: string }>
}

const SIGNING_WORKFLOWS: Record<PackageType, SigningWorkflow> = {
  rpm: {
    id: 'rpm',
    type: 'rpm',
    title: 'RPM Package Signing (RHEL / Fedora)',
    currentFlow: {
      keyAlgorithm: 'GPG RSA-4096',
      sigSize: 512,
      steps: [
        {
          id: 's1',
          step: '1. Generate signing key',
          command: 'gpg --gen-key\n# Select: RSA-4096, no expiry\n# Key ID: ABC12345',
          artifact: 'GPG RSA-4096 key pair (~/.gnupg/)',
        },
        {
          id: 's2',
          step: '2. Export public key for repo',
          command:
            'gpg --export --armor ABC12345 > RPM-GPG-KEY-MyOrg\nsudo rpm --import RPM-GPG-KEY-MyOrg',
          artifact: 'ASCII-armored public key (RPM-GPG-KEY-MyOrg)',
        },
        {
          id: 's3',
          step: '3. Sign RPM package',
          command:
            'rpm --addsign --key-id ABC12345 mypackage-1.0-1.x86_64.rpm\n# Or in bulk:\nrpm-sign --key-id ABC12345 *.rpm',
          artifact: 'Signed RPM with embedded GPG signature',
        },
        {
          id: 's4',
          step: '4. User verification (dnf)',
          command:
            'dnf install mypackage  # Auto-verifies GPG signature\n# Or manually:\nrpm --checksig mypackage-1.0-1.x86_64.rpm',
          artifact: 'Signature verified before install',
        },
      ],
    },
    pqcFlow: {
      keyAlgorithm: 'ML-DSA-65 (FIPS 204)',
      sigSize: 3309,
      method: 'sigstore-style detached ML-DSA signature OR libgcrypt PQC patch',
      steps: [
        {
          id: 'p1',
          step: '1. Generate ML-DSA-65 signing key',
          command:
            '# Option A: OpenSSL 3.5+ with ML-DSA support\nopenssl genpkey -algorithm mldsa65 -out signing-key.pem\nopenssl pkey -in signing-key.pem -pubout -out signing-key-pub.pem\n\n# Option B: libgcrypt PQC patch (experimental)\ngpg --expert --gen-key\n# Select: ML-DSA-65 (if patched libgcrypt)',
          artifact: 'ML-DSA-65 key pair (PEM files, 4,032 B private / 1,952 B public)',
        },
        {
          id: 'p2',
          step: '2. Create detached signature per RPM',
          command:
            '# Compute SHA-256 of RPM, sign with ML-DSA-65:\nopenssl pkeyutl -sign \\\n  -inkey signing-key.pem \\\n  -in <(sha256sum mypackage-1.0-1.x86_64.rpm | awk \'{print $1}\') \\\n  -out mypackage-1.0-1.x86_64.rpm.mldsa65.sig\n\n# Bundle signature + public key fingerprint:\njq -n --arg sig $(base64 -w0 *.sig) \\\n   --arg pub $(openssl pkey -in signing-key.pem -pubout -outform DER | base64 -w0) \\\n   \'{"algorithm":"ml-dsa-65","signature":$sig,"pubkey":$pub}\' \\\n   > mypackage-1.0-1.x86_64.rpm.pqcsig',
          artifact: 'Detached .mldsa65.sig file (3,309 bytes) alongside RPM',
        },
        {
          id: 'p3',
          step: '3. Publish public key to repo',
          command:
            '# Publish to distribution server:\ncp signing-key-pub.pem /var/www/html/repo/ML-DSA-KEY-MyOrg.pem\n\n# Update repo metadata (createrepo_c):\ncreaterepo_c --pqc-key ML-DSA-KEY-MyOrg.pem /var/www/html/repo/',
          artifact: 'ML-DSA-65 public key published to repository',
        },
        {
          id: 'p4',
          step: '4. Client verification (custom plugin)',
          command:
            "# DNF PQC verification plugin (future dnf 5.x target):\ndnf install mypackage  # Will verify ML-DSA sig via dnf plugin\n\n# Manual verification until dnf plugin is available:\nopenssl pkeyutl -verify \\\n  -pubin -inkey signing-key-pub.pem \\\n  -sigfile mypackage-1.0-1.x86_64.rpm.mldsa65.sig \\\n  -in <(sha256sum mypackage-1.0-1.x86_64.rpm | awk '{print $1}')",
          artifact: 'ML-DSA signature verified; package installed',
        },
      ],
    },
    trustChain: [
      {
        level: 'Root CA',
        component: 'OS Vendor Root Key',
        algorithm: 'RSA-4096 (current) → ML-DSA-87 (future)',
        notes:
          'Red Hat signs intermediate signing keys with root. Migration to ML-DSA-87 in RHEL 11 roadmap.',
      },
      {
        level: 'Package Signing Key',
        component: 'Repository Signing Certificate',
        algorithm: 'GPG RSA-4096 (current) → ML-DSA-65 (2027+)',
        notes: 'Signs all packages in the repository. Monthly rotation recommended.',
      },
      {
        level: 'Package',
        component: 'RPM Signature Header',
        algorithm: 'GPG RSA-4096 detached sig embedded in RPM header',
        notes: 'Each RPM contains the detached signature in its header section.',
      },
      {
        level: 'User',
        component: 'dnf / rpm verification',
        algorithm: 'GPG keyring verification on install',
        notes: 'rpm --checksig verifies embedded signature against imported public keys.',
      },
    ],
    compatibility: [
      { tool: 'dnf (RHEL 9)', currentSupport: true, pqcStatus: 'No native PQC; plugin needed' },
      {
        tool: 'rpm v4.19+',
        currentSupport: true,
        pqcStatus: 'Pluggable backend — ML-DSA experimental',
      },
      { tool: 'rpm v4.18', currentSupport: true, pqcStatus: 'GPG only — no PQC' },
      { tool: 'createrepo_c 1.x', currentSupport: true, pqcStatus: 'PQC metadata planned for 2.x' },
    ],
  },
  deb: {
    id: 'deb',
    type: 'deb',
    title: 'DEB Package Signing (Debian / Ubuntu)',
    currentFlow: {
      keyAlgorithm: 'GPG RSA-4096 (InRelease signing)',
      sigSize: 512,
      steps: [
        {
          id: 's1',
          step: '1. Generate archive signing key',
          command:
            'gpg --full-generate-key\n# Select: RSA-4096, 2-year expiry\n# Key ID: DEADBEEF12345678',
          artifact: 'GPG RSA-4096 key pair (~/.gnupg/)',
        },
        {
          id: 's2',
          step: '2. Sign repository InRelease file',
          command:
            'cd /var/www/apt-repo\ncreateapt . DEADBEEF12345678\n# or with reprepro:\nreprepro -V -b /var/www/apt-repo export',
          artifact: 'Signed InRelease file (repo metadata + GPG signature)',
        },
        {
          id: 's3',
          step: '3. Add key to apt keyring',
          command:
            '# Distribute public key:\ncurl -fsSL https://repo.example.com/GPG-KEY | \\\n  gpg --dearmor | \\\n  sudo tee /etc/apt/keyrings/myrepo.gpg\n\n# Reference in sources.list:\necho "deb [signed-by=/etc/apt/keyrings/myrepo.gpg] https://repo.example.com stable main" \\\n  | sudo tee /etc/apt/sources.list.d/myrepo.list',
          artifact: 'GPG key added to apt trusted keyring',
        },
        {
          id: 's4',
          step: '4. User installation (apt)',
          command:
            'sudo apt update  # Verifies InRelease GPG signature\nsudo apt install mypackage  # Verifies package checksum from InRelease',
          artifact: 'InRelease verified → package checksums verified → package installed',
        },
      ],
    },
    pqcFlow: {
      keyAlgorithm: 'ML-DSA-65 (FIPS 204)',
      sigSize: 3309,
      method: 'InRelease ML-DSA signature via GnuPG PQC extension (DEP-18)',
      steps: [
        {
          id: 'p1',
          step: '1. Generate ML-DSA-65 archive key',
          command:
            '# Using OpenSSL 3.5+ ML-DSA support:\nopenssl genpkey -algorithm mldsa65 -out archive-signing-key.pem\n\n# Or via future GnuPG PQC extension:\ngpg --expert --gen-key\n# Select: ML-DSA-65 (requires libgcrypt 2.0+ with PQC support)',
          artifact: 'ML-DSA-65 key pair for InRelease signing',
        },
        {
          id: 'p2',
          step: '2. Sign InRelease with ML-DSA',
          command:
            '# Future apt-ftparchive with PQC support:\napt-ftparchive --pqc-sign=mldsa65 release . > InRelease\n\n# Current workaround — append ML-DSA detached sig:\ncat Release | openssl pkeyutl -sign \\\n  -inkey archive-signing-key.pem \\\n  > Release.mldsa65.sig\n\n# Bundle:\ncat InRelease Release.mldsa65.sig > InRelease.pqc',
          artifact: 'InRelease with appended ML-DSA-65 signature block',
        },
        {
          id: 'p3',
          step: '3. Distribute ML-DSA public key',
          command:
            'openssl pkey -in archive-signing-key.pem -pubout \\\n  -out ML-DSA-KEY-MyOrg.pem\n\n# apt sources configuration (future):\necho "deb [signed-by=/etc/apt/keyrings/myrepo-mldsa65.pem \\\n  arch=amd64] https://repo.example.com stable main" \\\n  | sudo tee /etc/apt/sources.list.d/myrepo-pqc.list',
          artifact: 'ML-DSA-65 public key published and configured in apt sources',
        },
        {
          id: 'p4',
          step: '4. Client verification (apt PQC plugin)',
          command:
            '# apt 3.x target (Ubuntu 26.04 LTS planned):\nsudo apt update  # Verifies InRelease ML-DSA signature via apt PQC plugin\n\n# Manual verification (until apt native support):\nopenssl pkeyutl -verify \\\n  -pubin -inkey ML-DSA-KEY-MyOrg.pem \\\n  -sigfile Release.mldsa65.sig \\\n  -in Release',
          artifact: 'ML-DSA signature verified; repository trusted; packages installed',
        },
      ],
    },
    trustChain: [
      {
        level: 'Root Signing Key',
        component: 'Debian/Ubuntu Archive Key',
        algorithm: 'GPG RSA-4096 (current) → ML-DSA-87 (Ubuntu 28.04 LTS target)',
        notes: 'Distro root key signs repository. Debian has 5-year key rotation cycle.',
      },
      {
        level: 'Repository InRelease',
        component: 'APT Repository Metadata',
        algorithm: 'GPG RSA-4096 inline signature in InRelease',
        notes: 'InRelease contains signed hash of Packages.gz. APT verifies on apt update.',
      },
      {
        level: 'Package Checksums',
        component: 'SHA-256 in Packages.gz',
        algorithm: 'SHA-256 hash (not a signature — integrity only)',
        notes: 'Package files are hashed, not individually signed. Trust flows from InRelease.',
      },
      {
        level: 'User',
        component: 'apt / dpkg',
        algorithm: 'InRelease GPG verification + SHA-256 checksum',
        notes:
          'apt verifies InRelease signature, then validates package checksums against Packages.gz.',
      },
    ],
    compatibility: [
      {
        tool: 'apt 2.x (Ubuntu 24.04)',
        currentSupport: true,
        pqcStatus: 'GPG only; PQC planned in apt 3.x',
      },
      { tool: 'dpkg 1.22+', currentSupport: true, pqcStatus: 'No native PQC sig verification' },
      {
        tool: 'reprepro 5.x',
        currentSupport: true,
        pqcStatus: 'GPG only; PQC upstream proposal open',
      },
      {
        tool: 'apt-ftparchive',
        currentSupport: true,
        pqcStatus: 'GPG only; PQC in Ubuntu 26.04 roadmap',
      },
    ],
  },
}

export const PackageSigningMigrator: React.FC = () => {
  const [pkgType, setPkgType] = useState<PackageType>('rpm')
  const [showPqc, setShowPqc] = useState(false)
  const [expandedStep, setExpandedStep] = useState<string | null>('s1')

  const workflow = SIGNING_WORKFLOWS[pkgType]
  const currentFlow = showPqc ? workflow.pqcFlow : workflow.currentFlow
  const steps = showPqc ? workflow.pqcFlow.steps : workflow.currentFlow.steps

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-wrap items-center gap-3">
        <FilterDropdown
          items={[
            { id: 'rpm', label: 'RPM (RHEL / Fedora)' },
            { id: 'deb', label: 'DEB (Debian / Ubuntu)' },
          ]}
          selectedId={pkgType}
          onSelect={(id) => {
            if (id !== 'All') setPkgType(id as PackageType)
          }}
          label="Package Format"
          defaultLabel="Select Format"
          noContainer
        />

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs text-muted-foreground">View:</span>
          <button
            onClick={() => setShowPqc(false)}
            className={`px-3 py-1.5 text-xs rounded-l-lg border transition-colors ${
              !showPqc
                ? 'bg-status-warning/10 border-status-warning/30 text-foreground font-bold'
                : 'border-border text-muted-foreground hover:bg-muted/30'
            }`}
          >
            Classical (Current)
          </button>
          <button
            onClick={() => setShowPqc(true)}
            className={`px-3 py-1.5 text-xs rounded-r-lg border transition-colors ${
              showPqc
                ? 'bg-primary/10 border-primary/30 text-foreground font-bold'
                : 'border-border text-muted-foreground hover:bg-muted/30'
            }`}
          >
            PQC Migration
          </button>
        </div>
      </div>

      {/* Signing method badge */}
      <div className="glass-panel p-4">
        <div className="flex items-center gap-3">
          <Package size={20} className="text-primary shrink-0" />
          <div>
            <div className="text-sm font-bold text-foreground">{workflow.title}</div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {showPqc ? (
                <>
                  <span className="text-primary font-bold">PQC: </span>
                  {currentFlow.keyAlgorithm} &mdash; {currentFlow.sigSize.toLocaleString()} byte
                  signatures &mdash; Method: {workflow.pqcFlow.method}
                </>
              ) : (
                <>
                  <span className="text-status-warning font-bold">Classical: </span>
                  {currentFlow.keyAlgorithm} &mdash; {currentFlow.sigSize.toLocaleString()} byte
                  signatures
                </>
              )}
            </div>
          </div>
          {showPqc ? (
            <CheckCircle size={16} className="text-status-success ml-auto" />
          ) : (
            <AlertTriangle size={16} className="text-status-warning ml-auto" />
          )}
        </div>
      </div>

      {/* Signing workflow steps */}
      <div className="space-y-2">
        {steps.map((step) => (
          <div key={step.id} className="glass-panel overflow-hidden">
            <button
              onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
              className="flex items-center justify-between w-full p-4 text-left"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-2 py-0.5 rounded border font-bold ${
                    showPqc
                      ? 'bg-primary/10 text-primary border-primary/20'
                      : 'bg-muted text-muted-foreground border-border'
                  }`}
                >
                  {step.step.split('.')[0]}
                </span>
                <span className="text-sm font-medium text-foreground">
                  {step.step.split('. ')[1]}
                </span>
              </div>
              {expandedStep === step.id ? (
                <ChevronUp size={16} className="text-muted-foreground shrink-0" />
              ) : (
                <ChevronDown size={16} className="text-muted-foreground shrink-0" />
              )}
            </button>
            {expandedStep === step.id && (
              <div className="px-4 pb-4 space-y-3">
                <pre className="text-[11px] bg-background p-3 rounded border border-border overflow-x-auto font-mono whitespace-pre text-foreground">
                  {step.command}
                </pre>
                <div className="flex items-center gap-2 text-xs">
                  <Shield size={12} className="text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Artifact: <span className="text-foreground">{step.artifact}</span>
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Trust chain */}
      <div className="glass-panel p-4">
        <div className="text-sm font-bold text-foreground mb-3">Repository Trust Chain</div>
        <div className="space-y-2">
          {workflow.trustChain.map((level, idx) => (
            <div key={level.level} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className="w-7 h-7 rounded-full flex items-center justify-center bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary shrink-0">
                  {idx + 1}
                </div>
                {idx < workflow.trustChain.length - 1 && (
                  <div className="w-0.5 h-3 bg-border mt-1" />
                )}
              </div>
              <div className="flex-1 bg-muted/30 rounded-lg p-3 border border-border min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-foreground">{level.level}</span>
                  <span className="text-[10px] text-muted-foreground">{level.component}</span>
                </div>
                <div className="text-[10px] font-mono text-primary mb-1">{level.algorithm}</div>
                <p className="text-[10px] text-muted-foreground">{level.notes}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tool compatibility */}
      <div className="glass-panel p-4">
        <div className="text-sm font-bold text-foreground mb-3">
          Package Manager PQC Support Status
        </div>
        <div className="space-y-2">
          {workflow.compatibility.map((tool) => (
            <div
              key={tool.tool}
              className="flex items-center gap-3 p-3 bg-muted/30 rounded border border-border"
            >
              <div className="flex-1">
                <div className="text-xs font-medium text-foreground">{tool.tool}</div>
                <div className="text-[10px] text-muted-foreground">{tool.pqcStatus}</div>
              </div>
              <div>
                {tool.pqcStatus.includes('No') || tool.pqcStatus.includes('only') ? (
                  <AlertTriangle size={14} className="text-status-warning" />
                ) : (
                  <Clock size={14} className="text-status-info" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PACKAGE_FORMATS reference */}
      <div className="glass-panel p-4">
        <div className="text-sm font-bold text-foreground mb-3">Ecosystem Status Summary</div>
        <div className="space-y-3">
          {PACKAGE_FORMATS.map((fmt) => (
            <div key={fmt.id} className="bg-muted/30 rounded-lg p-3 border border-border">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-foreground">{fmt.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded border font-bold ${
                    fmt.status === 'production'
                      ? 'text-status-success bg-status-success/10 border-status-success/30'
                      : fmt.status === 'experimental'
                        ? 'text-status-warning bg-status-warning/10 border-status-warning/30'
                        : 'text-status-info bg-status-info/10 border-status-info/30'
                  }`}
                >
                  {fmt.status}
                </span>
              </div>
              <div className="text-[10px] text-muted-foreground mb-1">
                Current: <span className="text-foreground font-mono">{fmt.currentSigningAlgo}</span>
              </div>
              <div className="text-[10px] text-primary">PQC path: {fmt.pqcMigrationPath}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
