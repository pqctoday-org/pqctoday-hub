// SPDX-License-Identifier: AGPL-3.0-only
import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ModuleShell } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'
import { MLSIntroduction } from './components/MLSIntroduction'
import { TreeKEMVisualizer } from './workshop/TreeKEMVisualizer'
import { ProviderArchitecture } from './workshop/ProviderArchitecture'
import { MLSCryptoOperations } from './workshop/MLSCryptoOperations'
import { MLSReinitializationCheck } from './workshop/MLSReinitializationCheck'
import { useWorkshopStepAnchor } from '../../common/useWorkshopStepAnchor'

export function MLSGroupMessagingModule() {
  const [resetKey, setResetKey] = useState(0)
  useWorkshopStepAnchor(manifest.workshopSteps)
  return (
    <ModuleShell
      manifest={manifest}
      onReset={() => setResetKey((key) => key + 1)}
      learn={(api) => <MLSIntroduction onNavigateToWorkshop={() => api.goToWorkshop()} />}
      workshop={(api) => (
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-end">
            <Button
              variant="ghost"
              onClick={api.resetWorkshop}
              className="flex items-center gap-2 px-3 py-2 bg-destructive/10 text-status-error rounded hover:bg-destructive/20 transition-colors text-sm border border-destructive/20"
            >
              <Trash2 size={16} />
              Reset workshop
            </Button>
          </div>
          <MLSCryptoOperations />
          <MLSReinitializationCheck key={resetKey} />
          <div data-workshop-step="treekem">
            <TreeKEMVisualizer />
          </div>
          <div data-workshop-step="provider-arch">
            <ProviderArchitecture />
          </div>
        </div>
      )}
    />
  )
}
