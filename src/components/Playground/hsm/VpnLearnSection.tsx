// SPDX-License-Identifier: GPL-3.0-only
//
// VpnLearnSection — educational reference panels for the IKEv2/IPsec VPN simulator.
// Mirrors SshLearnSection: collapsible glass-panel sections, data driven from
// ikev2Constants.ts (single source of truth for byte counts and round trips).

import { useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Network,
  ShieldCheck,
  KeyRound,
  Scissors,
  FlaskConical,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CodeBlock } from '@/components/ui/code-block'
import {
  IKE_V2_MODES,
  IKE_V2_EXCHANGES,
  IKE_AUTH_SK_BYTES,
  type IKEv2Mode,
  type IKEv2ExchangeData,
} from '@/components/PKILearning/modules/VPNSSHModule/data/ikev2Constants'

// Lint-safe (no computed object access) lookup into IKE_V2_EXCHANGES.
function exchangeFor(mode: IKEv2Mode): IKEv2ExchangeData {
  switch (mode) {
    case 'classical':
      return IKE_V2_EXCHANGES.classical
    case 'hybrid':
      return IKE_V2_EXCHANGES.hybrid
    case 'pure-pqc':
      return IKE_V2_EXCHANGES['pure-pqc']
  }
}

// ── IKEv2 exchange flow phases ─────────────────────────────────────────────────

interface FlowPhase {
  label: string
  note: string
  rfc: string
  hybridOnly?: boolean
}

const FLOW_PHASES: FlowPhase[] = [
  {
    label: 'IKE_SA_INIT →',
    note: 'SA proposal, primary KE payload, nonce Ni — sent in plaintext',
    rfc: 'RFC 7296',
  },
  {
    label: 'IKE_SA_INIT ←',
    note: 'Selected SA, primary KE reply, nonce Nr — SKEYSEED derivable',
    rfc: 'RFC 7296',
  },
  {
    label: 'IKE_INTERMEDIATE →',
    note: 'SK{ KE2 } — Additional Key Exchange 1, encrypted under keys so far',
    rfc: 'RFC 9242 / 9370',
    hybridOnly: true,
  },
  {
    label: 'IKE_INTERMEDIATE ←',
    note: 'SK{ KE2 } reply — both sides chain the new secret into SKEYSEED',
    rfc: 'RFC 9242 / 9370',
    hybridOnly: true,
  },
  {
    label: 'IKE_AUTH →',
    note: 'SK{ IDi, AUTH, [CERT], SAi2, TSi, TSr } — peer authentication',
    rfc: 'RFC 7296',
  },
  {
    label: 'IKE_AUTH ←',
    note: 'SK{ IDr, AUTH, [CERT], SAr2, TSi, TSr } — tunnel established',
    rfc: 'RFC 7296',
  },
]

// ── SKEYSEED chaining snippet (RFC 7296 §2.14 + RFC 9370 §2.2.2) ──────────────

const SKEYSEED_SNIPPET = `# Initial derivation — RFC 7296 §2.14 (after IKE_SA_INIT)
SKEYSEED  = prf(Ni | Nr, shared secret)          # primary KE result

# After EACH IKE_INTERMEDIATE Additional Key Exchange — RFC 9370 §2.2.2
SKEYSEED' = prf(SK_d, new shared secret | Ni | Nr)

# Then the key material is re-expanded from the fresh SKEYSEED':
# {SK_d | SK_ai | SK_ar | SK_ei | SK_er | SK_pi | SK_pr}
#   = prf+(SKEYSEED', Ni | Nr | SPIi | SPIr)`

// ── HNDL verdict per KE mode ───────────────────────────────────────────────────

