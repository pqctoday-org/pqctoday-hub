// SPDX-License-Identifier: AGPL-3.0-only
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

/**
 * What the drawer can show. There are no tabs in the drawer itself: the top bar's buttons choose.
 * 'chat' is the Assistant; 'bookmarks', 'glossary', 'guide' (the page's guide), 'sources' (the
 * page's sources) and 'faq' open from the top bar, one at a time; 'workshop' only while a guided
 * workshop runs. (The old 'history' view moved to Learn › Your journey.)
 */
export type RightPanelTab =
  'chat' | 'bookmarks' | 'glossary' | 'guide' | 'sources' | 'faq' | 'workshop'

/** The views the top bar's toggle buttons open in the drawer. */
export type DrawerToggleTab = Exclude<RightPanelTab, 'workshop'>
