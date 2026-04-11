// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Play, BookOpen, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export interface WorkshopConfig {
  step: number
}

interface HsmPqcExercisesProps {
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

export const HsmPqcExercises: React.FC<HsmPqcExercisesProps> = ({
  onNavigateToWorkshop,
  onSetWorkshopConfig,
}) => {
  const navigate = useNavigate()

  const scenarios: Scenario[] = [
    {
      id: 'pkcs11-keygen',
      title: '1. PKCS#11 Key Generation — Generate ML-KEM-768 keypair and compare buffer sizes',
      description:
        'In the PKCS#11 Simulator workshop, step through the key generation operation. Observe the C_GenerateKeyPair call with CKM_ML_KEM_KEY_PAIR_GEN mechanism. Compare the 1,184-byte ML-KEM-768 public key against the 256-byte RSA-2048 public key in the classical comparison section.',
      badge: 'KEM',
      badgeColor: 'bg-primary/20 text-primary border-primary/50',
      observe:
        'The ML-KEM-768 public key (1,184 bytes) is 4.6x larger than RSA-2048 (256 bytes). Applications using fixed-size buffers will need updating. The private key never leaves the HSM boundary — CKA_SENSITIVE=TRUE and CKA_EXTRACTABLE=FALSE are enforced.',
      config: { step: 0 },
    },
    {
      id: 'ml-dsa-signing',
      title: '2. ML-DSA Signing in HSM — Sign and verify with ML-DSA-65',
      description:
        'Continue through the PKCS#11 Simulator to the signing operations (Steps 5-6). Observe the C_Sign and C_Verify calls using CKM_ML_DSA. Note the hedged signing output and the 3,309-byte signature size. Expand the on-prem vs cloud notes to see vendor support status.',
      badge: 'Signing',
      badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
      observe:
        'ML-DSA-65 signatures are 3,309 bytes (vs 64 bytes for ECDSA P-256 — a 51x increase). Hedged signing mode (rnd != 0) is enabled by default in all production HSMs for side-channel protection per FIPS 204 section 3.5.2.',
      config: { step: 0 },
    },
    {
      id: 'vendor-selection',
      title: '3. Vendor Selection — Given requirements, identify matching vendors',
      description:
        'Open the Vendor Comparison workshop. Filter vendors by "production" status. For a regulated financial institution requiring FIPS 140-3 Level 3 and ML-KEM + ML-DSA support, identify which vendors meet those criteria. Expand each vendor row to check hybrid support and side-channel countermeasures.',
      badge: 'Vendor',
      badgeColor: 'bg-warning/20 text-warning border-warning/50',
      observe:
        'Thales Luna 7 and Entrust nShield 5 both have FIPS 140-3 Level 3 certification and GA ML-KEM + ML-DSA support. Entrust nShield 5 also supports SLH-DSA (all 12 param sets, native PKCS#11) and LMS/XMSS via the PQSDK C API — covering the full CNSA 2.0 signature suite. Crypto4A QxHSM supports all algorithms with FPGA-based crypto-agility.',
      config: { step: 1 },
    },
    {
      id: 'on-prem-vs-cloud',
      title: '4. On-Prem vs Cloud HSM — Compare deployment for a regulated institution',
      description:
        'In the Vendor Comparison workshop, filter to show all vendors and compare on-prem vs cloud types. Examine which cloud HSMs support native PKCS#11 PQC mechanisms versus SDK-only access. Consider a scenario where the institution needs ML-KEM encapsulation for TLS key exchange.',
      badge: 'Deployment',
      badgeColor: 'bg-success/20 text-success border-success/50',
      observe:
        'No cloud HSM currently supports native PKCS#11 ML-KEM encapsulation in firmware. AWS CloudHSM offers ML-DSA preview via SDK only. For ML-KEM key exchange, an on-prem HSM (Thales, Entrust, Utimaco, or Crypto4A) is required today. Azure Dedicated HSM uses the same Thales Luna 7 hardware and gains full PQC once firmware is upgraded via Azure Support.',
      config: { step: 1 },
    },
    {
      id: 'firmware-migration',
      title: '5. Firmware Migration Planning — Plan upgrade for 10 HSMs with zero downtime',
      description:
        'Open the Migration Planner workshop. Select Thales Luna 7 as your vendor. Walk through all 4 phases: Assessment, Firmware Planning, Key Migration, and Validation. For a fleet of 10 HSMs, calculate total migration time using the dual-partition strategy where classical and PQC partitions run in parallel.',
      badge: 'Migration',
      badgeColor: 'bg-primary/20 text-primary border-primary/50',
      observe:
        'With Thales Luna 7 (low complexity, 30-60 min/HSM), a rolling upgrade of 10 HSMs takes approximately 5-10 hours. The dual-partition strategy allows classical operations to continue during migration. No FIPS recertification is needed since existing FIPS 140-3 covers PQC firmware.',
      config: { step: 2 },
    },
    {
      id: 'fips-readiness',
      title: '6. FIPS 140-3 Readiness Check — Walk through CMVP validation checklist',
      description:
        'Open the FIPS Validation Tracker workshop. Filter by "Active" status to see which vendors have achieved PQC validation. Compare ACVP algorithm-level certifications vs FIPS 140-3 module-level certifications. Check which algorithms have the most validations across vendors.',
      badge: 'FIPS',
      badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
      observe:
        'LMS has the most ACVP validations across vendors (Thales, Entrust, Utimaco, AWS). Full FIPS 140-3 module-level PQC validation is still limited to Thales Luna 7. Entrust nShield 5 has submitted for FIPS 140-3 but is pending. Algorithm-level ACVP validation is a prerequisite for module-level FIPS 140-3.',
      config: { step: 3 },
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
          Work through these scenarios to understand PKCS#11 PQC operations, HSM vendor selection,
          firmware migration planning, and FIPS validation. Each exercise pre-configures the
          Workshop &mdash; click &quot;Load &amp; Run&quot; to begin.
        </p>
      </div>

      <div className="space-y-4">
        {scenarios.map((scenario) => (
          <div key={scenario.id} className="glass-panel p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen size={24} className="text-primary" />
            <div>
              <h3 className="font-bold text-foreground">Test Your Knowledge</h3>
              <p className="text-sm text-muted-foreground">
                Take the PQC quiz to test what you&apos;ve learned about HSM operations and PQC
                integration.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate('/learn/quiz')}
            className="btn btn-secondary flex items-center gap-2 px-4 py-2"
          >
            Take Quiz <ArrowRight size={14} />
          </Button>
        </div>
      </div>
    </div>
  )
}
