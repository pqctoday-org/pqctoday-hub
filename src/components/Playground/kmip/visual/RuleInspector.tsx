// SPDX-License-Identifier: GPL-3.0-only
//
// RuleInspector — edit the selected rule's fields, rendered from the catalog
// FieldSpec. Precedence up/down, enable/disable, delete.
import { ArrowUp, ArrowDown, Trash2, Power } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { EditableRule } from './policyEditModel'
import {
  RULE_CATALOG,
  FAMILY_META,
  KMIP_OPS,
  KEY_STATES,
  USAGE_FLAGS,
  ALGORITHM_CLASSES,
  ALGO_SUGGESTIONS,
  isRuleTypeId,
  type FieldSpec,
} from './ruleCatalog'
import {
  FieldLabel,
  TagEditor,
  ChipToggleGroup,
  SelectField,
  TextField,
  NumberField,
  TimeBoundField,
  BoolField,
  AttrPairField,
} from './editorControls'

interface Props {
  rule: EditableRule | null
  index: number
  count: number
  onPatchScalar: (key: string, value: string) => void
  onPatchList: (key: string, value: string[]) => void
  onPatchMap: (key: string, value: { name: string; value: string }) => void
  onToggle: () => void
  onDelete: () => void
  onMove: (dir: -1 | 1) => void
}

function Field({
  spec,
  rule,
  onPatchScalar,
  onPatchList,
  onPatchMap,
}: {
  spec: FieldSpec
  rule: EditableRule
  onPatchScalar: (key: string, value: string) => void
  onPatchList: (key: string, value: string[]) => void
  onPatchMap: (key: string, value: { name: string; value: string }) => void
}) {
  const label = (spec.label ?? spec.key.replace(/_/g, ' ')) + (spec.central ? ' ●' : '')
  const scalar = rule.scalars[spec.key] ?? ''
  const list = rule.lists[spec.key] ?? []
  const map = rule.maps[spec.key] ?? { name: '', value: '' }

  let control: React.ReactNode
  switch (spec.kind) {
    case 'ops':
      control = (
        <ChipToggleGroup
          value={list}
          options={KMIP_OPS}
          onChange={(v) => onPatchList(spec.key, v)}
        />
      )
      break
    case 'op':
      control = (
        <SelectField
          value={scalar || KMIP_OPS[0]}
          options={KMIP_OPS}
          onChange={(v) => onPatchScalar(spec.key, v)}
          ariaLabel={label}
        />
      )
      break
    case 'algos':
      control = (
        <TagEditor
          value={list}
          suggestions={ALGO_SUGGESTIONS}
          onChange={(v) => onPatchList(spec.key, v)}
          placeholder="algorithm…"
        />
      )
      break
    case 'algo':
      control = (
        <TextField
          mono
          value={scalar}
          onChange={(v) => onPatchScalar(spec.key, v)}
          placeholder="algorithm"
        />
      )
      break
    case 'list':
      control = (
        <TagEditor value={list} onChange={(v) => onPatchList(spec.key, v)} placeholder="value…" />
      )
      break
    case 'states':
      control = (
        <ChipToggleGroup
          value={list}
          options={KEY_STATES}
          onChange={(v) => onPatchList(spec.key, v)}
        />
      )
      break
    case 'flags':
      control = (
        <ChipToggleGroup
          value={list}
          options={USAGE_FLAGS}
          onChange={(v) => onPatchList(spec.key, v)}
        />
      )
      break
    case 'class':
      control = (
        <SelectField
          value={scalar || ALGORITHM_CLASSES[0]}
          options={ALGORITHM_CLASSES}
          onChange={(v) => onPatchScalar(spec.key, v)}
          ariaLabel={label}
        />
      )
      break
    case 'date':
      control = <TimeBoundField value={scalar} onChange={(v) => onPatchScalar(spec.key, v)} />
      break
    case 'int':
      control = <NumberField value={scalar} onChange={(v) => onPatchScalar(spec.key, v)} />
      break
    case 'bool':
      control = <BoolField value={scalar} onChange={(v) => onPatchScalar(spec.key, v)} />
      break
    case 'attr':
      control = (
        <div className="flex items-center gap-1">
          <span className="font-mono text-[11px] text-muted-foreground">x-</span>
          <TextField mono value={scalar} onChange={(v) => onPatchScalar(spec.key, v)} />
        </div>
      )
      break
    case 'attrmap':
      control = (
        <AttrPairField
          name={map.name}
          value={map.value}
          onChange={(v) => onPatchMap(spec.key, v)}
        />
      )
      break
    case 'text':
    default:
      control = (
        <TextField
          value={scalar}
          onChange={(v) => onPatchScalar(spec.key, v)}
          placeholder={spec.key === 'reason' ? 'why this rule exists' : undefined}
        />
      )
  }

  return (
    <div>
      <FieldLabel>
        {label}
        {spec.optional && (
          <span className="ml-1 normal-case text-muted-foreground">(optional)</span>
        )}
      </FieldLabel>
      {control}
    </div>
  )
}

