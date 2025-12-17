export type WorkerMessage =
  | {
      type: 'COMMAND'
      command: string
      args: string[]
      files?: { name: string; data: Uint8Array }[]
      requestId?: string
    }
  | { type: 'LOAD'; url: string; requestId?: string }
  | { type: 'FILE_UPLOAD'; name: string; data: Uint8Array; requestId?: string }
  | { type: 'DELETE_FILE'; name: string; requestId?: string }
  | {
      type: 'TLS_SIMULATE'
      clientConfig: string
      serverConfig: string
      files?: { name: string; data: Uint8Array }[]
      requestId?: string
    }
  | {
      type: 'SKEY_OPERATION'
      opType: 'create' | 'derive'
      params: {
        keyBytes?: Uint8Array
        alg?: string
        kdf?: string
        secret?: Uint8Array
        outAlg?: string
        salt?: string
        info?: string
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [key: string]: any
      }
      requestId?: string
    }

export type WorkerResponse =
  | { type: 'LOG'; stream: 'stdout' | 'stderr'; message: string; requestId?: string }
  | { type: 'FILE_CREATED'; name: string; data: Uint8Array; requestId?: string }
  | { type: 'READY'; requestId?: string }
  | { type: 'ERROR'; error: string; requestId?: string }
  | { type: 'DONE'; requestId?: string }
