// SPDX-License-Identifier: GPL-3.0-only
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FilterDropdown } from '@/components/common/FilterDropdown'
import { useModuleStore } from '@/store/useModuleStore'
import { checklistFor } from '@/data/migrationTestChecklist'
import {
  TEST_RESULT_LABELS,
  testPlanFromChecklist,
  testPlanMarkdown,
  type TestPlanInputs,
  type TestResult,
} from '@/services/architectureArtifacts'
import { ARCHITECTURE_PACK_MODULE_ID, useSaveArtifact } from './saveArtifact'

const RESULT_ITEMS = (Object.keys(TEST_RESULT_LABELS) as TestResult[]).map((id) => ({
  id,
  label: TEST_RESULT_LABELS[id],
}))

export function TestPlanEditor() {
  const saved = useModuleStore((s) =>
    (s.artifacts.executiveDocuments ?? []).find(
      (d) => d.moduleId === ARCHITECTURE_PACK_MODULE_ID && d.type === 'architecture-test-plan'
    )
  )
  const [plan, setPlan] = useState<TestPlanInputs>(
    () =>
      (saved?.inputs as TestPlanInputs | undefined) ??
      testPlanFromChecklist(checklistFor('architect'))
  )
  const [newLine, setNewLine] = useState('')
  const [note, setNote] = useState<string | null>(null)
  const save = useSaveArtifact()

  const setLine = (i: number, patch: Partial<TestPlanInputs['lines'][number]>) =>
    setPlan((p) => ({ lines: p.lines.map((l, k) => (k === i ? { ...l, ...patch } : l)) }))

  const addLine = () => {
    const text = newLine.trim()
    if (!text) return
    setPlan((p) => ({
      lines: [...p.lines, { id: `custom-${Date.now()}`, text, owner: '', result: 'not-run' }],
    }))
    setNewLine('')
  }

  const onSave = () => {
    save({
      type: 'architecture-test-plan',
      moduleId: ARCHITECTURE_PACK_MODULE_ID,
      title: 'Architecture test plan',
      data: testPlanMarkdown(plan),
      inputs: plan,
      revisionSummary: saved ? 'Test plan updated' : undefined,
    })
    setNote('Test plan saved.')
  }

  return (
    <div className="space-y-3" data-testid="architecture-test-plan-editor">
      <ol className="space-y-2">
        {plan.lines.map((l, i) => (
          <li
            key={l.id}
            className="grid grid-cols-1 items-center gap-2 border-b border-border/50 pb-2 text-xs md:grid-cols-[1fr_10rem_9rem]"
          >
            <span>
              {i + 1}. {l.text}
            </span>
            <Input
              value={l.owner}
              onChange={(e) => setLine(i, { owner: e.target.value })}
              placeholder="Owner"
              aria-label={`Owner of check ${i + 1}`}
              className="h-7 text-xs"
            />
            <FilterDropdown
              items={RESULT_ITEMS}
              selectedId={l.result}
              onSelect={(id) => setLine(i, { result: id as TestResult })}
              ariaLabel={`Result of check ${i + 1}`}
              size="sm"
              noContainer
              hideDefaultOption
            />
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={newLine}
          onChange={(e) => setNewLine(e.target.value)}
          placeholder="Add your own check"
          aria-label="New check"
          className="h-8 max-w-md text-xs"
        />
        <Button size="sm" variant="outline" className="h-8 gap-1 text-[11px]" onClick={addLine}>
          <Plus size={12} /> Add
        </Button>
      </div>
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          variant="outline"
          onClick={onSave}
          data-testid="architecture-test-plan-save"
        >
          Save test plan
        </Button>
        {note && <span className="text-[11px] text-status-success">{note}</span>}
      </div>
    </div>
  )
}
