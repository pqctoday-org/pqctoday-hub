// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Play, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface WorkshopConfig {
  step: number
}

interface ExercisesProps {
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

export const CryptoDevAPIsExercises: React.FC<ExercisesProps> = ({
  onNavigateToWorkshop,
  onSetWorkshopConfig,
}) => {
  const scenarios: Scenario[] = [
    {
      id: 'api-selection',
      title: '1. API Selection — Choose the right crypto API for a PQC-enabled payment gateway',
      description:
        'In the API Architecture Explorer (Step 1), compare JCA/JCE and OpenSSL EVP APIs. Your payment gateway needs: cross-platform support, PKCS#11 HSM integration, and ML-DSA signing for transaction authorization. Which API scores higher for HSM integration? Which has better PQC readiness?',
      badge: 'Architecture',
      badgeColor: 'bg-primary/20 text-primary border-primary/50',
      observe:
        'JCA/JCE via JCProv and OpenSSL via PKCS#11 engine both achieve HSM integration, but through different paths. OpenSSL scores higher on PQC readiness (native oqsprovider), while JCA/JCE has broader Java ecosystem integration. For a Java-native stack, JCA+JCProv+BouncyCastle is optimal. For a C/C++ gateway, OpenSSL+oqsprovider is the clear winner.',
      config: { step: 0 },
    },
    {
      id: 'language-choice',
      title:
        '2. Language Choice — Select the safest language for a cryptographic key management service',
      description:
        'Open the Language Ecosystem Comparator (Step 2). You are building a key management service that handles ML-KEM key generation, wrapping, and distribution. Compare Rust, Java, and Go on: memory safety, crypto ecosystem, FFI capability, and compile-time guarantees. Which language minimizes the risk of key material exposure?',
      badge: 'Languages',
      badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
      observe:
        "Rust's ownership model and borrow checker prevent use-after-free on key buffers at compile time; the pqcrypto and aws-lc-rs crates provide PQC support. In Java, the JVM's garbage collector means key material may persist in memory longer before collection, though Bouncy Castle's zero-copy APIs reduce exposure. Go's garbage collector is non-deterministic for key cleanup, and compile-time memory guarantees are not provided by the language.",
      config: { step: 1 },
    },
    {
      id: 'provider-pattern',
      title: '3. Provider Pattern — Implement algorithm-agile signing across 3 APIs',
      description:
        'In the Provider Pattern Workshop (Step 3), select the "Sign" operation. Compare how JCA/JCE, OpenSSL, and PKCS#11 all implement ML-DSA-65 signing. Note how the provider registration pattern differs in each. What is the common abstraction that enables algorithm-agile code?',
      badge: 'Patterns',
      badgeColor: 'bg-status-success/20 text-status-success border-status-success/50',
      observe:
        'All three APIs use a two-phase pattern: (1) register/configure the provider at startup, (2) use algorithm-agnostic operations at runtime. JCA uses Security.addProvider() + Signature.getInstance("ML-DSA-65", "BC"). OpenSSL uses OSSL_PROVIDER_load() + EVP_PKEY_sign(). PKCS#11 uses C_Initialize() + CK_MECHANISM {CKM_ML_DSA_65, NULL, 0}. In all cases, the business logic (sign this buffer) is identical — only initialization differs.',
      config: { step: 2 },
    },
    {
      id: 'pqc-library-selection',
      title:
        '4. PQC Library — Choose the right open-source PQC library for a regulated fintech app',
      description:
        'In the PQC Library Explorer (Step 5), filter by FIPS Status: "Validated". Your fintech app processes payment card data (PCI DSS), needs ML-KEM and ML-DSA support, and must be FIPS 140-3 validated. Compare the available options. Which library best satisfies all three constraints?',
      badge: 'Libraries',
      badgeColor: 'bg-status-warning/20 text-status-warning border-status-warning/50',
      observe:
        "AWS-LC (Amazon's FIPS-validated fork) is the best fit: FIPS 140-3 validated, ML-KEM-768 in the FIPS module, Java bindings via aws-lc-rs-java. wolfSSL is also FIPS-validated and has ML-KEM support, making it a strong alternative especially for embedded POS terminal code. BoringSSL's \"BoringCrypto\" FIPS module is validated but limited to Google's internal use case.",
      config: { step: 4 },
    },
    {
      id: 'support-matrix',
      title: '5. Support Matrix — Identify PQC gaps for a cross-vendor PKI migration',
      description:
        'In the PQC Support Matrix (Step 6), look for cells showing "Planned" or "N/A" status. Your PKI uses Windows CNG for CA signing and PKCS#11 for HSM key storage. You need ML-DSA and ML-KEM support. Identify which API/algorithm combinations are gaps and what temporary mitigations exist.',
      badge: 'Matrix',
      badgeColor: 'bg-status-error/20 text-status-error border-status-error/50',
      observe:
        'Windows CNG shows "Planned" for both ML-DSA and ML-KEM — meaning your CA signing stack needs a mitigation. Options: (1) Use OpenSSL or Bouncy Castle as an intermediate layer for PQC operations while CNG handles classical key storage. (2) Deploy an oqsprovider-enabled OpenSSL as the CA signing backend with PKCS#11 for key storage (decoupled from CNG). PKCS#11 v3.2 shows "Experimental" — choose an HSM vendor with confirmed v3.2 support (Thales Luna 10.x).',
      config: { step: 5 },
    },
    {
      id: 'migration-wizard',
      title: '6. Migration Decision Lab — Plan a Java RSA codebase migration to ML-DSA',
      description:
        'In the Migration Decision Lab (Step 8), use the Decision Wizard. Select: Java/Kotlin → JCA/JCE → No HSM required → Compliance: SOC 2 → Timeline: 12 months. Follow the wizard to your recommended migration path. Then click "Migration Paths" and examine the before/after code examples.',
      badge: 'Migration',
      badgeColor: 'bg-status-info/20 text-status-info border-status-info/50',
      observe:
        'The wizard recommends the "Add Bouncy Castle Provider" path: minimal code changes, production-ready PQC support immediately. The before code uses Signature.getInstance("SHA256withRSA") hardcoded; the after code reads the algorithm from configuration and uses a factory pattern. The critical insight: crypto agility is not about changing one line — it\'s about factoring algorithm selection out of business logic entirely.',
      config: { step: 7 },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="glass-panel p-4">
        <h3 className="font-bold text-foreground mb-2">Guided Exercises</h3>
        <p className="text-muted-foreground text-sm">
          Each exercise guides you through a realistic scenario using the interactive workshop
          steps. Work through them in order for the best learning progression, or jump to the
          scenario most relevant to your current project.
        </p>
      </div>

      {scenarios.map((scenario) => (
        <div key={scenario.id} className="glass-panel p-6">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <h3 className="font-bold text-foreground">{scenario.title}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${scenario.badgeColor}`}>
                  {scenario.badge}
                </span>
              </div>

              <p className="text-sm text-muted-foreground mb-4">{scenario.description}</p>

              <div className="bg-muted/30 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-sm text-foreground mb-2">What to Observe</h4>
                <p className="text-sm text-muted-foreground">{scenario.observe}</p>
              </div>

              <Button
                variant="ghost"
                onClick={() => {
                  if (onSetWorkshopConfig) {
                    onSetWorkshopConfig(scenario.config)
                  }
                  onNavigateToWorkshop()
                }}
                className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/30 rounded-lg hover:bg-primary/20 transition-colors text-sm font-medium"
              >
                <Play size={16} />
                Open Workshop Step {scenario.config.step + 1}
                <ArrowRight size={14} />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
