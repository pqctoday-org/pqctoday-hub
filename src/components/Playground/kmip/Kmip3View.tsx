// SPDX-License-Identifier: GPL-3.0-only
//
// Kmip3View — the "KMIP3.0" top-level tab: ten guided walkthroughs
// (Learn, the on-ramp — first position; six classical→PQC comparisons plus
// four engine-addition lessons), a category-sorted tester for every KMIP
// 3.0 operation (Commands/Reference), the pipeline builder — whose palette
// can switch from standard operation primitives to a live in-browser replay
// of the real OASIS conformance corpus (Dev — 2026-08-31 merge, mirroring
// the PKCS#11 side's Developer tab: Corpus Replay used to be its own
// sub-tab here, then its own Pipeline-sibling tab, before folding into the
// pipeline builder's palette on 2026-09-01; the pipeline builder itself
// used to be a top-level KmipPlaygroundView plane), and the batch/macro
// builder (Batch & Macros).
import { useState } from 'react'
import { BookOpen, Terminal, Code2, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { KmipEngine } from '@/wasm/kmip/kmipEngine'
import { usePersonaStore } from '@/store/usePersonaStore'
import { GlossaryProvider } from '@/components/Playground/learnkit/GlossaryProvider'
import { GlossaryRail } from '@/components/Playground/learnkit/GlossaryRail'
import { BatchView } from './BatchView'
import { CommandsView } from './CommandsView'
import { KmipDevTab } from './KmipDevTab'
import { KeystoreStrip } from './kmip3/KeystoreStrip'
import { LearnView } from './kmip3/LearnView'
import { KMIP_GLOSSARY_DATA } from './kmip3/glossary'

type Kmip3Tab = 'learn' | 'commands' | 'dev' | 'batch'

const TABS: { id: Kmip3Tab; label: string; icon: typeof Terminal }[] = [
  { id: 'learn', label: 'Learn', icon: BookOpen },
  { id: 'commands', label: 'Commands', icon: Terminal },
  { id: 'dev', label: 'Dev', icon: Code2 },
  { id: 'batch', label: 'Batch & Macros', icon: Layers },
]

export function Kmip3View({
  engine,
  busy,
  expert,
  onBusyChange,
  onChanged,
}: {
  engine: KmipEngine
  busy: boolean
  expert: boolean
  onBusyChange: (running: boolean) => void
  onChanged: () => void
}) {
  const [tab, setTab] = useState<Kmip3Tab>('learn')
  const [pendingOp, setPendingOp] = useState<string | null>(null)
  const role = usePersonaStore((s) => s.selectedPersona)
  // Dev (Pipeline Builder + Corpus Replay) is an engineering-workbench
  // surface, same gating as the PKCS#11 side's Developer sub-tab — but
  // gated as one unit here (see KmipDevTab.tsx's own doc comment) rather
  // than per-inner-tab, since both halves are workbench tools together.
  const showDevTab = role !== 'curious' && role !== 'executive'

  return (
    <GlossaryProvider data={KMIP_GLOSSARY_DATA}>
      <KeystoreStrip engine={engine} />
      {/* max-lg:overflow-x-hidden is a defensive containment boundary: without
          it, a child that overflows horizontally (e.g. a wide table inside
          CommandsView) can offset this whole row's scroll position rather than
          just its own content, clipping everything below the header on phones. */}
      <div className="flex items-start gap-4 max-lg:overflow-x-hidden">
        <div className="min-w-0 flex-1">
          <div
            className="mb-4 flex items-center gap-1 border-b border-border"
            role="tablist"
            data-tour="kmip3-subtabs"
          >
            {TABS.filter((t) => t.id !== 'dev' || showDevTab).map((t) => {
              const Icon = t.icon
              const on = tab === t.id
              return (
                <Button
                  key={t.id}
                  variant="ghost"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    '-mb-px inline-flex h-auto items-center gap-1.5 rounded-none border-b-2 px-3 py-2 text-[12.5px] font-medium transition-colors hover:bg-transparent',
                    on
                      ? 'border-primary font-semibold text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon size={13} />
                  {t.label}
                </Button>
              )
            })}
          </div>

          {tab === 'learn' && (
            <LearnView
              engine={engine}
              onChanged={onChanged}
              onTryInReference={(op) => {
                setPendingOp(op)
                setTab('commands')
              }}
            />
          )}

          {tab === 'commands' && (
            <CommandsView
              engine={engine}
              onChanged={onChanged}
              pendingOp={pendingOp}
              onPendingOpHandled={() => setPendingOp(null)}
            />
          )}

          {tab === 'dev' && showDevTab && <KmipDevTab engine={engine} />}

          {tab === 'batch' && (
            <BatchView
              engine={engine}
              busy={busy}
              expert={expert}
              onBusyChange={onBusyChange}
              onChanged={onChanged}
            />
          )}
        </div>

        {/* Dev (the pipeline builder, corpus palette included) is a workbench, not a reading
            context — and KmipPipelineBuilder's own fixed 280px/340px side
            columns (palette, run/validation panel) were sized assuming the
            FULL row width the old top-level "Developer" plane had to
            itself. Sharing this row with the glossary rail too collapses
            its middle canvas column to near-nothing (found live: 722px
            total - 280px - 340px = 102px). Same reasoning HsmPlayground's
            own Developer tab already reflects — it has no glossary rail
            at all. */}
        {tab !== 'dev' && <GlossaryRail />}
      </div>
    </GlossaryProvider>
  )
}
