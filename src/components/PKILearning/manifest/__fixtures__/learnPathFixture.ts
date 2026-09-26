// SPDX-License-Identifier: GPL-3.0-only
/**
 * Test-only manifest exercising every WS-0 learn-path feature at once: two
 * paths over a shared core, a path-specific optional reference, a module-wide
 * optional reference, path-tagged + shared + optional workshop steps, and
 * `offPathSections: 'hide'`. NOT registered (registry only globs
 * modules/<X>/manifest.ts); tests that need it in MANIFEST_BY_ID mock the
 * registry.
 */
import type { ModuleManifest } from '../types'

export const PATH_FIXTURE: ModuleManifest = {
  id: 'ws0-path-fixture',
  title: 'Path Fixture',
  description: 'Learn-path test fixture',
  duration: '120 min',
  difficulty: 'advanced',
  frameworkPhase: 'p0',
  learnSections: [
    { id: 'core-1', label: 'Core 1' },
    { id: 'core-2', label: 'Core 2' },
    { id: 'a-1', label: 'A lesson' },
    { id: 'b-1', label: 'B lesson' },
    { id: 'a-ref', label: 'A deep dive', optional: true },
    { id: 'shared-ref', label: 'Shared reference', optional: true },
  ],
  learnPaths: [
    {
      id: 'a',
      label: 'Path A',
      audience: 'A people',
      entrySection: 'core-1',
      duration: '120 min',
      sections: ['core-1', 'core-2', 'a-1', 'a-ref'],
    },
    {
      id: 'b',
      label: 'Path B',
      entrySection: 'core-1',
      duration: '110 min',
      sections: ['core-1', 'core-2', 'b-1'],
    },
  ],
  offPathSections: 'hide',
  workshopSteps: [
    { id: 'w-core', label: 'Core step' },
    { id: 'w-a', label: 'A step', paths: ['a'] },
    { id: 'w-b', label: 'B step', paths: ['b'] },
    { id: 'w-ref', label: 'Reference step', optional: true },
  ],
}
