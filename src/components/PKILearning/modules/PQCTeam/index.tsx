// SPDX-License-Identifier: GPL-3.0-only
/**
 * "Building Your PQC Team" module (Applied Quantum Skills appendix, p.160–164).
 * Teaches core roles, the Crypto Champion network, Build-Borrow-Buy, and a
 * 1-per-500-engineers team-sizing calculator.
 */
import type { FC } from 'react'
import { ModuleShell } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'
import { Introduction } from './components/Introduction'
import { TeamSizingCalculator } from './components/TeamSizingCalculator'
import { PQCTeamExercises } from './PQCTeamExercises'

export const PQCTeamModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description="Staff the migration: core roles, a federated Crypto Champion network, Build-Borrow-Buy, and a 1-per-500 sizing calculator."
    learn={(api) => <Introduction onNavigateToWorkshop={() => api.goToWorkshop()} />}
    workshop={
      <div className="glass-panel p-4 sm:p-6 md:p-8">
        <TeamSizingCalculator />
      </div>
    }
    exercises={(api) => <PQCTeamExercises onNavigateToWorkshop={() => api.goToWorkshop()} />}
  />
)
