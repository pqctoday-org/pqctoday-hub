// SPDX-License-Identifier: GPL-3.0-only
/**
 * Lossless merge of two LearningProgress slices (B1 #3 — two-device sync).
 *
 * Decision (2026-06-16): when a device pulls a remote snapshot, progress must be
 * MERGED, never overwritten — so two devices can each make progress offline and
 * neither loses it on the next sync. Learning progress is monotonic/additive, so
 * the merge is well-defined and cannot lose data:
 *   - completedSteps / quizMastery / artifacts / visitDates → UNION
 *   - timeSpent / quizScores / streaks / sessions → MAX
 *   - status → most-advanced (completed > in-progress > not-started)
 *   - lastVisited / lastVisitDate / timestamp → latest; firstVisit → earliest
 *
 * Pure function — no store access — so it's unit-testable in isolation. Applied
 * at the remote-restore seam (the embed sync); manual file import stays an
 * explicit overwrite.
 */
import type { LearningProgress } from './types'

type Modules = LearningProgress['modules']
type ModuleEntry = Modules[string]

function statusRank(s: ModuleEntry['status']): number {
  return s === 'completed' ? 2 : s === 'in-progress' ? 1 : 0
}

function mostAdvanced(a: ModuleEntry['status'], b: ModuleEntry['status']): ModuleEntry['status'] {
  return statusRank(a) >= statusRank(b) ? a : b
}

function unionStrings(a: string[] = [], b: string[] = []): string[] {
  return [...new Set([...a, ...b])]
}

/** Per-quiz max (union of quiz ids, higher score wins). */
function mergeScores(
  a: Record<string, number> = {},
  b: Record<string, number> = {}
): Record<string, number> {
  const out: Record<string, number> = { ...a }
  for (const [k, v] of Object.entries(b)) {
    // eslint-disable-next-line security/detect-object-injection -- keys are quiz ids from our own data
    out[k] = Math.max(out[k] ?? -Infinity, v)
  }
  return out
}

/** OR per section (a section checked on either device stays checked). */
function mergeChecks(
  a: Record<string, boolean> = {},
  b: Record<string, boolean> = {}
): Record<string, boolean> {
  const out: Record<string, boolean> = { ...a }
  for (const [k, v] of Object.entries(b)) {
    // eslint-disable-next-line security/detect-object-injection -- keys are section ids from our own data
    out[k] = Boolean(out[k]) || Boolean(v)
  }
  return out
}

function mergeModuleEntry(a: ModuleEntry, b: ModuleEntry): ModuleEntry {
  return {
    status: mostAdvanced(a.status, b.status),
    lastVisited: Math.max(a.lastVisited ?? 0, b.lastVisited ?? 0),
    timeSpent: Math.max(a.timeSpent ?? 0, b.timeSpent ?? 0),
    completedSteps: unionStrings(a.completedSteps, b.completedSteps),
    quizScores: mergeScores(a.quizScores, b.quizScores),
    learnSectionChecks: mergeChecks(a.learnSectionChecks, b.learnSectionChecks),
  }
}

function mergeModules(a: Modules = {}, b: Modules = {}): Modules {
  const out: Modules = {}
  for (const id of new Set([...Object.keys(a), ...Object.keys(b)])) {
    // eslint-disable-next-line security/detect-object-injection -- keys are module ids from our own data
    const la = a[id]
    // eslint-disable-next-line security/detect-object-injection -- keys are module ids from our own data
    const rb = b[id]
    // eslint-disable-next-line security/detect-object-injection -- keys are module ids from our own data
    out[id] = la && rb ? mergeModuleEntry(la, rb) : (la ?? rb)
  }
  return out
}

/** Union two arrays of objects by a key getter (last-seen wins on collision). */
function unionBy<T>(a: T[] = [], b: T[] = [], key: (x: T) => string): T[] {
  const map = new Map<string, T>()
  for (const item of [...a, ...b]) map.set(key(item), item)
  return [...map.values()]
}

function mergeArtifacts(
  a: LearningProgress['artifacts'],
  b: LearningProgress['artifacts']
): LearningProgress['artifacts'] {
  const id = (x: { id?: string }) => x.id ?? ''
  return {
    keys: unionBy(a?.keys, b?.keys, id),
    certificates: unionBy(a?.certificates, b?.certificates, id),
    csrs: unionBy(a?.csrs, b?.csrs, id),
    executiveDocuments: unionBy(
      a?.executiveDocuments,
      b?.executiveDocuments,
      (d) => `${d.moduleId}::${d.type}`
    ),
  }
}

function mergeSession(
  a: LearningProgress['sessionTracking'],
  b: LearningProgress['sessionTracking']
): LearningProgress['sessionTracking'] {
  if (!a) return b
  if (!b) return a
  const visitDates = unionStrings(a.visitDates, b.visitDates).sort().slice(-30)
  return {
    firstVisit: Math.min(a.firstVisit, b.firstVisit),
    lastVisitDate: a.lastVisitDate >= b.lastVisitDate ? a.lastVisitDate : b.lastVisitDate,
    totalSessions: Math.max(a.totalSessions, b.totalSessions),
    currentStreak: Math.max(a.currentStreak, b.currentStreak),
    longestStreak: Math.max(a.longestStreak, b.longestStreak),
    visitDates,
    lastGapDays:
      (a.lastVisitDate >= b.lastVisitDate ? a.lastGapDays : b.lastGapDays) ?? a.lastGapDays,
  }
}

/** Merge `local` and `remote` progress losslessly. Neither side's progress is lost. */
export function mergeModuleProgress(
  local: LearningProgress,
  remote: LearningProgress
): LearningProgress {
  // version: keep the most recent (higher major) so a merge never downgrades.
  const major = (v: string) => parseInt(String(v).split('.')[0], 10) || 0
  return {
    version: major(local.version) >= major(remote.version) ? local.version : remote.version,
    timestamp: Math.max(local.timestamp ?? 0, remote.timestamp ?? 0),
    modules: mergeModules(local.modules, remote.modules),
    artifacts: mergeArtifacts(local.artifacts, remote.artifacts),
    // Settings/connections: remote (the synced source) wins per-key, local fills gaps.
    ejbcaConnections: { ...local.ejbcaConnections, ...remote.ejbcaConnections },
    preferences: { ...local.preferences, ...remote.preferences },
    // Notes: union by module; on collision keep the longer (more content) note.
    notes: mergeNotes(local.notes, remote.notes),
    sessionTracking: mergeSession(local.sessionTracking, remote.sessionTracking),
    quizMastery: {
      correctQuestionIds: unionStrings(
        local.quizMastery?.correctQuestionIds,
        remote.quizMastery?.correctQuestionIds
      ),
    },
    kpiHistory: {
      riskScore: unionBy(local.kpiHistory?.riskScore, remote.kpiHistory?.riskScore, (p) =>
        String(p.ts)
      )
        .sort((x, y) => x.ts - y.ts)
        .slice(-30),
    },
  }
}

function mergeNotes(
  a: LearningProgress['notes'] = {},
  b: LearningProgress['notes'] = {}
): LearningProgress['notes'] {
  const out: LearningProgress['notes'] = { ...a }
  for (const [k, v] of Object.entries(b)) {
    // eslint-disable-next-line security/detect-object-injection -- keys are module ids from our own data
    const existing = out[k]
    // eslint-disable-next-line security/detect-object-injection -- keys are module ids from our own data
    out[k] = !existing || v.length > existing.length ? v : existing
  }
  return out
}
