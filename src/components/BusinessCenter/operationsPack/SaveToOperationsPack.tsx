// SPDX-License-Identifier: GPL-3.0-only
//
// "Save to operations pack" button for the tools whose results belong in the
// IT operations pack (capacity calculators, config generators, VPN simulator).
// Shown only to the IT Ops role, the only role whose Command Center has the
// pack, so nobody saves into a pack they cannot open.
// Saving again from the same tool and context updates the same document and
// appends a revision. "Saved" shows only while the inputs are the ones saved:
// callers pass a memoised `build` that changes whenever its inputs change.

import { useState } from 'react'
import { Link } from 'react-router'
import { Check, PackagePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { OPERATIONS_PACK_PANEL_PATH } from '@/services/operationsPack'
import { usePersonaStore } from '@/store/usePersonaStore'
import { useSaveArtifact, type SaveRequest } from '../architecturePack/saveArtifact'

interface Props {
  /** Builds the artifact from the tool's current state at click time. Memoise
   * it on the tool's inputs: a new function means unsaved changes. */
  build: () => SaveRequest
  disabled?: boolean
  /** Shown as the button's tooltip when disabled. */
  disabledReason?: string
  testId?: string
}

export function SaveToOperationsPack({ build, disabled, disabledReason, testId }: Props) {
  const isOps = usePersonaStore((s) => s.selectedPersona === 'ops')
  const save = useSaveArtifact()
  // The build function that was last saved; a different one means the
  // inputs changed since, so the button offers to save again.
  const [savedBuild, setSavedBuild] = useState<Props['build'] | null>(null)
  const saved = savedBuild === build

  if (!isOps) return null

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        disabled={disabled}
        title={disabled ? disabledReason : undefined}
        onClick={() => {
          save(build())
          setSavedBuild(() => build)
        }}
        data-testid={testId ?? 'save-to-operations-pack'}
      >
        {saved ? <Check size={14} /> : <PackagePlus size={14} />}
        {saved ? 'Saved to operations pack' : 'Save to operations pack'}
      </Button>
      {saved && (
        <Link to={OPERATIONS_PACK_PANEL_PATH} className="text-[11px] text-primary hover:underline">
          Open the pack
        </Link>
      )}
    </span>
  )
}
