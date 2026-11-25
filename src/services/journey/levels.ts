// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Level mapping (owner: "1 / 2 / 3 start points"). The persona store has three experience levels;
 * the Learn tree has five stages. A level only decides where "Start here" points and which
 * suggestions come first; it never hides a lesson. It is a pure function, so the persona store is
 * not forked and nothing is stored.
 */
import type { ExperienceLevel } from '@/store/usePersonaStore'
import type { TreeLesson } from './lessons'

const START_STAGE: Record<ExperienceLevel, number> = { curious: 1, basics: 2, expert: 3 }

/** The stage a level starts at; stage 1 when the level is not set. */
export function startStageForLevel(level: ExperienceLevel | null | undefined): number {
  return level ? START_STAGE[level] : 1
}

/**
 * Where "Start here" points on a path: the first lesson at or after the level's start stage that is
 * not done yet; when every lesson from there on is done, the first lesson not done at all; null
 * when the whole path is done.
 */
export function startHere(
  path: readonly TreeLesson[],
  level: ExperienceLevel | null | undefined,
  isDone: (tag: string) => boolean
): TreeLesson | null {
  const open = path.filter((m) => !isDone(m.lmId))
  const from = startStageForLevel(level)
  return open.find((m) => m.stage >= from) ?? open[0] ?? null
}
