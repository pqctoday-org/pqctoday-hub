import { create } from 'zustand'

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

interface TLSStore {
  clientConfig: TLSConfig
  serverConfig: TLSConfig
  results: SimulationResult | null
  isSimulating: boolean

  // Session State
  commands: string[]
  sessionStatus: 'connected' | 'disconnected' | 'idle'

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

export const useTLSStore = create<TLSStore>((set) => ({
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

  setClientConfig: (config) =>
    set((state) => ({ clientConfig: { ...state.clientConfig, ...config } })),

  setServerConfig: (config) =>
    set((state) => ({ serverConfig: { ...state.serverConfig, ...config } })),

  setMode: (side, mode) =>
    set((state) => ({
      [side === 'client' ? 'clientConfig' : 'serverConfig']: {
        ...(side === 'client' ? state.clientConfig : state.serverConfig),
        mode,
      },
    })),

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
}))
