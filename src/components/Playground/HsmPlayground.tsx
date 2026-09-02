// SPDX-License-Identifier: GPL-3.0-only
import { useRef, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import {
  BookOpen,
  Cpu,
  Lock,
  Layers,
  Hash,
  FileSignature,
  ArrowLeftRight,
  Filter,
  AlertCircle,
  Construction,
  FlaskConical,
  Code2,
  Route,
  Wrench,
  Search,
  KeyRound,
  ScrollText,
} from 'lucide-react'
import clsx from 'clsx'
import { useSettingsContext } from './contexts/SettingsContext'
import { useHsmContext } from './hsm/HsmContext'
import type { EngineMode } from './hsm/HsmContext'
import { HsmSymmetricPanel } from './hsm/HsmSymmetricPanel'
import { HsmHashingPanel } from './hsm/HsmHashingPanel'
import { HsmKeyAgreementPanel } from './hsm/HsmKeyAgreementPanel'
import { HsmKdfPanel } from './hsm/HsmKdfPanel'
import { HsmKemPanel } from './hsm/HsmKemPanel'
import { HsmMechanismPanel } from './hsm/HsmMechanismPanel'
import { KeyWrapPanel } from './hsm/symmetric/KeyWrapPanel'
import { HsmTestMethodologyModal } from './hsm/HsmTestMethodologyModal'
import { TokenSetupPanel } from './components/TokenSetupPanel'
import { HsmKeyTable } from './keystore/HsmKeyTable'
import { Pkcs11LogPanel } from '../shared/Pkcs11LogPanel'
import { HsmSignCombinedPanel } from './tabs/SignVerifyTab'
import { HsmLearnView } from './hsm/learn/HsmLearnView'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs'
import { InlineTooltip } from '../ui/InlineTooltip'
import { usePageActionsStore } from '@/store/usePageActionsStore'
import { ExecutiveRedirectBanner } from '../common/ExecutiveRedirectBanner'
import { usePersonaStore } from '@/store/usePersonaStore'
import { logEvent } from '../../utils/analytics'
import {
  hsm_generateMLDSAKeyPair,
  hsm_generateECKeyPair,
  hsm_generateAESKey,
} from '../../wasm/softhsm'
import { DeveloperTab, type TestSuite } from './dev/DeveloperTab'
import {
  useLessonsTour,
  LessonsHub,
  TourOverlay,
  clickByText,
  type Lesson,
} from './learnkit/TourEngine'
import { WorkshopShell, type WorkshopTab } from './learnkit/WorkshopShell'
import { InspectChip } from './learnkit/InspectChip'

/**
 * Four modes (design handoff design_handoff_kmip_pkcs11_playground,
 * 2026-09-02): the previous 12 flat tabs regrouped as Learn · Operate ·
 * Build · Inspect. Operate hosts the seven crypto-primitive panels behind a
 * left rail; Inspect hosts the mechanism list, the ONE shared call log and
 * the key inventory; Build is the Standard/ACVP/Conformance workbench.
 */
export type HsmTab = 'learn' | 'operate' | 'build' | 'inspect'

/** Operate's primitive rail. Ids are the `?rail=` URL values. */
export type RailId = 'kem' | 'sym' | 'wrap' | 'hash' | 'sign' | 'agree' | 'kdf'

/** Inspect's sub-views. Ids are the `?itab=` URL values. */
export type InspectView = 'mechanisms' | 'log' | 'keys'

export interface HsmLocation {
  tab: HsmTab
  rail?: RailId
  itab?: InspectView
  dtab?: TestSuite
  /** Set when a legacy `?tab=keystore` link was resolved — that tab was the
   *  manual 3-step walkthrough, deliberately NOT auto-initialising the
   *  engine; the Operate tab it now maps to must keep that contract. */
  noAutoInit?: boolean
}

const DEFAULT_TAB: HsmTab = 'learn'
const DEFAULT_RAIL: RailId = 'kem'
const DEFAULT_INSPECT: InspectView = 'mechanisms'
const DEFAULT_DEV_SUB_TAB: TestSuite = 'standard'

/**
 * Every pre-redesign `?tab=` value (the 12 flat tabs, plus the two even
 * older `acvp`/`conformance` top-level tabs) still resolves — accepted on
 * the way in, never produced fresh. Learn's `tryRef` entries and every
 * existing e2e spec / role-board deep link use these ids.
 */
const LEGACY_TABS: Record<string, HsmLocation> = {
  keystore: { tab: 'operate', rail: DEFAULT_RAIL, noAutoInit: true },
  kem: { tab: 'operate', rail: 'kem' },
  symmetric: { tab: 'operate', rail: 'sym' },
  key_wrap: { tab: 'operate', rail: 'wrap' },
  hashing: { tab: 'operate', rail: 'hash' },
  sign_verify: { tab: 'operate', rail: 'sign' },
  key_agree: { tab: 'operate', rail: 'agree' },
  key_derive: { tab: 'operate', rail: 'kdf' },
  mechanisms: { tab: 'inspect', itab: 'mechanisms' },
  logs: { tab: 'inspect', itab: 'log' },
  log: { tab: 'inspect', itab: 'log' },
  developer: { tab: 'build' },
  acvp: { tab: 'build', dtab: 'acvp' },
  conformance: { tab: 'build', dtab: 'conformance' },
}

const isHsmTab = (v: string | null): v is HsmTab =>
  v === 'learn' || v === 'operate' || v === 'build' || v === 'inspect'
const RAIL_IDS: RailId[] = ['kem', 'sym', 'wrap', 'hash', 'sign', 'agree', 'kdf']
const isRailId = (v: string | null): v is RailId => RAIL_IDS.includes(v as RailId)
const isInspectView = (v: string | null): v is InspectView =>
  v === 'mechanisms' || v === 'log' || v === 'keys'

/** Pre-rename deep links (`?dtab=pipeline`) still resolve. */
const normalizeDevSubTab = (raw: string | null): TestSuite | null =>
  raw === 'pipeline'
    ? 'standard'
    : raw === 'acvp' || raw === 'conformance'
      ? raw
      : raw === 'standard'
        ? raw
        : null

/**
 * Resolve the incoming URL (or a legacy tab id handed over by Learn's
 * "Try it in the workbench" buttons) to a location in the 4-mode IA.
 * Exported for the unit test.
 */
export function resolveHsmLocation(params: {
  tab: string | null
  rail?: string | null
  itab?: string | null
  dtab?: string | null
}): HsmLocation {
  const { tab, rail, itab, dtab } = params
  const dsub = normalizeDevSubTab(dtab ?? null)
  if (tab && tab in LEGACY_TABS) {
    // eslint-disable-next-line security/detect-object-injection -- guarded by `in` against a static literal map
    const legacy = LEGACY_TABS[tab]
    return { ...legacy, dtab: legacy.dtab ?? dsub ?? undefined }
  }
  const t: HsmTab = isHsmTab(tab) ? tab : DEFAULT_TAB
  return {
    tab: t,
    rail: t === 'operate' ? (isRailId(rail ?? null) ? (rail as RailId) : DEFAULT_RAIL) : undefined,
    itab:
      t === 'inspect'
        ? isInspectView(itab ?? null)
          ? (itab as InspectView)
          : DEFAULT_INSPECT
        : undefined,
    dtab: t === 'build' ? (dsub ?? DEFAULT_DEV_SUB_TAB) : undefined,
  }
}

interface RailEntry {
  id: RailId
  label: string
  mono: string
  icon: typeof Lock
}

const RAIL: RailEntry[] = [
  { id: 'kem', label: 'KEM', mono: 'KM', icon: Lock },
  { id: 'sym', label: 'Symmetric Encrypt', mono: 'SY', icon: Lock },
  { id: 'wrap', label: 'Key Wrap / Unwrap', mono: 'KW', icon: Layers },
  { id: 'hash', label: 'Hashing', mono: 'HA', icon: Hash },
  { id: 'sign', label: 'Sign & Verify', mono: 'SV', icon: FileSignature },
  { id: 'agree', label: 'Key Agreement', mono: 'KA', icon: ArrowLeftRight },
  { id: 'kdf', label: 'KDF', mono: 'KD', icon: Filter },
]

export const HsmPlayground = () => {
  const role = usePersonaStore((s) => s.selectedPersona)
  const { error } = useSettingsContext()
  const {
    engineMode,
    setEngineMode,
    phase,
    isReady,
    autoInit,
    moduleRef,
    hSessionRef,
    addHsmKey,
    hsmLog,
    clearHsmLog,
    hsmKeys,
    setLogOrigin,
  } = useHsmContext()

  // ── URL deep-link setup ──────────────────────────────────────────────────
  const [searchParams, setSearchParams] = useSearchParams()

  // Capture incoming URL params once at mount (before any effects modify the URL)
  const initialLoc = useRef<HsmLocation>(
    resolveHsmLocation({
      tab: searchParams.get('tab'),
      rail: searchParams.get('rail'),
      itab: searchParams.get('itab'),
      dtab: searchParams.get('dtab'),
    })
  )
  const initialEngine = useRef(searchParams.get('engine') as EngineMode | null)
  const initialAlgo = useRef(searchParams.get('algo') ?? undefined)

  const [activeTab, setActiveTab] = useState<HsmTab>(DEFAULT_TAB)
  const [rail, setRail] = useState<RailId>(initialLoc.current.rail ?? DEFAULT_RAIL)
  const [inspectView, setInspectView] = useState<InspectView>(
    initialLoc.current.itab ?? DEFAULT_INSPECT
  )
  const [devSubTab, setDevSubTab] = useState<TestSuite>(DEFAULT_DEV_SUB_TAB)
  const [showMethodologyModal, setShowMethodologyModal] = useState(false)
  const errorRef = useRef<HTMLDivElement>(null)

  // Guard to skip URL sync on the very first render (don't wipe incoming params)
  const urlSyncReady = useRef(false)

  // Current algo string — updated by panels via onAlgoChange, written to ?algo=
  const [algoParam, setAlgoParam] = useState<string | undefined>(initialAlgo.current)

  /** Generate a sensible default key for the target primitive after deep-link auto-init. */
  const generateDefaultKeyForRail = (target: RailId, algo?: string, engine?: EngineMode) => {
    if (!moduleRef.current || !hSessionRef.current) return
    const M = moduleRef.current
    const hSession = hSessionRef.current
    const engineLabel: 'cpp' | 'rust' = (engine ?? engineMode) === 'rust' ? 'rust' : 'cpp'
    const ts = new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
    switch (target) {
      case 'sign': {
        const variant: 44 | 65 | 87 = algo === 'ML-DSA-44' ? 44 : algo === 'ML-DSA-87' ? 87 : 65
        const { pubHandle, privHandle } = hsm_generateMLDSAKeyPair(M, hSession, variant)
        addHsmKey({
          handle: pubHandle,
          family: 'ml-dsa',
          role: 'public',
          label: `ML-DSA-${variant} Public Key (auto)`,
          variant: String(variant),
          engine: engineLabel,
          generatedAt: ts,
        })
        addHsmKey({
          handle: privHandle,
          family: 'ml-dsa',
          role: 'private',
          label: `ML-DSA-${variant} Private Key (auto)`,
          variant: String(variant),
          engine: engineLabel,
          generatedAt: ts,
        })
        break
      }
      case 'agree': {
        const curve = ['P-256', 'P-384', 'P-521'].includes(algo ?? '')
          ? (algo as 'P-256' | 'P-384' | 'P-521')
          : 'P-256'
        const { pubHandle, privHandle } = hsm_generateECKeyPair(M, hSession, curve, false, 'sign')
        addHsmKey({
          handle: pubHandle,
          family: 'ecdh',
          role: 'public',
          label: `${curve} Public Key (auto)`,
          engine: engineLabel,
          generatedAt: ts,
        })
        addHsmKey({
          handle: privHandle,
          family: 'ecdh',
          role: 'private',
          label: `${curve} Private Key (auto)`,
          engine: engineLabel,
          generatedAt: ts,
        })
        break
      }
      case 'sym':
      case 'wrap':
      case 'kdf': {
        const bits: 128 | 192 | 256 = algo === 'AES-128' ? 128 : algo === 'AES-192' ? 192 : 256
        const handle = hsm_generateAESKey(M, hSession, bits)
        addHsmKey({
          handle,
          family: 'aes',
          role: 'secret',
          label: `AES-${bits} Key (auto)`,
          engine: engineLabel,
          generatedAt: ts,
        })
        break
      }
      default:
        break
    }
  }

  // ── Deep-link mount effect ───────────────────────────────────────────────
  useEffect(() => {
    const loc = initialLoc.current
    const engine = initialEngine.current
    const algo = initialAlgo.current
    if (engine) setEngineMode(engine)
    if (
      loc.tab === 'build' &&
      (loc.dtab === 'acvp' || loc.dtab === 'conformance') &&
      (role === 'curious' || role === 'executive')
    ) {
      // ACVP and Conformance are engineering-workbench suites, gated for
      // curious/executive (matches the ExecutiveRedirectBanner) — don't
      // honor a stale or hand-crafted ?dtab= (or legacy ?tab=acvp/conformance)
      // deep link for these personas. Build itself still opens on Standard.
    } else if (loc.dtab) {
      setDevSubTab(loc.dtab)
    }
    if (loc.tab === DEFAULT_TAB) {
      // Default tab — nothing extra to do.
    } else if (loc.tab !== 'operate' || loc.noAutoInit) {
      // Build / Inspect, and the legacy manual-walkthrough alias: switch
      // without eagerly auto-initing the engine in the background.
      setActiveTab(loc.tab)
    } else if (phase === 'idle') {
      autoInit(engine ?? undefined).then((ok) => {
        if (!ok) return
        setActiveTab('operate')
        generateDefaultKeyForRail(loc.rail ?? DEFAULT_RAIL, algo, engine ?? undefined)
      })
    } else if (isReady) {
      setActiveTab('operate')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── URL sync effect: keep URL in sync with tab / rail / views / engine ───
  useEffect(() => {
    if (!urlSyncReady.current) {
      urlSyncReady.current = true
      return
    }
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (activeTab !== DEFAULT_TAB) next.set('tab', activeTab)
        else next.delete('tab')
        if (activeTab === 'operate' && rail !== DEFAULT_RAIL) next.set('rail', rail)
        else next.delete('rail')
        if (activeTab === 'inspect' && inspectView !== DEFAULT_INSPECT)
          next.set('itab', inspectView)
        else next.delete('itab')
        if (activeTab === 'build' && devSubTab !== DEFAULT_DEV_SUB_TAB) next.set('dtab', devSubTab)
        else next.delete('dtab')
        if (engineMode !== 'rust') next.set('engine', engineMode)
        else next.delete('engine')
        if (algoParam) next.set('algo', algoParam)
        else next.delete('algo')
        return next
      },
      { replace: true }
    )
  }, [activeTab, rail, inspectView, devSubTab, engineMode, algoParam, setSearchParams])

  useEffect(() => {
    if (error) errorRef.current?.focus()
  }, [error])

  // Share lives ONLY in the top bar (2026-08-27 remediation) — register this
  // page's title/text so the global ShareButton (MainLayout.tsx) shows the
  // right copy instead of the generic route fallback. No URL override
  // needed: tab/rail/engine/algo are already synced to the URL above.
  useEffect(() => {
    const { setPageActions, clearPageActions } = usePageActionsStore.getState()
    setPageActions({
      shareTitle: 'PKCS#11 HSM Playground — PQC Today',
      shareText: 'Drive a real PKCS#11 HSM in your browser',
    })
    return () => clearPageActions()
  }, [])

  // Safety net: if a persona switch lands a curious/executive user on the
  // gated ACVP/Conformance suite mid-session, fall back to Standard rather
  // than leaving them on a surface whose trigger is now hidden.
  useEffect(() => {
    if (
      (devSubTab === 'acvp' || devSubTab === 'conformance') &&
      (role === 'curious' || role === 'executive')
    ) {
      setDevSubTab(DEFAULT_DEV_SUB_TAB)
    }
  }, [role, devSubTab])

  // Stamp every logged call with the surface it came from (§3.4 — one shared
  // log, grouped by origin). The header row itself is emitted lazily by
  // HsmContext on the first real call, so switching tabs never adds noise.
  useEffect(() => {
    const railLabel = RAIL.find((r) => r.id === rail)?.label ?? rail
    const suiteLabel =
      devSubTab === 'acvp' ? 'ACVP' : devSubTab === 'conformance' ? 'Conformance' : 'Standard'
    if (activeTab === 'operate') setLogOrigin(`operate:${rail}`, `Operate · ${railLabel}`)
    else if (activeTab === 'build') setLogOrigin(`build:${devSubTab}`, `Build · ${suiteLabel}`)
    else if (activeTab === 'inspect') setLogOrigin('inspect', 'Inspect')
    else setLogOrigin('learn', 'Learn')
  }, [activeTab, rail, devSubTab, setLogOrigin])

  // Inspect › Log origin filter (All · Operate · Build · Learn · Setup).
  type OriginFilter = 'all' | 'operate' | 'build' | 'learn' | 'setup'
  const [originFilter, setOriginFilter] = useState<OriginFilter>('all')
  const filteredLog =
    originFilter === 'all'
      ? hsmLog
      : hsmLog.filter((e) => (e.origin ?? 'setup').split(':')[0] === originFilter)

  const handleTabChange = (tab: HsmTab) => {
    setActiveTab(tab)
    setAlgoParam(undefined)
    logEvent('HSM Playground', 'Switch Tab', tab)
  }

  /** Navigate to a resolved location — used by Learn's "Try it in the
   *  workbench" (legacy tab ids), the Inspect chip, and the lesson spotlight. */
  const goTo = (loc: HsmLocation) => {
    if (loc.rail) setRail(loc.rail)
    if (loc.itab) setInspectView(loc.itab)
    if (loc.dtab && !((role === 'curious' || role === 'executive') && loc.dtab !== 'standard'))
      setDevSubTab(loc.dtab)
    handleTabChange(loc.tab)
  }

  // ── Guided lessons (dev-tabs-pkcs11-kmip plan G5) ──────────────────────
  // One tour, driving the real Build-tab workbench: `handleTabChange` is the
  // exact same handler a real tab click calls, and `clickByText` fires real
  // clicks on the builder's own template/Run buttons — never simulating an
  // outcome the real UI didn't produce. Deliberately does NOT script the
  // palette→canvas HTML5 drag/drop itself (synthetic DragEvents with a real
  // DataTransfer are unreliable to fabricate): the drag step is narrated as
  // "try it yourself" and the tour continues via a real template click.
  const devLessons: Lesson<HsmTab>[] = [
    {
      id: 'pkcs-dev-builder',
      title: 'Build a PKCS#11 v3.2 sequence',
      icon: Code2,
      plane: 'build',
      blurb: 'The Build tab: drag, bind, run — real p11 v3.2 calls.',
      steps: [
        {
          title: 'The palette',
          target: '[data-tour="pkcs-dev-palette"]',
          body: 'Every primitive here is a real PKCS#11 v3.2 mechanism — try dragging one onto the canvas on the right. When you’re ready, click Next and we’ll load a complete worked example together.',
        },
        {
          title: 'Or start from a template',
          target: '[data-tour="pkcs-dev-templates"]',
          act: () => clickByText('[data-tour="pkcs-dev-templates"] button', 'Encrypt + sign (PQ)'),
          body: 'Templates are real, already-bound pipelines — AES-GCM encrypt, hash the ciphertext, then ML-DSA-65 sign it. Same primitives, same p11 v3.2 calls, wired up for you.',
        },
        {
          title: "Every step's inputs are bound",
          target: '[data-tour="pkcs-dev-step-sign"]',
          body: 'The arrow above this Sign step reads "↓ from step 3" — its input is bound to the previous step’s output, not typed in by hand. That binding is what the generated Python’s variable references actually encode.',
        },
        {
          title: 'Run it for real',
          target: '[data-tour="pkcs-dev-run"]',
          act: () => clickByText('[data-tour="pkcs-dev-run"]', 'Run'),
          body: 'This runs the generated Python against the real softhsmv3 engine, compiled to WebAssembly, on your own dedicated "DevSequences" token slot.',
        },
        {
          title: 'Read the result',
          target: '[data-tour="pkcs-dev-output"]',
          body: 'Every step above now shows a ✓ or ✗ with its real PKCS#11 return value. "What this proved" explains what a green run across all five steps actually demonstrates.',
        },
        {
          title: 'Take it to the sandbox',
          target: '[data-tour="pkcs-dev-export"]',
          body: 'This is real, unmodified PKCS#11 v3.2 Python — download it and it runs the same way in the separately distributed pqctoday dev sandbox, no changes needed.',
        },
      ],
    },
  ]
  const tour = useLessonsTour<HsmTab>(devLessons, (p) => {
    handleTabChange(p)
    // The tour's data-tour="pkcs-dev-*" selectors only exist while the
    // Standard suite is mounted (TabsContent unmounts inactive panels) —
    // force back to it so starting this lesson from the ACVP/Conformance
    // suite doesn't leave every selector finding nothing.
    if (p === 'build') setDevSubTab('standard')
  })

  // Total logged calls minus the synthetic step-header rows the Learn tab
  // and (post-redesign) every Operate button emit for grouping.
  const callCount = hsmLog.reduce((n, e) => (e.isStepHeader ? n : n + 1), 0)
  const inspectChip = (
    <InspectChip
      calls={callCount}
      callsLabel="PKCS#11 calls"
      keys={hsmKeys.length}
      onOpen={() => goTo({ tab: 'inspect', itab: 'log' })}
      tourId="pkcs-inspect-chip"
    />
  )

  const activeRail = RAIL.find((r) => r.id === rail) ?? RAIL[0]

  const operatePanel = (() => {
    switch (rail) {
      case 'kem':
        return <HsmKemPanel />
      case 'sym':
        return <HsmSymmetricPanel initialAlgo={initialAlgo.current} onAlgoChange={setAlgoParam} />
      case 'wrap':
        return <KeyWrapPanel initialAlgo={initialAlgo.current} onAlgoChange={setAlgoParam} />
      case 'hash':
        return <HsmHashingPanel initialAlgo={initialAlgo.current} onAlgoChange={setAlgoParam} />
      case 'sign':
        return (
          <HsmSignCombinedPanel initialAlgo={initialAlgo.current} onAlgoChange={setAlgoParam} />
        )
      case 'agree':
        return (
          <HsmKeyAgreementPanel initialAlgo={initialAlgo.current} onAlgoChange={setAlgoParam} />
        )
      case 'kdf':
        return <HsmKdfPanel initialAlgo={initialAlgo.current} onAlgoChange={setAlgoParam} />
      default:
        return null
    }
  })()

  const tabs: WorkshopTab<HsmTab>[] = [
    {
      id: 'learn',
      label: 'Learn',
      icon: BookOpen,
      tourId: 'pkcs-tab-learn',
      content: <HsmLearnView onTryInWorkbench={(tab) => goTo(resolveHsmLocation({ tab }))} />,
    },
    {
      id: 'operate',
      label: 'Operate',
      icon: Wrench,
      tourId: 'pkcs-tab-operate',
      content: (
        <div className="grid grid-cols-1 lg:grid-cols-[200px_minmax(0,1fr)] gap-4 items-start">
          {/* ── Primitive rail ─────────────────────────────────────────── */}
          <nav
            aria-label="Primitives"
            data-tour="pkcs-rail"
            className="flex lg:flex-col gap-1 overflow-x-auto no-scrollbar lg:overflow-visible -mx-1 px-1 lg:mx-0 lg:px-0 lg:sticky lg:top-0"
          >
            <span className="hidden lg:block text-[10px] font-bold uppercase tracking-wide text-muted-foreground px-2 pb-1">
              Primitives
            </span>
            {RAIL.map((r) => {
              const on = r.id === rail
              return (
                <Button
                  key={r.id}
                  variant="ghost"
                  size="sm"
                  aria-current={on ? 'true' : undefined}
                  data-tour={`pkcs-rail-${r.id}`}
                  onClick={() => {
                    setRail(r.id)
                    setAlgoParam(undefined)
                    logEvent('HSM Playground', 'Switch Primitive', r.id)
                  }}
                  className={clsx(
                    'h-9 justify-start gap-2 px-2 whitespace-nowrap shrink-0 rounded-md border-l-2',
                    on
                      ? 'bg-primary/15 text-primary border-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent border-transparent'
                  )}
                >
                  <span
                    className={clsx(
                      'font-mono text-[10px] rounded px-1 py-0.5',
                      on ? 'bg-primary/20' : 'bg-muted'
                    )}
                    aria-hidden="true"
                  >
                    {r.mono}
                  </span>
                  <span className="text-xs">{r.label}</span>
                </Button>
              )
            })}
          </nav>

          {/* ── Token setup strip + active primitive ─────────────────── */}
          <div className="min-w-0 space-y-4">
            <div data-tour="pkcs-op-setup">
              <TokenSetupPanel />
            </div>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h4 className="text-base font-semibold flex items-center gap-2">
                <activeRail.icon size={16} className="text-primary" aria-hidden="true" />
                {activeRail.label}
              </h4>
              {inspectChip}
            </div>
            <div data-tour={`pkcs-op-${rail}`}>{operatePanel}</div>
          </div>
        </div>
      ),
    },
    {
      id: 'build',
      label: 'Build',
      icon: Code2,
      tourId: 'pkcs-tab-build',
      content: (
        <div className="space-y-3">
          <div className="flex justify-end">{inspectChip}</div>
          <DeveloperTab activeSubTab={devSubTab} onSubTabChange={setDevSubTab} />
        </div>
      ),
    },
    {
      id: 'inspect',
      label: 'Inspect',
      icon: Search,
      tourId: 'pkcs-tab-inspect',
      content: (
        <Tabs value={inspectView} onValueChange={(v) => setInspectView(v as InspectView)}>
          <TabsList aria-label="Inspect views" data-tour="pkcs-inspect-subtabs">
            <TabsTrigger value="mechanisms" className="gap-1.5" data-tour="pkcs-insp-mechanisms">
              <Layers size={14} aria-hidden="true" /> Mechanisms
            </TabsTrigger>
            <TabsTrigger value="log" className="gap-1.5" data-tour="pkcs-insp-log">
              <ScrollText size={14} aria-hidden="true" /> Log
            </TabsTrigger>
            <TabsTrigger value="keys" className="gap-1.5" data-tour="pkcs-insp-keys">
              <KeyRound size={14} aria-hidden="true" /> Keys
            </TabsTrigger>
          </TabsList>
          <p className="text-xs text-muted-foreground mt-2">
            One log and one key inventory, fed by every Operate and Build surface — no separate
            copies inside each panel.
          </p>
          <TabsContent value="mechanisms">
            <HsmMechanismPanel />
          </TabsContent>
          <TabsContent value="log">
            <div
              className="flex flex-wrap items-center gap-1 mb-2"
              role="group"
              aria-label="Filter log by origin"
            >
              {(
                [
                  ['all', 'All'],
                  ['operate', 'Operate'],
                  ['build', 'Build'],
                  ['learn', 'Learn'],
                  ['setup', 'Setup'],
                ] as const
              ).map(([id, label]) => (
                <Button
                  key={id}
                  variant="ghost"
                  size="sm"
                  aria-pressed={originFilter === id}
                  onClick={() => setOriginFilter(id)}
                  className={clsx(
                    'h-7 rounded-md px-2.5 text-[11px]',
                    originFilter === id
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {label}
                </Button>
              ))}
            </div>
            <Pkcs11LogPanel log={filteredLog} onClear={clearHsmLog} defaultOpen={true} />
          </TabsContent>
          <TabsContent value="keys">
            <HsmKeyTable />
          </TabsContent>
        </Tabs>
      ),
    },
  ]

  return (
    <Card className="p-3 md:p-6 min-h-[60vh] md:min-h-[85vh] flex flex-col">
      {role === 'executive' && (
        <ExecutiveRedirectBanner
          className="mb-4 shrink-0"
          title="PKCS#11 HSM Playground is a hands-on engineering workbench."
          subtitle="This surface runs real cryptographic operations against a simulated hardware security module — useful for your engineering team, not for board-level PQC decisions. For executive context:"
          ctas={[
            { label: 'Command Center →', to: '/business' },
            { label: 'Compliance landscape →', to: '/compliance' },
            { label: 'Migration framework →', to: '/migrate' },
          ]}
        />
      )}

      <WorkshopShell<HsmTab>
        icon={Cpu}
        title="PKCS#11 HSM Playground"
        badge={
          <Button
            variant="ghost"
            onClick={() => setShowMethodologyModal(true)}
            className="ml-1 flex items-center gap-1 text-xs font-semibold px-2 py-0.5 h-auto rounded-full bg-warning/10 text-warning border border-warning/30 hover:bg-warning/20 transition-colors"
            aria-label="View PKCS#11 test methodology"
          >
            <Construction size={11} />
            WIP
            <FlaskConical size={11} />
          </Button>
        }
        actions={
          <>
            {/* Share lives only in the top bar (2026-08-27 remediation) — see the
                usePageActionsStore effect above; no local ShareButton here. */}
            <Button
              variant="outline"
              size="sm"
              onClick={tour.openHub}
              className="flex items-center gap-1.5 text-xs"
            >
              <Route size={13} /> Lessons
            </Button>
            {/* Engine mode selector — an engineering-workbench control, gated
                for curious/executive same as the ACVP suite; they run on the
                'rust' default without needing to choose. */}
            {role !== 'curious' && role !== 'executive' ? (
              <div className="flex items-center gap-2 sm:gap-4 bg-muted/50 px-2 sm:px-3 py-1.5 rounded-full shadow-inner">
                <span className="text-xs font-semibold text-muted-foreground mr-1 hidden sm:inline">
                  Engine:
                </span>
                {(['cpp', 'rust', 'dual'] as const).map((mode) => (
                  <label
                    key={mode}
                    className={`flex items-center gap-1 sm:gap-1.5 text-xs min-h-[44px] md:min-h-[36px] ${phase === 'idle' ? 'cursor-pointer hover:text-primary' : 'opacity-60 cursor-not-allowed'}`}
                  >
                    <input
                      type="radio"
                      name="engineMode-hsm"
                      value={mode}
                      checked={engineMode === mode}
                      onChange={() => {
                        if (phase === 'idle') setEngineMode(mode)
                      }}
                      disabled={phase !== 'idle'}
                      className="accent-primary w-3 h-3"
                    />
                    <span
                      className={
                        engineMode === mode ? 'text-primary font-bold' : 'text-muted-foreground'
                      }
                    >
                      {mode === 'cpp' && 'C++'}
                      {mode === 'rust' && 'Rust'}
                      {mode === 'dual' && (
                        <>
                          <span className="hidden sm:inline">Dual Parity</span>
                          <span className="sm:hidden">Dual</span>
                        </>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">
                Engine: <span className="font-mono text-foreground">Rust</span>
              </span>
            )}
          </>
        }
        preamble={
          <div className="mb-3 shrink-0 text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold text-foreground">New to PKCS#11?</span>
            <span>Hover a term:</span>
            <InlineTooltip term="C_GenerateKeyPair" />
            <span aria-hidden="true">·</span>
            <InlineTooltip term="CKA_EXTRACTABLE" />
            <span aria-hidden="true">·</span>
            <InlineTooltip term="CKA_SENSITIVE" />
            <span aria-hidden="true">·</span>
            <InlineTooltip term="C_WrapKey" />
            <span aria-hidden="true">·</span>
            <InlineTooltip term="CKM_AES_KW" />
            <span aria-hidden="true">·</span>
            <InlineTooltip term="C_EncapsulateKey" />
          </div>
        }
        tabs={tabs}
        value={activeTab}
        onValueChange={handleTabChange}
        tabListLabel="HSM Playground modes"
        tabListTourId="pkcs-tabs"
      />

      {showMethodologyModal && (
        <HsmTestMethodologyModal onClose={() => setShowMethodologyModal(false)} />
      )}
      {tour.hubOpen && (
        <LessonsHub<HsmTab>
          lessons={devLessons}
          done={tour.doneLessons}
          onStart={tour.startLesson}
          onClose={tour.closeHub}
          planeBadge={() => ({ label: 'Build', className: 'bg-accent/10 text-accent' })}
        />
      )}
      {tour.activeLesson && tour.tourStep >= 0 && (
        <TourOverlay
          lessonTitle={tour.activeLesson.title}
          step={tour.activeLesson.steps[tour.tourStep]}
          stepIndex={tour.tourStep}
          stepCount={tour.activeLesson.steps.length}
          rect={tour.tourRect}
          onNext={tour.nextStep}
          onBack={tour.backStep}
          onEnd={tour.endTour}
        />
      )}

      {error && (
        <div
          ref={errorRef}
          id="hsm-playground-error"
          role="alert"
          tabIndex={-1}
          className="mt-6 p-4 bg-status-error border border-status-error rounded-xl flex items-center gap-3 text-status-error text-sm shrink-0"
        >
          <AlertCircle size={20} aria-hidden="true" />
          <span className="font-medium">{error}</span>
        </div>
      )}
    </Card>
  )
}
