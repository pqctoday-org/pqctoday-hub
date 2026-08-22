// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection -- keys are typed RuleFamily
   / preset file names, never user input. */
//
// RulePalette — left column of the visual editor: a policy switcher over the
// preset catalogue + an "Add a rule" list grouped by family. Guided mode shows
// only the common subset; expert shows all 18 with their raw snake_case name.
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { cn } from '@/lib/utils'
import { POLICY_PRESETS, type PolicyPreset } from '@/wasm/kmip/kmipMeta'
import {
  RULE_CATALOG,
  FAMILY_META,
  FAMILY_ORDER,
  RULE_TYPE_IDS,
  type RuleFamily,
  type RuleTypeId,
} from './ruleCatalog'

interface Props {
  guided: boolean
  activePresetFile: string | null
  onSelectPreset: (preset: PolicyPreset) => void
  onAddRule: (type: RuleTypeId) => void
}

export function RulePalette({ guided, activePresetFile, onSelectPreset, onAddRule }: Props) {
  const byFamily = FAMILY_ORDER.map((fam) => ({
    fam,
    types: RULE_TYPE_IDS.filter(
      (t) => RULE_CATALOG[t].family === fam && (!guided || RULE_CATALOG[t].guided)
    ),
  })).filter((g) => g.types.length > 0)

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-border p-3">
        <div className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          Policy
        </div>
        <FilterDropdown
          items={POLICY_PRESETS.map((p) => ({ id: p.file, label: p.label }))}
          selectedId={activePresetFile ?? ''}
          onSelect={(id) => {
            const p = POLICY_PRESETS.find((x) => x.file === id)
            if (p) onSelectPreset(p)
          }}
          defaultLabel="— built-in permissive —"
          defaultIcon={null}
          ariaLabel="Policy"
          noContainer
          className="w-full"
        />
      </div>

      <div className="border-b border-border px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <Plus size={14} className="text-primary" />
          <span className="text-[12.5px] font-semibold text-foreground">Add a rule</span>
        </div>
        <p className="mt-1 text-[10.5px] leading-snug text-muted-foreground">
          {guided
            ? 'Click a rule type to append it to the pipeline. Nodes evaluate in order.'
            : 'Nodes evaluate top-to-bottom. Precedence matters — first match wins.'}
        </p>
      </div>

      <div className="flex-1 min-h-0 space-y-3 overflow-y-auto p-3">
        {byFamily.map(({ fam, types }) => {
          const meta = FAMILY_META[fam as RuleFamily]
          return (
            <div key={fam}>
              <div className="mb-1.5 flex items-center gap-1.5">
                <span className={cn('h-2 w-2 rounded-sm', meta.bg, meta.border, 'border')} />
                <span className="text-[9.5px] font-bold uppercase tracking-wide text-muted-foreground">
                  {meta.label}
                </span>
                <span
                  className="ml-auto cursor-help text-[10px] text-muted-foreground"
                  title={meta.meaning}
                >
                  ⓘ
                </span>
              </div>
              <div className="space-y-1">
                {types.map((t) => {
                  const spec = RULE_CATALOG[t]
                  const Icon = spec.icon
                  return (
                    <Button
                      key={t}
                      variant="ghost"
                      type="button"
                      onClick={() => onAddRule(t)}
                      title={spec.blurb}
                      className="flex h-auto w-full items-center justify-start gap-2 rounded-lg border border-border bg-background/40 px-2 py-1.5 text-left font-normal transition-colors hover:border-primary/40 hover:bg-primary/5"
                    >
                      <span
                        className={cn(
                          'grid h-6 w-6 shrink-0 place-items-center rounded-md',
                          spec.family && FAMILY_META[spec.family].bg
                        )}
                      >
                        <Icon size={13} className={FAMILY_META[spec.family].text} />
                      </span>
                      <span className="flex min-w-0 flex-col">
                        <span className="text-[12px] font-semibold text-foreground">
                          {spec.title}
                        </span>
                        {!guided && (
                          <span className="truncate font-mono text-[9.5px] text-muted-foreground">
                            {t}
                          </span>
                        )}
                      </span>
                      <Plus size={12} className="ml-auto text-muted-foreground" />
                    </Button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
