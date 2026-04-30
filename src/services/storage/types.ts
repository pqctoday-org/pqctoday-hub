// SPDX-License-Identifier: GPL-3.0-only
export interface StoredKeyPair {
  id: string
  name: string
  algorithm: string
  keySize: number
  created: number
  publicKey: string // PEM format
  privateKey?: string // Optional, encrypted or omitted
  description?: string
}

export interface StoredCertificate {
  id: string
  name: string
  pem: string
  created: number
  metadata: {
    subject: string
    issuer: string
    serial: string
    notBefore: number
    notAfter: number
  }
  tags: string[]
  keyPairId?: string
}

export interface StoredCSR {
  id: string
  name: string
  pem: string
  created: number
  keyPairId?: string
}

export type ExecutiveDocumentType =
  | 'roi-model'
  | 'risk-register'
  | 'raci-matrix'
  | 'vendor-scorecard'
  | 'policy-draft'
  | 'compliance-checklist'
  | 'audit-checklist'
  | 'compliance-timeline'
  | 'board-deck'
  | 'contract-clause'
  | 'kpi-dashboard'
  | 'migration-roadmap'
  | 'stakeholder-comms'
  | 'kpi-tracker'
  | 'risk-treatment-plan'
  | 'crqc-scenario'
  | 'supply-chain-matrix'
  | 'deployment-playbook'
  | 'crypto-architecture'
  | 'management-tools-audit'
  | 'crypto-cbom'
  | 'crypto-vulnerability-watch'

export interface ExecutiveDocumentRevision {
  /** Unix ms when this revision was recorded. */
  updatedAt: number
  /** Optional human summary of what changed (e.g. "Re-ran with new compliance frameworks"). */
  summary?: string
}

/**
 * Approval workflow state. Pre-existing artifacts default to `'draft'` via
 * the v14 store migration; new artifacts also start at `'draft'`. The user
 * advances through review → approved manually from the artifact drawer.
 */
export type ExecutiveDocumentApprovalStatus = 'draft' | 'in-review' | 'approved'

export interface ExecutiveDocument {
  id: string
  moduleId: string
  type: ExecutiveDocumentType
  title: string
  data: string
  createdAt: number
  /** Last edit time. Defaults to `createdAt` when omitted. The store
   *  populates this on `addExecutiveDocument` if the caller didn't set it. */
  updatedAt?: number
  /** Append-only revision log. Empty for documents that have never been
   *  re-saved. Each entry corresponds to one `updateExecutiveDocument` call. */
  revisions?: ExecutiveDocumentRevision[]
  /** Approval workflow state. Defaults to 'draft' for new + migrated docs. */
  approvalStatus?: ExecutiveDocumentApprovalStatus
  /** Free-text reviewer name; populated when status moves to 'in-review' or 'approved'. */
  reviewer?: string
  /** Unix ms when status moved to 'approved'. */
  approvedAt?: number
  // Serialized builder form state so Edit can restore prior inputs.
  // Shape is builder-specific and opaque to the store.
  inputs?: unknown
}

export interface LearningProgress {
  version: string // Format version for compatibility
  timestamp: number // Last save timestamp

  // Module completion
  modules: {
    [moduleId: string]: {
      status: 'not-started' | 'in-progress' | 'completed'
      lastVisited: number
      timeSpent: number // Seconds
      completedSteps: string[]
      quizScores: { [quizId: string]: number }
      learnSectionChecks?: Record<string, boolean> // sectionId → manually checked by user
    }
  }

  // Generated artifacts (keys, certs, CSRs, executive documents)
  artifacts: {
    keys: StoredKeyPair[]
    certificates: StoredCertificate[]
    csrs: StoredCSR[]
    executiveDocuments?: ExecutiveDocument[]
  }

  // EJBCA connections (if used)
  ejbcaConnections: {
    [name: string]: {
      url: string
      lastUsed: number
      // No credentials stored!
    }
  }

  // User preferences
  preferences: {
    theme: 'light' | 'dark'
    defaultKeyType: string
    autoSave: boolean
  }

  // Learning notes
  notes: {
    [moduleId: string]: string
  }

  // Session and streak tracking
  sessionTracking?: {
    firstVisit: number // ms timestamp of first ever visit
    lastVisitDate: string // 'YYYY-MM-DD' of last app open
    totalSessions: number // incremented once per calendar day
    currentStreak: number // consecutive days with at least one visit
    longestStreak: number // all-time best streak
    visitDates: string[] // last 30 YYYY-MM-DD strings (sliding window)
    lastGapDays?: number // days since previous visit when this session started (v8)
  }

  // Cumulative quiz mastery — union of correctly-answered question IDs across all sessions
  quizMastery?: {
    correctQuestionIds: string[]
  }

  // Risk score history for Command Center KPI trending (cap 30 snapshots)
  kpiHistory?: {
    riskScore: { ts: number; score: number }[]
  }
}
