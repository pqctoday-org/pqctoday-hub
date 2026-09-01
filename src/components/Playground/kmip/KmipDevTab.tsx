// SPDX-License-Identifier: GPL-3.0-only
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../ui/tabs'
import type { KmipEngine } from '@/wasm/kmip/kmipEngine'
import { KmipPipelineBuilder } from '../dev/kmipPipeline/KmipPipelineBuilder'
import { CorpusReplayView } from './CorpusReplayView'

export type KmipDevSubTab = 'pipeline' | 'corpus'

/**
 * The KMIP3.0 plane's "Dev" sub-tab shell: the KMIP pipeline builder and the
 * OASIS corpus replay harness — previously a top-level "Developer" plane
 * (KmipPipelineBuilder alone) and a separate KMIP3.0 sub-tab (Corpus Replay)
 * respectively, folded together here as the engineering-workbench surfaces
 * they both are, mirroring the PKCS#11 side's DeveloperTab.tsx (Pipeline /
 * ACVP / Conformance).
 *
 * Unlike DeveloperTab.tsx, there is no per-sub-tab persona gating here —
 * Kmip3View hides this whole "Dev" outer sub-tab (trigger and content) for
 * curious/executive personas instead, since Pipeline and Corpus Replay are
 * both workbench tools together, not a baseline tool plus advanced add-ons.
 */
export const KmipDevTab = ({ engine }: { engine: KmipEngine }) => {
  return (
    <Tabs defaultValue="pipeline">
      <TabsList data-tour="kmip-dev-subtabs">
        <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
        <TabsTrigger value="corpus">Corpus Replay</TabsTrigger>
      </TabsList>
      <TabsContent value="pipeline">
        <KmipPipelineBuilder engine={engine} />
      </TabsContent>
      <TabsContent value="corpus">
        <CorpusReplayView />
      </TabsContent>
    </Tabs>
  )
}
