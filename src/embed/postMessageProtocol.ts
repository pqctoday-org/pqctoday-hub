// SPDX-License-Identifier: GPL-3.0-only

/**
 * postMessage protocol types for the PQC Today embed ↔ parent communication.
 *
 * See PRD §9.3–9.4 for the full protocol specification.
 */

// ---------------------------------------------------------------------------
// App → Parent messages
// ---------------------------------------------------------------------------

export interface PqcReadyMessage {
  type: 'pqc:ready'
}

export interface PqcLoadMessage {
  type: 'pqc:load'
  userId: string
}

export interface PqcSaveMessage {
  type: 'pqc:save'
  userId: string
  snapshot: unknown // AppSnapshot — kept as unknown to avoid coupling
}

export interface PqcEventMessage {
  type: 'pqc:event'
  userId: string
  events: unknown[] // HistoryEvent[]
}

export interface PqcResizeMessage {
  type: 'pqc:resize'
  height: number
}

export interface PqcAuthExpiredMessage {
  type: 'pqc:authExpired'
  userId: string
}

// ---------------------------------------------------------------------------
// Parent → App messages
// ---------------------------------------------------------------------------

export interface PqcAuthMessage {
  type: 'pqc:auth'
  token: string
}

export interface PqcLoadResponseMessage {
  type: 'pqc:loadResponse'
  snapshot: unknown | null // AppSnapshot | null
}

// ---------------------------------------------------------------------------
// Union types
// ---------------------------------------------------------------------------

/** Messages sent from the embedded app to the parent window. */
export type PqcAppToParentMessage =
  | PqcReadyMessage
  | PqcLoadMessage
  | PqcSaveMessage
  | PqcEventMessage
  | PqcResizeMessage
  | PqcAuthExpiredMessage

/** Messages sent from the parent window to the embedded app. */
export type PqcParentToAppMessage = PqcAuthMessage | PqcLoadResponseMessage

/** All PQC embed postMessage types. */
export type PqcMessage = PqcAppToParentMessage | PqcParentToAppMessage

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const PQC_MESSAGE_TYPES = [
  'pqc:ready',
  'pqc:load',
  'pqc:save',
  'pqc:event',
  'pqc:resize',
  'pqc:authExpired',
  'pqc:auth',
  'pqc:loadResponse',
] as const

export type PqcMessageType = (typeof PQC_MESSAGE_TYPES)[number]

// ---------------------------------------------------------------------------
// Type guard
// ---------------------------------------------------------------------------

/** Check if an unknown postMessage payload is a PQC embed message. */
export function isPqcMessage(data: unknown): data is PqcMessage {
  if (typeof data !== 'object' || data === null) return false
  const msg = data as Record<string, unknown>
  return typeof msg.type === 'string' && PQC_MESSAGE_TYPES.includes(msg.type as PqcMessageType)
}
