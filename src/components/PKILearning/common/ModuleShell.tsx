// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
/**
 * ModuleShell — the shared chrome every learn module copy-pastes today: the
 * gradient header, the ModuleTabBar, the data-driven Visual/References/Tools
 * tabs, and the workshop stepper (progress dots, step header, prev/next/
 * complete). Reproduced verbatim from the golden master (modules/HsmPqc) so a
 * module that adopts it renders identically.
 *
 * Module-specific content is supplied via slots:
 *  - `learn` / `exercises`: the tab bodies (Learn is glossary-wrapped here)
 *  - `workshopParts` + `renderWorkshopStep`: the workshop steps + their bodies
 *  - `children`: for `custom` modules (Quiz) that own their whole body
 *
 * Header text is a slot (`title`/`description`) defaulting to the manifest —
 * because a module's in-page header often differs from its catalog description.
 */
import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Trash2 } from 'lucide-react'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ModuleTabBar } from './ModuleTabBar'
import { ModuleVisualTab } from './ModuleVisualTab'
import { ModuleReferencesTab } from './ModuleReferencesTab'
import { ModuleMigrateTab } from './ModuleMigrateTab'
import { WorkshopStepHeader } from './WorkshopStepHeader'
import { GlossaryAutoWrap } from './GlossaryAutoWrap'
import { useModuleProgress } from './useModuleProgress'
import { STANDARD_TABS, type ModuleManifest } from '../manifest/types'

export interface WorkshopPart {
  id: string
  title: string
  description: string
  icon: LucideIcon
}

/** Handlers the shell exposes to function slots so Learn/Exercises content can
 *  drive navigation owned by the shell's progress hook (the per-module
 *  onNavigateToWorkshop / onSetWorkshopConfig callbacks). */
export interface ModuleSlotApi {
  /** complete the current tab and jump to the Workshop tab */
  goToWorkshop: () => void
  /** complete the current tab and jump to a named tab */
  goToTab: (tab: string) => void
  /** open the Workshop at a specific step (remounts the step body) */
  openWorkshopStep: (index: number) => void
}

/** A tab body: a static node, or a function given the nav API. */
export type ModuleSlot = ReactNode | ((api: ModuleSlotApi) => ReactNode)

export interface ModuleShellProps {
  manifest: ModuleManifest
  /** header title; defaults to manifest.title */
  title?: ReactNode
  /** header description; defaults to manifest.description (often overridden) */
  description?: ReactNode
  /** Learn tab body (wrapped in GlossaryAutoWrap by the shell) */
  learn?: ModuleSlot
  /** Exercises tab body */
  exercises?: ModuleSlot
  /** workshop stepper parts (omit for modules with no workshop) */
  workshopParts?: WorkshopPart[]
  /** renders the active workshop step body, keyed by configKey for remounts */
  renderWorkshopStep?: (index: number, configKey: number) => ReactNode
  /** custom modules (Quiz) render their own body — no tabs */
  children?: ReactNode
}

interface WorkshopStepperProps {
  moduleId: string
  parts: WorkshopPart[]
  currentPart: number
  configKey: number
  onPartChange: (index: number) => void
  onReset: () => void
  onComplete: (stepId: string) => void
  renderStep: (index: number, configKey: number) => ReactNode
}

