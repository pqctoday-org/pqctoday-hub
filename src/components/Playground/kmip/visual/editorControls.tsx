// SPDX-License-Identifier: GPL-3.0-only
//
// editorControls.tsx — small field controls for the visual policy editor's
// inspector and simulator. All semantic-token styled; the tag editor supports
// free text (algorithm names aren't a closed set) with a datalist of hints.
import { useId, useState, type ReactNode } from 'react'
import { X, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { cn } from '@/lib/utils'

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
      {children}
    </span>
  )
}

/** Free-text tag list with add-on-Enter and a datalist of suggestions. */
export function TagEditor({
  value,
  suggestions = [],
  onChange,
  placeholder = 'add…',
}: {
  value: string[]
  suggestions?: string[]
  onChange: (next: string[]) => void
  placeholder?: string
}) {
  const [draft, setDraft] = useState('')
  const listId = useId()
  const add = (raw: string) => {
    const v = raw.trim()
    if (!v || value.some((x) => x.toLowerCase() === v.toLowerCase())) return
    onChange([...value, v])
    setDraft('')
  }
  return (
    <div className="rounded-lg border border-input bg-background/40 p-1.5">
      <div className="flex flex-wrap gap-1">
        {value.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground"
          >
            {v}
            <Button
              variant="ghost"
              type="button"
              aria-label={`remove ${v}`}
              onClick={() => onChange(value.filter((x) => x !== v))}
              className="h-auto w-auto p-0 text-muted-foreground hover:bg-transparent hover:text-destructive"
            >
              <X size={11} />
            </Button>
          </span>
        ))}
      </div>
      <div className="mt-1 flex items-center gap-1">
        <input
          list={listId}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add(draft)
            }
          }}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent px-1 py-0.5 font-mono text-[11px] text-foreground outline-none placeholder:text-muted-foreground"
        />
        <datalist id={listId}>
          {suggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
        <Button
          variant="ghost"
          type="button"
          aria-label="add tag"
          onClick={() => add(draft)}
          className="h-auto w-auto rounded p-0.5 text-muted-foreground hover:bg-transparent hover:text-primary"
        >
          <Plus size={13} />
        </Button>
      </div>
    </div>
  )
}

/** Multi-select over a closed option set, rendered as toggle chips. */
export function ChipToggleGroup({
  value,
  options,
  onChange,
}: {
  value: string[]
  options: readonly string[]
  onChange: (next: string[]) => void
}) {
  const toggle = (o: string) =>
    onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o])
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((o) => {
        const on = value.includes(o)
        return (
          <Button
            key={o}
            variant="ghost"
            type="button"
            aria-pressed={on}
            onClick={() => toggle(o)}
            className={cn(
              'h-auto rounded border px-1.5 py-0.5 font-mono text-[10.5px] font-normal transition-colors',
              on
                ? 'border-primary bg-primary/15 text-primary'
                : 'border-border bg-background/40 text-muted-foreground hover:border-primary/40'
            )}
          >
            {o}
          </Button>
        )
      })}
    </div>
  )
}

/**
 * Single-select over a closed option set. An empty string inside `options` is
 * the "unset / any" choice — rendered as FilterDropdown's clear row rather than
 * a blank option, so the menu never shows an unlabelled entry.
 */
export function SelectField({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: string
  options: readonly string[]
  onChange: (next: string) => void
  ariaLabel?: string
}) {
  const allowsUnset = options.includes('')
  return (
    <FilterDropdown
      items={options.filter((o) => o !== '')}
      selectedId={value}
      onSelect={(id) => onChange(id === 'All' ? '' : id)}
      defaultLabel="any"
      defaultIcon={null}
      hideDefaultOption={!allowsUnset}
      ariaLabel={ariaLabel}
      noContainer
      className="w-full"
    />
  )
}

export function TextField({
  value,
  onChange,
  placeholder,
  mono,
}: {
  value: string
  onChange: (next: string) => void
  placeholder?: string
  mono?: boolean
}) {
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn('h-8 bg-background/40 text-[12px]', mono && 'font-mono')}
    />
  )
}

export function NumberField({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (next: string) => void
  placeholder?: string
}) {
  return (
    <Input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="h-8 bg-background/40 font-mono text-[12px]"
    />
  )
}

/** TimeBound editor: an "always" toggle beside a date input. */
export function TimeBoundField({
  value,
  onChange,
}: {
  value: string
  onChange: (next: string) => void
}) {
  const isAlways = value === 'always' || value === ''
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="ghost"
        type="button"
        aria-pressed={isAlways}
        onClick={() => onChange(isAlways ? '2030-01-01' : 'always')}
        className={cn(
          'h-auto rounded border px-2 py-1 text-[11px] font-normal transition-colors',
          isAlways
            ? 'border-primary bg-primary/15 text-primary'
            : 'border-border bg-background/40 text-muted-foreground hover:border-primary/40'
        )}
      >
        always
      </Button>
      {!isAlways && (
        <input
          type="date"
          value={/^\d{4}-\d{2}-\d{2}$/.test(value) ? value : ''}
          onChange={(e) => onChange(e.target.value || 'always')}
          className="rounded-lg border border-input bg-background/40 px-2 py-1 font-mono text-[12px] text-foreground outline-none focus:border-primary"
        />
      )}
    </div>
  )
}

/** Boolean tri-toggle (unset / true / false) for optional serde bool fields. */
export function BoolField({
  value,
  onChange,
}: {
  value: string
  onChange: (next: string) => void
}) {
  const opts: { v: string; label: string }[] = [
    { v: '', label: 'unset' },
    { v: 'true', label: 'true' },
    { v: 'false', label: 'false' },
  ]
  return (
    <div className="flex gap-1">
      {opts.map((o) => (
        <Button
          key={o.label}
          variant="ghost"
          type="button"
          aria-pressed={value === o.v}
          onClick={() => onChange(o.v)}
          className={cn(
            'h-auto rounded border px-2 py-1 text-[11px] font-normal transition-colors',
            value === o.v
              ? 'border-primary bg-primary/15 text-primary'
              : 'border-border bg-background/40 text-muted-foreground hover:border-primary/40'
          )}
        >
          {o.label}
        </Button>
      ))}
    </div>
  )
}

/** `{ name, value }` custom-attribute predicate editor. */
export function AttrPairField({
  name,
  value,
  onChange,
}: {
  name: string
  value: string
  onChange: (next: { name: string; value: string }) => void
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="font-mono text-[11px] text-muted-foreground">x-</span>
      <Input
        value={name}
        onChange={(e) => onChange({ name: e.target.value, value })}
        placeholder="attribute"
        className="h-8 flex-1 bg-background/40 font-mono text-[11px]"
      />
      <span className="text-muted-foreground">=</span>
      <Input
        value={value}
        onChange={(e) => onChange({ name, value: e.target.value })}
        placeholder="value"
        className="h-8 flex-1 bg-background/40 font-mono text-[11px]"
      />
    </div>
  )
}
