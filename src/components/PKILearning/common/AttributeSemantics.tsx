// SPDX-License-Identifier: AGPL-3.0-only
import type { X509Attribute } from './types'
import { FilterDropdown } from '@/components/common/FilterDropdown'

export function AttributeSemantics({
  attribute,
  onAttributeChange,
}: {
  attribute: X509Attribute
  onAttributeChange: (id: string, field: keyof X509Attribute, value: string | boolean) => void
}) {
  return (
    <div className="mt-1 space-y-1 text-xs font-normal text-muted-foreground">
      <span className="block">
        Presence requirement:{' '}
        {attribute.status === 'unknown' ? 'Not established' : attribute.status}
      </span>
      {attribute.elementType === 'Extension' && (
        <FilterDropdown
          ariaLabel={`Criticality for ${attribute.label}`}
          items={[
            { id: 'true', label: 'Critical' },
            { id: 'false', label: 'Noncritical' },
          ]}
          selectedId={attribute.critical === undefined ? '' : String(attribute.critical)}
          defaultLabel="Criticality not established"
          hideDefaultOption
          size="sm"
          onSelect={(value) => onAttributeChange(attribute.id, 'critical', value === 'true')}
        />
      )}
    </div>
  )
}

export function ProfileSemanticsNotice({
  selectedProfile,
  loading,
  error,
}: {
  selectedProfile: string
  loading?: boolean
  error?: string | null
}) {
  if (error)
    return (
      <p role="alert" className="text-sm text-destructive">
        Profile incomplete: {error}. Previous fields are retained for review; generation is blocked
        until a profile loads successfully or is cleared.
      </p>
    )
  if (loading)
    return (
      <p role="status" className="text-sm text-muted-foreground">
        Loading profile examples…
      </p>
    )
  if (!selectedProfile) return null
  return (
    <p className="text-sm text-muted-foreground rounded border border-border p-3">
      Populated profile examples are selected and editable. This editor does not infer presence
      requirements from criticality; review the source guidance to determine required fields.
      Editing or omitting fields may depart from that profile. Selecting it does not establish
      compliance.
    </p>
  )
}
