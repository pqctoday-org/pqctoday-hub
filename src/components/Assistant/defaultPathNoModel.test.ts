// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-non-literal-fs-filename -- static-analysis test over the repo's own src/ tree */
/**
 * Proof that the default path never loads a model service.
 *
 * Starting at the app's entry and following every import (static and lazy), the three model
 * services (retrieval, Gemini, WebLLM) are reachable only through the one lazy edge that the
 * hidden rollback switch uses: RightPanel -> ChatPanelContent. Take that edge away and nothing
 * reaches them; keep it and they are all reachable (so the test is not vacuous).
 */
import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'fs'
import { dirname, join, resolve } from 'path'

const SRC = join(process.cwd(), 'src')
const MODEL_SERVICES = [
  'services/chat/RetrievalService.ts',
  'services/chat/GeminiService.ts',
  'services/chat/WebLLMService.ts',
].map((p) => join(SRC, p))

const IMPORT_RE =
  /(?:^|[\n;])\s*(?:import|export)\s+(?!type\b)(?:[^'"()]*?\sfrom\s*)?['"]([^'"]+)['"]|\bimport\(\s*['"]([^'"]+)['"]\s*\)/g

function resolveModule(from: string, spec: string): string | null {
  const base = spec.startsWith('@/')
    ? join(SRC, spec.slice(2))
    : spec.startsWith('.')
      ? resolve(dirname(from), spec)
      : null
  if (!base) return null
  for (const candidate of [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    join(base, 'index.ts'),
    join(base, 'index.tsx'),
  ]) {
    if (/\.(ts|tsx)$/.test(candidate) && existsSync(candidate)) return candidate
  }
  return null
}

function closure(roots: string[], skipEdge?: (from: string, to: string) => boolean): Set<string> {
  const seen = new Set<string>()
  const stack = [...roots]
  while (stack.length) {
    const file = stack.pop()!
    if (seen.has(file)) continue
    seen.add(file)
    const source = readFileSync(file, 'utf8')
    for (const m of source.matchAll(IMPORT_RE)) {
      const to = resolveModule(file, m[1] ?? m[2])
      if (to && !(skipEdge && skipEdge(file, to))) stack.push(to)
    }
  }
  return seen
}

const entry = join(SRC, 'App.tsx')
const legacyEdge = (from: string, to: string) =>
  from.endsWith(join('RightPanel', 'RightPanel.tsx')) && to.endsWith('ChatPanelContent.tsx')

describe('default path loads no model service', () => {
  it('the scan finds the entry and follows lazy edges (it is not vacuous)', () => {
    const all = closure([entry])
    expect(all.size).toBeGreaterThan(500)
    expect(all.has(join(SRC, 'components/RightPanel/RightPanel.tsx'))).toBe(true)
    expect(all.has(join(SRC, 'components/Assistant/AssistantConversation.tsx'))).toBe(true)
  })

  it('with the rollback edge, the old chat reaches all three model services', () => {
    const all = closure([entry])
    for (const svc of MODEL_SERVICES) expect(all.has(svc), svc).toBe(true)
  })

  it('without the rollback edge, nothing in the app reaches any of them', () => {
    const all = closure([entry], legacyEdge)
    for (const svc of MODEL_SERVICES) expect(all.has(svc), svc).toBe(false)
    expect(all.has(join(SRC, 'components/RightPanel/ChatPanelContent.tsx'))).toBe(false)
    expect(all.has(join(SRC, 'hooks/useChatSend.ts'))).toBe(false)
  })

  it('the only file that names the old chat panel is the drawer, and only as a lazy import', () => {
    const users: string[] = []
    for (const file of closure([entry])) {
      const src = readFileSync(file, 'utf8')
      if (/ChatPanelContent['"]/.test(src) && !file.includes('.test.')) users.push(file)
    }
    expect(users.map((f) => f.replace(SRC, 'src'))).toEqual([
      'src/components/RightPanel/RightPanel.tsx',
    ])
    const drawer = readFileSync(join(SRC, 'components/RightPanel/RightPanel.tsx'), 'utf8')
    expect(drawer).toMatch(/import\('\.\/ChatPanelContent'\)/)
    expect(drawer).not.toMatch(/^import .*ChatPanelContent/m)
  })
})
