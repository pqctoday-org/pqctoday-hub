// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { ChevronDown, Sparkles } from 'lucide-react'
import clsx from 'clsx'
import { useNavigate } from 'react-router-dom'
import { Button } from '../ui/button'
import type { LibraryEnrichment } from '../../data/libraryEnrichmentData'

interface DocumentAnalysisProps {
  enrichment: LibraryEnrichment
}

type TagVariant =
  | 'default'
  | 'primary'
  | 'destructive'
  | 'warning'
  | 'info'
  | 'secondary'
  | 'accent'
  | 'tertiary'
  | 'success'

const TAG_STYLES: Record<TagVariant, string> = {
  default: 'bg-muted/30 text-muted-foreground border border-border',
  primary: 'bg-primary/10 text-primary border border-primary/20',
  destructive: 'bg-destructive/10 text-destructive border border-destructive/20',
  warning: 'bg-status-warning/10 text-status-warning border border-status-warning/20',
  info: 'bg-status-info/10 text-status-info border border-status-info/20',
  secondary: 'bg-secondary/10 text-secondary border border-secondary/30',
  accent: 'bg-accent/10 text-accent border border-accent/30',
  tertiary: 'bg-tertiary/10 text-tertiary border border-tertiary/20',
  success: 'bg-status-success/10 text-status-success border border-status-success/20',
}

const FEATURE_ROUTES: Record<string, string> = {
  Timeline: '/timeline',
  Threats: '/threats',
  Compliance: '/compliance',
  Migrate: '/migrate',
  Assess: '/assess',
  Library: '/library',
  Algorithms: '/algorithms',
  Leaders: '/leaders',
  Playground: '/playground',
  'OpenSSL Studio': '/openssl',
  About: '/about',
  'pqc-101': '/learn/pqc-101',
  'quantum-threats': '/learn/quantum-threats',
  'hybrid-crypto': '/learn/hybrid-crypto',
  'crypto-agility': '/learn/crypto-agility',
  'tls-basics': '/learn/tls-basics',
  'vpn-ssh-pqc': '/learn/vpn-ssh-pqc',
  'email-signing': '/learn/email-signing',
  'pki-workshop': '/learn/pki-workshop',
  'kms-pqc': '/learn/kms-pqc',
  'hsm-pqc': '/learn/hsm-pqc',
  'data-asset-sensitivity': '/learn/data-asset-sensitivity',
  'stateful-signatures': '/learn/stateful-signatures',
  'digital-assets': '/learn/digital-assets',
  '5g-security': '/learn/5g-security',
  'digital-id': '/learn/digital-id',
  'entropy-randomness': '/learn/entropy-randomness',
  'merkle-tree-certs': '/learn/merkle-tree-certs',
  qkd: '/learn/qkd',
  'vendor-risk': '/learn/vendor-risk',
  'compliance-strategy': '/learn/compliance-strategy',
  'migration-program': '/learn/migration-program',
  'pqc-risk-management': '/learn/pqc-risk-management',
  'pqc-business-case': '/learn/pqc-business-case',
  'pqc-governance': '/learn/pqc-governance',
  'code-signing': '/learn/code-signing',
  'api-security-jwt': '/learn/api-security-jwt',
  'iot-ot-pqc': '/learn/iot-ot-pqc',
}

function DimensionText({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
        {label}
      </h5>
      <p className="text-sm text-foreground leading-relaxed">{value}</p>
    </div>
  )
}

