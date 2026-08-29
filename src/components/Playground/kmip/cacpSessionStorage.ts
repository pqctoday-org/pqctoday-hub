// SPDX-License-Identifier: GPL-3.0-only
//
// cacpSessionStorage — WS-4c (2026-08-28 gaps-remediation plan) persistence
// for the CACP playground across a page reload. Deliberately narrow: which
// preset/modules were active, the uncovered-ops mode, and at most ONE
// user-edited draft (global — not one per preset), plus the fingerprint(s)
// the modules had at save time so a restore can tell the user their policy
// moved on server-side since their last visit. Everything else (the graph's
// layout positions, simulate-tab request fields, etc.) is intentionally NOT
// persisted — this is session continuity for "what was active", not a full
// editor-state snapshot.
export interface CacpSession {
  /** The preset's `file` key (also used for a multi-module preset — see
   * `PolicyPreset.file` in kmipMeta.ts). `null` = nothing was active (the
   * built-in permissive default). */
  presetFile: string | null
  /** Set only for a multi-module preset (`PolicyPreset.files`); `null` for a
   * single-file preset or no active preset. */
  moduleFiles: string[] | null
  uncoveredOps: 'deny' | 'allow'
  /** Module fingerprint(s) at save time — one per active module, or a single
   * legacy-policy fingerprint. Compared against the fresh fingerprint(s) on
   * restore to detect the policy having changed server-side meanwhile. */
  fingerprints: string[]
  /** The one global draft slot: the last-edited YAML from the visual editor,
   * still un-reset. `null` when there's no unsaved edit. */
  draftYaml: string | null
  /** Which preset the draft was edited under — restored only when it matches
   * the preset this session restores to; a stale mismatch is just dropped. */
  draftPresetFile: string | null
}

const KEY = 'cacp-session-v1'

const EMPTY: CacpSession = {
  presetFile: null,
  moduleFiles: null,
  uncoveredOps: 'deny',
  fingerprints: [],
  draftYaml: null,
  draftPresetFile: null,
}

export function loadCacpSession(): CacpSession {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...EMPTY }
    return { ...EMPTY, ...(JSON.parse(raw) as Partial<CacpSession>) }
  } catch {
    return { ...EMPTY }
  }
}

function write(session: CacpSession): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(session))
  } catch {
    // Private-browsing quota, or localStorage unavailable entirely — session
    // continuity is a convenience, not a correctness requirement, so this
    // fails silently rather than surfacing an error the user can't act on.
  }
}

/** Call after a preset/module set successfully activates. Replaces the whole
 * session — a freshly-loaded preset has no unsaved draft yet. */
export function saveCacpPresetSession(args: {
  presetFile: string | null
  moduleFiles: string[] | null
  uncoveredOps: 'deny' | 'allow'
  fingerprints: string[]
}): void {
  write({ ...args, draftYaml: null, draftPresetFile: null })
}

/** Call on every debounced edit-apply in the visual editor. Merges into
 * whatever session is already stored without disturbing the preset/module
 * fields alongside it. */
export function saveCacpDraft(presetFile: string | null, yaml: string): void {
  write({ ...loadCacpSession(), draftYaml: yaml, draftPresetFile: presetFile })
}

/** Call when the user resets the graph back to the pristine preset — the
 * edit is gone, so the draft slot should be too. */
export function clearCacpDraft(): void {
  write({ ...loadCacpSession(), draftYaml: null, draftPresetFile: null })
}
