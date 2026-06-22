// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ModuleShell } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'
import { MLSIntroduction } from './components/MLSIntroduction'
import { TreeKEMVisualizer } from './workshop/TreeKEMVisualizer'
import { ProviderArchitecture } from './workshop/ProviderArchitecture'
import { MLSCryptoOperations } from './workshop/MLSCryptoOperations'

export const MLSGroupMessagingModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    learn={(api) => <MLSIntroduction onNavigateToWorkshop={() => api.goToWorkshop()} />}
    workshop={(api) => (
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-end">
          <Button
            variant="ghost"
            onClick={api.resetWorkshop}
            className="flex items-center gap-2 px-3 py-2 bg-destructive/10 text-destructive rounded hover:bg-destructive/20 transition-colors text-sm border border-destructive/20"
          >
            <Trash2 size={16} />
            Reset
          </Button>
        </div>
        <MLSCryptoOperations />
        <TreeKEMVisualizer />
        <ProviderArchitecture />
      </div>
    )}
  />
)
