// SPDX-License-Identifier: GPL-3.0-only
import { useMemo, useState, type ReactNode } from 'react'
import {
  Info,
  ShieldCheck,
  Database,
  Shield,
  Bot,
  ChevronDown,
  Sparkles,
  ExternalLink,
  Sun,
  Moon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router'
import { cn } from '@/lib/utils'
import { getCurrentVersion, useVersionStore } from '@/store/useVersionStore'
import { useIsEmbedded } from '@/embed/EmbedProvider'
import { useTheme } from '@/hooks/useTheme'
import { securityAuditDate } from '@/data/securityAuditData'
import { timelineData } from '@/data/timelineData'
import { patentsData } from '@/data/patentsData'
import { threatsData } from '@/data/threatsData'
import { leadersData } from '@/data/leadersData'
import {
  DISCUSSIONS_BASE,
  DISCUSSIONS,
  CRYPTO_BUFF_SITES,
  CRYPTO_BUFF_BOOKS,
} from '@/components/About/aboutData'

declare const __BUILD_TIMESTAMP__: string

const SBOM_CATEGORIES = [
  'UI Frameworks & Libraries',
  'Utilities',
  'Cryptography & PQC',
  'Rust WASM Bindings',
  'Rust Crypto Crates',
  'Local AI & Embeddings',
  'State Management',
  'Analytics',
  'Notifications',
  'Build & Development',
  'Testing',
]

type GroupId = 'vision' | 'trust' | 'data' | 'opensource' | 'assistant'

interface GroupDef {
  id: GroupId
  icon: typeof Info
  title: string
  standaloneOnly?: boolean
}

const GROUPS: GroupDef[] = [
  { id: 'vision', icon: Info, title: 'Vision & how it adapts' },
  { id: 'trust', icon: ShieldCheck, title: 'Trust & verification' },
  { id: 'data', icon: Database, title: 'Data & privacy' },
  { id: 'opensource', icon: Shield, title: 'Open source & enterprise' },
  { id: 'assistant', icon: Bot, title: 'Assistant, community & preferences' },
]

/**
 * Mobile About (handoff Phase 7 — README §23 "About / Glossary / Assistant").
 * Glossary and Assistant themselves need no mobile screen — both are already
 * global overlays reused as-is on mobile via getMobilePageActions.ts +
 * MobilePageActionsSheet.tsx (confirmed before writing this file). This
 * screen covers only About's own content, distilled to the "five-section
 * accordion" README §23 asks for, from the REAL 16 sections AboutView.tsx
 * renders (verified by counting `<AboutSection>` JSX call sites — both the
 * README's "fifteen" and the code's own inline comment claiming "15" are
 * stale; 16 is correct). Sections are grouped 3/3/3/3/4, not summarized —
 * every real section keeps its own row inside its group.
 *
 * Reuses real desktop data/hooks verbatim, never re-typed: getCurrentVersion,
 * useVersionStore (What's New / Changelog), useTheme (functional light/dark
 * toggle, not decorative), useIsEmbedded (the same 5 sections AboutView.tsx
 * hides when embedded — cloud-sync, community, enterprise, cryptobuff,
 * appearance — are hidden here too, so a mobile-embedded reader never sees
 * content that assumes a standalone visit), securityAuditDate, and
 * aboutData.ts's own DISCUSSIONS/CRYPTO_BUFF_* arrays.
 *
 * Two real, honest cuts, stated below rather than faked: the SBOM's full
 * per-package list (11 real categories shown, not each dependency) and Data
 * Foundation's async algorithm-CSV count and full 10-dataset grid (4
 * synchronous real counts shown instead — Timeline/Patents/Threats/Community
 * — with the rest stated as cut, not silently dropped).
 */
export function MobileAboutView() {
  const [openGroup, setOpenGroup] = useState<GroupId | null>(null)
  const isEmbedded = useIsEmbedded()
  const { theme, setTheme } = useTheme()
  const version = getCurrentVersion()
  const requestShowWhatsNew = useVersionStore((s) => s.requestShowWhatsNew)

  const timelineEventCount = useMemo(
    () => timelineData.flatMap((c) => c.bodies.flatMap((b) => b.events)).length,
    []
  )
  const lastAudited = securityAuditDate
    ? securityAuditDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'date unavailable'

  const toggle = (id: GroupId) => setOpenGroup((cur) => (cur === id ? null : id))

  return (
    <div className="px-4 pb-4 pt-4">
      <div className="mb-1">
        <h1 className="sr-only">About</h1>
      </div>
      <p className="mb-4 text-[11.5px] leading-relaxed text-muted-foreground">
        v{version} · PQCToday exists to close the gap between the coming quantum-cryptographic
        transition and how ready most organisations actually are.
      </p>

      <div className="flex flex-col gap-2.5">
        {GROUPS.map((group) => {
          const isOpen = openGroup === group.id
          const Icon = group.icon
          return (
            <div key={group.id} className="glass-panel overflow-hidden">
              <Button
                type="button"
                variant="ghost"
                onClick={() => toggle(group.id)}
                aria-expanded={isOpen}
                className="flex h-auto w-full items-center justify-start gap-2.5 rounded-none px-3.5 py-3 text-left"
              >
                <Icon size={17} className="shrink-0 text-primary" aria-hidden="true" />
                <span className="flex-1 text-[13px] font-bold text-foreground">{group.title}</span>
                <ChevronDown
                  size={16}
                  className={cn(
                    'shrink-0 text-muted-foreground transition-transform',
                    isOpen && 'rotate-180'
                  )}
                  aria-hidden="true"
                />
              </Button>

              {isOpen && (
                <div className="flex flex-col gap-3 border-t border-border px-3.5 pb-3.5 pt-3">
                  {group.id === 'vision' && (
                    <>
                      <Row title="Our vision">
                        The algorithms protecting your data today — RSA, ECC, the cryptography
                        behind TLS, SSH and every digital signature — will be broken by quantum
                        computers. Most organisations do not know which systems are vulnerable, and
                        most practitioners have never practiced post-quantum cryptography hands-on.
                      </Row>
                      <Row title="How this hub adapts to you">
                        Telling the hub your role changes which pages lead your navigation, which
                        sections your report opens on, and which progress ladder you climb. It never
                        removes a page — a route you're not offered is still reachable by URL, deep
                        link or search.
                      </Row>
                      <Row title="Release notes">
                        <span className="block text-[11px] text-muted-foreground">
                          Deployed: {__BUILD_TIMESTAMP__}
                        </span>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={requestShowWhatsNew}
                            className="h-8 gap-1.5 text-[11px]"
                          >
                            <Sparkles size={12} aria-hidden="true" />
                            What's new
                          </Button>
                          <Link
                            to="/changelog"
                            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-3 text-[11px] font-semibold text-foreground"
                          >
                            View changelog
                          </Link>
                        </div>
                      </Row>
                    </>
                  )}

                  {group.id === 'trust' && (
                    <>
                      <Row title="Transparency & disclaimer" badge="WIP">
                        This site has not received endorsement from the organisations, standards
                        bodies or agencies it references. Information is sourced publicly and
                        verified through automated and manual review, but may still contain
                        inaccuracies. Leaders are featured only with written consent.
                      </Row>
                      <Row title="Trust Engine">
                        Every fact on PQC Today carries a trust score, a named reviewer, and a link
                        to the original source document — produced by a maintenance pipeline that
                        re-runs whenever a source changes, not a one-time label.
                      </Row>
                      <Row title="Security audit">
                        <span className="font-semibold text-status-success">0 vulnerabilities</span>{' '}
                        (production and dev) — last audited {lastAudited}. OWASP Top 10 compliant:
                        no dangerouslySetInnerHTML/eval/innerHTML, every external link protected
                        against tabnabbing, no hardcoded secrets, CSP configured.
                      </Row>
                    </>
                  )}

                  {group.id === 'data' && (
                    <>
                      <Row title="Platform data">
                        <div className="mt-1 grid grid-cols-2 gap-2">
                          <Stat label="Timeline events" value={timelineEventCount} />
                          <Stat label="Patents tracked" value={patentsData.length} />
                          <Stat label="Threat records" value={threatsData.length} />
                          <Stat label="Community profiles" value={leadersData.length} />
                        </div>
                        <p className="mt-2 text-[10.5px] text-muted-foreground">
                          Plus compliance, library, algorithms, migrate, quiz and sources datasets —
                          the full breakdown is on a laptop.
                        </p>
                      </Row>
                      <Row title="Data privacy">
                        PQC Today is a fully static website — no backend server, no database, no
                        user accounts. Preferences, assessment results and learning progress are
                        stored only in your browser's localStorage and never leave your device
                        unless you opt in to sync. Cryptographic operations run entirely client-side
                        via WebAssembly.
                      </Row>
                      {!isEmbedded && (
                        <Row title="Google Drive sync — privacy terms">
                          Built into the app to back up progress across devices, but{' '}
                          <span className="font-semibold text-foreground">
                            not currently enabled in the interface
                          </span>{' '}
                          — no sign-in control exists today. No personal data is requested; any data
                          would live only in your own Drive's hidden app-data folder.
                        </Row>
                      )}
                    </>
                  )}

                  {group.id === 'opensource' && (
                    <>
                      <Row title="Open source license">
                        Released under{' '}
                        <span className="font-semibold text-foreground">GNU GPLv3</span>. Free to
                        copy, distribute and modify, provided modifications stay under the same
                        license.
                        <div className="mt-2 flex flex-col gap-1.5">
                          <ExternalLinkRow
                            href="https://github.com/pqctoday-org/pqctoday-hub/blob/main/LICENSE"
                            label="View full license"
                          />
                          <ExternalLinkRow
                            href="https://github.com/pqctoday-org/pqctoday-hub"
                            label="View GitHub repository"
                          />
                          <ExternalLinkRow
                            href="https://github.com/sponsors/pqctoday-org"
                            label="Support development"
                          />
                        </div>
                      </Row>
                      <Row title="Software Bill of Materials">
                        Built entirely on open-source software, across {SBOM_CATEGORIES.length} real
                        dependency categories: {SBOM_CATEGORIES.join(', ')}. Full package-level SBOM
                        is on a laptop.
                      </Row>
                      {!isEmbedded && (
                        <Row title="Enterprise">
                          <span className="font-semibold text-foreground">Sandbox</span> — 30+
                          real-world PQC migration scenarios (strongSwan, OpenSSH, HAProxy,
                          PostgreSQL, Hyperledger Besu, Algorand) in isolated Docker containers.{' '}
                          <span className="font-semibold text-foreground">Embedding mode</span> lets
                          organisations integrate tailored sections via a no-code visual designer,
                          gated by a zero-trust ECDSA-signed vendor certificate and a secure
                          postMessage bridge — no coding required.
                        </Row>
                      )}
                    </>
                  )}

                  {group.id === 'assistant' && (
                    <>
                      <Row title="PQC Assistant">
                        Uses Retrieval-Augmented Generation to deliver grounded, sourced answers —
                        searches a curated knowledge corpus, retrieves the most relevant passages,
                        and grounds the model's response with deep links back to the exact page.
                        Runs in cloud mode (Gemini) with your own free API key, or fully local
                        in-browser (Qwen3-8B) — local mode works even in airplane mode and nothing
                        leaves your device.
                      </Row>
                      {!isEmbedded && (
                        <Row title="Community">
                          Join the conversation on GitHub Discussions.
                          <div className="mt-2 flex flex-col gap-1.5">
                            {DISCUSSIONS.slice(0, 2).map((d) => (
                              <ExternalLinkRow
                                key={d.number}
                                href={d.url ?? `${DISCUSSIONS_BASE}${d.number}`}
                                label={d.label}
                              />
                            ))}
                          </div>
                        </Row>
                      )}
                      {!isEmbedded && (
                        <Row title="Cryptography buff">
                          {CRYPTO_BUFF_SITES.length} curated websites & blogs,{' '}
                          {CRYPTO_BUFF_BOOKS.length} essential books — full lists on a laptop.
                        </Row>
                      )}
                      {!isEmbedded && (
                        <Row title="Appearance">
                          <div className="mt-1 flex items-center gap-2 rounded-lg border border-border bg-muted/20 p-1">
                            {(['light', 'dark'] as const).map((t) => (
                              <Button
                                key={t}
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setTheme(t)}
                                aria-pressed={theme === t}
                                className={cn(
                                  'h-8 flex-1 gap-1.5 rounded-md text-[11px] font-semibold capitalize',
                                  theme === t &&
                                    'border border-primary/20 bg-primary/20 text-primary'
                                )}
                              >
                                {t === 'light' ? (
                                  <Sun size={13} aria-hidden="true" />
                                ) : (
                                  <Moon size={13} aria-hidden="true" />
                                )}
                                {t}
                              </Button>
                            ))}
                          </div>
                        </Row>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <p className="mt-4 border-t border-border pt-3 text-[10.5px] leading-relaxed text-muted-foreground">
        The full Content Audit Trail feed, per-package SBOM listing, and complete platform-data grid
        are on a laptop.
      </p>
    </div>
  )
}

function Row({ title, badge, children }: { title: string; badge?: string; children: ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5">
        <h2 className="text-[12px] font-bold text-foreground">{title}</h2>
        {badge && (
          <span className="rounded-full border border-status-warning/40 bg-status-warning/15 px-1.5 py-0.5 text-sim-chip font-bold text-status-warning">
            {badge}
          </span>
        )}
      </div>
      <div className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{children}</div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-muted/30 p-2 text-center">
      <div className="text-[15px] font-extrabold text-gradient">{value.toLocaleString()}</div>
      <div className="text-[9.5px] text-muted-foreground">{label}</div>
    </div>
  )
}

function ExternalLinkRow({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 text-[11px] font-semibold text-primary"
    >
      <ExternalLink size={12} aria-hidden="true" />
      {label}
    </a>
  )
}
