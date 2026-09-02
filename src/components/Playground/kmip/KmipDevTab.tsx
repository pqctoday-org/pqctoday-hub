// SPDX-License-Identifier: GPL-3.0-only
import type { KmipEngine } from '@/wasm/kmip/kmipEngine'
import { KmipPipelineBuilder } from '../dev/kmipPipeline/KmipPipelineBuilder'

/**
 * The KMIP3.0 plane's "Dev" sub-tab shell: the KMIP pipeline builder, now
 * also hosting the OASIS conformance corpus as an alternate palette source
 * inside it (kmip3-corpus-palette-plan-09012026.md) rather than as a
 * separate sibling tab — what used to be a top-level "Developer" plane
 * (KmipPipelineBuilder alone), then a Pipeline/Corpus Replay tab pair, is
 * now one workbench with a palette switch, mirroring the PKCS#11 side's
 * DeveloperTab.tsx in spirit (Pipeline / ACVP / Conformance) without
 * needing its own sub-tab bar now that there's only one surface here.
 *
 * Kmip3View hides this whole "Dev" outer sub-tab (trigger and content) for
 * curious/executive personas — this is a workbench tool, not baseline
 * content.
 */
export const KmipDevTab = ({ engine }: { engine: KmipEngine }) => (
  <KmipPipelineBuilder engine={engine} />
)
