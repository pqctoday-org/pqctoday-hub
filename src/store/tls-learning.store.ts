import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface TLSConfig {
  cipherSuites: string[]
  groups: string[]
  signatureAlgorithms: string[]
  certificates: {
    certPath?: string
    keyPath?: string
    caPath?: string
    certPem?: string
    keyPem?: string
    caPem?: string
  }
  rawConfig: string
  mode: 'ui' | 'raw'
  verifyClient?: boolean
  clientAuthEnabled?: boolean
}

export interface SimulationResult {
  trace: {
    side: 'client' | 'server' | 'connection' | 'system'
    event: string
    details: string
  }[]
  status: 'success' | 'failed' | 'error' | 'idle'
  error?: string
}

// Run history for comparison table
export interface TLSRunRecord {
  id: number
  timestamp: Date
  cipher: string
  keyExchange: string
  signature: string
  clientIdentity: string
  serverIdentity: string
  clientCaKeyType: string // CA signature algorithm for client cert
  serverCaKeyType: string // CA signature algorithm for server cert
  totalBytes: number
  handshakeBytes: number
  appDataBytes: number
  success: boolean
}

interface TLSStore {
  clientConfig: TLSConfig
  serverConfig: TLSConfig
  results: SimulationResult | null
  isSimulating: boolean

  // Session State
  commands: string[]
  sessionStatus: 'connected' | 'disconnected' | 'idle'

  // Run History for Comparison
  runHistory: TLSRunRecord[]

  setClientConfig: (config: Partial<TLSConfig>) => void
  setServerConfig: (config: Partial<TLSConfig>) => void
  setMode: (side: 'client' | 'server', mode: 'ui' | 'raw') => void
  setResults: (results: SimulationResult | null) => void
  // Message Configuration
  clientMessage: string
  serverMessage: string
  setClientMessage: (msg: string) => void
  setServerMessage: (msg: string) => void
  setIsSimulating: (isSimulating: boolean) => void

  // Actions
  addCommand: (cmd: string) => void
  clearSession: () => void
  reset: () => void

  // Comparison Actions
  addRunToHistory: (record: Omit<TLSRunRecord, 'id' | 'timestamp'>) => void
  clearRunHistory: () => void
}

const DEFAULT_RAW_CONFIG = `openssl_conf = default_conf

[ default_conf ]
ssl_conf = ssl_sect

[ ssl_sect ]
system_default = system_default_sect

[ system_default_sect ]
MinProtocol = TLSv1.3
MaxProtocol = TLSv1.3
Ciphersuites = TLS_AES_256_GCM_SHA384:TLS_AES_128_GCM_SHA256:TLS_CHACHA20_POLY1305_SHA256
Groups = X25519:P-256:P-384
SignatureAlgorithms = mldsa44:mldsa65:mldsa87:ecdsa_secp256r1_sha256:rsa_pss_rsae_sha256
`

const DEFAULT_CONFIG: TLSConfig = {
  cipherSuites: [
    'TLS_AES_256_GCM_SHA384',
    'TLS_AES_128_GCM_SHA256',
    'TLS_CHACHA20_POLY1305_SHA256',
  ],
  groups: ['X25519', 'P-256', 'P-384'],
  signatureAlgorithms: [
    'mldsa44',
    'mldsa65',
    'mldsa87',
    'ecdsa_secp256r1_sha256',
    'rsa_pss_rsae_sha256',
  ],
  certificates: {},
  rawConfig: DEFAULT_RAW_CONFIG,
  mode: 'ui',
  verifyClient: false,
  clientAuthEnabled: true,
}

/**
 * Parse raw OpenSSL config text to extract UI-relevant settings.
 * Used when switching from Raw mode back to UI mode to sync the UI state.
 */
function parseRawConfig(raw: string): Partial<TLSConfig> {
  const result: Partial<TLSConfig> = {}

  // Parse Ciphersuites line (e.g., "Ciphersuites = TLS_AES_256_GCM_SHA384:TLS_AES_128_GCM_SHA256")
  const cipherMatch = raw.match(/Ciphersuites\s*=\s*(.+)/i)
  if (cipherMatch) {
    const ciphers = cipherMatch[1]
      .trim()
      .split(':')
      .map((s) => s.trim())
      .filter(Boolean)
    if (ciphers.length > 0) {
      result.cipherSuites = ciphers
    }
  }

  // Parse Groups line (e.g., "Groups = X25519:P-256:P-384")
  const groupsMatch = raw.match(/Groups\s*=\s*(.+)/i)
  if (groupsMatch) {
    const groups = groupsMatch[1]
      .trim()
      .split(':')
      .map((s) => s.trim())
      .filter(Boolean)
    if (groups.length > 0) {
      result.groups = groups
    }
  }

  // Parse SignatureAlgorithms line (e.g., "SignatureAlgorithms = mldsa44:ecdsa_secp256r1_sha256")
  const sigMatch = raw.match(/SignatureAlgorithms\s*=\s*(.+)/i)
  if (sigMatch) {
    const sigs = sigMatch[1]
      .trim()
      .split(':')
      .map((s) => s.trim())
      .filter(Boolean)
    if (sigs.length > 0) {
      result.signatureAlgorithms = sigs
    }
  }

  return result
}

