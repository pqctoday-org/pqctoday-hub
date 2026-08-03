// SPDX-License-Identifier: GPL-3.0-only
export type WorkerMessage =
  | {
      type: 'COMMAND'
      command: string
      args: string[]
      files?: { name: string; data: Uint8Array }[]
      /**
       * When true, `files` are the COMPLETE filesystem: the worker's
       * persistent VFS is cleared before this command. Omit for merge
       * semantics (files persist across COMMANDs so chained calls see each
       * other's outputs). See openssl.worker.ts "Persistent virtual
       * filesystem" for the full contract.
       */
      replaceVfs?: boolean
      requestId?: string
    }
  | { type: 'LOAD'; url: string; requestId?: string }
  | { type: 'FILE_UPLOAD'; name: string; data: Uint8Array; requestId?: string }
  | { type: 'DELETE_FILE'; name: string; requestId?: string }
  /**
   * Generate a token-resident keypair via direct C_GenerateKeyPair.
   * NOT `genpkey -out pkcs11:...` — that writes a PEM into MEMFS through a
   * BIO and the key never reaches the token, so later `pkcs11:object=<id>`
   * lookups fail. See openssl.worker.ts's in-token keygen section.
   */
  | { type: 'HSM_KEYGEN'; algorithm: string; keyId: string; requestId?: string }
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
  | {
      // One real PKCS#11 C_* call the worker made against the linked engine.
      // Distinct from 'LOG', which carries openssl stdout/stderr plus the
      // worker's own narration — that is prose, this is a call trace.
      type: 'P11CALL'
      fn: string
      args: string
      /** Raw CK_RV as returned by the engine (unsigned). */
      rv: number
      ms: number
      requestId?: string
    }
  | { type: 'FILE_CREATED'; name: string; data: Uint8Array; requestId?: string }
  | { type: 'READY'; requestId?: string }
  | { type: 'ERROR'; error: string; requestId?: string }
  | { type: 'DONE'; requestId?: string }
  | {
      type: 'HSM_KEY_CREATED'
      keyId: string
      algorithm: string
      /** `pkcs11:` URI addressing the new token-resident private key. */
      uri: string
      requestId?: string
    }
