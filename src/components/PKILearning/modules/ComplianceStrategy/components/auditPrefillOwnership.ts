// SPDX-License-Identifier: AGPL-3.0-only
import type {
  ArtifactFieldEdit,
  ArtifactFormData,
  ArtifactSection,
} from '../../../common/executive/ArtifactBuilder'

export interface AuditPrefillToken {
  sectionId: string
  fieldId: string
  optionValue: string
}
export interface AuditPrefillOwnership {
  version: 1
  untouchedInserted: AuditPrefillToken[]
  cleared: boolean
  inheritedOriginUnknown: boolean
}
export interface AuditPrefillDraft {
  checklistData: ArtifactFormData
  prefillOwnership: AuditPrefillOwnership
  originalSavedInputs?: unknown
  lastClearCount: number | null
}
const isRecord = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
const exactKeys = (value: Record<string, unknown>, keys: string[]) =>
  Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key))
const tokenKey = (token: AuditPrefillToken) =>
  JSON.stringify([token.sectionId, token.fieldId, token.optionValue])

function readOwnership(
  raw: unknown,
  sections: ArtifactSection[],
  data: ArtifactFormData
): AuditPrefillOwnership | null {
  if (
    !isRecord(raw) ||
    !exactKeys(raw, ['version', 'untouchedInserted', 'cleared', 'inheritedOriginUnknown']) ||
    raw.version !== 1 ||
    !Array.isArray(raw.untouchedInserted) ||
    typeof raw.cleared !== 'boolean' ||
    typeof raw.inheritedOriginUnknown !== 'boolean'
  )
    return null
  const tokens: AuditPrefillToken[] = []
  const seen = new Set<string>()
  for (const value of raw.untouchedInserted) {
    if (
      !isRecord(value) ||
      !exactKeys(value, ['sectionId', 'fieldId', 'optionValue']) ||
      typeof value.sectionId !== 'string' ||
      typeof value.fieldId !== 'string' ||
      typeof value.optionValue !== 'string'
    )
      return null
    const token = {
      sectionId: value.sectionId,
      fieldId: value.fieldId,
      optionValue: value.optionValue,
    }
    const field = sections
      .find((section) => section.id === token.sectionId)
      ?.fields.find((field) => field.id === token.fieldId)
    const selected = data[token.sectionId]?.[token.fieldId]
    if (
      field?.type !== 'checklist' ||
      !field.options?.some((option) => option.value === token.optionValue) ||
      !Array.isArray(selected) ||
      selected.filter((item) => item === token.optionValue).length !== 1 ||
      seen.has(tokenKey(token))
    )
      return null
    tokens.push(token)
    seen.add(tokenKey(token))
  }
  if (raw.cleared && tokens.length > 0) return null
  return {
    version: 1,
    untouchedInserted: tokens,
    cleared: raw.cleared,
    inheritedOriginUnknown: raw.inheritedOriginUnknown,
  }
}

/** A saved field, including an explicit empty array, outranks today's defaults. */
export function initializeAuditPrefill(
  sections: ArtifactSection[],
  savedInputs?: unknown
): AuditPrefillDraft {
  const loaded = savedInputs !== undefined && savedInputs !== null
  const saved = isRecord(savedInputs) ? savedInputs : undefined
  const savedData = isRecord(saved?.checklistData) ? saved.checklistData : {}
  // Unknown sections/fields remain opaque draft data; clearing never targets them.
  const data = Object.fromEntries(
    Object.entries(savedData)
      .filter(([, value]) => isRecord(value))
      .map(([id, value]) => [id, { ...(value as Record<string, string | string[]>) }])
  ) as ArtifactFormData
  const inserted: AuditPrefillToken[] = []
  for (const section of sections) {
    const row = { ...data[section.id] }
    for (const field of section.fields) {
      if (!Object.hasOwn(row, field.id)) {
        const initial = loaded
          ? field.type === 'checklist'
            ? []
            : ''
          : (field.defaultValue ?? (field.type === 'checklist' ? [] : ''))
        row[field.id] = Array.isArray(initial) ? [...initial] : initial
        if (!loaded && field.type === 'checklist' && Array.isArray(initial)) {
          for (const value of initial) {
            if (
              field.options?.some((option) => option.value === value) &&
              initial.filter((item) => item === value).length === 1
            )
              inserted.push({ sectionId: section.id, fieldId: field.id, optionValue: value })
          }
        }
      }
    }
    data[section.id] = row
  }
  const ownership = loaded ? readOwnership(saved?.prefillOwnership, sections, data) : null
  // Unsupported ownership or new opaque input fields belong to this loaded
  // record, not necessarily to its older snapshot. Preserve that whole envelope
  // once; the next supported save reuses it rather than nesting on every reload.
  const knownInputKeys = new Set([
    'checklistData',
    'exceptions',
    'evidence',
    'prefillOwnership',
    'originalSavedInputs',
  ])
  const unknownInputs = saved && Object.keys(saved).some((key) => !knownInputKeys.has(key))
  const originalSavedInputs = loaded
    ? ownership === null || unknownInputs
      ? savedInputs
      : (saved?.originalSavedInputs ?? savedInputs)
    : undefined
  return {
    checklistData: data,
    prefillOwnership: ownership ?? {
      version: 1,
      untouchedInserted: loaded ? [] : inserted,
      cleared: false,
      inheritedOriginUnknown: loaded,
    },
    originalSavedInputs,
    lastClearCount: null,
  }
}

/** A real edit releases ownership even when a later edit restores equal bytes. */
export function editAuditDraft(
  previous: AuditPrefillDraft,
  update: (data: ArtifactFormData) => ArtifactFormData,
  edit: ArtifactFieldEdit
): AuditPrefillDraft {
  return {
    ...previous,
    checklistData: update(previous.checklistData),
    prefillOwnership: {
      ...previous.prefillOwnership,
      untouchedInserted: previous.prefillOwnership.untouchedInserted.filter(
        (token) =>
          !(
            token.sectionId === edit.sectionId &&
            token.fieldId === edit.fieldId &&
            (edit.optionValue === undefined || token.optionValue === edit.optionValue)
          )
      ),
    },
  }
}

export function clearAuditPrefill(previous: AuditPrefillDraft): AuditPrefillDraft {
  const data = { ...previous.checklistData }
  let removed = 0
  for (const token of previous.prefillOwnership.untouchedInserted) {
    const row = data[token.sectionId]
    const selected = row?.[token.fieldId]
    if (!Array.isArray(selected) || !selected.includes(token.optionValue)) continue
    data[token.sectionId] = {
      ...row,
      [token.fieldId]: selected.filter((value) => value !== token.optionValue),
    }
    removed++
  }
  return {
    ...previous,
    checklistData: data,
    prefillOwnership: { ...previous.prefillOwnership, untouchedInserted: [], cleared: true },
    lastClearCount: removed,
  }
}
