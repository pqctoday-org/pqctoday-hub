// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import type { HistoryEvent } from '@/types/HistoryTypes'
import { useModuleStore } from '@/store/useModuleStore'
import { useAssessmentStore } from '@/store/useAssessmentStore'
import { useTLSStore } from '@/store/tls-learning.store'
import { usePersonaStore } from '@/store/usePersonaStore'
import { useHistoryStore } from '@/store/useHistoryStore'
import { MODULE_CATALOG } from '@/components/PKILearning/moduleData'

/**
 * Seeds history events from existing store data. Waits for all stores to finish
 * rehydrating from localStorage before reading. Guarded by the `seeded` flag —
 * calling multiple times is safe.
 */
export function seedHistoryFromStores() {
  // Wait for all persisted stores to finish hydrating before reading their state.
  // Zustand persist hydration is async — reading immediately gives INITIAL_STATE.
  const stores = [useModuleStore, useAssessmentStore, useTLSStore, usePersonaStore, useHistoryStore]
  const allHydrated = stores.every((s) =>
    (s as unknown as { persist: { hasHydrated: () => boolean } }).persist.hasHydrated()
  )

  if (!allHydrated) {
    // If not all hydrated yet, register a one-shot listener on the last one to finish
    let pendingCount = stores.filter(
      (s) => !(s as unknown as { persist: { hasHydrated: () => boolean } }).persist.hasHydrated()
    ).length

    for (const store of stores) {
      const persist = (
        store as unknown as {
          persist: { hasHydrated: () => boolean; onFinishHydration: (fn: () => void) => () => void }
        }
      ).persist
      if (!persist.hasHydrated()) {
        persist.onFinishHydration(() => {
          pendingCount--
          if (pendingCount === 0) {
            doSeed()
          }
        })
      }
    }
    return
  }

  doSeed()
}

function doSeed() {
  if (useHistoryStore.getState().seeded) return

  const seededEvents: Omit<HistoryEvent, 'id'>[] = []

  try {
    seedModuleEvents(seededEvents)
    seedAssessmentEvents(seededEvents)
    seedTLSEvents(seededEvents)
    seedPersonaEvents(seededEvents)
  } catch (error) {
    console.error('History seeding error:', error)
  }

  if (seededEvents.length > 0) {
    useHistoryStore.getState().bulkSeed(seededEvents)
  } else {
    // Mark as seeded even if no events, so we don't retry
    useHistoryStore.setState({ seeded: true })
  }
}

function seedModuleEvents(out: Omit<HistoryEvent, 'id'>[]) {
  const moduleState = useModuleStore.getState()

  // Session tracking
  if (moduleState.sessionTracking) {
    const st = moduleState.sessionTracking
    if (st.firstVisit) {
      out.push({
        type: 'daily_visit',
        timestamp: st.firstVisit,
        title: 'First visit to PQC Today',
        route: '/',
      })
    }
    if (st.visitDates) {
      for (const dateStr of st.visitDates) {
        const ts = new Date(dateStr).getTime()
        if (ts && ts !== st.firstVisit) {
          out.push({
            type: 'daily_visit',
            timestamp: ts,
            title: 'Daily visit',
            route: '/',
          })
        }
      }
    }
  }

  // Modules
  const modules = moduleState.modules ?? {}
  for (const [moduleId, mod] of Object.entries(modules)) {
    if (!mod || mod.status === 'not-started') continue

    const title = MODULE_CATALOG[moduleId]?.title ?? moduleId

    out.push({
      type: 'module_started',
      timestamp: mod.lastVisited - (mod.completedSteps.length * 60000 + 60000),
      title: `Started ${title}`,
      moduleId,
      route: `/learn/${moduleId}`,
    })

    // Step completions (approximate timestamps)
    for (let i = 0; i < mod.completedSteps.length; i++) {
      out.push({
        type: 'step_completed',
        timestamp: mod.lastVisited - (mod.completedSteps.length - i - 1) * 60000,
        title: `Completed step in ${title}`,
        detail: `Step ${i + 1} of ${mod.completedSteps.length}`,
        moduleId,
        route: `/learn/${moduleId}?tab=workshop&step=${i}`,
      })
    }

    if (mod.status === 'completed') {
      out.push({
        type: 'module_completed',
        timestamp: mod.lastVisited,
        title: `Completed ${title}`,
        moduleId,
        route: `/learn/${moduleId}`,
      })
    }
  }

  // Artifacts
  const artifacts = moduleState.artifacts ?? { keys: [], certificates: [], csrs: [] }
  for (const key of artifacts.keys ?? []) {
    out.push({
      type: 'artifact_key',
      timestamp: key.created,
      title: `Generated key: ${key.name ?? key.algorithm ?? 'key'}`,
      route: '/openssl',
    })
  }
  for (const cert of artifacts.certificates ?? []) {
    out.push({
      type: 'artifact_cert',
      timestamp: cert.created,
      title: `Generated certificate: ${cert.name ?? 'certificate'}`,
      route: '/openssl',
    })
  }
  for (const csr of artifacts.csrs ?? []) {
    out.push({
      type: 'artifact_csr',
      timestamp: csr.created,
      title: `Generated CSR: ${csr.name ?? 'CSR'}`,
      route: '/openssl',
    })
  }
  for (const doc of artifacts.executiveDocuments ?? []) {
    out.push({
      type: 'artifact_executive',
      timestamp: doc.createdAt,
      title: `Created ${doc.type}: ${doc.title}`,
      moduleId: doc.moduleId,
      route: `/learn/${doc.moduleId}?tab=workshop`,
    })
  }
}

function seedAssessmentEvents(out: Omit<HistoryEvent, 'id'>[]) {
  const assessState = useAssessmentStore.getState()

  if (assessState.assessmentStatus === 'in-progress' && assessState.lastWizardUpdate) {
    out.push({
      type: 'assessment_started',
      timestamp: new Date(assessState.lastWizardUpdate).getTime() - 60000,
      title: 'Started risk assessment',
      route: '/assess',
    })
  }

  if (assessState.completedAt) {
    out.push({
      type: 'assessment_completed',
      timestamp: new Date(assessState.completedAt).getTime(),
      title: 'Completed risk assessment',
      detail: assessState.lastResult
        ? `Risk score: ${assessState.lastResult.riskScore}`
        : undefined,
      route: '/assess',
    })
  }
}

function seedTLSEvents(out: Omit<HistoryEvent, 'id'>[]) {
  const tlsState = useTLSStore.getState()

  for (const run of tlsState.runHistory ?? []) {
    const ts = run.timestamp ? new Date(run.timestamp).getTime() : 0
    if (ts > 0) {
      out.push({
        type: 'tls_simulation',
        timestamp: ts,
        title: 'TLS handshake simulation',
        detail: run.cipher ? `Cipher: ${run.cipher}` : undefined,
        route: '/learn/tls-basics?tab=workshop',
      })
    }
  }
}

function seedPersonaEvents(out: Omit<HistoryEvent, 'id'>[]) {
  const personaState = usePersonaStore.getState()

  if (personaState.selectedPersona) {
    const labels: Record<string, string> = {
      executive: 'Executive / CISO',
      developer: 'Developer / Engineer',
      architect: 'Security Architect',
      researcher: 'Researcher / Academic',
    }
    out.push({
      type: 'persona_set',
      timestamp: 1,
      title: `Selected persona: ${labels[personaState.selectedPersona] ?? personaState.selectedPersona}`,
      route: '/',
    })
  }
}
