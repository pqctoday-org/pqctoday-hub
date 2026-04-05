// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import React, { useState, useCallback, useMemo } from 'react'
import { ArrowRight, ArrowLeft, RotateCcw, ShieldAlert, Cpu, CheckCircle } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { GlossaryAutoWrap } from '@/components/PKILearning/common/GlossaryAutoWrap'
import { HsmKeyInspector } from '../../shared/HsmKeyInspector'
import { PkcsLogPanel } from '../components/PkcsLogPanel'

import { CKF_RW_SESSION, CKF_SERIAL_SESSION, CKU_USER } from '@/wasm/softhsm/constants'

import {
  IKE_V2_MODES,
  IKE_V2_EXCHANGES,
  type IKEv2Mode,
  type IKEv2Payload,
} from '@/components/PKILearning/modules/VPNSSHModule/data/ikev2Constants'
import {
  strongSwanEngine,
  type StrongSwanLog,
  type StrongSwanState,
} from '@/wasm/strongswan/bridge'
import { useHsmContext } from './HsmContext'

export interface VpnSimulationPanelProps {
  initialMode?: IKEv2Mode
}

const PayloadCard: React.FC<{
  payload: IKEv2Payload
  index: number
  highlighted: boolean
  isFragmented?: boolean
}> = ({ payload, highlighted, isFragmented }) => (
  <div
    className={`rounded-lg p-2 border text-xs transition-all duration-300 ${
      highlighted
        ? isFragmented
          ? 'bg-destructive/10 border-destructive/40 shadow-[0_0_8px_hsl(var(--destructive)/0.15)] animate-pulse'
          : 'bg-primary/10 border-primary/40 shadow-[0_0_8px_hsl(var(--primary)/0.15)]'
        : 'bg-muted/50 border-border'
    }`}
  >
    <div className="flex items-center justify-between mb-1">
      <span className={`font-bold ${isFragmented ? 'text-destructive' : 'text-foreground'}`}>
        {payload.abbreviation}
      </span>
      <span className="text-muted-foreground">{payload.sizeBytes} B</span>
    </div>
    <p className="text-muted-foreground text-[10px]">{payload.description}</p>
    {isFragmented && (
      <div className="text-destructive text-[10px] mt-1 font-bold flex items-center gap-1">
        <ShieldAlert size={10} /> Packet dropped (Exceeds MTU)
      </div>
    )}
  </div>
)