function WorkshopStepper({
  moduleId,
  parts,
  currentPart,
  configKey,
  onPartChange,
  onReset,
  onComplete,
  renderStep,
}: WorkshopStepperProps) {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-end">
        <Button
          variant="ghost"
          onClick={onReset}
          className="flex items-center gap-2 px-3 py-2 bg-destructive/10 text-destructive rounded hover:bg-destructive/20 transition-colors text-sm border border-destructive/20"
        >
          <Trash2 size={16} />
          Reset
        </Button>
      </div>

      <div className="overflow-x-auto px-2 sm:px-0">
        <div className="flex justify-evenly relative min-w-0">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -z-10 hidden sm:block" />
          {parts.map((part, idx) => {
            const Icon = part.icon
            return (
              <Button
                variant="ghost"
                key={part.id}
                onClick={() => onPartChange(idx)}
                className={`flex flex-col items-center gap-1 group px-1 sm:px-2 py-1 h-auto ${idx === currentPart ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors bg-background font-bold
                    ${
                      idx === currentPart
                        ? 'border-primary text-primary shadow-[0_0_15px_hsl(var(--primary)/0.3)]'
                        : idx < currentPart
                          ? 'border-success text-success'
                          : 'border-border text-muted-foreground'
                    }`}
                >
                  <Icon size={16} />
                </div>
                <span className="text-sm font-medium hidden md:block">
                  {part.title.split(':')[0]}
                </span>
              </Button>
            )
          })}
        </div>
      </div>

      <div className="glass-panel p-4 sm:p-6 md:p-8 min-h-[400px] md:min-h-[600px] animate-fade-in">
        <WorkshopStepHeader
          moduleId={moduleId}
          stepId={parts[currentPart].id}
          stepTitle={parts[currentPart].title}
          stepDescription={parts[currentPart].description}
          stepIndex={currentPart}
          totalSteps={parts.length}
          steps={parts.map((p) => ({ id: p.id, label: p.title }))}
          onStepClick={onPartChange}
        />
        {renderStep(currentPart, configKey)}
      </div>

      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <Button
          variant="ghost"
          onClick={() => onPartChange(Math.max(0, currentPart - 1))}
          disabled={currentPart === 0}
          className="px-6 py-3 min-h-[44px] rounded-lg border border-border hover:bg-muted disabled:opacity-50 transition-colors text-foreground"
          data-workshop-target="learn-stepper-prev"
        >
          &larr; Previous Step
        </Button>
        {currentPart === parts.length - 1 ? (
          <Button
            variant="gradient"
            onClick={() => onComplete(parts[currentPart].id)}
            className="px-6 py-3 min-h-[44px] font-bold rounded-lg transition-colors"
            data-workshop-target="learn-stepper-complete"
          >
            Complete Module
          </Button>
        ) : (
          <Button
            variant="gradient"
            onClick={() => onPartChange(currentPart + 1)}
            className="px-6 py-3 min-h-[44px] font-bold rounded-lg transition-colors"
            data-workshop-target="learn-stepper-next"
          >
            Next Step &rarr;
          </Button>
        )}
      </div>
    </div>
  )
}

export const ModuleShell = ({
  manifest,
  title,
  description,
  learn,
  exercises,
  workshopParts,
  renderWorkshopStep,
  children,
}: ModuleShellProps) => {
  const parts = workshopParts ?? []
  const {
    activeTab,
    handleTabChange,
    navigateToTab,
    currentPart,
    setCurrentPart,
    configKey,
    bumpConfig,
    handlePartChange,
    handleReset,
    completeStep,
    workshopDot,
  } = useModuleProgress(manifest.id, {
    steps: parts.length ? parts : manifest.workshopSteps,
    // dot tracks the canonical workshopSteps (matches the golden master), even
    // if the UI parts are wired differently
    dotSteps: manifest.workshopSteps,
    resetLabel: `Restart ${manifest.title}?`,
  })

  const slotApi: ModuleSlotApi = {
    goToWorkshop: () => navigateToTab('workshop'),
    goToTab: navigateToTab,
    openWorkshopStep: (index) => {
      setCurrentPart(index)
      bumpConfig()
    },
  }
  const resolve = (slot: ModuleSlot | undefined): ReactNode =>
    typeof slot === 'function' ? slot(slotApi) : slot

  const headerDescription = description ?? manifest.description

  const header = (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 className="text-3xl font-bold text-gradient">{title ?? manifest.title}</h1>
        {headerDescription ? (
          <p className="text-muted-foreground mt-2">{headerDescription}</p>
        ) : null}
      </div>
    </div>
  )

  // Custom modules (Quiz) own their entire body; the hook still tracks time.
  if (manifest.custom) {
    return <div className="space-y-6">{children}</div>
  }

  const tabs = manifest.tabs ?? STANDARD_TABS
  const present = new Set(tabs.map((t) => t.value))
  const barTabs = tabs.map((t) => (t.value === 'workshop' ? { ...t, hasDot: workshopDot } : t))

  return (
    <div className="space-y-6">
      {header}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <ModuleTabBar tabs={barTabs} value={activeTab} onValueChange={handleTabChange} />

        {present.has('learn') && (
          <TabsContent value="learn">
            <GlossaryAutoWrap>{resolve(learn)}</GlossaryAutoWrap>
          </TabsContent>
        )}
        {present.has('visual') && (
          <TabsContent value="visual">
            <ModuleVisualTab moduleId={manifest.id} />
          </TabsContent>
        )}
        {present.has('workshop') && parts.length > 0 && renderWorkshopStep && (
          <TabsContent value="workshop">
            <WorkshopStepper
              moduleId={manifest.id}
              parts={parts}
              currentPart={currentPart}
              configKey={configKey}
              onPartChange={handlePartChange}
              onReset={handleReset}
              onComplete={(stepId) => completeStep(stepId)}
              renderStep={renderWorkshopStep}
            />
          </TabsContent>
        )}
        {present.has('exercises') && (
          <TabsContent value="exercises">{resolve(exercises)}</TabsContent>
        )}
        {present.has('references') && (
          <TabsContent value="references">
            <ModuleReferencesTab moduleId={manifest.id} />
          </TabsContent>
        )}
        {present.has('tools') && (
          <TabsContent value="tools">
            <ModuleMigrateTab moduleId={manifest.id} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
