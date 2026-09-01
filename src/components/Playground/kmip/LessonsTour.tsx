// SPDX-License-Identifier: GPL-3.0-only
//
// LessonsTour — the KMIP playground's binding of the shared coachmark tour
// engine (`learnkit/TourEngine.tsx`, dev-tabs-pkcs11-kmip plan G5) to this
// playground's own `Plane` union and badge styling. The engine itself
// (dimmed veil + spotlight "hole" + positioned tooltip card, driving the
// REAL app — each step's `act` calls the same handlers the buttons on
// screen call) now lives there so the PKCS#11 Developer tab's own tour
// (`HsmPlayground.tsx`) can reuse it instead of a second copy; this file
// re-exports it bound to KMIP's plane names so `KmipPlaygroundView.tsx`
// needed no import-path change. Behavior reference (unchanged from the
// original single-file version): `design_handoff_cacp_a_grade/cacp2/
// cacp-app.jsx`'s Lessons engine — NOT ported code, a from-scratch
// React/TypeScript build over this app's actual state.
import {
  useLessonsTour as useLessonsTourGeneric,
  LessonsHub as LessonsHubGeneric,
  TourOverlay,
  clickByText,
  dragRangeToMax,
  type Lesson as LessonGeneric,
  type LessonStep,
  type PlaneBadge,
} from '@/components/Playground/learnkit/TourEngine'

export type { LessonStep }
export { TourOverlay, clickByText, dragRangeToMax }

export type Plane = 'agility' | 'policy' | 'kmip3'
export type Lesson = LessonGeneric<Plane>

const PLANE_BADGE: Record<Plane, PlaneBadge> = {
  agility: { label: 'Workbench', className: 'bg-status-warning/10 text-status-warning' },
  policy: { label: 'Policy', className: 'bg-primary/10 text-primary' },
  kmip3: { label: 'KMIP3.0', className: 'bg-status-info/10 text-status-info' },
}

export function useLessonsTour(lessons: Lesson[], onLessonPlane: (p: Plane) => void) {
  return useLessonsTourGeneric<Plane>(lessons, onLessonPlane)
}

export function LessonsHub(props: {
  lessons: Lesson[]
  done: Record<string, boolean>
  onStart: (id: string) => void
  onClose: () => void
}) {
  return <LessonsHubGeneric<Plane> {...props} planeBadge={(p) => PLANE_BADGE[p]} />
}
