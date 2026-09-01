// SPDX-License-Identifier: GPL-3.0-only
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../ui/tabs'
import { usePersonaStore } from '@/store/usePersonaStore'
import { PkcsDevWorkbench } from './pipeline/PkcsDevWorkbench'
import { HsmAcvpTesting } from '../hsm/HsmAcvpTesting'
import { Pkcs11ConformanceRunner } from '../hsm/Pkcs11ConformanceRunner'

/**
 * Which content set the shared Builder/Code workbench (PkcsDevWorkbench)
 * shows — a "Test Suite" switcher, not the pipeline builder's own drag/drop
 * "palette" (pipelineCatalogMeta.ts's PaletteMeta/PaletteEntry — a
 * deliberately different word, chosen to avoid colliding with that already-
 * established term). `'pipeline'` was the pre-rename value; still accepted
 * on deep links via HsmPlayground.tsx's legacy alias, never produced fresh.
 */
export type TestSuite = 'standard' | 'acvp' | 'conformance'

interface DeveloperTabProps {
  activeSubTab: TestSuite
  onSubTabChange: (tab: TestSuite) => void
}

/**
 * The Developer tab's own sub-tab shell: the PKCS#11 sequence builder, ACVP
 * KAT validation, and PKCS#11 v3.2 conformance testing — three previously
 * separate top-level HsmPlayground tabs, folded together here as the
 * engineering-workbench surfaces they all are (2026-08-31 merge), then
 * relabeled Standard/ACVP/Conformance as a Test Suite switcher over one
 * shared Builder/Code workbench (PkcsDevWorkbench) — ACVP generalization
 * still in progress; Conformance still renders its own standalone runner.
 *
 * Labeled "Standard" — deliberately not "Builder" or "Pipeline Builder": the
 * workbench itself already has its own inner "Builder"/"Code" tabs
 * (PkcsDevWorkbench.tsx), and e2e/dev-tab-pkcs11.local.spec.ts locates those
 * via `getByRole('tab', { name: 'Builder' })` without `exact: true` —
 * Playwright's default name match is substring-based, so an outer tab named
 * "Builder" would collide with the inner one once both tablists are mounted
 * together.
 */
export const DeveloperTab = ({ activeSubTab, onSubTabChange }: DeveloperTabProps) => {
  const role = usePersonaStore((s) => s.selectedPersona)
  // ACVP/Conformance are engineering-workbench surfaces — the same gating the
  // two top-level tabs had before this merge (see HsmPlayground.tsx's
  // curious/executive checks), ported here to the sub-tab level. Gating both
  // the trigger AND the content is deliberate: HsmPlayground's own safety-net
  // effect resets `activeSubTab` back to 'standard' on a persona switch, but
  // gating the content here too means a stale/hand-crafted `dtab=acvp` deep
  // link can never render the panel even for the one render before that
  // effect fires.
  const showWorkbenchTabs = role !== 'curious' && role !== 'executive'

  return (
    <Tabs value={activeSubTab} onValueChange={(v) => onSubTabChange(v as TestSuite)}>
      <TabsList>
        <TabsTrigger value="standard">Standard</TabsTrigger>
        {showWorkbenchTabs && <TabsTrigger value="acvp">ACVP</TabsTrigger>}
        {showWorkbenchTabs && <TabsTrigger value="conformance">Conformance</TabsTrigger>}
      </TabsList>
      <TabsContent value="standard">
        <PkcsDevWorkbench suite="standard" />
      </TabsContent>
      {showWorkbenchTabs && (
        <TabsContent value="acvp">
          <HsmAcvpTesting />
        </TabsContent>
      )}
      {showWorkbenchTabs && (
        <TabsContent value="conformance">
          <Pkcs11ConformanceRunner />
        </TabsContent>
      )}
    </Tabs>
  )
}
