// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { Users, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Props {
  onNavigateToWorkshop: () => void
}

const PROMPTS = [
  'Name the single accountable owner of your PQC program. If you can’t, that is your first gap.',
  'Count engineers who touch crypto, divide by 500, round up — that is your Crypto Champion target.',
  'For each capability (discovery, architecture, tooling), decide Build, Borrow, or Buy and write why.',
  'Identify one team with no Crypto Champion today and nominate a candidate.',
]

export const PQCTeamExercises: React.FC<Props> = ({ onNavigateToWorkshop }) => (
  <div className="space-y-6">
    <section className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Users size={24} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-gradient">Reflection Exercises</h2>
      </div>
      <ol className="space-y-3 list-decimal pl-5 text-sm text-foreground/80">
        {PROMPTS.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ol>
      <div className="mt-5">
        <Button
          variant="gradient"
          onClick={onNavigateToWorkshop}
          className="inline-flex items-center gap-2"
        >
          Open the Sizing Calculator <ArrowRight size={16} />
        </Button>
      </div>
    </section>
  </div>
)