function DimensionTags({
  label,
  items,
  variant = 'default',
}: {
  label: string
  items: string[]
  variant?: TagVariant
}) {
  return (
    <div>
      <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
        {label}
      </h5>
      <div className="flex flex-wrap gap-1">
        {items.map((item) => (
          <span
            key={item}
            className={clsx(
              'inline-flex items-center px-1.5 py-0.5 rounded text-xs',
              TAG_STYLES[variant]
            )}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

function DimensionBullets({ label, items }: { label: string; items: string[] }) {
  return (
    <div>
      <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
        {label}
      </h5>
      <ul className="space-y-1 pl-4">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-foreground leading-relaxed list-disc">
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function DimensionLinks({
  label,
  items,
  onNavigate,
}: {
  label: string
  items: string[]
  onNavigate: (path: string) => void
}) {
  return (
    <div>
      <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
        {label}
      </h5>
      <div className="flex flex-wrap gap-1">
        {items.map((item) => {
          const route = FEATURE_ROUTES[item]
          if (!route) {
            return (
              <span
                key={item}
                className={clsx(
                  'inline-flex items-center px-1.5 py-0.5 rounded text-xs',
                  TAG_STYLES.primary
                )}
              >
                {item}
              </span>
            )
          }
          return (
            <button
              key={item}
              onClick={() => onNavigate(route)}
              className={clsx(
                'inline-flex items-center px-1.5 py-0.5 rounded text-xs cursor-pointer',
                'hover:opacity-80 transition-opacity underline-offset-2 hover:underline',
                TAG_STYLES.primary
              )}
            >
              {item}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function DimensionSection({
  title,
  isFirst = false,
  children,
}: {
  title: string
  isFirst?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={clsx(!isFirst && 'border-t border-border/30 pt-3')}>
      <h4 className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-2">
        {title}
      </h4>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

export const DocumentAnalysis = ({ enrichment }: DocumentAnalysisProps) => {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const hasCoreAnalysis =
    enrichment.mainTopic ||
    enrichment.keyTakeaways.length > 0 ||
    enrichment.targetAudience.length > 0

  const hasAlgorithmsSecurity =
    enrichment.pqcAlgorithms.length > 0 ||
    enrichment.classicalAlgorithms.length > 0 ||
    enrichment.securityLevels.length > 0

  const hasMigration =
    (enrichment.migrationTimeline && enrichment.migrationTimeline.length > 0) ||
    enrichment.hybridApproaches.length > 0 ||
    enrichment.performanceConsiderations.length > 0 ||
    enrichment.implementationPrereqs.length > 0

  const hasEcosystem =
    enrichment.quantumThreats.length > 0 ||
    enrichment.regionsAndBodies !== null ||
    enrichment.leadersContributions.length > 0 ||
    enrichment.pqcProducts.length > 0 ||
    enrichment.protocols.length > 0 ||
    enrichment.infrastructureLayers.length > 0 ||
    enrichment.standardizationBodies.length > 0 ||
    enrichment.complianceFrameworks.length > 0

  const hasFeatures = enrichment.relevantFeatures.length > 0

  return (
    <div className="glass-panel p-3">
      <Button
        variant="ghost"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full h-auto items-center justify-between px-1 py-1.5"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2 font-semibold text-foreground text-sm">
          <Sparkles size={16} className="text-primary" />
          Document Analysis
        </div>
        <ChevronDown
          size={16}
          className={clsx(
            'text-muted-foreground transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </Button>

      {open && (
        <div className="mt-3 space-y-4 pl-1">
          {hasCoreAnalysis && (
            <DimensionSection title="Core Analysis" isFirst>
              {enrichment.mainTopic && (
                <DimensionText label="Main Topic" value={enrichment.mainTopic} />
              )}
              {enrichment.keyTakeaways.length > 0 && (
                <DimensionBullets label="Key Takeaways" items={enrichment.keyTakeaways} />
              )}
              {enrichment.targetAudience.length > 0 && (
                <DimensionTags
                  label="Target Audience"
                  items={enrichment.targetAudience}
                  variant="info"
                />
              )}
            </DimensionSection>
          )}

          {hasAlgorithmsSecurity && (
            <DimensionSection title="Algorithms & Security" isFirst={!hasCoreAnalysis}>
              {enrichment.pqcAlgorithms.length > 0 && (
                <DimensionTags
                  label="PQC Algorithms"
                  items={enrichment.pqcAlgorithms}
                  variant="primary"
                />
              )}
              {enrichment.classicalAlgorithms.length > 0 && (
                <DimensionTags
                  label="Classical Algorithms"
                  items={enrichment.classicalAlgorithms}
                  variant="warning"
                />
              )}
              {enrichment.securityLevels.length > 0 && (
                <DimensionTags
                  label="Security Levels & Parameters"
                  items={enrichment.securityLevels}
                  variant="tertiary"
                />
              )}
            </DimensionSection>
          )}

          {hasMigration && (
            <DimensionSection
              title="Migration & Implementation"
              isFirst={!hasCoreAnalysis && !hasAlgorithmsSecurity}
            >
              {enrichment.migrationTimeline && enrichment.migrationTimeline.length > 0 && (
                <DimensionTags
                  label="Migration Timeline"
                  items={enrichment.migrationTimeline}
                  variant="warning"
                />
              )}
              {enrichment.hybridApproaches.length > 0 && (
                <DimensionTags
                  label="Hybrid & Transition"
                  items={enrichment.hybridApproaches}
                  variant="success"
                />
              )}
              {enrichment.performanceConsiderations.length > 0 && (
                <DimensionBullets
                  label="Performance & Size"
                  items={enrichment.performanceConsiderations}
                />
              )}
              {enrichment.implementationPrereqs.length > 0 && (
                <DimensionBullets
                  label="Implementation Prerequisites"
                  items={enrichment.implementationPrereqs}
                />
              )}
            </DimensionSection>
          )}

          {hasEcosystem && (
            <DimensionSection
              title="Ecosystem"
              isFirst={!hasCoreAnalysis && !hasAlgorithmsSecurity && !hasMigration}
            >
              {enrichment.quantumThreats.length > 0 && (
                <DimensionTags
                  label="Quantum Threats"
                  items={enrichment.quantumThreats}
                  variant="destructive"
                />
              )}

              {enrichment.regionsAndBodies && (
                <div>
                  <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                    Regions & Bodies
                  </h5>
                  <div className="space-y-1.5">
                    {enrichment.regionsAndBodies.regions.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="text-xs text-muted-foreground mr-1">Regions:</span>
                        {enrichment.regionsAndBodies.regions.map((r) => (
                          <span
                            key={r}
                            className={clsx(
                              'inline-flex items-center px-1.5 py-0.5 rounded text-xs',
                              TAG_STYLES.default
                            )}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    )}
                    {enrichment.regionsAndBodies.bodies.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1">
                        <span className="text-xs text-muted-foreground mr-1">Bodies:</span>
                        {enrichment.regionsAndBodies.bodies.map((b) => (
                          <span
                            key={b}
                            className={clsx(
                              'inline-flex items-center px-1.5 py-0.5 rounded text-xs',
                              TAG_STYLES.info
                            )}
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {enrichment.leadersContributions.length > 0 && (
                <DimensionTags label="Leaders Mentioned" items={enrichment.leadersContributions} />
              )}

              {enrichment.pqcProducts.length > 0 && (
                <DimensionTags label="PQC Products" items={enrichment.pqcProducts} />
              )}

              {enrichment.protocols.length > 0 && (
                <DimensionTags label="Protocols" items={enrichment.protocols} variant="secondary" />
              )}

              {enrichment.infrastructureLayers.length > 0 && (
                <DimensionTags
                  label="Infrastructure Layers"
                  items={enrichment.infrastructureLayers}
                />
              )}

              {enrichment.standardizationBodies.length > 0 && (
                <DimensionTags
                  label="Standardization Bodies"
                  items={enrichment.standardizationBodies}
                  variant="info"
                />
              )}

              {enrichment.complianceFrameworks.length > 0 && (
                <DimensionTags
                  label="Compliance Frameworks"
                  items={enrichment.complianceFrameworks}
                  variant="accent"
                />
              )}
            </DimensionSection>
          )}

          {hasFeatures && (
            <DimensionSection
              title="Explore on PQC Today"
              isFirst={!hasCoreAnalysis && !hasAlgorithmsSecurity && !hasMigration && !hasEcosystem}
            >
              <DimensionLinks
                label="Relevant Features"
                items={enrichment.relevantFeatures}
                onNavigate={navigate}
              />
            </DimensionSection>
          )}
        </div>
      )}
    </div>
  )
}
