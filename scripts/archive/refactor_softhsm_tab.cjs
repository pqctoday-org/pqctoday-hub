const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, '../src/components/Playground/tabs/SoftHsmTab.tsx')
let content = fs.readFileSync(filePath, 'utf8')

// The new imports
const newImports = `import { TokenSetupDemo } from './softhsm/TokenSetupDemo'
import { MLKemDemo } from './softhsm/MLKemDemo'
import { MLDsaDemo } from './softhsm/MLDsaDemo'
import { SlhDsaDemo } from './softhsm/SlhDsaDemo'
import { Phase, KEM_SIZES, DSA_SIZES } from './softhsm/SoftHsmUI'`

// Replace the imports at the top
content = content.replace(
  "import { HsmMechanismPanel } from '../hsm/HsmMechanismPanel'",
  "import { HsmMechanismPanel } from '../hsm/HsmMechanismPanel'\\n" + newImports
)

// Delete the static size hints and helpers block
const block1Start =
  '// ── Static size hints ────────────────────────────────────────────────────────'
const block1End = "type Phase = 'idle' | 'initialized' | 'session_open'"
content =
  content.slice(0, content.indexOf(block1Start)) +
  content.slice(content.indexOf(block1End) + block1End.length)

// Delete VariantSelector, ResultRow, StepBadge
const block2Start =
  '// ── Variant selector ──────────────────────────────────────────────────────────'
const block2End =
  '// ── Log panel ─────────────────────────────────────────────────────────────────'
content = content.slice(0, content.indexOf(block2Start)) + content.slice(content.indexOf(block2End))

const block3Start =
  '// ── Step badge ────────────────────────────────────────────────────────────────'
const block3End = '// ── HSM mode wrapper (PKCS#11 call log from HsmContext) ──────────────────────'
content = content.slice(0, content.indexOf(block3Start)) + content.slice(content.indexOf(block3End))

// Replace SoftHsmTabBrowser
const newBrowser = `const SoftHsmTabBrowser = () => {
  const [liveMode, setLiveMode] = useState(false)
  
  // Shared state connecting the children
  const [phase, setPhase] = useState<Phase>('idle')
  const [tokenCreated, setTokenCreated] = useState(false)
  const [log, setLog] = useState<Pkcs11LogEntry[]>([])

  const moduleRef = useRef<SoftHSMModule | null>(null)
  const hSessionRef = useRef<number>(0)
  const slotRef = useRef<number>(0)

  const addLog = useCallback((e: Pkcs11LogEntry) => setLog((l) => [...l, e]), [])
  
  const sessionOpen = phase === 'session_open'

  if (!liveMode) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between glass-panel p-4">
          <div>
            <p className="font-semibold text-sm">PKCS#11 v3.2 — PQC HSM</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Token lifecycle, ML-KEM, ML-DSA via SoftHSM WASM + OpenSSL 3.6
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setLiveMode(true)}>
            <Shield size={14} className="mr-2" /> Live WASM
          </Button>
        </div>
        <SimulationView />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between glass-panel p-4">
        <div>
          <p className="font-semibold text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-status-success inline-block animate-pulse" />
            Live WASM — PKCS#11 v3.2
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real in-browser SoftHSM token · OpenSSL 3.6 · FIPS 203 / 204 / 205
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            try {
              if (moduleRef.current && hSessionRef.current) {
                hsm_finalize(moduleRef.current, hSessionRef.current)
              }
            } catch {
              // ignore
            }
            moduleRef.current = null
            hSessionRef.current = 0
            slotRef.current = 0
            setTokenCreated(false)
            setPhase('idle')
            setLog([])
            setLiveMode(false)
          }}
        >
          Simulation
        </Button>
      </div>

      <TokenSetupDemo
        moduleRef={moduleRef}
        slotRef={slotRef}
        hSessionRef={hSessionRef}
        phase={phase}
        setPhase={setPhase}
        tokenCreated={tokenCreated}
        setTokenCreated={setTokenCreated}
        addLog={addLog}
      />

      <HsmMechanismPanel />

      <MLKemDemo moduleRef={moduleRef} hSessionRef={hSessionRef} sessionOpen={sessionOpen} />
      
      <MLDsaDemo moduleRef={moduleRef} hSessionRef={hSessionRef} sessionOpen={sessionOpen} />

      <SlhDsaDemo moduleRef={moduleRef} hSessionRef={hSessionRef} sessionOpen={sessionOpen} />
    </div>
  )
}
`

const browserStart =
  '// ── Browser mode (original implementation, unchanged) ────────────────────────'
content = content.slice(0, content.indexOf(browserStart)) + browserStart + '\\n\\n' + newBrowser

fs.writeFileSync(filePath, content, 'utf8')
console.log('Successfully replaced monolithic chunks')
