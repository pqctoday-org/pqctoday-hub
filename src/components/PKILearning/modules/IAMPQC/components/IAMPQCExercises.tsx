// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Play, BookOpen, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export interface WorkshopConfig {
  step: number
}

interface IAMPQCExercisesProps {
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

export const IAMPQCExercises: React.FC<IAMPQCExercisesProps> = ({
  onNavigateToWorkshop,
  onSetWorkshopConfig,
}) => {
  const navigate = useNavigate()

  const scenarios: Scenario[] = [
    {
      id: 'iam-crypto-audit',
      title: '1. IAM Crypto Audit',
      description:
        'Review all 8 IAM components (SSO, MFA, JWT issuance, SAML IdP, OAuth AS, LDAP, Kerberos KDC, Certificate Auth) and their quantum risk levels. Sort by migration priority to identify your highest-urgency items. Pay attention to the 4 components marked as "Immediate" priority.',
      badge: 'Inventory',
      badgeColor: 'bg-primary/20 text-primary border-primary/50',
      observe:
        'Kerberos KDC, SAML IdP, JWT issuance, and Certificate-Based Auth all show Immediate priority. These use RSA-2048 or ECDSA in long-lived token paths — the highest HNDL targets. Sort by "Priority" to confirm your migration order.',
      config: { step: 0 },
    },
    {
      id: 'token-signing-migration',
      title: '2. Token Signing Migration',
      description:
        'Use the Token Migration Lab to compare RS256, ES256, and the three ML-DSA variants side-by-side. Click "Sign Token" for each algorithm and observe the signature size difference. Note how the JWT header "alg" field changes — and why relying parties need updated JWKS validation.',
      badge: 'Token Signing',
      badgeColor: 'bg-secondary/20 text-secondary border-secondary/50',
      observe:
        'ML-DSA-65 signature (3,309 bytes) is ~13x larger than RS256 (256 bytes) and ~52x larger than ES256 (64 bytes). While signing takes only ~2.1ms (faster than most network round trips), the token size increase can impact HTTP Authorization header limits. Check your load balancer max header size.',
      config: { step: 1 },
    },
    {
      id: 'directory-services-risk',
      title: '3. Directory Services Risk',
      description:
        'Explore the quantum vulnerability analysis for Active Directory, OpenLDAP, and Azure AD / Entra ID. Review the HNDL risk scores and click "Show Scenarios" to understand specific CRQC attack vectors for each directory service.',
      badge: 'Directory',
      badgeColor: 'bg-warning/20 text-warning border-warning/50',
      observe:
        'Active Directory exposes two critical HNDL vectors: PKINIT RSA decryption (Kerberos TGT traffic) and NTLM credential exposure. Microsoft Entra ID uses long-lived refresh tokens (90-day default) signed with RSA-2048, which are at risk under HNDL if intercepted.',
      config: { step: 2 },
    },
    {
      id: 'vendor-evaluation',
      title: '4. Vendor Evaluation',
      description:
        'Review the IAM Vendor PQC Status workshop. For each vendor, inspect the Token Signing, MFA/Attestation, API Security, and Roadmap details. Identify which vendors have GA PQC token signing support today versus which have roadmap commitments only.',
      badge: 'Vendor PQC',
      badgeColor: 'bg-destructive/20 text-destructive border-destructive/50',
      observe:
        "Microsoft Entra ID uses SymCrypt which supports ML-KEM and ML-DSA, and holds FedRAMP High certification. Keycloak (open-source) can be integrated with oqsprovider for PQC signing in self-hosted deployments. Roadmap timelines vary by vendor — check each vendor's public announcements for GA dates.",
      config: { step: 3 },
    },
    {
      id: 'zero-trust-roadmap',
      title: '5. Zero Trust Identity Roadmap',
      description:
        'Assign migration years to each of the five zero trust identity pillars (Identity Verification, Device Trust, Session Management, Authorization, Audit). Generate and export a phased migration roadmap based on your timeline selections.',
      badge: 'Zero Trust',
      badgeColor: 'bg-success/20 text-success border-success/50',
      observe:
        'Session Management (hybrid TLS) can be migrated in 2025-2026 with zero application changes — start here for immediate quantum-safe coverage. Device Trust is the longest lead-time item (hardware replacement cycle); begin planning before 2026 even if deployment is 2027-2028.',
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
          Work through these scenarios to master IAM PQC migration: audit cryptographic exposure,
          migrate token signing, analyze directory services, evaluate vendors, and design a zero
          trust roadmap. Each exercise pre-configures the Workshop &mdash; click &quot;Load &amp;
          Run&quot; to begin.
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
              <button
                onClick={() => handleLoadAndRun(scenario)}
                className="btn btn-primary flex items-center gap-2 px-4 py-2 shrink-0"
              >
                <Play size={14} fill="currentColor" aria-hidden="true" /> Load &amp; Run
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Quiz Link */}
      <div className="glass-panel p-6 border-primary/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen size={24} className="text-primary" aria-hidden="true" />
            <div>
              <h3 className="font-bold text-foreground">Test Your Knowledge</h3>
              <p className="text-sm text-muted-foreground">
                Take the PQC quiz to test what you&apos;ve learned about IAM and PQC migration.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/learn/quiz')}
            className="btn btn-secondary flex items-center gap-2 px-4 py-2"
          >
            Take Quiz <ArrowRight size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}
