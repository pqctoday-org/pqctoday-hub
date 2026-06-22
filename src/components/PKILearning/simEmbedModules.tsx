// SPDX-License-Identifier: GPL-3.0-only
/**
 * simEmbedModules — the Learn modules the Simulation can embed in-place. Derived
 * from the manifests flagged `embeddable` (the single source of truth): a module
 * becomes sim-embeddable by setting `embeddable: true` in its manifest, nothing
 * else. Mirrors how the Command Center mounts a tool component.
 *
 * `embedContract.test.ts` asserts every `learn` tree step resolves here, so an
 * unembeddable referenced module fails CI rather than navigating the player out.
 */
import type { ComponentType } from 'react'
import { lazyWithRetry } from '@/utils/lazyWithRetry'
import { MANIFESTS } from './manifest/registry'

export const SIM_LEARN_MODULES: Record<string, ComponentType> = Object.fromEntries(
  MANIFESTS.filter((m) => m.embeddable && m.load).map((m) => [m.id, lazyWithRetry(m.load!)])
)

export const isEmbeddableModule = (id: string): boolean => id in SIM_LEARN_MODULES
