// SPDX-License-Identifier: GPL-3.0-only
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../ui/tabs'
import { usePersonaStore } from '@/store/usePersonaStore'
import { PkcsPipelineBuilder } from './pipeline/PkcsPipelineBuilder'
import { HsmAcvpTesting } from '../hsm/HsmAcvpTesting'
import { Pkcs11ConformanceRunner } from '../hsm/Pkcs11ConformanceRunner'

export type DeveloperSubTab = 'pipeline' | 'acvp' | 'conformance'

interface DeveloperTabProps {
  activeSubTab: DeveloperSubTab
  onSubTabChange: (tab: DeveloperSubTab) => void
}

/**
 * The Developer tab's own sub-tab shell: the PKCS#11 pipeline builder, ACVP
 * KAT validation, and PKCS#11 v3.2 conformance testing — three previously
 * separate top-level HsmPlayground tabs, folded together here as the
 * engineering-workbench surfaces they all are (2026-08-31 merge).
 *
 * Labeled "Pipeline" — deliberately not "Builder" or "Pipeline Builder": the
 * pipeline builder itself already has its own inner "Builder"/"Code" tabs
 * (PkcsPipelineBuilder.tsx), and e2e/dev-tab-pkcs11.local.spec.ts locates
 * those via `getByRole('tab', { name: 'Builder' })` without `exact: true` —
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
  // effect resets `activeSubTab` back to 'pipeline' on a persona switch, but
  // gating the content here too means a stale/hand-crafted `dtab=acvp` deep
  // link can never render the panel even for the one render before that
  // effect fires.
  const showWorkbenchTabs = role !== 'curious' && role !== 'executive'

  return (
    <Tabs value={activeSubTab} onValueChange={(v) => onSubTabChange(v as DeveloperSubTab)}>
      <TabsList>
        <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
        {showWorkbenchTabs && <TabsTrigger value="acvp">ACVP</TabsTrigger>}
        {showWorkbenchTabs && <TabsTrigger value="conformance">Conformance</TabsTrigger>}
      </TabsList>
      <TabsContent value="pipeline">
        <PkcsPipelineBuilder />
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
