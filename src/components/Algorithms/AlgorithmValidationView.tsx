// SPDX-License-Identifier: GPL-3.0-only
import { lazy, Suspense, useEffect, useState } from 'react'
import { ShieldAlert, FlaskConical, ChevronDown, Grid3x3 } from 'lucide-react'
import clsx from 'clsx'
import { Button } from '@/components/ui/button'
import { usePersonaStore } from '@/store/usePersonaStore'
import { ImplementationAttacksView } from './ImplementationAttacksView'
import { KATView } from './KATView'
import { getAlgorithmDefaults, type AlgorithmSectionId } from '@/data/personaConfig'
import { DeepLinkNotice } from '@/components/common/DeepLinkNotice'
import { useScrollToDeepLinkTarget, deepLinkSelector } from '@/hooks/useScrollToDeepLinkTarget'
import { matchAttackProfile } from './attackDeepLink'

// WS-C C-6: the public coverage matrix + open-gaps register. Lazy — it fetches
// its own generated JSON and only mounts when the section is opened.
const CoverageMatrixView = lazy(() =>
  import('./CoverageMatrixView').then((m) => ({ default: m.CoverageMatrixView }))
)

type ValidationSection = AlgorithmSectionId | 'coverage'

const isSection = (v: string | null | undefined): v is ValidationSection =>
  v === 'attacks' || v === 'kat' || v === 'coverage'

interface AlgorithmValidationViewProps {
  /** `?section=` value from the URL — deep-link wins over the persona default. */
  sectionParam?: string | null
  /** `?attack=` — an algorithm name/id; opens Implementation Attacks at its profile. */
  attackParam?: string | null
  /** `?engine=` / `?case=` — passed through to the coverage matrix. */
  engineParam?: string | null
  caseParam?: string | null
  /** URL writer (replace). Omitted → the view keeps its state locally. */
  onUpdateParams?: (updates: Record<string, string | null>) => void
}

/**
 * "Validation" tab — houses the two interactive reference views that used to be
 * buried as the 5th/6th accordion sections of the Detailed Comparison tab:
 * Implementation Attacks (side-channel / fault reference) and KAT Validation
 * (live in-browser known-answer-test vectors). Each is a collapsible section so
 * the heavy KAT runner only mounts when opened. Which sections open by default
 * comes from ALGORITHM_PERSONA_DEFAULTS.openSections (researcher: both), plus
 * the `?section=kat` deep link (e.g. the Entry Strip's "Run a live test" CTA).
 */
export function AlgorithmValidationView({
  sectionParam,
  attackParam,
  engineParam,
  caseParam,
  onUpdateParams,
}: AlgorithmValidationViewProps = {}) {
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const attackProfile = matchAttackProfile(attackParam)
  const [open, setOpen] = useState<Set<ValidationSection>>(() => {
    const defaults = new Set<ValidationSection>(getAlgorithmDefaults(selectedPersona).openSections)
    if (isSection(sectionParam)) defaults.add(sectionParam)
    if (attackParam) defaults.add('attacks')
    return defaults
  })

  // Same-route navigation (Back/Forward, an in-app link) changes ?section /
  // ?attack without remounting — open the named section then too.
  useEffect(() => {
    const want: ValidationSection | null = isSection(sectionParam)
      ? sectionParam
      : attackParam
        ? 'attacks'
        : null
    if (!want) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- URL→state sync
    setOpen((prev) => (prev.has(want) ? prev : new Set(prev).add(want)))
  }, [sectionParam, attackParam])

  // Scroll to the linked section — but not when the reader just toggled it
  // here (their click already put it where they are looking).
  const [selfWrittenSection, setSelfWrittenSection] = useState<string | null>(null)
  const scrollSection =
    isSection(sectionParam) && !attackParam && selfWrittenSection !== sectionParam
      ? sectionParam
      : null
  useScrollToDeepLinkTarget(
    scrollSection ? `section|${scrollSection}` : null,
    scrollSection ? deepLinkSelector(`validation-${scrollSection}`) : null
  )

  const toggle = (id: ValidationSection) => {
    const willOpen = !open.has(id)
    const next = new Set(open)
    if (willOpen) next.add(id)
    else next.delete(id)
    setOpen(next)
    if (!onUpdateParams) return
    // ?section names the section last opened; closing it falls back to
    // another open one, or clears the param. Closing Implementation Attacks
    // also clears ?attack (its profile is no longer on screen).
    const section = willOpen
      ? id
      : sectionParam === id || !isSection(sectionParam)
        ? ((['attacks', 'kat', 'coverage'] as const).find((s) => next.has(s)) ?? null)
        : sectionParam
    setSelfWrittenSection(section)
    onUpdateParams({
      section,
      ...(id === 'attacks' && !willOpen ? { attack: null } : {}),
      ...(id === 'coverage' && !willOpen ? { case: null } : {}),
    })
  }

  const sections: Array<{
    id: ValidationSection
    icon: React.ReactNode
    label: string
    caption: string
    content: React.ReactNode
  }> = [
    {
      id: 'attacks',
      icon: <ShieldAlert size={16} />,
      label: 'Implementation Attacks',
      caption: 'Side-channel and fault-injection considerations per algorithm family.',
      content: (
        <>
          {attackParam && !attackProfile && (
            <DeepLinkNotice
              kind="not-found"
              message={`No implementation-attack profile matches "${attackParam}".`}
              onDismiss={() => onUpdateParams?.({ attack: null })}
            />
          )}
          <ImplementationAttacksView highlightProfile={attackProfile?.algorithm ?? null} />
        </>
      ),
    },
    {
      id: 'kat',
      icon: <FlaskConical size={16} />,
      label: 'KAT Validation',
      caption: 'Run pinned known-answer-test vectors live in your browser via WASM.',
      content: <KATView />,
    },
    {
      id: 'coverage',
      icon: <Grid3x3 size={16} />,
      label: 'Coverage Matrix',
      caption:
        'Every advertised PKCS#11 capability per engine vs. the registered tests, with open gaps.',
      content: (
        <Suspense fallback={<p className="text-xs text-muted-foreground">Loading…</p>}>
          <CoverageMatrixView
            engineParam={engineParam}
            caseParam={caseParam}
            onUpdateParams={onUpdateParams}
          />
        </Suspense>
      ),
    },
  ]

  return (
    <div className="space-y-3">
      {sections.map(({ id, icon, label, caption, content }) => {
        const isOpen = open.has(id)
        return (
          <section
            key={id}
            className="glass-panel overflow-hidden"
            data-workshop-target={`section-validation-${id}`}
            data-deeplink-id={`validation-${id}`}
          >
            <Button
              variant="ghost"
              onClick={() => toggle(id)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/30 h-auto rounded-none"
            >
              <span className="flex items-center gap-2.5">
                <span className="text-primary">{icon}</span>
                <span className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground">{label}</span>
                  <span className="text-xs text-muted-foreground font-normal">{caption}</span>
                </span>
              </span>
              <ChevronDown
                size={18}
                className={clsx(
                  'shrink-0 text-muted-foreground transition-transform',
                  isOpen && 'rotate-180'
                )}
              />
            </Button>
            {isOpen && <div className="border-t border-border p-4">{content}</div>}
          </section>
        )
      })}
    </div>
  )
}
