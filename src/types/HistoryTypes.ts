// SPDX-License-Identifier: GPL-3.0-only
export type HistoryEventType =
  | 'module_started'
  | 'module_completed'
  | 'step_completed'
  | 'artifact_key'
  | 'artifact_cert'
  | 'artifact_csr'
  | 'artifact_executive'
  | 'quiz_session'
  | 'assessment_started'
  | 'assessment_completed'
  | 'tls_simulation'
  | 'persona_set'
  | 'daily_visit'
  | 'belt_earned'
  | 'streak_milestone'
  | 'migrate_product_selection'
  | 'compliance_framework_selection'
  | 'page_view'

export interface HistoryEvent {
  id: string
  type: HistoryEventType
  timestamp: number
  title: string
  detail?: string
  moduleId?: string
  route?: string
  meta?: Record<string, string | number | boolean>
}

export type RightPanelTab = 'chat' | 'history' | 'bookmarks' | 'faq' | 'workshop' | 'workshop'