export const useTLSStore = create<TLSStore>()(
  persist(
    (set) => ({
      clientConfig: {
        ...DEFAULT_CONFIG,
        rawConfig: '# --- Client Configuration ---\n' + DEFAULT_RAW_CONFIG,
      },
      serverConfig: {
        ...DEFAULT_CONFIG,
        rawConfig: '# --- Server Configuration ---\n' + DEFAULT_RAW_CONFIG,
      },
      results: null,
      clientMessage: 'Hello Server (Encrypted)',
      serverMessage: 'Hello Client (Encrypted)',
      setClientMessage: (msg) => set({ clientMessage: msg }),
      setServerMessage: (msg) => set({ serverMessage: msg }),

      isSimulating: false,
      commands: [],
      sessionStatus: 'idle',
      runHistory: [],

      setClientConfig: (config) =>
        set((state) => {
          const newConfig = { ...state.clientConfig, ...config }
          // If in UI mode and not explicitly setting rawConfig, regenerate it
          if (newConfig.mode === 'ui' && !config.rawConfig) {
            const cipherSuites = newConfig.cipherSuites.join(':')
            const groups = newConfig.groups.join(':')
            const sigAlgs = newConfig.signatureAlgorithms.join(':')
            let rawConfig = `openssl_conf = default_conf

[ default_conf ]
ssl_conf = ssl_sect

[ ssl_sect ]
system_default = system_default_sect

[ system_default_sect ]
`
            if (cipherSuites) rawConfig += `Ciphersuites = ${cipherSuites}\n`
            if (groups) rawConfig += `Groups = ${groups}\n`
            if (sigAlgs) rawConfig += `SignatureAlgorithms = ${sigAlgs}\n`
            rawConfig += `MinProtocol = TLSv1.3\nMaxProtocol = TLSv1.3\n`
            if (newConfig.certificates.caPem) {
              rawConfig += `VerifyCAFile = /ssl/client-ca.crt\n`
            }
            newConfig.rawConfig = rawConfig
          }
          return { clientConfig: newConfig }
        }),

      setServerConfig: (config) =>
        set((state) => {
          const newConfig = { ...state.serverConfig, ...config }
          // If in UI mode and not explicitly setting rawConfig, regenerate it
          if (newConfig.mode === 'ui' && !config.rawConfig) {
            const cipherSuites = newConfig.cipherSuites.join(':')
            const groups = newConfig.groups.join(':')
            const sigAlgs = newConfig.signatureAlgorithms.join(':')
            let rawConfig = `openssl_conf = default_conf

[ default_conf ]
ssl_conf = ssl_sect

[ ssl_sect ]
system_default = system_default_sect

[ system_default_sect ]
`
            if (cipherSuites) rawConfig += `Ciphersuites = ${cipherSuites}\n`
            if (groups) rawConfig += `Groups = ${groups}\n`
            if (sigAlgs) rawConfig += `SignatureAlgorithms = ${sigAlgs}\n`
            rawConfig += `MinProtocol = TLSv1.3\nMaxProtocol = TLSv1.3\n`
            if (newConfig.verifyClient) {
              rawConfig += `VerifyMode = Peer,Request\n`
              if (newConfig.certificates.caPem) {
                rawConfig += `VerifyCAFile = /ssl/server-ca.crt\n`
              }
            }
            newConfig.rawConfig = rawConfig
          }
          return { serverConfig: newConfig }
        }),

      setMode: (side, mode) =>
        set((state) => {
          const configKey = side === 'client' ? 'clientConfig' : 'serverConfig'
          const currentConfig = state[configKey]

          // If switching from 'raw' to 'ui', parse the raw config to sync UI state
          if (currentConfig.mode === 'raw' && mode === 'ui') {
            const parsed = parseRawConfig(currentConfig.rawConfig)
            return {
              [configKey]: {
                ...currentConfig,
                mode,
                // Only update arrays if parsing found values
                ...(parsed.cipherSuites && { cipherSuites: parsed.cipherSuites }),
                ...(parsed.groups && { groups: parsed.groups }),
                ...(parsed.signatureAlgorithms && {
                  signatureAlgorithms: parsed.signatureAlgorithms,
                }),
              },
            }
          }

          // Otherwise just update mode
          return {
            [configKey]: {
              ...currentConfig,
              mode,
            },
          }
        }),

      setResults: (results) => {
        // Full Interaction runs complete lifecycle (handshake + messages + disconnect)
        // So session status should always be 'idle' after simulation completes
        set({ results, sessionStatus: 'idle' })
      },
      setIsSimulating: (isSimulating) => set({ isSimulating }),

      addCommand: (cmd) => set((state) => ({ commands: [...state.commands, cmd] })),
      clearSession: () => set({ commands: [], sessionStatus: 'idle', results: null }),

      reset: () =>
        set({
          clientConfig: { ...DEFAULT_CONFIG },
          serverConfig: { ...DEFAULT_CONFIG },
          results: null,
          isSimulating: false,
          commands: [],
          sessionStatus: 'idle',
        }),

      // Comparison Actions
      addRunToHistory: (record) =>
        set((state) => ({
          runHistory: [
            ...state.runHistory,
            {
              ...record,
              id: state.runHistory.length + 1,
              timestamp: new Date(),
            },
          ],
        })),
      clearRunHistory: () => set({ runHistory: [] }),
    }),
    {
      name: 'tls-learning-storage',
      version: 1,
      // Only persist configuration and history, not ephemeral simulation state
      partialize: (state) => ({
        clientConfig: state.clientConfig,
        serverConfig: state.serverConfig,
        runHistory: state.runHistory,
        clientMessage: state.clientMessage,
        serverMessage: state.serverMessage,
        // Exclude: results, isSimulating, commands, sessionStatus (ephemeral)
      }),
    }
  )
)
