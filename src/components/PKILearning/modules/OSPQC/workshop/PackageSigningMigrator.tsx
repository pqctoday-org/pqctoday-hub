// SPDX-License-Identifier: AGPL-3.0-only
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
import { KatValidationPanel } from '@/components/shared/KatValidationPanel'
import type { KatTestSpec } from '@/utils/katRunner'
import { Button } from '@/components/ui/button'

const OSPQC_KAT_SPECS: KatTestSpec[] = [
  {
    id: 'os-pkg-sign',
    useCase: 'OS package signing (ML-DSA-65)',
    standard: 'FIPS 204',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/204/final',
    kind: { type: 'mldsa-functional', variant: 65 },
    message: 'RPM header digest: Name=openssl-3.5,Arch=x86_64,SHA256=c4a2b3...',
  },
  {
    id: 'os-ssh-kem',
    useCase: 'SSH key exchange (ML-KEM-768)',
    standard: 'FIPS 203',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/203/final',
    kind: { type: 'mlkem-encap-roundtrip', variant: 768 },
  },
  {
    id: 'os-kernel-hash',
    useCase: 'Kernel module integrity hash',
    standard: 'FIPS 180-4 ACVP',
    referenceUrl: 'https://csrc.nist.gov/pubs/fips/180-4/upd1/final',
    kind: { type: 'sha256-hash', testIndex: 1 },
  },
]

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
      keyAlgorithm: 'ML-DSA-87 + Ed448 hybrid OpenPGP v6 key (ML-DSA-87 signature part, FIPS 204)',
      sigSize: 4627,
      method:
        'additional OpenPGP v6 signature next to the RSA one (RPM 6, Sequoia; Red Hat technology preview). Step 5 is a detached lab example only.',
      steps: [
        {
          id: 'p1',
          step: '1. Generate a hybrid ML-DSA signing key (Sequoia)',
          command:
            '# Based on Red Hat\'s technology-preview procedure for RHEL 10.1:\nsq key generate --own-key --email vendor@example.com --name "Vendor Inc." \\\n  --cipher-suite mldsa87-ed448 --profile rfc9580 --cannot-authenticate \\\n  --cannot-encrypt --expiration=never\nsq key list\n\n# Red Hat\'s article writes the suite as mldsa87 and states that generating\n# primary keys with signing capabilities requires patching sequoia-sq.\n# Upstream sq documents mldsa87-ed448 and mldsa65-ed25519: run\n# sq key generate --help to see what your build accepts.',
          artifact: 'Hybrid ML-DSA-87 + Ed448 OpenPGP v6 key in the Sequoia key store',
        },
        {
          id: 'p2',
          step: '2. Export the public certificate',
          command: 'sq cert export --cert-email vendor@example.com > RPM-PGP-KEY-VENDOR',
          artifact: 'Public certificate (RPM-PGP-KEY-VENDOR) to publish to clients',
        },
        {
          id: 'p3',
          step: '3. Add the signature without removing the RSA one',
          command:
            '# RHEL: copy the macro template and name the key\ncp /usr/share/doc/rpm/macros.rpmsign-sequoia /etc/rpm/\necho "%_gpg_name <key fingerprint>" > ~/.rpmmacros\n\n# Fedora / upstream RPM: use the Sequoia signer instead\n#   %_openpgp_sign sq\n#   %_openpgp_sign_id <key fingerprint>\n\nrpmsign --addsign --rpmv6 mypackage-1.0-1.x86_64.rpm',
          artifact:
            'RPM 6 package carrying the new OpenPGP v6 signature next to its existing signature',
        },
        {
          id: 'p4',
          step: '4. Client verification (RPM 6 required)',
          command:
            "# The client must import the public certificate first:\nrpmkeys --import RPM-PGP-KEY-VENDOR\nrpmkeys -Kv mypackage-1.0-1.x86_64.rpm\n# On an RPM 6-capable system Red Hat's sample output includes a line like:\n#   Header OpenPGP V6 ML-DSA-87+Ed448/SHA512 signature, key fingerprint: ...: OK\n# Systems whose rpm does not understand RPM 6 signatures check only the\n# classical RSA signature, so the PQC signature is not checked there.",
          artifact: 'PQC signature verified only where the client supports it',
        },
        {
          id: 'p5',
          step: '5. Lab only: detached ML-DSA-65 signature',
          command:
            '# No package manager checks this. It shows the signature size and the\n# verification step only; trust depends on how the verifier obtains the\n# public key (use a channel independent of the download) and on the\n# verifier being run by hand or by your own tooling.\nopenssl genpkey -algorithm ML-DSA-65 -out signing-key.pem\nopenssl pkey -in signing-key.pem -pubout -out signing-key-pub.pem\nopenssl pkeyutl -sign -inkey signing-key.pem -rawin \\\n  -in mypackage-1.0-1.x86_64.rpm \\\n  -out mypackage-1.0-1.x86_64.rpm.mldsa65.sig\n\nopenssl pkeyutl -verify -pubin -inkey signing-key-pub.pem -rawin \\\n  -in mypackage-1.0-1.x86_64.rpm \\\n  -sigfile mypackage-1.0-1.x86_64.rpm.mldsa65.sig',
          artifact: 'Detached 3,309-byte ML-DSA-65 signature; verified by hand, not by rpm or dnf',
        },
      ],
    },
    trustChain: [
      {
        level: 'Root CA',
        component: 'OS Vendor Root Key',
        algorithm: 'RSA (current) → hybrid ML-DSA-87 + Ed448 added beside it (Red Hat, RHEL 10.1)',
        notes:
          'Sample model. rpm checks packages against the OpenPGP keys imported into its keyring; this lesson does not describe any vendor’s internal key hierarchy.',
      },
      {
        level: 'Package Signing Key',
        component: 'Repository Signing Certificate',
        algorithm: 'OpenPGP RSA (current) → hybrid ML-DSA + classical key (RPM 6)',
        notes:
          'Signs the packages in the repository. Rotation interval is the operator’s decision; this lesson recommends none.',
      },
      {
        level: 'Package',
        component: 'RPM Signature Header',
        algorithm: 'OpenPGP signature(s) in the RPM header',
        notes:
          'RPM 6 can hold several OpenPGP signatures in one package; a client that understands RPM 6 signatures verifies the PQC signature as well as the RSA one.',
      },
      {
        level: 'User',
        component: 'dnf / rpm verification',
        algorithm: 'OpenPGP keyring verification on install',
        notes:
          'rpmkeys -K (also rpm --checksig) verifies the embedded signatures against the imported public keys.',
      },
    ],
    compatibility: [
      {
        tool: 'RPM 6.0.0 and later (released 22 September 2025)',
        currentSupport: true,
        pqcStatus:
          'Release notes list OpenPGP v6 and PQC keys and signatures and several signatures per package; Sequoia back end (rpm-sequoia 1.9.0 or later to build)',
      },
      {
        tool: 'RHEL 10.1 (RPM 6 backports)',
        currentSupport: true,
        pqcStatus: 'Verifies RPM 6 signatures; signing your own RPMs is a technology preview',
      },
      {
        tool: 'RPM without RPM 6 signature support',
        currentSupport: true,
        pqcStatus: 'Verifies only the classical RSA signature; PQC signature not checked',
      },
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
      method:
        'lab sketch only: detached ML-DSA signature over Release, checked by a separate tool; no apt release is cited as verifying it',
      steps: [
        {
          id: 'p1',
          step: '1. Generate an ML-DSA-65 key (lab)',
          command:
            '# Requires an OpenSSL with ML-DSA support (OpenSSL 3.5 or later):\nopenssl genpkey -algorithm ML-DSA-65 -out archive-signing-key.pem\nopenssl pkey -in archive-signing-key.pem -pubout -out archive-signing-key-pub.pem',
          artifact:
            'ML-DSA-65 key pair for the lab (FIPS 204: 4,032 B secret key, 1,952 B public key)',
        },
        {
          id: 'p2',
          step: '2. Sign Release with a detached signature (lab)',
          command:
            '# This lesson cites no apt release that reads this file. It sits beside\n# the OpenPGP-signed InRelease, which is what apt checks today.\nopenssl pkeyutl -sign -inkey archive-signing-key.pem -rawin \\\n  -in Release -out Release.mldsa65.sig',
          artifact: 'Detached Release.mldsa65.sig (3,309 bytes) next to the unchanged InRelease',
        },
        {
          id: 'p3',
          step: '3. Distribute the public key independently',
          command:
            '# The verifier must get this key over a channel that does not depend on\n# the repository being checked (for example a pinned copy shipped with the\n# OS image). A key fetched from the same mirror proves nothing.\ncp archive-signing-key-pub.pem /secure/channel/ML-DSA-KEY-MyOrg.pem',
          artifact: 'ML-DSA-65 public key distributed outside the repository',
        },
        {
          id: 'p4',
          step: '4. Verify by hand (no apt support cited)',
          command:
            'openssl pkeyutl -verify -pubin -inkey ML-DSA-KEY-MyOrg.pem -rawin \\\n  -in Release -sigfile Release.mldsa65.sig\n\n# apt itself would keep trusting only what its OpenPGP verifier accepts.\n# Switching an archive to ML-DSA needs apt-side verification support;\n# this lesson cites no Debian or Ubuntu release that provides it.',
          artifact: 'Signature checked by the lab command only; apt behaviour unchanged',
        },
      ],
    },
    trustChain: [
      {
        level: 'Root Signing Key',
        component: 'Debian/Ubuntu Archive Key',
        algorithm: 'OpenPGP key (sample: RSA-4096); no post-quantum plan cited in this lesson',
        notes:
          'Sample model. The distribution’s archive key signs the repository metadata; this lesson cites no key rotation cycle or post-quantum target.',
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
        tool: 'apt (InRelease verification)',
        currentSupport: true,
        pqcStatus: 'No ML-DSA verification cited in this lesson; check release notes',
      },
      {
        tool: 'dpkg',
        currentSupport: true,
        pqcStatus: 'No ML-DSA signature verification cited in this lesson',
      },
      {
        tool: 'reprepro',
        currentSupport: true,
        pqcStatus: 'No ML-DSA signing cited in this lesson',
      },
      {
        tool: 'apt-ftparchive',
        currentSupport: true,
        pqcStatus: 'No ML-DSA signing cited in this lesson',
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
          <Button
            variant="ghost"
            onClick={() => setShowPqc(false)}
            className={`px-3 py-1.5 text-xs rounded-l-lg border transition-colors ${
              !showPqc
                ? 'bg-status-warning/10 border-status-warning/30 text-foreground font-bold'
                : 'border-border text-muted-foreground hover:bg-muted/30'
            }`}
          >
            Classical (Current)
          </Button>
          <Button
            variant="ghost"
            onClick={() => setShowPqc(true)}
            className={`px-3 py-1.5 text-xs rounded-r-lg border transition-colors ${
              showPqc
                ? 'bg-primary/10 border-primary/30 text-foreground font-bold'
                : 'border-border text-muted-foreground hover:bg-muted/30'
            }`}
          >
            PQC Migration
          </Button>
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
            <Button
              variant="ghost"
              onClick={() => setExpandedStep(expandedStep === step.id ? null : step.id)}
              className="h-auto whitespace-normal flex items-center justify-between w-full p-4 text-left"
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
            </Button>
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

      <KatValidationPanel
        specs={OSPQC_KAT_SPECS}
        label="OS PQC Known Answer Tests"
        authorityNote="FIPS 203 · FIPS 204 · FIPS 180-4"
      />
    </div>
  )
}
