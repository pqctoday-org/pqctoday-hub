// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useState } from 'react'
import type { WorkshopFixtures, WorkshopFlow } from '@/types/Workshop'

/**
 * Loads per-flow fixtures (used by Video Mode auto-fill cues and the
 * Workshop Mode manual cue stepper). Tries inline `flow.fixtures` first,
 * then fetches from `flow.fixturesUrl` (relative to public/). Returns
 * an empty object on miss — fill cues silently no-op when a key is absent.
 */
export function useWorkshopFixtures(flow: WorkshopFlow | null): WorkshopFixtures {
  // Inline fixtures resolve synchronously — never go through state.
  const inline = flow?.fixtures ?? null
  const url = !inline ? (flow?.fixturesUrl ?? null) : null

  const [remote, setRemote] = useState<WorkshopFixtures>({})

  useEffect(() => {
    if (!url) return
    let cancelled = false
    fetch(url)
      .then((r) => (r.ok ? r.json() : {}))
      .then((data) => {
        if (cancelled) return
        const clean: WorkshopFixtures = {}
        for (const [k, v] of Object.entries(data ?? {})) {
          if (k.startsWith('$') || k.startsWith('_')) continue
          if (v && typeof v === 'object') clean[k] = v as Record<string, never>
        }
        setRemote(clean)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [url])

  return inline ?? remote
}