const HNDL_VERDICT: Record<IKEv2Mode, { safe: boolean; text: string }> = {
  classical: {
    safe: false,
    text: 'Vulnerable to Harvest-Now-Decrypt-Later: a future CRQC recovers the MODP-3072 discrete log from recorded IKE_SA_INIT traffic and decrypts the whole session retroactively.',
  },
  hybrid: {
    safe: true,
    text: 'HNDL-safe: the chained SKEYSEED depends on both the ML-KEM-768 secret and the ECP-256 secret. An attacker must break BOTH algorithms — quantum-safe even if one is later found weak.',
  },
  'pure-pqc': {
    safe: true,
    text: 'HNDL-safe: session key material is fully quantum-resistant from the first exchange (ML-KEM-768, NIST Level 3). No classical fallback if a lattice break is ever found.',
  },
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SectionToggle({
  label,
  icon: Icon,
  open,
  onToggle,
}: {
  label: string
  icon: React.ElementType
  open: boolean
  onToggle: () => void
}) {
  return (
    <Button
      variant="ghost"
      onClick={onToggle}
      className="w-full flex items-center gap-2 text-sm font-semibold py-3 px-4 justify-start"
      aria-expanded={open}
    >
      {open ? (
        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
      ) : (
        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
      )}
      <Icon className="w-4 h-4 text-primary shrink-0" />
      <span className="text-gradient">{label}</span>
    </Button>
  )
}

function ModePanel({ mode }: { mode: IKEv2Mode }) {
  const config = IKE_V2_MODES.find((m) => m.id === mode)
  const exchange = exchangeFor(mode)
  const verdict = HNDL_VERDICT[mode === 'pure-pqc' ? 'pure-pqc' : mode]
  if (!config) return null

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
      <div className="rounded-lg border border-border/40 bg-muted/20 p-3 space-y-1.5">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Key exchange
        </p>
        <p className="text-sm font-mono text-foreground">{config.dhGroup}</p>
        <p className="text-xs font-mono text-muted-foreground">
          {config.encAlgorithm} · {config.integrityAlgorithm} · {config.prfAlgorithm}
        </p>
        <p className="text-xs text-muted-foreground">
          Handshake (PSK baseline): {exchange.totalBytes.toLocaleString()} B · {exchange.roundTrips}{' '}
          round trip{exchange.roundTrips > 1 ? 's' : ''}
        </p>
      </div>

      <div
        className={`rounded-lg border p-3 space-y-1.5 ${
          verdict.safe
            ? 'border-status-success/30 bg-status-success/5'
            : 'border-status-error/30 bg-status-error/5'
        }`}
      >
        <p
          className={`text-[10px] font-semibold uppercase tracking-wider ${
            verdict.safe ? 'text-status-success' : 'text-status-error'
          }`}
        >
          HNDL {verdict.safe ? 'safe' : 'vulnerable'}
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">{verdict.text}</p>
      </div>

      <div className="md:col-span-2 rounded-lg border border-border/40 bg-muted/20 p-2.5">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
          How it runs
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">{config.description}</p>
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export function VpnLearnSection() {
  const [flowOpen, setFlowOpen] = useState(false)
  const [modesOpen, setModesOpen] = useState(false)
  const [skeyseedOpen, setSkeyseedOpen] = useState(false)
  const [fragOpen, setFragOpen] = useState(false)
  const [scopeOpen, setScopeOpen] = useState(false)
  const [selectedMode, setSelectedMode] = useState<IKEv2Mode | null>(null)

  const hybridIntermediate = IKE_V2_EXCHANGES.hybrid.ikeIntermediate
  const classicalKe = IKE_V2_EXCHANGES.classical.ikeSaInit.initiator.payloads.find(
    (p) => p.abbreviation === 'KE'
  )
  const pqcKe = IKE_V2_EXCHANGES['pure-pqc'].ikeSaInit.initiator.payloads.find(
    (p) => p.abbreviation === 'KE'
  )

  return (
    <div className="space-y-2">
      {/* ── Section 1: IKEv2 Exchange Flow ── */}
      <div className="glass-panel overflow-hidden">
        <SectionToggle
          label="IKEv2 Exchange Flow — IKE_SA_INIT, IKE_INTERMEDIATE, IKE_AUTH"
          icon={Network}
          open={flowOpen}
          onToggle={() => setFlowOpen((v) => !v)}
        />

        {flowOpen && (
          <div className="px-4 pb-4 overflow-x-auto">
            <div className="flex flex-wrap gap-1.5 mt-2">
              {FLOW_PHASES.map((p, i) => (
                <div key={p.label} className="flex items-center gap-1">
                  <div
                    className={`rounded border px-2 py-1 text-center min-w-[110px] max-w-[170px] ${
                      p.hybridOnly
                        ? 'border-primary/40 bg-primary/5'
                        : 'border-border/60 bg-muted/30'
                    }`}
                  >
                    <p className="text-xs font-semibold text-foreground font-mono">{p.label}</p>
                    <p className="text-[10px] font-mono text-primary">{p.rfc}</p>
                    <p className="text-[9px] text-muted-foreground leading-tight mt-0.5">
                      {p.note}
                    </p>
                    {p.hybridOnly && (
                      <p className="text-[9px] text-primary font-semibold mt-0.5">hybrid only</p>
                    )}
                  </div>
                  {i < FLOW_PHASES.length - 1 && (
                    <span className="text-muted-foreground text-xs">→</span>
                  )}
                </div>
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-3 italic leading-relaxed">
              IKE_INTERMEDIATE (RFC 9242) appears only when an Additional Key Exchange is negotiated
              (RFC 9370 multiple-KE) — in hybrid mode it carries the ECP-256 round after ML-KEM-768
              has run in the primary KE slot of IKE_SA_INIT. Classical and pure-PQC modes go
              straight from IKE_SA_INIT to IKE_AUTH. CREATE_CHILD_SA exchanges follow for rekeying
              and additional Child SAs.
            </p>
          </div>
        )}
      </div>

      {/* ── Section 2: Classical vs Hybrid vs Pure-PQC + HNDL ── */}
      <div className="glass-panel overflow-hidden">
        <SectionToggle
          label="Classical vs Hybrid vs Pure-PQC — the HNDL threat"
          icon={ShieldCheck}
          open={modesOpen}
          onToggle={() => setModesOpen((v) => !v)}
        />

        {modesOpen && (
          <div className="px-4 pb-4 space-y-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              The IKE_SA_INIT key exchange travels in plaintext, so an adversary recording VPN
              traffic today can attack it later — Harvest Now, Decrypt Later (HNDL). Classical mode
              uses DH Group 15 (MODP-3072, 256 B public value); the PQC modes put ML-KEM-768 (NIST
              Level 3, IKEv2 Key Exchange Method 36) in the primary KE slot.
            </p>
            <div className="flex flex-wrap gap-2">
              {IKE_V2_MODES.map((mode) => (
                <Button
                  key={mode.id}
                  variant={selectedMode === mode.id ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedMode(selectedMode === mode.id ? null : mode.id)}
                  className="text-xs"
                  aria-pressed={selectedMode === mode.id}
                >
                  {mode.label}
                </Button>
              ))}
            </div>

            {selectedMode && <ModePanel mode={selectedMode} />}

            {!selectedMode && (
              <p className="text-xs text-muted-foreground italic">
                Select a mode above to see its key exchange, handshake cost, and HNDL verdict.
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Section 3: SKEYSEED chaining ── */}
      <div className="glass-panel overflow-hidden">
        <SectionToggle
          label="SKEYSEED Chaining — RFC 9370 §2.2.2"
          icon={KeyRound}
          open={skeyseedOpen}
          onToggle={() => setSkeyseedOpen((v) => !v)}
        />

        {skeyseedOpen && (
          <div className="px-4 pb-4 mt-2 space-y-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              IKEv2 derives SKEYSEED from the nonces and the primary key-exchange secret. With
              multiple key exchanges (RFC 9370), each IKE_INTERMEDIATE round{' '}
              <span className="text-foreground font-medium">re-derives</span> SKEYSEED by feeding
              the previous <span className="font-mono text-foreground">SK_d</span> and the new
              shared secret back through the prf:
            </p>
            <CodeBlock language="text" code={SKEYSEED_SNIPPET} className="my-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              The secrets are <span className="text-foreground font-medium">chained</span> through
              the prf — never XORed together. Because every re-derivation consumes the previous{' '}
              <span className="font-mono text-foreground">SK_d</span>, the final session keys are
              only recoverable by an attacker who breaks{' '}
              <span className="text-foreground font-medium">every</span> key exchange in the chain
              (in hybrid mode: both ML-KEM-768 and ECP-256). This is what makes hybrid mode
              HNDL-safe.
            </p>
          </div>
        )}
      </div>

      {/* ── Section 4: Fragmentation & MTU ── */}
      <div className="glass-panel overflow-hidden">
        <SectionToggle
          label="Fragmentation & MTU — why IKE_SA_INIT can't fragment"
          icon={Scissors}
          open={fragOpen}
          onToggle={() => setFragOpen((v) => !v)}
        />

        {fragOpen && (
          <div className="px-4 pb-4 space-y-3 text-xs text-muted-foreground leading-relaxed mt-2">
            <p>
              RFC 7383 IKE fragmentation applies{' '}
              <span className="text-foreground font-medium">
                only to messages carrying an Encrypted (SK) payload
              </span>{' '}
              — each fragment is wrapped in an SKF payload that must be encrypted and integrity-
              protected. IKE_SA_INIT runs before any keys exist, so{' '}
              <span className="text-status-warning font-medium">
                IKE_SA_INIT can never be fragmented at the IKE layer
              </span>
              . An over-MTU SA_INIT (ML-KEM-768 encapsulation key:{' '}
              {(pqcKe?.sizeBytes ?? 1192).toLocaleString()} B payload vs{' '}
              {(classicalKe?.sizeBytes ?? 264).toLocaleString()} B for MODP-3072) must survive
              IP-layer fragmentation — frequently dropped by middleboxes — or the handshake fails.
              This is the core ML-KEM-in-SA_INIT deployment problem.
            </p>
            <p>
              The message that <span className="text-foreground font-medium">most</span> needs RFC
              7383 is IKE_AUTH under certificate authentication: its SK payload carries the peer
              certificate plus the AUTH signature. With ML-DSA-65 that is roughly{' '}
              {IKE_AUTH_SK_BYTES['ML-DSA-65'].toLocaleString()} B (vs{' '}
              {IKE_AUTH_SK_BYTES.PSK.toLocaleString()} B for PSK and{' '}
              {IKE_AUTH_SK_BYTES['RSA-3072'].toLocaleString()} B for RSA-3072) — several fragments
              at a 1,500 B MTU. Fortunately IKE_AUTH is encrypted, so RFC 7383 fragmentation works
              there.
            </p>
            <p className="italic">
              Try it in the simulator: lower the MTU slider below ~1,300 B and watch IKE_SA_INIT go
              over MTU in the PQC modes while SK-carrying messages fragment cleanly.
            </p>
          </div>
        )}
      </div>

      {/* ── Section 5: Real vs simulated ── */}
      <div className="glass-panel overflow-hidden">
        <SectionToggle
          label="What's Real vs Simulated in This Build"
          icon={FlaskConical}
          open={scopeOpen}
          onToggle={() => setScopeOpen((v) => !v)}
        />

        {scopeOpen && (
          <div className="px-4 pb-4 space-y-3 text-xs text-muted-foreground leading-relaxed mt-2">
            <div className="rounded-lg border border-status-success/30 bg-status-success/5 p-3 space-y-1.5">
              <p className="text-[10px] font-semibold text-status-success uppercase tracking-wider">
                Real
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>
                  ML-KEM-768 key exchange in the primary KE slot of IKE_SA_INIT — real{' '}
                  <span className="font-mono text-foreground">C_EncapsulateKey</span> /{' '}
                  <span className="font-mono text-foreground">C_DecapsulateKey</span> (PKCS#11 v3.2)
                  on softhsmv3 WASM.
                </li>
                <li>
                  RSA-3072 and ML-DSA-44/65/87 key generation plus self-signed X.509 certificates
                  built and signed on the HSM (ML-DSA OIDs per RFC 9881);{' '}
                  <span className="font-mono text-foreground">C_Sign</span> for IKE_AUTH in
                  certificate mode.
                </li>
                <li>
                  Charon library code: proposal parser (ML-KEM transforms — IANA KE Methods
                  35/36/37) and certificate loader.
                </li>
              </ul>
            </div>
            <div className="rounded-lg border border-status-warning/30 bg-status-warning/5 p-3 space-y-1.5">
              <p className="text-[10px] font-semibold text-status-warning uppercase tracking-wider">
                Simulated
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>
                  The hybrid IKE_INTERMEDIATE round (ECP-256 as Additional Key Exchange 1, RFC
                  9242/9370): the additional-KE exchange logic is not in this WASM build, so that
                  round appears as narrated <span className="font-mono text-foreground">[SIM]</span>{' '}
                  log entries
                  {hybridIntermediate
                    ? ` (${hybridIntermediate.initiator.payloads
                        .reduce((a, p) => a + p.sizeBytes, 0)
                        .toLocaleString()} B per message in the diagram)`
                    : ''}
                  .
                </li>
                <li>
                  IKE wire packets: messages are not serialized or exchanged over a network — the
                  diagram and payload sizes come from{' '}
                  <span className="font-mono text-foreground">ikev2Constants.ts</span>.
                </li>
                <li>
                  Fragmentation/MTU: the over-MTU check is UI-side; charon&apos;s RFC 7383 fragment
                  assembly never runs.
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
