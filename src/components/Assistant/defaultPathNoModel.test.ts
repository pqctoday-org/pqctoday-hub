// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-non-literal-fs-filename -- static-analysis test over the repo's own src/ tree */
/**
 * Proof that the app has no language model of its own.
 *
 * The old model chat (a model downloaded into the browser, and a cloud model reached with the
 * visitor's own key) is gone: its files do not exist, nothing in the app's import graph names
 * them, no source file points at a model provider, and the package that ran the in-browser model
 * is not a dependency.
 */
import { describe, expect, it } from 'vitest'
import { existsSync, readdirSync, readFileSync, statSync } from 'fs'
import { dirname, join, resolve } from 'path'

const SRC = join(process.cwd(), 'src')
const REMOVED_FILES = [
  'services/chat/GeminiService.ts',
  'services/chat/modelConfig.ts',
  'services/chat/WebLLMService.ts',
  'components/RightPanel/ChatPanelContent.tsx',
  'components/Chat/ProviderSetup.tsx',
  'components/Chat/ApiKeySetup.tsx',
  'components/Chat/ModelDownloadBanner.tsx',
  'hooks/useChatSend.ts',
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

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) sourceFiles(full, out)
    else if (/\.(ts|tsx)$/.test(name) && !/\.(test|spec)\./.test(name)) out.push(full)
  }
  return out
}

const entry = join(SRC, 'App.tsx')

describe('the app has no language model of its own', () => {
  it('the scan finds the entry and follows lazy edges (it is not vacuous)', () => {
    const all = closure([entry])
    expect(all.size).toBeGreaterThan(500)
    expect(all.has(join(SRC, 'components/RightPanel/RightPanel.tsx'))).toBe(true)
    expect(all.has(join(SRC, 'components/Assistant/AssistantConversation.tsx'))).toBe(true)
  })

  it('the files of the old model chat no longer exist', () => {
    for (const file of REMOVED_FILES) expect(existsSync(file), file).toBe(false)
  })

  it('nothing in the app imports a model service, a model set-up screen or the old chat panel', () => {
    const banned =
      /(WebLLMService|GeminiService|modelConfig|ChatPanelContent|ProviderSetup|ApiKeySetup|ModelDownloadBanner|useChatSend|@mlc-ai\/web-llm)['"]/
    for (const file of closure([entry])) {
      expect(banned.test(readFileSync(file, 'utf8')), file.replace(SRC, 'src')).toBe(false)
    }
  })

  it('nothing outside the chat services folder imports a model service or its settings', () => {
    const banned = /services\/chat\/(WebLLMService|GeminiService|modelConfig)['"]/
    const offenders = sourceFiles(SRC)
      .filter((f) => !f.includes(join('services', 'chat') + '/'))
      .filter((f) => banned.test(readFileSync(f, 'utf8')))
    expect(offenders.map((f) => f.replace(SRC, 'src'))).toEqual([])
  })

  it('no source file points at a model provider', () => {
    const providers = /generativelanguage\.googleapis\.com|api\.openai\.com|api\.anthropic\.com/
    const offenders = sourceFiles(SRC).filter((f) => providers.test(readFileSync(f, 'utf8')))
    expect(offenders.map((f) => f.replace(SRC, 'src'))).toEqual([])
  })

  it('the content-security policy lists no model provider and no model library host', () => {
    const config = readFileSync(join(process.cwd(), 'vite.config.ts'), 'utf8')
    expect(config).not.toMatch(/generativelanguage|raw\.githubusercontent\.com/)
  })

  it('the package that ran the in-browser model is not a dependency', () => {
    const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8')) as {
      dependencies?: Record<string, string>
      devDependencies?: Record<string, string>
    }
    const names = [
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.devDependencies ?? {}),
    ]
    expect(names).not.toContain('@mlc-ai/web-llm')
  })
})
