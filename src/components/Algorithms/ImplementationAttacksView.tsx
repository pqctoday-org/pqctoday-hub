// SPDX-License-Identifier: GPL-3.0-only
import { ExternalLink, ShieldAlert, Cpu, Zap, KeyRound, Code2, AlertTriangle } from 'lucide-react'
import clsx from 'clsx'
import {
  ATTACK_PROFILES,
  type AttackCategory,
  type AttackSeverity,
} from '@/data/implementationAttackProfiles'

const ATTACK_CATEGORY_META: Record<
  AttackCategory,
  { label: string; icon: React.ElementType; color: string }
> = {
  'side-channel': {
    label: 'Side-Channel',
    icon: Cpu,
    color: 'text-status-error',
  },
  'fault-injection': {
    label: 'Fault Injection',
    icon: Zap,
    color: 'text-status-warning',
  },
  'rng-failure': {
    label: 'RNG Failure',
    icon: KeyRound,
    color: 'text-status-error',
  },
  'secret-handling': {
    label: 'Secret Handling',
    icon: ShieldAlert,
    color: 'text-status-warning',
  },
  'api-misuse': {
    label: 'API/Integration',
    icon: Code2,
    color: 'text-status-info',
  },
}

const SEVERITY_LABELS: Record<AttackSeverity, { label: string; className: string }> = {
  critical: { label: 'Critical', className: 'bg-status-error/90 text-primary-foreground' },
  high: { label: 'High', className: 'bg-status-error/60 text-primary-foreground' },
  medium: { label: 'Medium', className: 'bg-status-warning/70 text-primary-foreground' },
  low: { label: 'Low', className: 'bg-status-warning/40 text-foreground' },
}

function StatusBadge({
  status,
  severity,
}: {
  status: 'yes' | 'no' | 'unknown'
  severity?: AttackSeverity
}) {
  if (status === 'yes' && severity) {
    // eslint-disable-next-line security/detect-object-injection
    const sev = SEVERITY_LABELS[severity]
    return (
      <span
        className={clsx(
          'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium',
          sev.className
        )}
        title={`Severity: ${sev.label}`}
      >
        {sev.label}
      </span>
    )
  }
  if (status === 'yes') {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-status-error/80 text-primary-foreground font-medium">
        Vulnerable
      </span>
    )
  }
  if (status === 'no') {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-status-success/80 text-primary-foreground font-medium">
        Not Found
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
      Unknown
    </span>
  )
}

export const ImplementationAttacksView: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Introductory context */}
      <div className="glass-panel p-4 md:p-6">
        <div className="flex items-start gap-3 p-4 bg-status-warning/10 border border-status-warning/30 rounded-lg">
          <AlertTriangle className="text-status-warning flex-shrink-0 mt-0.5" size={20} />
          <div className="text-sm">
            <p className="font-semibold mb-1 text-foreground">Implementation Attack Evidence</p>
            <p className="text-muted-foreground">
              This tab summarizes known implementation-level attacks on PQC algorithms —
              side-channel leakage, fault injection, RNG failures, and API misuse. These are{' '}
              <span className="font-medium text-foreground">implementation vulnerabilities</span>,
              not weaknesses in the underlying mathematics. Each tile links to peer-reviewed
              research and authoritative sources.
            </p>
          </div>
        </div>
      </div>

      {/* Attack category + severity legend */}
      <div className="glass-panel p-4 space-y-3">
        <div className="flex flex-wrap gap-4 justify-center">
          {Object.entries(ATTACK_CATEGORY_META).map(([key, meta]) => {
            const Icon = meta.icon
            return (
              <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Icon size={14} className={meta.color} />
                <span>{meta.label}</span>
              </div>
            )
          })}
        </div>
        <div className="flex flex-wrap gap-3 justify-center border-t border-border pt-3">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            Severity:
          </span>
          {(
            Object.entries(SEVERITY_LABELS) as [
              AttackSeverity,
              { label: string; className: string },
            ][]
          ).map(([key, sev]) => (
            <span
              key={key}
              className={clsx(
                'inline-flex items-center text-[10px] px-2 py-0.5 rounded-full font-medium',
                sev.className
              )}
            >
              {sev.label}
            </span>
          ))}
          <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full font-medium bg-status-success/80 text-primary-foreground">
            Not Found
          </span>
          <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground">
            Unknown
          </span>
        </div>
      </div>

      {/* Algorithm attack tiles */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {ATTACK_PROFILES.map((profile) => (
          <div
            key={profile.algorithm}
            className="glass-panel p-5 flex flex-col gap-4 hover:border-primary/50 transition-colors border border-border rounded-lg"
          >
            {/* Header */}
            <div>
              <h4 className="font-semibold text-foreground text-base">{profile.algorithm}</h4>
              <span className="text-xs text-muted-foreground">{profile.family}</span>
            </div>

            {/* Attack status grid */}
            <div className="grid grid-cols-1 gap-2">
              {profile.attacks.map((attack) => {
                const meta = ATTACK_CATEGORY_META[attack.category]
                const Icon = meta.icon
                return (
                  <div
                    key={attack.category}
                    className={clsx(
                      'flex items-start gap-2 p-2 rounded-md text-sm',
                      attack.status === 'yes' && 'bg-status-error/5',
                      attack.status === 'unknown' && 'bg-muted/30'
                    )}
                  >
                    <Icon size={14} className={clsx(meta.color, 'mt-0.5 shrink-0')} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-foreground">{meta.label}</span>
                        <StatusBadge status={attack.status} severity={attack.severity} />
                      </div>
                      {attack.detail && (
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          {attack.detail}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Summary */}
            <p className="text-xs text-muted-foreground leading-relaxed border-t border-border pt-3">
              {profile.summary}
            </p>

            {/* Countermeasures */}
            {profile.countermeasures && profile.countermeasures.length > 0 && (
              <div className="bg-status-success/5 border border-status-success/20 rounded-md p-3">
                <span className="text-xs font-semibold text-status-success uppercase tracking-wider block mb-1.5">
                  Countermeasures
                </span>
                <ul className="space-y-1">
                  {profile.countermeasures.map((cm, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <span className="text-status-success mt-0.5 shrink-0">&bull;</span>
                      <span>{cm}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Reference links */}
            <div className="flex flex-col gap-1.5 mt-auto">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                References
              </span>
              {profile.references.map((ref) => (
                <a
                  key={ref.referenceId}
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-1.5 text-xs text-accent hover:text-primary transition-colors group"
                  title={ref.title}
                >
                  <ExternalLink
                    size={12}
                    className="shrink-0 mt-0.5 opacity-60 group-hover:opacity-100"
                  />
                  <span className="line-clamp-2">{ref.title}</span>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