export function RuleInspector({
  rule,
  index,
  count,
  onPatchScalar,
  onPatchList,
  onPatchMap,
  onToggle,
  onDelete,
  onMove,
}: Props) {
  if (!rule) {
    return (
      <div className="p-5 text-[12px] leading-relaxed text-muted-foreground">
        <p>
          Select a node to edit its rule — the operations it scopes to, its algorithms, and the
          reason shown when it denies a request.
        </p>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Or add a rule from the palette on the left.
        </p>
      </div>
    )
  }

  const spec = isRuleTypeId(rule.type) ? RULE_CATALOG[rule.type] : undefined
  const fam = spec ? FAMILY_META[spec.family] : undefined
  const Icon = spec?.icon

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className={cn('border-b border-border p-3', fam?.bg)}>
        <div className="flex items-center gap-2">
          {Icon && fam && (
            <span className={cn('grid h-7 w-7 place-items-center rounded-md', fam.bg)}>
              <Icon size={15} className={fam.text} />
            </span>
          )}
          <div className="min-w-0">
            <div className="text-[13px] font-bold text-foreground">
              {spec?.title ?? rule.type}
              <span className={cn('ml-1.5 text-[10px] font-bold', fam?.text)}>#{index + 1}</span>
            </div>
            <div className="font-mono text-[10px] text-muted-foreground">{rule.type}</div>
          </div>
          {fam && (
            <span
              className={cn(
                'ml-auto rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide',
                fam.bg,
                fam.text
              )}
            >
              {fam.label}
            </span>
          )}
        </div>
        {spec && (
          <p className="mt-2 text-[11px] leading-snug text-muted-foreground">{spec.blurb}</p>
        )}
      </div>

      <div className="flex-1 min-h-0 space-y-3.5 overflow-y-auto p-3.5">
        {spec ? (
          spec.fields.map((f) => (
            <Field
              key={f.key}
              spec={f}
              rule={rule}
              onPatchScalar={onPatchScalar}
              onPatchList={onPatchList}
              onPatchMap={onPatchMap}
            />
          ))
        ) : (
          <p className="text-[11px] text-muted-foreground">
            Unknown rule type — not in the catalog. Edit the YAML directly.
          </p>
        )}
      </div>

      <div className="space-y-2.5 border-t border-border p-3">
        <div>
          <FieldLabel>Precedence</FieldLabel>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 text-[11px]"
              disabled={index === 0}
              onClick={() => onMove(-1)}
            >
              <ArrowUp size={12} /> earlier
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1 text-[11px]"
              disabled={index === count - 1}
              onClick={() => onMove(1)}
            >
              <ArrowDown size={12} /> later
            </Button>
            <span className="ml-1 text-[10.5px] text-muted-foreground">
              {index + 1} of {count}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="h-7 gap-1 text-[11px]" onClick={onToggle}>
            <Power size={12} /> {rule.enabled ? 'Disable' : 'Enable'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto h-7 gap-1 border-destructive/40 text-[11px] text-destructive hover:bg-destructive/10"
            onClick={onDelete}
          >
            <Trash2 size={12} /> Delete
          </Button>
        </div>
      </div>
    </div>
  )
}
