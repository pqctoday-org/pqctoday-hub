// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Play, BookOpen, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export interface WorkshopConfig {
  step: number
}

interface OSPQCExercisesProps {
  onNavigateToWorkshop: () => void
  onSetWorkshopConfig?: (config: WorkshopConfig) => void
}

interface Scenario {
  id: string
  title: string
  description: string
  badge: string
  badgeColor: string
  observe: string
  config: WorkshopConfig
}

export const OSPQCExercises: React.FC<OSPQCExercisesProps> = ({
  onNavigateToWorkshop,
  onSetWorkshopConfig,
}) => {
  const navigate = useNavigate()

  const scenarios: Scenario[] = [
    {
      id: 'os-crypto-audit',
      title: '1. OS Crypto Audit',
      description:
        'Perform a complete OS-level cryptographic component inventory. Review all 8 system components — from system TLS and SSH daemon to the container runtime — and identify which are critical risk vs. easy wins. Use the risk and effort filters to prioritize your migration roadmap.',
      badge: 'Inventory',
      badgeColor: 'bg-primary/20 text-primary border-primary/50',
      observe:
        'System TLS and SSH daemon are both Critical risk but only Medium effort to migrate — making them the highest-ROI first steps. Package signing is High risk AND High effort, requiring ecosystem coordination. Note the 2 "Easy Win" components that benefit automatically from system TLS migration.',
      config: { step: 0 },
    },
    {
      id: 'system-tls-policy',
      title: '2. System TLS Policy Migration',
      description:
        'Configure system-wide PQC TLS policy for RHEL, Ubuntu, and Windows Server. Compare the classical cipher priority list with the PQC-enabled configuration. Toggle between before/after views to see the exact configuration changes needed for each OS. Observe how X25519MLKEM768 is added as the preferred TLS 1.3 KEM group.',
      badge: 'TLS',
      badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
      observe:
        'RHEL requires update-crypto-policies --set FUTURE (experimental, disables TLS 1.2). Ubuntu only needs a Groups= line in openssl.cnf — no TLS 1.2 disruption. Windows Server 2025 already has X25519MLKEM768 enabled by default via KB5036893 — zero configuration needed.',
      config: { step: 1 },
    },
    {
      id: 'ssh-migration',
      title: '3. SSH Host Key Migration',
      description:
        'Walk through the 4-step SSH host key migration wizard: generate an ML-DSA-65 host key, update sshd_config to advertise both classical and PQC keys, update client known_hosts, and verify client compatibility. Check the client compatibility matrix to understand which SSH clients support the new ssh-mldsa65 key type.',
      badge: 'SSH',
      badgeColor: 'bg-warning/20 text-warning border-warning/50',
      observe:
        'ML-DSA-65 host keys are 1,952 bytes public / 3,309 bytes signature — vs Ed25519 at 32 bytes / 64 bytes. As of March 2026, no production SSH client supports ssh-mldsa65 — all clients fall back to Ed25519. ML-KEM hybrid key exchange (sntrup761x25519) is already available in OpenSSH 8.5+ stable for session encryption.',
      config: { step: 2 },
    },
    {
      id: 'package-signing',
      title: '4. Package Signing Migration',
      description:
        'Compare RPM and DEB package signing workflows between classical GPG (RSA-4096) and PQC (ML-DSA-65). Step through each signing and verification command for both formats. Examine the repository trust chain from root signing key down to individual package verification.',
      badge: 'Packages',
      badgeColor: 'bg-destructive/20 text-destructive border-destructive/50',
      observe:
        'GPG RSA-4096 signatures are 512 bytes; ML-DSA-65 signatures are 3,309 bytes — a 6.5x increase. Package signing requires coordinated infrastructure upgrades (signing server, repo metadata format, package manager client, end-user systems). This is why package signing lags 2-3 years behind system TLS migration.',
      config: { step: 3 },
    },
    {
      id: 'fips-compatibility',
      title: '5. FIPS Compatibility Check',
      description:
        'Analyze FIPS 140-3 module status and PQC algorithm inclusion across all 4 major OS platforms. Identify which platforms have ML-KEM and ML-DSA in their FIPS-validated modules. Design a hybrid FIPS + PQC strategy for regulated environments that need both compliance and quantum resistance.',
      badge: 'FIPS',
      badgeColor: 'bg-success/20 text-success border-success/50',
      observe:
        'Windows Server 2025 (SymCrypt 103.4.0) is the only platform with ML-KEM in a FIPS 140-3 validated module today. RHEL 9 FIPS mode blocks ML-KEM. The recommended approach: keep FIPS for regulated workloads, use dual-provider config for new PQC services, then consolidate when RHEL 10/Ubuntu 26.04 FIPS PQC modules are certified.',
      config: { step: 4 },
    },
  ]

  const handleLoadAndRun = (scenario: Scenario) => {
    onSetWorkshopConfig?.(scenario.config)
    onNavigateToWorkshop()
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="glass-panel p-6">
        <h2 className="text-xl font-bold text-gradient mb-2">Guided Exercises</h2>
        <p className="text-muted-foreground text-sm">
          Work through these scenarios to master OS-level PQC migration — from crypto component
          inventory to FIPS compatibility analysis. Each exercise pre-configures the Workshop
          &mdash; click &quot;Load &amp; Run&quot; to begin.
        </p>
      </div>

      <div className="space-y-4">
        {scenarios.map((scenario) => (
          <div key={scenario.id} className="glass-panel p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <h3 className="text-lg font-bold text-foreground">{scenario.title}</h3>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded border font-bold ${scenario.badgeColor}`}
                  >
                    {scenario.badge}
                  </span>
                </div>
                <p className="text-sm text-foreground/80 mb-2">{scenario.description}</p>
                <p className="text-xs text-muted-foreground">
                  <strong>What to observe:</strong> {scenario.observe}
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={() => handleLoadAndRun(scenario)}
                className="btn btn-primary flex items-center gap-2 px-4 py-2 shrink-0"
              >
                <Play size={14} fill="currentColor" /> Load &amp; Run
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Quiz Link */}
      <div className="glass-panel p-6 border-primary/20">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BookOpen size={24} className="text-primary" />
            <div>
              <h3 className="font-bold text-foreground">Test Your Knowledge</h3>
              <p className="text-sm text-muted-foreground">
                Take the PQC quiz to test what you&apos;ve learned about OS-level PQC migration.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate('/learn/quiz')}
            className="btn btn-secondary flex items-center gap-2 px-4 py-2 shrink-0"
          >
            Take Quiz <ArrowRight size={14} />
          </Button>
        </div>
      </div>
    </div>
  )
}
