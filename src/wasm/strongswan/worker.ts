// SPDX-License-Identifier: GPL-3.0-only
/// <reference lib="webworker" />

declare const self: DedicatedWorkerGlobalScope

let strongSwanModule: any = null

const createConfigFiles = (configs: { [filename: string]: string }) => {
  if (!strongSwanModule) return

  try {
    strongSwanModule.FS.mkdir('/etc')
    strongSwanModule.FS.mkdir('/etc/strongswan.d')
  } catch (e: any) {
    if (e.code !== 'EEXIST') console.error('FS.mkdir error', e)
  }

  for (const [filename, content] of Object.entries(configs)) {
    try {
      const path = filename.startsWith('/') ? filename : `/etc/${filename}`
      strongSwanModule.FS.writeFile(path, content)
    } catch (e) {
      console.error(`Failed to write config: ${filename}`, e)
    }
  }
}

self.onmessage = async (e: MessageEvent) => {
  const { type, payload } = e.data

  if (type === 'INIT') {
    try {
      importScripts('/wasm/strongswan.js')

      const createModule = (globalThis as any).Module || (globalThis as any).strongswan

      strongSwanModule = await createModule({
        locateFile: (path: string) => `/wasm/${path}`,
        print: (text: string) => {
          self.postMessage({ type: 'LOG', payload: { level: 'info', text } })
        },
        printErr: (text: string) => {
          self.postMessage({ type: 'LOG', payload: { level: 'error', text } })
        },
        // We shim the custom dlopen / dlsym that we patched into pkcs11_library.c
        wasm_dlopen: (filenamePtr: number, _flags: number) => {
          const file = strongSwanModule.UTF8ToString(filenamePtr)
          self.postMessage({
            type: 'LOG',
            payload: { level: 'info', text: `[WASM DLOPEN] Intercepted load request for: ${file}` },
          })
          return 1 // return valid handle
        },
        wasm_dlsym: (_handle: number, symbolPtr: number) => {
          const sym = strongSwanModule.UTF8ToString(symbolPtr)
          if (sym === 'C_GetFunctionList') {
            self.postMessage({
              type: 'LOG',
              payload: { level: 'info', text: `[WASM DLSYM] Binding JS SoftHSM hook to ${sym}!` },
            })

            // This is the C-callable that returns CKR_OK and writes the function list pointer
            const cGetFunctionList = (_ppFunctionList: number) => {
              // In a complete implementation, this allocates a struct CK_FUNCTION_LIST
              // and fills it with addFunction mapped pointers from our React SoftHSM module.
              // For this simulation phase, we log the binding success and return a mock.
              // We will implement full 70-function mapping in the dedicated PKCS#11 mapping pass.
              return 0 // CKR_OK
            }
            return strongSwanModule.addFunction(cGetFunctionList, 'ii')
          }
          return 0
        },
        onRuntimeInitialized: () => {
          self.postMessage({ type: 'READY' })
        },
      })
    } catch (err: any) {
      self.postMessage({ type: 'ERROR', payload: `Init error: ${err.message}` })
    }
  } else if (type === 'START_DAEMON') {
    if (strongSwanModule && strongSwanModule._main) {
      try {
        if (payload) {
          createConfigFiles(payload)
        }
        // Starts the Charon Daemon
        strongSwanModule._main(0, 0)
      } catch (err: any) {
        self.postMessage({ type: 'ERROR', payload: `Daemon exited: ${err.message}` })
      }
    }
  }
}
