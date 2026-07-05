// SPDX-License-Identifier: GPL-3.0-only
//
// Kmip3View — the "KMIP3.0" top-level tab: a category-sorted tester for
// every KMIP 3.0 operation (Commands), a live in-browser replay of the real
// OASIS conformance corpus (Corpus Replay), and the existing batch/macro
// builder (Batch & Macros), unchanged, just relocated here from its own
// top-level tab.
import { useState } from 'react'
import { Terminal, FlaskConical, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { KmipEngine } from '@/wasm/kmip/kmipEngine'
import { BatchView } from './BatchView'
import { CommandsView } from './CommandsView'
import { CorpusReplayView } from './CorpusReplayView'

type Kmip3Tab = 'commands' | 'corpus' | 'batch'

const TABS: { id: Kmip3Tab; label: string; icon: typeof Terminal }[] = [
  { id: 'commands', label: 'Commands', icon: Terminal },
  { id: 'corpus', label: 'Corpus Replay', icon: FlaskConical },
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
  const [tab, setTab] = useState<Kmip3Tab>('commands')

  return (
    <div>
      <div
        className="mb-4 flex items-center gap-1 border-b border-border"
        role="tablist"
        data-tour="kmip3-subtabs"
      >
        {TABS.map((t) => {
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

      {tab === 'commands' && <CommandsView engine={engine} onChanged={onChanged} />}

      {tab === 'corpus' && <CorpusReplayView />}

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
  )
}
