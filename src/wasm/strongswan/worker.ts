// SPDX-License-Identifier: GPL-3.0-only
/// <reference lib="webworker" />

declare const self: DedicatedWorkerGlobalScope

let strongSwanModule: any = null
let isDaemonRunning = false
let cachedGetFunctionListPtr: number | null = null

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
      // Bypass Vite's import analysis for /public directory by evaluating path dynamically
      const scriptPath = ['/wa', 'sm/strong', 'swan.js'].join('')
      // @ts-ignore
      const moduleImport = await import(/* @vite-ignore */ scriptPath)
      const createModule =
        moduleImport.default || (globalThis as any).Module || (globalThis as any).strongswan

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
        wasm_dlclose: (_handle: number) => {
          self.postMessage({
            type: 'LOG',
            payload: { level: 'info', text: `[WASM DLCLOSE] Successfully unloaded module handle` },
          })
          return 0 // success
        },
        wasm_dlsym: (_handle: number, symbolPtr: number) => {
          const sym = strongSwanModule.UTF8ToString(symbolPtr)
          if (sym === 'C_GetFunctionList') {
            self.postMessage({
              type: 'LOG',
              payload: { level: 'info', text: `[WASM DLSYM] Binding JS SoftHSM hook to ${sym}!` },
            })

            if (cachedGetFunctionListPtr !== null) {
              return cachedGetFunctionListPtr
            }

            // This is the C-callable that returns CKR_OK and writes the function list pointer
            const cGetFunctionList = (_ppFunctionList: number) => {
              // Mock implementation
              return 0 // CKR_OK
            }
            cachedGetFunctionListPtr = strongSwanModule.addFunction(cGetFunctionList, 'ii')
            return cachedGetFunctionListPtr
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
    if (isDaemonRunning) {
      self.postMessage({
        type: 'LOG',
        payload: { level: 'error', text: 'Daemon is already running in this worker block!' },
      })
      return
    }

    if (strongSwanModule && strongSwanModule._main) {
      try {
        if (payload) {
          createConfigFiles(payload)
        }
        isDaemonRunning = true
        // Starts the Charon Daemon
        strongSwanModule._main(0, 0)
      } catch (err: any) {
        self.postMessage({ type: 'ERROR', payload: `Daemon exited: ${err.message}` })
      } finally {
        isDaemonRunning = false
      }
    }
  }
}
