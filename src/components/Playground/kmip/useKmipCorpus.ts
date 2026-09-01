// SPDX-License-Identifier: GPL-3.0-only
//
// useKmipCorpus — state + fetch/run logic for the OASIS KMIP 3.0 conformance
// corpus (95 mandatory + 7 optional OASIS tests, plus 42 vendored PQC
// interop tests), extracted out of CorpusReplayView.tsx so the same corpus
// data/execution can be driven from more than one shell: originally its own
// standalone "Corpus Replay" tab, now also the "corpus" palette source
// inside KmipPipelineBuilder (kmip3-corpus-palette-plan-09012026.md).
// Execution semantics are unchanged — this still replays the real TTLV wire
// bytes of each transcript via runCorpusTest(), the same byte-exact
// comparison CorpusReplayView always used; only where the state/effects live
// has moved.
//
// `enabled` gates the manifest/codepoint-table fetch: nothing is downloaded
// until the caller actually needs corpus data (e.g. only once a user
// switches the Pipeline Builder's palette to "Corpus"), so the common case
// (standard palette, corpus never opened) costs zero extra network calls.
// Once fetched, the result is kept even if `enabled` later goes false (no
// re-fetch on flipping back and forth).
import { useEffect, useMemo, useRef, useState } from 'react'
import { getCodepointTable, type CodepointTable } from '@/wasm/kmip/ttlv/codepointTable'
import { runCorpusTest, type TestResult, type TestStatus } from '@/wasm/kmip/corpus/runner'
import { CHAINED_TEST_GROUPS } from '@/wasm/kmip/corpus/classify'

export interface ManifestEntry {
  file: string
  tier: 'mandatory' | 'optional' | 'pqc'
  category: string
  name: string
}
export interface Manifest {
  count: number
  tests: ManifestEntry[]
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// Slots below this are reserved for the rest of the app's shared engines
// (the Agility/Commands tabs use slot 0) — start corpus-replay slots well
// clear of those.
const SLOT_BASE = 10_000

export const STATUS_LABEL: Record<TestStatus, string> = {
  PASS: 'PASS',
  FAIL: 'FAIL',
  ERROR: 'ERROR',
  SKIP_OP: 'SKIP (op not implemented)',
  SKIP_PARSE: 'SKIP (XML malformed)',
  SKIP_DEPRECATED: 'SKIP (deprecated algorithm)',
  SKIP_TRANSPORT: 'SKIP (native-transport-only feature)',
}

export function useKmipCorpus({ enabled }: { enabled: boolean }) {
  const [table, setTable] = useState<CodepointTable | null>(null)
  const [manifest, setManifest] = useState<Manifest | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [xmlCache] = useState(() => new Map<string, string>())
  const [results, setResults] = useState<Record<string, TestResult>>({})
  const [running, setRunning] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set())
  const nextSlot = useRef(SLOT_BASE)
  // Code mode: which test's decoded request script is shown. Selecting a
  // test here (or in Builder) runs it if it hasn't been already — the
  // request tree only exists as part of a real TestResult (runCorpusTest
  // decodes both request and response together; there's no decode-only
  // path, and there doesn't need to be one — see runner.ts's TestResult.pairs).
  const [selectedTest, setSelectedTest] = useState<string | null>(null)

  useEffect(() => {
    if (!enabled || table || manifest || error) return
    let alive = true
    Promise.all([
      getCodepointTable(),
      fetch('/kmip-corpus/manifest.json').then((r) =>
        r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))
      ),
    ])
      .then(([t, m]) => {
        if (!alive) return
        setTable(t)
        setManifest(m as Manifest)
      })
      .catch((e: unknown) => alive && setError(e instanceof Error ? e.message : String(e)))
    return () => {
      alive = false
    }
  }, [enabled, table, manifest, error])

  const byCategory = useMemo(() => {
    const m = new Map<string, ManifestEntry[]>()
    for (const t of manifest?.tests ?? []) {
      const list = m.get(t.category) ?? []
      list.push(t)
      m.set(t.category, list)
    }
    return m
  }, [manifest])

  const entryByName = useMemo(() => {
    const m = new Map<string, ManifestEntry>()
    for (const t of manifest?.tests ?? []) m.set(t.name, t)
    return m
  }, [manifest])

  // `manifest.count` is every vendored test (144 = 102 OASIS + 42 PQC) — the
  // header text needs the OASIS-only figure, so count tiers directly rather
  // than reusing that aggregate.
  const tierCounts = useMemo(() => {
    let oasis = 0
    let pqc = 0
    for (const t of manifest?.tests ?? []) {
      if (t.tier === 'pqc') pqc += 1
      else oasis += 1
    }
    return { oasis, pqc }
  }, [manifest])

  async function fetchXml(entry: ManifestEntry): Promise<string> {
    const cached = xmlCache.get(entry.file)
    if (cached) return cached
    const text = await fetch(`/kmip-corpus/${entry.file}`).then((r) => r.text())
    xmlCache.set(entry.file, text)
    return text
  }

  /** Chained prerequisites (classify.ts CHAINED_TEST_GROUPS) — fetch the
   * earlier transcripts this test's state depends on. Prereqs live in the
   * same directory as the dependent test. */
  async function fetchPrereqs(entry: ManifestEntry): Promise<{ name: string; xml: string }[]> {
    const names = CHAINED_TEST_GROUPS[entry.name] ?? []
    const dir = entry.file.slice(0, entry.file.lastIndexOf('/') + 1)
    return Promise.all(
      names.map(async (name) => ({
        name,
        xml: await fetchXml({ ...entry, name, file: dir + name }),
      }))
    )
  }

  /** Code mode's picker: select a test's script, running it first if it
   * hasn't been (the request tree is only ever produced as a byproduct of
   * a real run — see `selectedTest`'s own comment). Re-selecting an
   * already-run test is instant, no re-run. */
  async function selectForCode(entry: ManifestEntry) {
    setSelectedTest(entry.name)
    if (!results[entry.name]) await runOne(entry)
  }

  async function runOne(entry: ManifestEntry) {
    if (!table) return
    setRunning(entry.name)
    try {
      const xml = await fetchXml(entry)
      const prereqs = await fetchPrereqs(entry)
      const result = await runCorpusTest(entry.name, xml, table, nextSlot.current++, prereqs)
      setResults((prev) => ({ ...prev, [entry.name]: result }))
    } finally {
      setRunning(null)
    }
  }

  async function runAll() {
    if (!table || !manifest) return
    setRunning('__all__')
    const out: Record<string, TestResult> = {}
    for (const entry of manifest.tests) {
      await sleep(0)
      const xml = await fetchXml(entry)
      const prereqs = await fetchPrereqs(entry)
      out[entry.name] = await runCorpusTest(entry.name, xml, table, nextSlot.current++, prereqs)
      setResults({ ...out })
    }
    setRunning(null)
  }

  const toggleCategory = (cat: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })

  const ran = Object.keys(results)
  const passed = ran.filter((k) => results[k].status === 'PASS').length
  const failed = ran.filter(
    (k) => results[k].status === 'FAIL' || results[k].status === 'ERROR'
  ).length

  return {
    table,
    manifest,
    error,
    results,
    running,
    collapsed,
    expandedTests,
    setExpandedTests,
    selectedTest,
    byCategory,
    entryByName,
    tierCounts,
    ran,
    passed,
    failed,
    runOne,
    runAll,
    selectForCode,
    toggleCategory,
  }
}

export type UseKmipCorpus = ReturnType<typeof useKmipCorpus>
