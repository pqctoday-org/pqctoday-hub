// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Play, BookOpen, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export interface WorkshopConfig {
  step: number
}

interface DatabaseEncryptionExercisesProps {
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

export const DatabaseEncryptionExercises: React.FC<DatabaseEncryptionExercisesProps> = ({
  onNavigateToWorkshop,
  onSetWorkshopConfig,
}) => {
  const navigate = useNavigate()

  const scenarios: Scenario[] = [
    {
      id: 'encryption-layer-map',
      title: '1. Encryption Layer Coverage',
      description:
        'Use the Encryption Layer Mapper to compare Oracle Database 23ai vs PostgreSQL encryption coverage. Switch between databases using the dropdown. Observe which layers are supported and identify the PQC upgrade path for each supported layer.',
      badge: 'Layers',
      badgeColor: 'bg-primary/20 text-primary border-primary/50',
      observe:
        'Oracle supports 3 layers (TDE + Column + Application) while PostgreSQL only has TDE via pg_tde and application-layer encryption. Oracle has HSM integration and FIPS validation; PostgreSQL does not. Both use RSA-OAEP for DEK wrapping — both need ML-KEM-1024 upgrade.',
      config: { step: 0 },
    },
    {
      id: 'tde-migration-plan',
      title: '2. TDE Migration Step-by-Step',
      description:
        "Walk through all 6 TDE migration steps for SQL Server. Pay attention to Step 3 (Master Key Rotation) and Step 4 (Online Re-Encryption). Switch to MongoDB at Step 4 to see how rotateMasterKey differs from SQL Server's ALTER DATABASE ENCRYPTION KEY command.",
      badge: 'Migration',
      badgeColor: 'bg-status-warning/20 text-status-warning border-status-warning/50',
      observe:
        'Step 4 (Online Re-Encryption) has "High Risk" rating despite zero downtime — because a failure mid-migration leaves the database in a dual-key state requiring careful recovery. Both Oracle and SQL Server support online migration; PostgreSQL requires offline maintenance window.',
      config: { step: 1 },
    },
    {
      id: 'byok-architecture',
      title: '3. HYOK vs BYOK PQC Readiness',
      description:
        'Compare all three key ownership patterns in the BYOK Architecture Designer. Start with Provider-Managed (30% score), then compare to BYOK (65%), and finally HYOK (90%). Study the architecture diagram for each — especially how ML-KEM-1024 is used differently in BYOK vs HYOK.',
      badge: 'Architecture',
      badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
      observe:
        'HYOK achieves 90% PQC readiness because the ML-KEM key pair lives in the customer HSM — the cloud provider never has access to the plaintext master key. BYOK scores 65% because the cloud KMS temporarily holds the unwrapped CMK in HSM memory during operations, creating a brief exposure window.',
      config: { step: 2 },
    },
    {
      id: 'queryable-encryption',
      title: '4. Queryable Encryption Compatibility Matrix',
      description:
        'Review the Query Compatibility Matrix in the Queryable Encryption Lab. Compare MongoDB FLE 2.0 vs SQL Server Always Encrypted vs pg_tde. Focus on the PQC compatibility column and understand why pg_tde shows all zeros in the matrix.',
      badge: 'Queryable',
      badgeColor: 'bg-status-success/20 text-status-success border-status-success/50',
      observe:
        'pg_tde shows no queryable encryption support because it is a TDE-only solution — all queries run on plaintext after block-level decryption. MongoDB FLE 2.0 supports equality + range + prefix queries on encrypted fields, making it the most capable queryable encryption solution today, though PQC support is still planned.',
      config: { step: 3 },
    },
    {
      id: 'readiness-assessment',
      title: '5. Fleet Readiness Assessment',
      description:
        'Complete the Migration Readiness Checklist. Start by checking all Inventory items, then review the Technical items. Observe how the Priority Gaps section highlights unchecked Critical items. Note the migration complexity table at the bottom.',
      badge: 'Readiness',
      badgeColor: 'bg-destructive/20 text-destructive border-destructive/50',
      observe:
        'The three Critical inventory items (crypto audit, DEK hierarchy documentation, external KMS) are prerequisites for all technical work. Oracle 23ai and SQL Server are rated "High" complexity — they require firmware upgrades and external KMS setup. MySQL rates "Medium" due to lack of HSM integration.',
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
          Work through these scenarios to master database encryption layers, TDE migration
          procedures, BYOK/HYOK key ownership design, and fleet readiness assessment. Each exercise
          pre-configures the Workshop &mdash; click &ldquo;Load &amp; Run&rdquo; to begin.
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
              <button
                onClick={() => handleLoadAndRun(scenario)}
                className="btn btn-primary flex items-center gap-2 px-4 py-2 shrink-0"
              >
                <Play size={14} fill="currentColor" /> Load &amp; Run
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Quiz link */}
      <div className="glass-panel p-6 border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen size={24} className="text-primary" />
            <div>
              <h3 className="font-bold text-foreground">Test Your Knowledge</h3>
              <p className="text-sm text-muted-foreground">
                Take the PQC quiz to test what you&apos;ve learned about database encryption and
                quantum-safe key management.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/learn/quiz')}
            className="btn btn-secondary flex items-center gap-2 px-4 py-2"
          >
            Take Quiz <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
