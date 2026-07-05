// SPDX-License-Identifier: GPL-3.0-only
//
// ParamField — one editable field in the Reference tab's per-op parameter
// form, switched on `OpParam.kind`. Composes existing primitives (`Input`,
// `FilterDropdown`, `Switch`) rather than a new form library — none of this
// codebase's existing components are schema-driven, so this is the small
// adapter that makes `opTemplates.ts`'s `OpParam[]` renderable.
import { useEffect } from 'react'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { ALGORITHMS } from '@/wasm/kmip/kmipMeta'
import type { OpParam } from '@/wasm/kmip/ttlv/opTemplates'
import { Term } from './Term'

/** Maps a param's `key` to the KMIP wire tag it carries, so the Reference
 * tab's field labels are glossary-aware (hover/focus → rail pin) same as
 * wire-tree tag names — covers the recurring param keys across the 64 op
 * forms; a key with no entry just renders an un-hinted label. */
const PARAM_TAG: Record<string, string> = {
  uid: 'UniqueIdentifier',
  baseUid: 'UniqueIdentifier',
  algorithm: 'CryptographicAlgorithm',
  length: 'CryptographicLength',
  usage: 'CryptographicUsageMask',
  data: 'Data',
  ivHex: 'IVCounterNonce',
  signature: 'SignatureData',
  macDataHex: 'MACData',
  keyMaterialHex: 'KeyMaterial',
  ticket: 'Ticket',
  message: 'LogMessage',
  name: 'Name',
  attributeReference: 'AttributeReference',
  attributeReferences: 'AttributeReference',
  adjustmentValue: 'AdjustmentValue',
  adjustmentType: 'AdjustmentType',
  offset: 'Offset',
  dataLength: 'DataLength',
  objectType: 'ObjectType',
  reason: 'RevocationReasonCode',
  role: 'EndpointRole',
  method: 'DerivationMethod',
  fn: 'PKCS11Function',
  inputParametersHex: 'PKCS11InputParameters',
  usageLimitsCount: 'UsageLimitsCount',
  leaseTime: 'LeaseTime',
  requestCount: 'RequestCount',
  identifier: 'InteropIdentifier',
  replaceExisting: 'ReplaceExisting',
  keyFormatType: 'KeyFormatType',
}

function FieldLabel({ param }: { param: OpParam }) {
  const tag = PARAM_TAG[param.key]
  return (
    <label className="mb-1 block text-[10.5px] font-medium text-muted-foreground">
      {tag ? <Term glossaryKey={tag}>{param.label}</Term> : param.label}
    </label>
  )
}

export function ParamField({
  param,
  value,
  onChange,
  keystoreUids,
}: {
  param: OpParam
  value: string
  onChange: (v: string) => void
  /** Current session object UIDs, offered as a `<datalist>` for `uid`-kind
   * fields — plain HTML, no new component needed. */
  keystoreUids?: string[]
}) {
  // Auto-fill a fresh random value the first time this field mounts (e.g.
  // Encrypt's IV) — still a normal editable field afterward.
  useEffect(() => {
    if (param.randomBytes && !value) {
      const bytes = crypto.getRandomValues(new Uint8Array(param.randomBytes))
      onChange(Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join(''))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount only, matching the "fill it in for me the first time" intent; the field is freely editable afterward.
  }, [])

  if (param.kind === 'algorithm') {
    return (
      <div>
        <FieldLabel param={param} />
        <FilterDropdown
          items={ALGORITHMS.map((a) => ({ id: a.value, label: a.label }))}
          selectedId={value}
          onSelect={onChange}
          size="sm"
          searchable
          className="w-full"
        />
      </div>
    )
  }

  if (param.kind === 'select') {
    const options = param.options ?? []
    return (
      <div>
        <FieldLabel param={param} />
        <FilterDropdown
          items={options.map((o) => (o === '' ? { id: '', label: '(none)' } : o))}
          selectedId={value}
          onSelect={onChange}
          size="sm"
          className="w-full"
        />
      </div>
    )
  }

  if (param.kind === 'bool') {
    return (
      <div className="flex items-center gap-2">
        <Switch checked={value === 'true'} onCheckedChange={(c) => onChange(String(c))} />
        <FieldLabel param={param} />
      </div>
    )
  }

  if (param.kind === 'uid') {
    const listId = `kmip3-uids-${param.key}`
    return (
      <div>
        <FieldLabel param={param} />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="paste or pick a UID"
          list={keystoreUids?.length ? listId : undefined}
          className="h-8 font-mono text-[11px]"
        />
        {keystoreUids && keystoreUids.length > 0 && (
          <datalist id={listId}>
            {keystoreUids.map((uid) => (
              <option key={uid} value={uid} />
            ))}
          </datalist>
        )}
      </div>
    )
  }

  return (
    <div>
      <FieldLabel param={param} />
      <Input
        type={param.kind === 'number' ? 'number' : 'text'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={param.kind === 'hex' ? 'h-8 font-mono text-[11px]' : 'h-8 text-[11.5px]'}
      />
    </div>
  )
}
