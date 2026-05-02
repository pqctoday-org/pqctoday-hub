// SPDX-License-Identifier: GPL-3.0-only
import type { PersonaId } from '@/data/learningPersonas'
import type { ExperienceLevel } from '@/store/usePersonaStore'

export type WorkshopRegion = 'US' | 'CA' | 'AU' | 'EU' | 'UK' | 'JP' | 'OTHER'

export type WorkshopChapterKind = 'intro' | 'prereq' | 'foundations' | 'region' | 'action' | 'close'

export type WorkshopCue =
  | { tMs: number; kind: 'navigate'; route: string; query?: Record<string, string> }
  | { tMs: number; kind: 'caption'; text: string }
  | { tMs: number; kind: 'spotlight'; selector: string; padding?: number }
  | {
      tMs: number
      kind: 'callout'
      selector: string
      label: string
      arrow?: 'left' | 'right' | 'top' | 'bottom'
    }
  | { tMs: number; kind: 'click'; selector: string }
  | { tMs: number; kind: 'highlight-tab'; tabName: string }
  | { tMs: number; kind: 'advance' }

export type WorkshopCompletionSignal =
  | { kind: 'route-visited'; route: string }
  | { kind: 'assessment-complete' }
  | { kind: 'bookmark-added'; surface: 'compliance' | 'leaders' | 'library' | 'timeline' }
  | { kind: 'module-progress'; moduleId: string; minSteps: number }
  | { kind: 'filter-applied'; surface: 'threats' | 'leaders' | 'compliance'; key: string }

export interface WorkshopStep {
  id: string
  chapter: WorkshopChapterKind
  region?: WorkshopRegion
  title: string
  estMinutes: number
  whyItMatters: string
  page: { route: string; query?: Record<string, string> }
  tasks: string[]
  expectedOutput: string
  narration: string
  completionSignal?: WorkshopCompletionSignal
  cues?: WorkshopCue[]
}

export interface WorkshopChapter {
  id: string
  title: string
  estMinutes: number
  steps: WorkshopStep[]
}

export interface FlowMatch {
  roles: PersonaId[] | '*'
  proficiencies: ExperienceLevel[] | '*'
  industries: string[] | '*'
  regions: WorkshopRegion[] | '*'
}

export interface WorkshopFlow {
  id: string
  title: string
  match: FlowMatch
  totalEstMinutes: number
  intro: WorkshopChapter
  prerequisites: WorkshopChapter
  common: WorkshopChapter[]
  regions?: Partial<Record<WorkshopRegion, WorkshopChapter>>
  close: WorkshopChapter
}

export interface ResolvedFlowContext {
  role: PersonaId
  proficiency: ExperienceLevel
  industry: string
  region: WorkshopRegion
}
