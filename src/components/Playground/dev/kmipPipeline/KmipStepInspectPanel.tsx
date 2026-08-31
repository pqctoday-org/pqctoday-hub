// SPDX-License-Identifier: GPL-3.0-only
/**
 * KmipStepInspectPanel — opt-in real-data view for one KMIP pipeline step,
 * fed by the ###STEP <id> detail### line kmipPipelineCodegen.ts now emits.
 * `detail.tree` is the step's real decoded KMIP response (namedResponseTree,
 * a TtlvNode) — rendered through the SAME WireTreeView the manual Agility
 * Workbench inspector uses, not a second decoder.
 */
import type { TtlvNode } from '../../../../wasm/kmip/kmipEngine'
import type { StepDetail } from '../pipeline/pipelineCodegen'
import { WireTreeView } from '../../kmip/WireTreeView'
import { ErrorDetailPanel } from '../../../shared/ErrorDetailPanel'

export function KmipStepInspectPanel({ detail }: { detail: StepDetail }) {
  const tree = (detail.tree as TtlvNode | null | undefined) ?? null

  if (detail.kind === 'error') {
    return (
      <>
        <ErrorDetailPanel
          excType={detail.excType}
          message={detail.message}
          traceback={detail.traceback}
        />
        {tree && (
          <div className="mt-2">
            <WireTreeView root={tree} />
          </div>
        )}
      </>
    )
  }

  if (!tree) return null

  return (
    <div className="mt-2">
      <WireTreeView root={tree} />
    </div>
  )
}