export const VpnSimulationPanel: React.FC<VpnSimulationPanelProps> = ({ initialMode }) => {
  const { moduleRef, hSessionRef, addHsmLog, hsmKeys } = useHsmContext()
  const hsmKeysRef = React.useRef(hsmKeys)
  React.useEffect(() => {
    hsmKeysRef.current = hsmKeys
  }, [hsmKeys])
  const [selectedMode, setSelectedMode] = useState<IKEv2Mode>(initialMode ?? 'classical')
  const [currentStep, setCurrentStep] = useState(0)
  const [mtu, setMtu] = useState<number>(1500)
  const [allowFragmentation, setAllowFragmentation] = useState<boolean>(true)
  const [ssState, setSsState] = useState<StrongSwanState>('UNINITIALIZED')
  const [charonFailed, setCharonFailed] = useState(false)
  const [sabError, setSabError] = useState<string | null>(null)
  const [ssLogs, setSsLogs] = useState<StrongSwanLog[]>([])

  const serverSessionRef = React.useRef(0)

  // VPN RPC state: session mapping + per-call sign/verify context
  const vpnStateRef = React.useRef<{
    sessions: Map<number, number> // logical slotId per softhsmv3 session handle
    signMechType: number
    signHKey: number
    verifyMechType: number
    verifyHKey: number
  }>({
    sessions: new Map(),
    signMechType: 0,
    signHKey: 0,
    verifyMechType: 0,
    verifyHKey: 0,
  })

  // Key Gen State for Client
  const [clientAlg, setClientAlg] = useState('RSA')
  const [clientSize, setClientSize] = useState('65')
  const [clientClassAlg, setClientClassAlg] = useState('RSA-3072')

  // Key Gen State for Server
  const [serverAlg, setServerAlg] = useState('ML-DSA')
  const [serverSize, setServerSize] = useState('65')
  const [serverClassAlg, setServerClassAlg] = useState('RSA-3072')

  const scrollRef = React.useRef<HTMLDivElement>(null)

  // Single PKCS#11 module — softhsmv3 is statically linked.
  // Both slots (0=initiator keys, 1=responder keys) are accessible via one C_Initialize.
  const charonConfig = `charon {
  integrity_test = no
  load_modular = no
  load = random nonce aes sha1 sha2 hmac pkcs11 socket-wasm
  plugins {
    pkcs11 {
      use_hasher = yes
      use_rng = yes
      modules {
        softhsm {
          path = libsofthsmv3.so
        }
      }
    }
  }
  filelog {
    stderr {
      time_format = %H:%M:%S
      default = 2
      mgr = 2
      ike = 2
      enc = 2
      cfg = 2
    }
  }
}`

  const initiatorIpsec = `config setup
  strictcrlpolicy=no
conn %default
  ikelifetime=60m
  keylife=20m
  rekeymargin=3m
  keyingtries=1
conn host-host
  left=192.168.0.1
  leftauth=pubkey
  leftsigkey=%smartcard1
  right=192.168.0.2
  rightauth=pubkey
  rightsigkey=%smartcard2
  ike=aes256-mlkem768-sha384!
  esp=aes256gcm16!
  auto=start`

  const responderIpsec = `config setup
  strictcrlpolicy=no
conn %default
  ikelifetime=60m
  keylife=20m
  rekeymargin=3m
  keyingtries=1
conn host-host
  left=192.168.0.2
  leftauth=pubkey
  leftsigkey=%smartcard1
  right=192.168.0.1
  rightauth=pubkey
  rightsigkey=%smartcard2
  ike=aes256-mlkem768-sha384!
  esp=aes256gcm16!
  auto=route`

  const [activeInitConfig, setActiveInitConfig] = useState(charonConfig)
  const [activeRespConfig, setActiveRespConfig] = useState(charonConfig)
  const [activeInitIpsec, setActiveInitIpsec] = useState(initiatorIpsec)
  const [activeRespIpsec, setActiveRespIpsec] = useState(responderIpsec)

  // Bidirectional UI -> Config sync
  React.useEffect(() => {
    let modeike = 'aes256-mlkem768-sha384!'
    if (selectedMode === 'classical') modeike = 'aes256-sha256-modp3072!'
    if (selectedMode === 'hybrid') modeike = 'aes256-mlkem768-x25519-sha384!'

    const replaceIke = (prev: string) => {
      if (/ike=.*/.test(prev)) {
        return prev.replace(/ike=.*/, `ike=${modeike}`)
      } else {
        // If the user deleted the ike= line, we safely inject it back under the host-host connection block
        return prev.replace(/conn host-host/, `conn host-host\n  ike=${modeike}`)
      }
    }
    setActiveInitIpsec(replaceIke)
    setActiveRespIpsec(replaceIke)
  }, [selectedMode])

  React.useEffect(() => {
    const handleLog = (log: StrongSwanLog) => {
      setSsLogs((prev) => {
        const next = [...prev, log]
        return next.length > 500 ? next.slice(next.length - 500) : next
      })
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }

      // Auto-advance UI slideshow based on actual charon log output
      const text = log.text.toLowerCase()

      // Basic IKEv2 heuristic log parser mapping
      if (text.includes('initiating ike_sa')) {
        setCurrentStep(1)
      } else if (
        text.includes('parsing ike_sa_init response') ||
        text.includes('parsed ike_sa_init response')
      ) {
        setCurrentStep(2)
      } else if (text.includes('authentication of') && text.includes('successful')) {
        setCurrentStep(3)
      } else if (text.includes('ike_sa') && text.includes('established between')) {
        // Find the length of steps so we can set it to max.
        // Usually established is the final step.
        setCurrentStep((prev) => Math.max(prev, 3)) // Fallback, will be maxed later
        setCharonFailed(false)
      } else if (
        text.includes('establishing ike_sa failed') ||
        text.includes('fatal error') ||
        text.includes('error:') ||
        text.includes('signature validation failed')
      ) {
        setCharonFailed(true)
      }
    }
    const handleState = (state: StrongSwanState) => setSsState(state)

    strongSwanEngine.addLogListener(handleLog)
    strongSwanEngine.addStateListener(handleState)

    // Wire up RPC handler — dispatches charon's PKCS#11 calls into softhsmv3 in real time.
    // Both arrays alias the same SharedArrayBuffer so writes are immediately visible to the worker.
    strongSwanEngine.setRpcHandler((sab, workerRole) => {
      const M = moduleRef.current
      if (!M) return

      const flagView = new Int32Array(sab, 0, 12)
      const p = new Int32Array(sab, 48) // payload i32 view (same as rpcPayloadI32 in worker)
      const payloadView = new Uint8Array(sab, 48) // payload byte view

      const cmdId = Atomics.load(flagView, 0)
      const state = vpnStateRef.current
      let rv = 0 // CKR_OK default

      try {
        switch (cmdId) {
          // ── C_Initialize ─────────────────────────────────────────────────────
          case 0: {
            const r = M._C_Initialize(0) >>> 0
            rv = r === 0x191 ? 0 : r // CKR_CRYPTOKI_ALREADY_INITIALIZED → OK
            strongSwanEngine.dispatchLog({
              level: 'info',
              text: `[RPC] C_Initialize → rv=0x${rv.toString(16)} (raw=0x${r.toString(16)})`,
            })
            break
          }

          // ── C_Finalize ───────────────────────────────────────────────────────
          case 1:
            rv = 0
            break

          // ── C_GetSlotList ────────────────────────────────────────────────────
          // Always advertise slots [0, 1] so charon loads both client and server modules.
          case 4: {
            const wantList = p[2]
            p[0] = 2 // count = 2 slots (client slot 0, server slot 1)
            if (wantList) {
              p[1] = 0
              p[2] = 1
            } // slot IDs; both map to softhsmv3 slot 0 internally
            rv = 0
            break
          }

          // ── C_GetTokenInfo ───────────────────────────────────────────────────
          // Write a minimal CK_TOKEN_INFO (160 bytes) into payload[4..164].
          // CKF_TOKEN_INITIALIZED=0x400 | CKF_RNG=0x01 | CKF_USER_PIN_INITIALIZED=0x08
          // CKF_LOGIN_REQUIRED is intentionally cleared — we auto-login in C_OpenSession.
          case 6: {
            const slotId6 = p[0] >>> 0
            payloadView.fill(0x20, 4, 100) // space-pad label/mfr/model/serial (TOKEN_INFO bytes 0-95)
            payloadView.fill(0, 100, 164) // zero numeric fields (TOKEN_INFO bytes 96-159)
            const dv = new DataView(sab, 48 + 4) // DataView over TOKEN_INFO struct (starts at payload byte 4)
            dv.setUint32(96, 0x409, true) // flags: TOKEN_INITIALIZED|RNG|USER_PIN_INITIALIZED
            dv.setUint32(100, 0xffffffff, true) // ulMaxSessionCount = CK_EFFECTIVELY_INFINITE
            dv.setUint32(104, 0, true) // ulSessionCount (current)
            dv.setUint32(108, 0xffffffff, true) // ulMaxRwSessionCount = CK_EFFECTIVELY_INFINITE
            dv.setUint32(112, 0, true) // ulRwSessionCount (current)
            dv.setUint32(116, 255, true) // ulMaxPinLen
            dv.setUint32(120, 4, true) // ulMinPinLen
            dv.setUint32(124, 0xffffffff, true) // ulTotalPublicMemory = CK_UNAVAILABLE
            dv.setUint32(128, 0xffffffff, true) // ulFreePublicMemory = CK_UNAVAILABLE
            dv.setUint32(132, 0xffffffff, true) // ulTotalPrivateMemory = CK_UNAVAILABLE
            dv.setUint32(136, 0xffffffff, true) // ulFreePrivateMemory = CK_UNAVAILABLE
            rv = 0
            strongSwanEngine.dispatchLog({
              level: 'info',
              text: `[RPC] C_GetTokenInfo slotId=${slotId6} → flags=0x409 ulMaxSess=∞`,
            })
            break
          }

          // ── C_GetMechanismList ───────────────────────────────────────────────
          case 7: {
            const mechs = [0x00, 0x01, 0x06, 0x40, 0x43, 0x1058] // RSA_PKCS_KEY_PAIR_GEN, RSA_PKCS, SHA1_RSA_PKCS, SHA256_RSA_PKCS, SHA256_RSA_PKCS_PSS, CKM_ML_KEM
            const wantList7 = p[2]
            p[0] = mechs.length
            if (wantList7)
              mechs.forEach((m, i) => {
                p[1 + i] = m
              })
            rv = 0
            break
          }

          // ── C_OpenSession ─────────────────────────────────────────────────────
          // Charon queries logical slots 0 and 1, which map nicely to physical slot 0 (client) and 1 (server).
          case 12: {
            const slotId12 = p[0] >>> 0
            const flags12 = p[1] >>> 0
            const sessPtr = M._malloc(4)
            const r12 =
              M._C_OpenSession(slotId12, CKF_RW_SESSION | CKF_SERIAL_SESSION, 0, 0, sessPtr) >>> 0
            if (r12 === 0) {
              const hSess = M.getValue(sessPtr, 'i32') >>> 0
              const pinBytes = new TextEncoder().encode('user1234')
              const pinPtr = M._malloc(pinBytes.length)
              M.HEAPU8.set(pinBytes, pinPtr)
              const loginRv = M._C_Login(hSess, CKU_USER, pinPtr, pinBytes.length) >>> 0
              M._free(pinPtr)
              p[0] = hSess
              state.sessions.set(hSess, slotId12)
              strongSwanEngine.dispatchLog({
                level: 'info',
                text: `[RPC] C_OpenSession slotId=${slotId12} flags=0x${flags12.toString(16)} → hSess=${hSess} loginRv=0x${loginRv.toString(16)}`,
              })
            } else {
              strongSwanEngine.dispatchLog({
                level: 'error',
                text: `[RPC] C_OpenSession slotId=${slotId12} FAILED rv=0x${r12.toString(16)}`,
              })
            }
            M._free(sessPtr)
            rv = r12
            break
          }

          // ── C_CloseSession ───────────────────────────────────────────────────
          case 13: {
            const hSess13 = p[0] >>> 0
            state.sessions.delete(hSess13)
            M._C_CloseSession(hSess13)
            rv = 0
            break
          }

          // ── C_Login ── already logged in during OpenSession ──────────────────
          case 18:
            rv = 0x100
            break // CKR_USER_ALREADY_LOGGED_IN

          // ── C_Logout ─────────────────────────────────────────────────────────
          case 19:
            rv = 0
            break

          // ── C_GetAttributeValue ───────────────────────────────────────────────
          // Two-pass softhsmv3 call: first get sizes (NULL pValue), then values.
          // Worker already serialised attrCount types+capacities into payload.
          case 24: {
            const hSess24 = p[0] >>> 0
            const hObj = p[1] >>> 0
            const attrCount = p[2] >>> 0
            const types: number[] = []
            for (let i = 0; i < attrCount; i++) types.push(p[3 + i * 2] >>> 0)

            // Pass 1: null pValue → get actual sizes
            const tpl1 = M._malloc(attrCount * 12)
            types.forEach((t, i) => {
              M.setValue(tpl1 + i * 12, t, 'i32')
              M.setValue(tpl1 + i * 12 + 4, 0, 'i32')
              M.setValue(tpl1 + i * 12 + 8, 0, 'i32')
            })
            M._C_GetAttributeValue(hSess24, hObj, tpl1, attrCount)
            const sizes = types.map((_, i) => M.getValue(tpl1 + i * 12 + 8, 'i32') >>> 0)
            M._free(tpl1)

            // Pass 2: allocate buffers and fill
            const valPtrs = sizes.map((s) => (s > 0 ? M._malloc(s) : 0))
            const tpl2 = M._malloc(attrCount * 12)
            types.forEach((t, i) => {
              M.setValue(tpl2 + i * 12, t, 'i32')
              M.setValue(tpl2 + i * 12 + 4, valPtrs[i], 'i32')
              M.setValue(tpl2 + i * 12 + 8, sizes[i], 'i32')
            })
            rv = M._C_GetAttributeValue(hSess24, hObj, tpl2, attrCount) >>> 0

            // Serialize: write actual lengths into payload[3+i*2], values after header
            const byteBase = (3 + attrCount * 2) * 4
            let bytePos = 0
            types.forEach((_, i) => {
              const len = M.getValue(tpl2 + i * 12 + 8, 'i32') >>> 0
              p[3 + i * 2] = len
              if (valPtrs[i] && len > 0) {
                payloadView.set(M.HEAPU8.subarray(valPtrs[i], valPtrs[i] + len), byteBase + bytePos)
              }
              bytePos += len
              if (valPtrs[i]) M._free(valPtrs[i])
            })
            M._free(tpl2)
            break
          }

          // ── C_FindObjectsInit ─────────────────────────────────────────────────
          case 26: {
            const hSess26 = p[0] >>> 0
            const attrCount26 = p[1] >>> 0
            const byteBase26 = (2 + attrCount26 * 2) * 4
            let bytePos26 = 0

            const tplPtr26 = M._malloc(attrCount26 * 12)
            for (let i = 0; i < attrCount26; i++) {
              const attrType = p[2 + i * 2]
              const attrLen = p[3 + i * 2]

              M.setValue(tplPtr26 + i * 12, attrType, 'i32')
              if (attrLen > 0) {
                const valPtr = M._malloc(attrLen)
                M.HEAPU8.set(
                  payloadView.subarray(byteBase26 + bytePos26, byteBase26 + bytePos26 + attrLen),
                  valPtr
                )
                M.setValue(tplPtr26 + i * 12 + 4, valPtr, 'i32')
              } else {
                M.setValue(tplPtr26 + i * 12 + 4, 0, 'i32')
              }
              M.setValue(tplPtr26 + i * 12 + 8, attrLen, 'i32')
              bytePos26 += attrLen
            }

            rv = M._C_FindObjectsInit(hSess26, tplPtr26, attrCount26) >>> 0

            for (let i = 0; i < attrCount26; i++) {
              const valPtr = M.getValue(tplPtr26 + i * 12 + 4, 'i32')
              if (valPtr) M._free(valPtr)
            }
            M._free(tplPtr26)
            strongSwanEngine.dispatchLog({
              level: rv === 0 ? 'info' : 'error',
              text: `[RPC] C_FindObjectsInit hSess=${hSess26} attrCount=${attrCount26} → rv=0x${rv.toString(16)}`,
            })
            break
          }

          // ── C_FindObjects ─────────────────────────────────────────────────────
          case 27: {
            const hSess27 = p[0] >>> 0
            const maxCount27 = p[1] >>> 0
            const handlesPtr = M._malloc(maxCount27 * 4)
            const countPtr = M._malloc(4)
            rv = M._C_FindObjects(hSess27, handlesPtr, maxCount27, countPtr) >>> 0

            if (rv === 0) {
              const foundCount = M.getValue(countPtr, 'i32') >>> 0
              p[0] = foundCount
              for (let i = 0; i < foundCount; i++) {
                p[1 + i] = M.getValue(handlesPtr + i * 4, 'i32') >>> 0
              }
              strongSwanEngine.dispatchLog({
                level: 'info',
                text: `[RPC] C_FindObjects maxCount=${maxCount27} found=${foundCount} (worker=${workerRole})`,
              })
            } else {
              strongSwanEngine.dispatchLog({
                level: 'error',
                text: `[RPC] C_FindObjects failed rv=0x${rv.toString(16)}`,
              })
            }
            M._free(handlesPtr)
            M._free(countPtr)
            break
          }

          // ── C_FindObjectsFinal ────────────────────────────────────────────────
          case 28: {
            const hSess28 = p[0] >>> 0
            rv = M._C_FindObjectsFinal(hSess28) >>> 0
            break
          }

          // ── C_SignInit ────────────────────────────────────────────────────────
          // Call softhsmv3 immediately; signing state lives in the WASM session object.
          case 42: {
            const hSess42 = p[0] >>> 0
            const mechType42 = p[1] >>> 0
            const paramLen42 = p[2] >>> 0
            const hKey42 = p[3] >>> 0
            const mechPtr42 = M._malloc(12)
            M.setValue(mechPtr42, mechType42, 'i32')
            if (paramLen42 > 0) {
              const paramPtr42 = M._malloc(paramLen42)
              M.HEAPU8.set(payloadView.subarray(16, 16 + paramLen42), paramPtr42)
              M.setValue(mechPtr42 + 4, paramPtr42, 'i32')
              M.setValue(mechPtr42 + 8, paramLen42, 'i32')
              rv = M._C_SignInit(hSess42, mechPtr42, hKey42) >>> 0
              M._free(paramPtr42)
            } else {
              M.setValue(mechPtr42 + 4, 0, 'i32')
              M.setValue(mechPtr42 + 8, 0, 'i32')
              rv = M._C_SignInit(hSess42, mechPtr42, hKey42) >>> 0
            }
            M._free(mechPtr42)
            strongSwanEngine.dispatchLog({
              level: rv === 0 ? 'info' : 'error',
              text: `[RPC] C_SignInit hSess=${hSess42} mech=0x${mechType42.toString(16)} hKey=${hKey42} → rv=0x${rv.toString(16)}`,
            })
            break
          }

          // ── C_Sign ───────────────────────────────────────────────────────────
          // wantSig=0: return buffer-size hint without signing (preserves WASM signing state).
          // wantSig=1: call softhsmv3 C_Sign; write signature into payload[4..].
          case 43: {
            const hSess43 = p[0] >>> 0
            const dataLen43 = p[1] >>> 0
            const wantSig43 = p[2]
            if (!wantSig43) {
              p[0] = 4096 // conservative size estimate; charon allocates this much
              rv = 0
              strongSwanEngine.dispatchLog({
                level: 'info',
                text: `[RPC] C_Sign hSess=${hSess43} sizeQuery → hint=4096`,
              })
            } else {
              const dataPtr43 = M._malloc(dataLen43)
              M.HEAPU8.set(payloadView.subarray(12, 12 + dataLen43), dataPtr43)
              const sigBufPtr43 = M._malloc(4096)
              const sigLenPtr43 = M._malloc(4)
              M.setValue(sigLenPtr43, 4096, 'i32')
              rv = M._C_Sign(hSess43, dataPtr43, dataLen43, sigBufPtr43, sigLenPtr43) >>> 0
              const sigLen43 = M.getValue(sigLenPtr43, 'i32') >>> 0
              p[0] = sigLen43
              if (rv === 0 && sigLen43 > 0) {
                payloadView.set(M.HEAPU8.subarray(sigBufPtr43, sigBufPtr43 + sigLen43), 4)
              }
              M._free(dataPtr43)
              M._free(sigBufPtr43)
              M._free(sigLenPtr43)
              strongSwanEngine.dispatchLog({
                level: rv === 0 ? 'info' : 'error',
                text: `[RPC] C_Sign hSess=${hSess43} dataLen=${dataLen43} → sigLen=${sigLen43} rv=0x${rv.toString(16)}`,
              })
            }
            break
          }

          // ── C_VerifyInit ──────────────────────────────────────────────────────
          case 48: {
            const hSess48 = p[0] >>> 0
            const mechType48 = p[1] >>> 0
            const paramLen48 = p[2] >>> 0
            const hKey48 = p[3] >>> 0
            const mechPtr48 = M._malloc(12)
            M.setValue(mechPtr48, mechType48, 'i32')
            if (paramLen48 > 0) {
              const paramPtr48 = M._malloc(paramLen48)
              M.HEAPU8.set(payloadView.subarray(16, 16 + paramLen48), paramPtr48)
              M.setValue(mechPtr48 + 4, paramPtr48, 'i32')
              M.setValue(mechPtr48 + 8, paramLen48, 'i32')
              rv = M._C_VerifyInit(hSess48, mechPtr48, hKey48) >>> 0
              M._free(paramPtr48)
            } else {
              M.setValue(mechPtr48 + 4, 0, 'i32')
              M.setValue(mechPtr48 + 8, 0, 'i32')
              rv = M._C_VerifyInit(hSess48, mechPtr48, hKey48) >>> 0
            }
            M._free(mechPtr48)
            strongSwanEngine.dispatchLog({
              level: rv === 0 ? 'info' : 'error',
              text: `[RPC] C_VerifyInit hSess=${hSess48} mech=0x${mechType48.toString(16)} hKey=${hKey48} → rv=0x${rv.toString(16)}`,
            })
            break
          }

          // ── C_Verify ──────────────────────────────────────────────────────────
          case 49: {
            const hSess49 = p[0] >>> 0
            const dataLen49 = p[1] >>> 0
            const sigLen49 = p[2] >>> 0
            const dataPtr49 = M._malloc(dataLen49)
            const sigPtr49 = M._malloc(sigLen49)
            M.HEAPU8.set(payloadView.subarray(12, 12 + dataLen49), dataPtr49)
            M.HEAPU8.set(payloadView.subarray(12 + dataLen49, 12 + dataLen49 + sigLen49), sigPtr49)
            rv = M._C_Verify(hSess49, dataPtr49, dataLen49, sigPtr49, sigLen49) >>> 0
            M._free(dataPtr49)
            M._free(sigPtr49)
            break
          }

          // ── C_GenerateKeyPair ────────────────────────────────────────────────
          case 59: {
            const hSess59 = p[0] >>> 0
            const mechType59 = p[1] >>> 0
            const pubCount59 = p[2] >>> 0
            const privCount59 = p[3] >>> 0

            const mechPtr59 = M._malloc(12)
            M.setValue(mechPtr59, mechType59, 'i32')
            M.setValue(mechPtr59 + 4, 0, 'i32') // param ptr
            M.setValue(mechPtr59 + 8, 0, 'i32') // param len

            const deserializeTpl = (count: number, startHdrOff: number, byteBase: number) => {
              const tplPtr = M._malloc(count * 12)
              let byteOff = 0
              let hdrOff = startHdrOff
              for (let i = 0; i < count; i++) {
                const type = p[hdrOff++]
                const valLen = p[hdrOff++]
                M.setValue(tplPtr + i * 12, type, 'i32')
                if (valLen > 0) {
                  const valPtr = M._malloc(valLen)
                  M.HEAPU8.set(
                    payloadView.subarray(byteBase + byteOff, byteBase + byteOff + valLen),
                    valPtr
                  )
                  M.setValue(tplPtr + i * 12 + 4, valPtr, 'i32')
                } else {
                  M.setValue(tplPtr + i * 12 + 4, 0, 'i32')
                }
                M.setValue(tplPtr + i * 12 + 8, valLen, 'i32')
                byteOff += valLen > 0 ? valLen : 0
              }
              return { tplPtr, totalBytes: byteOff }
            }

            const byteBase59 = (4 + (pubCount59 + privCount59) * 2) * 4
            const pubTpl = deserializeTpl(pubCount59, 4, byteBase59)
            const privTpl = deserializeTpl(
              privCount59,
              4 + pubCount59 * 2,
              byteBase59 + pubTpl.totalBytes
            )

            const pubKeyPtr = M._malloc(4)
            const privKeyPtr = M._malloc(4)

            rv =
              M._C_GenerateKeyPair(
                hSess59,
                mechPtr59,
                pubTpl.tplPtr,
                pubCount59,
                privTpl.tplPtr,
                privCount59,
                pubKeyPtr,
                privKeyPtr
              ) >>> 0

            if (rv === 0) {
              p[0] = M.getValue(pubKeyPtr, 'i32') >>> 0
              p[1] = M.getValue(privKeyPtr, 'i32') >>> 0
            }

            M._free(mechPtr59)
            const freeTplVals = (tplPtr: number, count: number) => {
              for (let i = 0; i < count; i++) {
                const valPtr = M.getValue(tplPtr + i * 12 + 4, 'i32')
                if (valPtr) M._free(valPtr)
              }
              M._free(tplPtr)
            }
            freeTplVals(pubTpl.tplPtr, pubCount59)
            freeTplVals(privTpl.tplPtr, privCount59)
            M._free(pubKeyPtr)
            M._free(privKeyPtr)

            strongSwanEngine.dispatchLog({
              level: rv === 0 ? 'info' : 'error',
              text: `[RPC] C_GenerateKeyPair hSess=${hSess59} mech=0x${mechType59.toString(16)} → rv=0x${rv.toString(16)}`,
            })
            break
          }

          // ── C_EncapsulateKey ────────────────────────────────────────────────
          case 68: {
            const hSess68 = p[0] >>> 0
            const mechType68 = p[1] >>> 0
            const hKey68 = p[2] >>> 0
            const wantCt = p[3]

            const mechPtr68 = M._malloc(12)
            M.setValue(mechPtr68, mechType68, 'i32')
            M.setValue(mechPtr68 + 4, 0, 'i32')
            M.setValue(mechPtr68 + 8, 0, 'i32')

            if (!wantCt) {
              const ctLenPtr = M._malloc(4)
              // eslint-disable-next-line @typescript-eslint/no-explicit-any -- charon RPC proxy uses different arity than direct PKCS#11
              rv = (M as any)._C_EncapsulateKey(hSess68, mechPtr68, hKey68, 0, ctLenPtr, 0) >>> 0
              if (rv === 0) p[0] = M.getValue(ctLenPtr, 'i32') >>> 0
              M._free(ctLenPtr)
              strongSwanEngine.dispatchLog({
                level: rv === 0 ? 'info' : 'error',
                text: `[RPC] C_EncapsulateKey SizeQuery hSess=${hSess68} hKey=${hKey68} → rv=0x${rv.toString(16)} len=${p[0]}`,
              })
            } else {
              const ctLenPtr = M._malloc(4)
              M.setValue(ctLenPtr, 4096, 'i32')
              const ctBufPtr = M._malloc(4096)
              const hSecretKeyPtr = M._malloc(4)
              rv =
                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- charon RPC proxy uses different arity than direct PKCS#11
                (M as any)._C_EncapsulateKey(
                  hSess68,
                  mechPtr68,
                  hKey68,
                  ctBufPtr,
                  ctLenPtr,
                  hSecretKeyPtr
                ) >>> 0
              if (rv === 0) {
                const ctLen = M.getValue(ctLenPtr, 'i32') >>> 0
                p[0] = ctLen
                p[1] = M.getValue(hSecretKeyPtr, 'i32') >>> 0
                if (ctLen > 0) {
                  payloadView.set(M.HEAPU8.subarray(ctBufPtr, ctBufPtr + ctLen), 8)
                }
              }
              M._free(ctLenPtr)
              M._free(ctBufPtr)
              M._free(hSecretKeyPtr)
              strongSwanEngine.dispatchLog({
                level: rv === 0 ? 'info' : 'error',
                text: `[RPC] C_EncapsulateKey Exec hSess=${hSess68} hKey=${hKey68} → rv=0x${rv.toString(16)} len=${p[0]} secKey=${p[1]}`,
              })
            }
            M._free(mechPtr68)
            break
          }

          // ── C_DecapsulateKey ────────────────────────────────────────────────
          case 69: {
            const hSess69 = p[0] >>> 0
            const mechType69 = p[1] >>> 0
            const hKey69 = p[2] >>> 0
            const ctLen69 = p[3] >>> 0

            const mechPtr69 = M._malloc(12)
            M.setValue(mechPtr69, mechType69, 'i32')
            M.setValue(mechPtr69 + 4, 0, 'i32')
            M.setValue(mechPtr69 + 8, 0, 'i32')

            const ctBufPtr69 = M._malloc(ctLen69)
            if (ctLen69 > 0) {
              M.HEAPU8.set(payloadView.subarray(16, 16 + ctLen69), ctBufPtr69)
            }

            const hSecretKeyPtr69 = M._malloc(4)
            rv =
              // eslint-disable-next-line @typescript-eslint/no-explicit-any -- charon RPC proxy uses different arity than direct PKCS#11
              (M as any)._C_DecapsulateKey(
                hSess69,
                mechPtr69,
                hKey69,
                ctBufPtr69,
                ctLen69,
                hSecretKeyPtr69
              ) >>> 0

            if (rv === 0) {
              p[0] = M.getValue(hSecretKeyPtr69, 'i32') >>> 0
            }

            M._free(mechPtr69)
            M._free(ctBufPtr69)
            M._free(hSecretKeyPtr69)
            strongSwanEngine.dispatchLog({
              level: rv === 0 ? 'info' : 'error',
              text: `[RPC] C_DecapsulateKey Exec hSess=${hSess69} hKey=${hKey69} → rv=0x${rv.toString(16)} secKey=${p[0]}`,
            })
            break
          }

          default:
            rv = 0 // Unknown command — return CKR_OK to avoid blocking charon
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        strongSwanEngine.dispatchLog({ level: 'error', text: `[RPC cmd=${cmdId}] ${msg}` })
        rv = 0x50 // CKR_FUNCTION_NOT_SUPPORTED
      }

      addHsmLog({
        id: Date.now() + Math.floor(Math.random() * 1000),
        timestamp: new Date().toISOString().split('T')[1]?.split('.')[0] || '',
        fn: `PKCS11_C${cmdId}`,
        args: `hSession=${p[0]}`,
        rvName: rv === 0 ? 'CKR_OK' : `0x${rv.toString(16)}`,
        rvHex: `0x${rv.toString(16).padStart(8, '0')}`,
        ok: rv === 0,
        ms: 0,
      })

      Atomics.store(flagView, 2, rv)
      Atomics.store(flagView, 1, 2)
      Atomics.notify(flagView, 1, 1)
    })

    return () => {
      strongSwanEngine.removeLogListener(handleLog)
      strongSwanEngine.removeStateListener(handleState)
      strongSwanEngine.setRpcHandler(() => {})
      strongSwanEngine.destroy()
    }
  }, [moduleRef, hSessionRef, addHsmLog])

  const exchange = IKE_V2_EXCHANGES[selectedMode]
  const modeConfig = IKE_V2_MODES.find((m) => m.id === selectedMode)

  const steps = useMemo(() => {
    if (!exchange) return []
    const result = [
      {
        label: 'IKE_SA_INIT Request',
        direction: 'right' as const,
        message: exchange.ikeSaInit.initiator,
      },
      {
        label: 'IKE_SA_INIT Response',
        direction: 'left' as const,
        message: exchange.ikeSaInit.responder,
      },
    ]

    if (exchange.ikeIntermediate) {
      result.push(
        {
          label: 'IKE_INTERMEDIATE Request',
          direction: 'right' as const,
          message: exchange.ikeIntermediate.initiator,
        },
        {
          label: 'IKE_INTERMEDIATE Response',
          direction: 'left' as const,
          message: exchange.ikeIntermediate.responder,
        }
      )
    }

    result.push(
      {
        label: 'IKE_AUTH Request',
        direction: 'right' as const,
        message: exchange.ikeAuth.initiator,
      },
      {
        label: 'IKE_AUTH Response',
        direction: 'left' as const,
        message: exchange.ikeAuth.responder,
      }
    )
    return result
  }, [exchange])

  const hasCrashed = useMemo(() => {
    if (charonFailed) return true
    if (exchange && steps.length > 0) {
      const stepData = steps[currentStep]
      if (stepData) {
        const payloadSize = stepData.message.payloads.reduce((acc, p) => acc + p.sizeBytes, 0)
        if (payloadSize > mtu && !allowFragmentation) {
          return true
        }
      }
    }
    return false
  }, [currentStep, mtu, allowFragmentation, exchange, steps, charonFailed])

  const handleReset = useCallback(() => {
    setCurrentStep(0)
    setSsLogs([])
    setCharonFailed(false)
    strongSwanEngine.destroy()
    // Don't re-init here — user must click "Start Daemon" to pass configs.
  }, [])

  const handleModeChange = useCallback((mode: IKEv2Mode) => {
    // Destroy running daemon — config changes require restart
    strongSwanEngine.destroy()
    setSsLogs([])
    setSelectedMode(mode)
    setCurrentStep(0)
  }, [])

  return (
    <div className="space-y-6">
      <Tabs defaultValue="ui" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="ui">UI Controls</TabsTrigger>
          <TabsTrigger value="raw">Raw Config</TabsTrigger>
        </TabsList>

        <TabsContent value="ui" className="animate-fade-in mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-card border border-border p-4 rounded-xl">
            <div className="space-y-3">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Key Exchange Mode
              </div>
              <div className="flex flex-wrap gap-2">
                {IKE_V2_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => handleModeChange(mode.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                      selectedMode === mode.id
                        ? 'bg-primary/20 border-primary/50 text-primary'
                        : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
              {modeConfig && (
                <p className="text-[11px] text-muted-foreground">{modeConfig.description}</p>
              )}
            </div>

            <div className="space-y-4">
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Network Constraints
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <label htmlFor="mtuSlider">Maximum Transmission Unit (MTU)</label>
                  <span className="font-bold font-mono">{mtu} Bytes</span>
                </div>
                <input
                  type="range"
                  id="mtuSlider"
                  min="500"
                  max="4000"
                  step="100"
                  value={mtu}
                  onChange={(e) => setMtu(parseInt(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="fragToggle"
                  checked={allowFragmentation}
                  onChange={(e) => setAllowFragmentation(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary accent-primary"
                />
                <label htmlFor="fragToggle" className="text-sm font-medium">
                  Enable Application-Layer Fragmentation (RFC 7383)
                </label>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="raw" className="animate-fade-in mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <span>strongswan.conf (Initiator)</span>
              </div>
              <textarea
                value={activeInitConfig}
                onChange={(e) => setActiveInitConfig(e.target.value)}
                className="w-full h-24 bg-transparent border border-border rounded-lg text-[10px] font-mono p-3 text-muted-foreground focus:outline-none focus:border-primary"
                spellCheck={false}
              />
              <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider mt-2">
                <span>strongswan.conf (Responder)</span>
              </div>
              <textarea
                value={activeRespConfig}
                onChange={(e) => setActiveRespConfig(e.target.value)}
                className="w-full h-24 bg-transparent border border-border rounded-lg text-[10px] font-mono p-3 text-muted-foreground focus:outline-none focus:border-primary"
                spellCheck={false}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <span>ipsec.conf (Initiator)</span>
              </div>
              <textarea
                value={activeInitIpsec}
                onChange={(e) => setActiveInitIpsec(e.target.value)}
                className="w-full h-24 bg-transparent border border-border rounded-lg text-[10px] font-mono p-3 text-muted-foreground focus:outline-none focus:border-primary"
                spellCheck={false}
              />
              <div className="flex justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider mt-2">
                <span>ipsec.conf (Responder)</span>
              </div>
              <textarea
                value={activeRespIpsec}
                onChange={(e) => setActiveRespIpsec(e.target.value)}
                className="w-full h-24 bg-transparent border border-border rounded-lg text-[10px] font-mono p-3 text-muted-foreground focus:outline-none focus:border-primary"
                spellCheck={false}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {hasCrashed && (
        <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl flex items-center justify-between text-destructive animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <ShieldAlert size={24} />
            <div>
              <h4 className="font-bold">MTU Exceeded - Packet Dropped</h4>
              <p className="text-xs opacity-80">
                The current payload size exceeds the MTU of {mtu} bytes, and fragmentation is
                disabled. The VPN tunnel has failed to initialize.
              </p>
            </div>
          </div>
          <button
            onClick={handleReset}
            className="px-3 py-1.5 bg-destructive/20 rounded hover:bg-destructive/30 text-sm font-bold transition-colors"
          >
            Reset
          </button>
        </div>
      )}

      {sabError && (
        <div className="p-4 bg-status-error/10 border border-status-error/30 rounded-xl flex items-center justify-between text-status-error animate-in fade-in slide-in-from-top-4 my-4">
          <div className="flex items-center gap-3">
            <ShieldAlert size={24} />
            <div>
              <h4 className="font-bold">Execution Environment Unsupported</h4>
              <p className="text-xs opacity-80 max-w-[600px] mt-1 line-clamp-2">{sabError}</p>
            </div>
          </div>
          <button
            onClick={() => setSabError(null)}
            className="px-3 py-1.5 bg-status-error/20 rounded hover:bg-status-error/30 text-sm font-bold transition-colors shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      <GlossaryAutoWrap>
        <div
          className={`overflow-x-auto relative ${hasCrashed ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-start min-w-[480px]">
            <div>
              <div className="text-center mb-4">
                <div className="inline-block px-4 py-2 rounded-lg bg-primary/10 border border-primary/30">
                  <span className="text-sm font-bold text-primary">Initiator (Client)</span>
                </div>
              </div>
              <div className="space-y-3">
                {steps.map((step, idx) =>
                  step.direction === 'right' ? (
                    <div
                      key={step.label}
                      className={`transition-all duration-300 ${
                        idx <= currentStep ? 'opacity-100' : 'opacity-30'
                      }`}
                    >
                      <div className="text-xs font-bold text-foreground mb-2 flex items-center gap-2">
                        {step.label}
                        {idx === currentStep &&
                          allowFragmentation &&
                          step.message.payloads.reduce((a, p) => a + p.sizeBytes, 0) > mtu && (
                            <span className="px-1.5 py-0.5 bg-warning/20 text-warning text-[9px] rounded uppercase font-bold border border-warning/30">
                              Fragmented
                            </span>
                          )}
                      </div>
                      <div className="space-y-1.5 relative">
                        {step.message.payloads.map((payload, pIdx) => (
                          <PayloadCard
                            key={`${step.label}-${pIdx}`}
                            payload={payload}
                            index={pIdx}
                            highlighted={idx === currentStep}
                            isFragmented={hasCrashed && idx === currentStep}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div key={step.label} className="h-4" />
                  )
                )}
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 pt-14 border-x border-border/30 px-4">
              {steps.map((step, idx) => (
                <div
                  key={step.label}
                  className={`flex flex-col items-center justify-center transition-all duration-300 ${
                    idx <= currentStep ? 'opacity-100' : 'opacity-20'
                  }`}
                  style={{ minHeight: '60px' }}
                >
                  {step.direction === 'right' ? (
                    <ArrowRight size={20} className="text-primary mb-1" />
                  ) : (
                    <ArrowLeft size={20} className="text-secondary mb-1" />
                  )}

                  {idx === currentStep &&
                    allowFragmentation &&
                    step.message.payloads.reduce((a, p) => a + p.sizeBytes, 0) > mtu && (
                      <div className="flex gap-1 animate-pulse">
                        <span className="w-1.5 h-1.5 bg-warning rounded-full"></span>
                        <span className="w-1.5 h-1.5 bg-warning rounded-full delay-75"></span>
                        <span className="w-1.5 h-1.5 bg-warning rounded-full delay-150"></span>
                      </div>
                    )}
                </div>
              ))}
            </div>

            <div>
              <div className="text-center mb-4">
                <div className="inline-block px-4 py-2 rounded-lg bg-secondary/10 border border-secondary/30">
                  <span className="text-sm font-bold text-secondary">Responder (Gateway)</span>
                </div>
              </div>
              <div className="space-y-3">
                {steps.map((step, idx) =>
                  step.direction === 'left' ? (
                    <div
                      key={step.label}
                      className={`transition-all duration-300 ${
                        idx <= currentStep ? 'opacity-100' : 'opacity-30'
                      }`}
                    >
                      <div className="text-xs font-bold text-foreground mb-2 flex items-center gap-2">
                        {step.label}
                        {idx === currentStep &&
                          allowFragmentation &&
                          step.message.payloads.reduce((a, p) => a + p.sizeBytes, 0) > mtu && (
                            <span className="px-1.5 py-0.5 bg-warning/20 text-warning text-[9px] rounded uppercase font-bold border border-warning/30">
                              Assembled
                            </span>
                          )}
                      </div>
                      <div className="space-y-1.5">
                        {step.message.payloads.map((payload, pIdx) => (
                          <PayloadCard
                            key={`${step.label}-${pIdx}`}
                            payload={payload}
                            index={pIdx}
                            highlighted={idx === currentStep}
                            isFragmented={hasCrashed && idx === currentStep}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div key={step.label} className="h-4" />
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </GlossaryAutoWrap>

      <div className="flex items-center justify-between mt-4 bg-muted/30 p-2 rounded-lg border border-border">
        <button
          onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
          disabled={currentStep === 0 || hasCrashed}
          className="px-4 py-2 rounded border border-border hover:bg-muted disabled:opacity-50 text-sm transition-colors"
        >
          &larr; Previous Phase
        </button>
        <div className="text-xs font-semibold text-muted-foreground bg-background px-3 py-1 rounded-full border border-border flex items-center gap-2">
          <span>
            Sequence {currentStep + 1} of {steps.length}
          </span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] uppercase ${ssState === 'RUNNING' ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground'}`}
          >
            Daemon: {ssState}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="p-2 border border-border rounded hover:bg-muted"
            title="Restart Simulation"
          >
            <RotateCcw size={16} />
          </button>
          {currentStep === 0 && ssState === 'UNINITIALIZED' ? (
            <button
              onClick={async () => {
                if (typeof SharedArrayBuffer === 'undefined') {
                  setSabError(
                    'SharedArrayBuffer is disabled in this environment. The full WASM PQC Proxy requires strict Cross-Origin Isolation (or a Chromium-based browser) to marshal memory contexts. Please check your browser or iframe security settings.'
                  )
                  return
                }

                try {
                  // Pass user's key algorithm selection to the worker
                  // algType: 1=RSA, 2=ML-DSA. size: RSA bits or ML-DSA level.
                  const algType = clientAlg === 'ML-DSA' ? 2 : 1
                  const slot0Size =
                    algType === 2
                      ? parseInt(clientSize) || 65
                      : parseInt(clientClassAlg.split('-')[1] || '3072') || 3072
                  const slot1Size =
                    algType === 2
                      ? parseInt(serverSize) || 65
                      : parseInt(serverClassAlg.split('-')[1] || '3072') || 3072
                  strongSwanEngine.setKeySpec(algType, slot0Size, slot1Size)

                  strongSwanEngine.init(
                    { 'strongswan.conf': activeInitConfig, 'ipsec.conf': activeInitIpsec },
                    { 'strongswan.conf': activeRespConfig, 'ipsec.conf': activeRespIpsec }
                  )
                  setCurrentStep(1)
                } catch (err: unknown) {
                  setSabError(err instanceof Error ? err.message : String(err))
                }
              }}
              className="px-4 py-2 bg-primary text-primary-foreground font-bold rounded shadow-sm hover:bg-primary/90 text-sm transition-colors"
            >
              Start Daemon
            </button>
          ) : (
            <button
              onClick={() => setCurrentStep((s) => Math.min(steps.length - 1, s + 1))}
              disabled={true}
              className="px-4 py-2 bg-primary/50 text-white font-bold rounded shadow-sm opacity-50 cursor-not-allowed text-sm transition-colors"
              title="UI automatically advances based on daemon log output"
            >
              {hasCrashed
                ? 'Tunnel Failed'
                : currentStep === steps.length - 1
                  ? 'Tunnel Established'
                  : 'Awaiting Negotiation...'}
            </button>
          )}
        </div>
      </div>

      <div className="border border-border/50 rounded-xl overflow-hidden bg-slate-50 pb-2">
        <div className="bg-muted px-4 py-1.5 text-xs font-mono font-bold border-b border-border text-muted-foreground flex justify-between items-center">
          <span>charon.log</span>
          <div className="flex items-center gap-2">
            <span>WASM IKEv2 KEM Daemon</span>
            <button
              className="px-2 py-0.5 rounded text-[10px] bg-background/50 hover:bg-background border border-border/50 transition-colors"
              onClick={() => {
                const text = ssLogs.map((l) => `[${l.level}] ${l.text}`).join('\n')
                navigator.clipboard.writeText(text)
              }}
              title="Copy logs to clipboard"
            >
              Copy
            </button>
          </div>
        </div>
        <div
          ref={scrollRef}
          className="p-3 h-[180px] overflow-y-auto font-mono text-[11px] leading-relaxed"
        >
          {ssLogs.length === 0 ? (
            <div className="text-muted-foreground/50 italic">Awaiting daemon initialization...</div>
          ) : (
            ssLogs.map((log, i) => (
              <div
                key={i}
                className={log.level === 'error' ? 'text-destructive' : 'text-success/80'}
              >
                <span className="opacity-50 mr-2">
                  [{new Date().toISOString().split('T')[1]?.split('.')[0]}]
                </span>
                {log.text}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <h4 className="text-sm font-bold flex items-center gap-2 mb-3">
          <Cpu size={16} /> Tunnel Statistics
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div
            className={`p-3 rounded-xl border flex flex-col justify-center items-center ${currentStep === steps.length - 1 && !hasCrashed ? 'bg-success/10 border-success/30' : 'bg-card border-border'}`}
          >
            <span
              className={`text-2xl font-bold ${currentStep === steps.length - 1 && !hasCrashed ? 'text-success' : ''}`}
            >
              {hasCrashed ? (
                '--'
              ) : currentStep === steps.length - 1 ? (
                <CheckCircle className="inline-block text-success" />
              ) : (
                '...'
              )}
            </span>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">
              Status
            </span>
          </div>
          <div className="p-3 rounded-xl bg-card border border-border flex flex-col justify-center items-center">
            <span className="text-xl font-bold">{exchange.totalBytes.toLocaleString()}</span>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">
              Total Bytes
            </span>
          </div>
          <div className="p-3 rounded-xl bg-card border border-border flex flex-col justify-center items-center">
            <span className="text-xl font-bold">
              {exchange.totalInitiatorBytes.toLocaleString()}
            </span>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">
              Initiator Bytes
            </span>
          </div>
          <div className="p-3 rounded-xl bg-card border border-border flex flex-col justify-center items-center">
            <span className="text-xl font-bold">{exchange.roundTrips}</span>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mt-1">
              Round Trips
            </span>
          </div>
        </div>
      </div>

      <div className="pt-6 mt-6 border-t border-border">
        <div className="bg-card border rounded-lg overflow-hidden shadow-sm">
          <div className="bg-muted/30 px-4 py-2 border-b flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Cpu size={16} /> PKCS#11 Cryptographic Diagnostic Boundary
            </h3>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-status-success animate-pulse"></span>
              Full WASM Proxy Active
            </div>
          </div>

          <div className="p-4">
            <Tabs defaultValue="client" className="w-full">
              <TabsList className="mb-4 grid grid-cols-2 w-[400px]">
                <TabsTrigger
                  value="client"
                  className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
                >
                  <ShieldAlert size={16} /> Client Token (Slot 1)
                </TabsTrigger>
                <TabsTrigger
                  value="server"
                  className="gap-2 data-[state=active]:bg-secondary/10 data-[state=active]:text-secondary"
                >
                  <ShieldAlert size={16} /> Server Token (Slot 2)
                </TabsTrigger>
              </TabsList>

              <TabsContent value="client" className="space-y-4">
                {ssState === 'UNINITIALIZED' && (
                  <div className="mb-4 p-3 border border-border rounded-lg bg-muted/30">
                    <div className="text-xs font-semibold mb-2">Client Key Type</div>
                    <div className="flex gap-2 items-center flex-wrap">
                      <select
                        value={clientAlg}
                        onChange={(e) => setClientAlg(e.target.value)}
                        className="text-xs px-2 py-1 rounded border border-border bg-background"
                      >
                        <option value="ML-DSA">ML-DSA (PQC)</option>
                        <option value="RSA">RSA (Classical)</option>
                      </select>
                      {clientAlg === 'ML-DSA' ? (
                        <select
                          value={clientSize}
                          onChange={(e) => setClientSize(e.target.value)}
                          className="text-xs px-2 py-1 rounded border border-border bg-background"
                        >
                          <option value="44">ML-DSA-44</option>
                          <option value="65">ML-DSA-65</option>
                          <option value="87">ML-DSA-87</option>
                        </select>
                      ) : (
                        <select
                          value={clientClassAlg}
                          onChange={(e) => setClientClassAlg(e.target.value)}
                          className="text-xs px-2 py-1 rounded border border-border bg-background"
                        >
                          <option value="RSA-2048">RSA-2048</option>
                          <option value="RSA-3072">RSA-3072</option>
                          <option value="RSA-4096">RSA-4096</option>
                        </select>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        Keys generated in worker HSM on Start Daemon
                      </span>
                    </div>
                  </div>
                )}

                <div className="mb-4 p-4 border border-border bg-slate-50 rounded-xl relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                  <div className="text-xs font-mono mb-2 flex items-center justify-between text-slate-800">
                    <span className="font-semibold">Client Identity Parameter Mapping</span>
                    <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded">
                      leftauth=pubkey
                    </span>
                  </div>
                  <pre className="text-xs text-slate-800 font-mono">
                    {activeInitIpsec
                      .split('\n')
                      .filter((l: string) => l.includes('left'))
                      .map((l: string) => l.trim())
                      .join('\n')}
                  </pre>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-3">
                    <HsmKeyInspector
                      keys={hsmKeys.filter((k) => k.slotId === 0 || k.slotId === undefined)}
                      moduleRef={moduleRef}
                      hSessionRef={hSessionRef}
                      title="Client Token (Slot 1)"
                    />
                  </div>
                  <div className="border border-border/50 rounded-lg p-3 bg-slate-50 text-slate-800">
                    <PkcsLogPanel
                      filterFn={(e) => {
                        if (e.fn.includes('RESPONDER')) return false
                        // Enforce telemetry routing by hSession for native C++ calls
                        if (e.hSession !== undefined && e.hSession !== hSessionRef.current)
                          return false
                        return true
                      }}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="server" className="space-y-4">
                {ssState === 'UNINITIALIZED' && (
                  <div className="mb-4 p-3 border border-border rounded-lg bg-muted/30">
                    <div className="text-xs font-semibold mb-2">Server Key Type</div>
                    <div className="flex gap-2 items-center flex-wrap">
                      <select
                        value={serverAlg}
                        onChange={(e) => setServerAlg(e.target.value)}
                        className="text-xs px-2 py-1 rounded border border-border bg-background"
                      >
                        <option value="ML-DSA">ML-DSA (PQC)</option>
                        <option value="RSA">RSA (Classical)</option>
                      </select>
                      {serverAlg === 'ML-DSA' ? (
                        <select
                          value={serverSize}
                          onChange={(e) => setServerSize(e.target.value)}
                          className="text-xs px-2 py-1 rounded border border-border bg-background"
                        >
                          <option value="44">ML-DSA-44</option>
                          <option value="65">ML-DSA-65</option>
                          <option value="87">ML-DSA-87</option>
                        </select>
                      ) : (
                        <select
                          value={serverClassAlg}
                          onChange={(e) => setServerClassAlg(e.target.value)}
                          className="text-xs px-2 py-1 rounded border border-border bg-background"
                        >
                          <option value="RSA-2048">RSA-2048</option>
                          <option value="RSA-3072">RSA-3072</option>
                          <option value="RSA-4096">RSA-4096</option>
                        </select>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        Keys generated in worker HSM on Start Daemon
                      </span>
                    </div>
                  </div>
                )}

                <div className="mb-4 p-4 border border-border bg-slate-50 rounded-xl relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary"></div>
                  <div className="text-xs font-mono mb-2 flex items-center justify-between text-slate-800">
                    <span className="font-semibold">Server Identity Parameter Mapping</span>
                    <span className="text-[10px] bg-secondary/20 text-secondary px-2 py-0.5 rounded">
                      rightauth=pubkey
                    </span>
                  </div>
                  <pre className="text-xs text-slate-800 font-mono">
                    {activeInitIpsec
                      .split('\n')
                      .filter((l: string) => l.includes('right'))
                      .map((l: string) => l.trim())
                      .join('\n')}
                  </pre>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-3">
                    <HsmKeyInspector
                      keys={hsmKeys.filter((k) => k.slotId === 1)}
                      moduleRef={moduleRef}
                      hSessionRef={serverSessionRef}
                      title="Server Token (Slot 2)"
                    />
                  </div>
                  <div className="border border-border/50 rounded-lg p-3 bg-slate-50 text-slate-800">
                    <PkcsLogPanel
                      filterFn={(e) => {
                        if (e.fn.includes('INITIATOR')) return false
                        // Enforce telemetry routing by hSession for native C++ calls
                        if (
                          e.hSession !== undefined &&
                          serverSessionRef.current &&
                          e.hSession !== serverSessionRef.current
                        )
                          return false
                        return true
                      }}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
