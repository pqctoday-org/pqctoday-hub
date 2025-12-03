/* eslint-disable */
/* eslint-disable no-restricted-globals */
import type { WorkerMessage } from './types'

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface EmscriptenModule {
  callMain: (args: string[]) => number
  FS: {
    writeFile: (path: string, data: Uint8Array) => void
    readFile: (path: string) => Uint8Array
    readdir: (path: string) => string[]
    unlink: (path: string) => void
    stat: (path: string) => any
    isFile: (mode: number) => boolean
    llseek: (stream: any, offset: number, whence: number) => any
    close: (stream: any) => void
    mkdir: (path: string) => void
  }
  ENV?: { [key: string]: string }
}

interface ModuleConfig {
  noInitialRun: boolean
  print: (text: string) => void
  printErr: (text: string) => void
  locateFile: (path: string) => string
}

// ----------------------------------------------------------------------------
// Core Logic (Loader, Environment, Filesystem)
// ----------------------------------------------------------------------------

declare function importScripts(...urls: string[]): void
declare var createOpenSSLModule: any

var moduleFactory: any = null
var loadingPromise: Promise<void> | null = null

var loadOpenSSLScript = async (
  url: string = '/wasm/openssl.js',
  requestId?: string
): Promise<void> => {
  if (moduleFactory) return
  if (loadingPromise) return loadingPromise

  loadingPromise = (async () => {
    self.postMessage({
      type: 'LOG',
      stream: 'stdout',
      message: `[Debug] loadOpenSSLScript called with url: ${url}`,
      requestId,
    })

    try {
      // Shim module.exports to capture the factory if the script tries to use CommonJS
      const global = self as any
      // Only shim if not already defined, to avoid breaking things
      const originalModule = global.module
      const originalExports = global.exports

      if (!global.module) {
        global.module = { exports: {} }
      }
      if (!global.exports) {
        global.exports = global.module.exports
      }

      // Use importScripts for standard worker script loading
      importScripts(url)

      // Check for CommonJS export
      if (global.module.exports && typeof global.module.exports === 'function') {
        moduleFactory = global.module.exports
      } else if (global.module.exports && typeof global.module.exports.default === 'function') {
        moduleFactory = global.module.exports.default
      }
      // Check for global variable
      else if (typeof (self as any).createOpenSSLModule === 'function') {
        // @ts-ignore
        moduleFactory = self.createOpenSSLModule
      } else if (typeof createOpenSSLModule === 'function') {
        // @ts-ignore
        moduleFactory = createOpenSSLModule
      } else {
        // Restore originals if we messed them up and didn't find anything
        if (!originalModule) delete global.module
        if (!originalExports) delete global.exports
        throw new Error(
          'createOpenSSLModule not found in global scope or module.exports after importScripts'
        )
      }

      // Cleanup shims if we created them
      if (!originalModule) delete global.module
      if (!originalExports) delete global.exports

      self.postMessage({
        type: 'LOG',
        stream: 'stdout',
        message: '[Debug] Script loaded successfully',
        requestId,
      })
    } catch (e: any) {
      self.postMessage({
        type: 'LOG',
        stream: 'stderr',
        message: `[Debug] importScripts failed: ${e.message}`,
        requestId,
      })
      throw e
    }
  })()

  try {
    await loadingPromise
  } catch (e) {
    loadingPromise = null // Allow retry on failure
    throw e
  }
}

var createOpenSSLInstance = async (requestId?: string): Promise<EmscriptenModule> => {
  if (!moduleFactory) throw new Error('Module factory not loaded. Call loadOpenSSLScript first.')
  const moduleConfig: ModuleConfig = {
    noInitialRun: true,
    print: (text: string) =>
      self.postMessage({ type: 'LOG', stream: 'stdout', message: text, requestId }),
    printErr: (text: string) =>
      self.postMessage({ type: 'LOG', stream: 'stderr', message: text, requestId }),
    locateFile: (path: string) => (path.endsWith('.wasm') ? '/wasm/openssl.wasm' : path),
  }
  return await moduleFactory(moduleConfig)
}

var injectEntropy = (module: EmscriptenModule, requestId?: string) => {
  try {
    const seedData = new Uint8Array(4096)
    self.crypto.getRandomValues(seedData)
    module.FS.writeFile('/random.seed', seedData)
    try {
      module.FS.writeFile('/dev/urandom', seedData)
    } catch (e) { }
  } catch (e) {
    self.postMessage({
      type: 'LOG',
      stream: 'stderr',
      message: 'Warning: Failed to inject entropy',
      requestId,
    })
  }
}

var configureEnvironment = (module: EmscriptenModule, requestId?: string) => {
  try {
    try {
      module.FS.mkdir('/ssl')
    } catch (e) { }
    const minimalConfig = `
openssl_conf = openssl_init
[openssl_init]
providers = provider_sect
[provider_sect]
default = default_sect
legacy = legacy_sect
[default_sect]
activate = 1
[legacy_sect]
activate = 1
[req]
distinguished_name = req_distinguished_name
[req_distinguished_name]
`
    const cnfBytes = new TextEncoder().encode(minimalConfig)

    // Create config file at multiple locations to satisfy different OpenSSL commands
    try {
      module.FS.mkdir('/ssl')
    } catch (e) { }
    try {
      module.FS.mkdir('/usr')
    } catch (e) { }
    try {
      module.FS.mkdir('/usr/local')
    } catch (e) { }
    try {
      module.FS.mkdir('/usr/local/ssl')
    } catch (e) { }
    try {
      module.FS.mkdir('/openssl-wasm')
    } catch (e) { }

    module.FS.writeFile('/ssl/openssl.cnf', cnfBytes)
    module.FS.writeFile('/usr/local/ssl/openssl.cnf', cnfBytes)
    module.FS.writeFile('/openssl-wasm/openssl.cnf', cnfBytes)
    module.FS.writeFile('/openssl.cnf', cnfBytes) // Also at root

    self.postMessage({ type: 'FILE_CREATED', name: 'openssl.cnf', data: cnfBytes, requestId })
    // @ts-ignore
    if (module.ENV) {
      // @ts-ignore
      module.ENV['OPENSSL_CONF'] = '/ssl/openssl.cnf'
      // @ts-ignore
      module.ENV['RANDFILE'] = '/random.seed'
    }
  } catch (e) {
    throw new Error('Failed to configure OpenSSL environment')
  }
}

var writeInputFiles = (
  module: EmscriptenModule,
  files: { name: string; data: Uint8Array }[],
  requestId?: string
) => {
  const writtenFiles = new Set<string>()
  for (const file of files) {
    try {
      module.FS.writeFile('/' + file.name, file.data)
      writtenFiles.add(file.name)
    } catch (e) {
      // Use postMessage instead of console.warn
      self.postMessage({
        type: 'LOG',
        stream: 'stderr',
        message: `Failed to write input file ${file.name}: ${e}`,
        requestId,
      })
    }
  }
  return writtenFiles
}

var scanOutputFiles = (module: EmscriptenModule, inputFiles: Set<string>, requestId?: string) => {
  try {
    const files = module.FS.readdir('/')
    for (const file of files) {
      if (
        file === '.' ||
        file === '..' ||
        file === 'tmp' ||
        file === 'dev' ||
        file === 'proc' ||
        file === 'ssl'
      )
        continue
      if (inputFiles.has(file)) continue
      try {
        const stat = module.FS.stat('/' + file)
        if (module.FS.isFile(stat.mode)) {
          if (
            file.endsWith('.key') ||
            file.endsWith('.pub') ||
            file.endsWith('.csr') ||
            file.endsWith('.crt') ||
            file.endsWith('.sig') ||
            file.endsWith('.txt') ||
            file.endsWith('.bin') ||
            file.endsWith('.p12') ||
            file.endsWith('.pem') ||
            file.endsWith('.enc')
          ) {
            const content = module.FS.readFile('/' + file)
            self.postMessage({ type: 'FILE_CREATED', name: file, data: content, requestId })
          }
        }
      } catch (e) { }
    }
  } catch (e) { }
}

// ----------------------------------------------------------------------------
// Strategies
// ----------------------------------------------------------------------------

interface CommandStrategy {
  prepare(module: EmscriptenModule, requestId?: string): void
  getArgs(command: string, args: string[]): string[]
}

var BaseStrategy = class BaseStrategy implements CommandStrategy {
  prepare(module: EmscriptenModule, requestId?: string): void {
    // Ensure environment is configured even for base commands
    configureEnvironment(module, requestId)
  }
  getArgs(command: string, args: string[]): string[] {
    return [command, ...args]
  }
}

var CryptoStrategy = class CryptoStrategy implements CommandStrategy {
  prepare(module: EmscriptenModule, requestId?: string): void {
    injectEntropy(module, requestId)
    configureEnvironment(module, requestId)
  }
  getArgs(command: string, args: string[]): string[] {
    return [command, '-rand', '/random.seed', ...args]
  }
}

var CRYPTO_COMMANDS = [
  'genpkey',
  'req',
  'rand',
  'dgst',
  'enc',
  'cms',
  'ca',
  'x509',
  'verify',
  'sign',
  'spkac',
]

var getStrategy = (command: string): CommandStrategy => {
  if (CRYPTO_COMMANDS.includes(command)) {
    return new CryptoStrategy()
  }
  return new BaseStrategy()
}

// ----------------------------------------------------------------------------
// Main Execution
// ----------------------------------------------------------------------------

// console.log("[Worker] Worker script loaded (Consolidated)"); // Removed console.log

var executeCommand = async (
  command: string,
  args: string[],
  inputFiles: { name: string; data: Uint8Array }[] = [],
  requestId?: string
) => {
  self.postMessage({
    type: 'LOG',
    stream: 'stdout',
    message: `[Debug] executeCommand started: ${command}`,
    requestId,
  })
  let openSSLModule

  try {
    self.postMessage({
      type: 'LOG',
      stream: 'stdout',
      message: '[Debug] Loading OpenSSL script...',
      requestId,
    })
    await loadOpenSSLScript('/wasm/openssl.js', requestId)
    self.postMessage({
      type: 'LOG',
      stream: 'stdout',
      message: '[Debug] Creating OpenSSL instance...',
      requestId,
    })
    openSSLModule = await createOpenSSLInstance(requestId)
    self.postMessage({
      type: 'LOG',
      stream: 'stdout',
      message: '[Debug] OpenSSL instance created',
      requestId,
    })
  } catch (e: any) {
    self.postMessage({
      type: 'LOG',
      stream: 'stderr',
      message: `[Debug] Initialization failed: ${e.message}`,
      requestId,
    })
    throw new Error(`Failed to initialize OpenSSL: ${e.message}`)
  }

  try {
    self.postMessage({
      type: 'LOG',
      stream: 'stdout',
      message: '[Debug] Selecting strategy...',
      requestId,
    })
    const strategy = getStrategy(command)
    self.postMessage({
      type: 'LOG',
      stream: 'stdout',
      message: `[Debug] Strategy selected: ${strategy.constructor.name}`,
      requestId,
    })

    self.postMessage({
      type: 'LOG',
      stream: 'stdout',
      message: '[Debug] Writing input files...',
      requestId,
    })
    const writtenFiles = writeInputFiles(openSSLModule, inputFiles, requestId)

    self.postMessage({
      type: 'LOG',
      stream: 'stdout',
      message: '[Debug] Preparing strategy...',
      requestId,
    })
    strategy.prepare(openSSLModule, requestId)

    const fullArgs = strategy.getArgs(command, args)
    self.postMessage({
      type: 'LOG',
      stream: 'stdout',
      message: `[Debug] Full args: ${fullArgs.join(' ')}`,
      requestId,
    })

    self.postMessage({
      type: 'LOG',
      stream: 'stdout',
      message: `Executing: openssl ${fullArgs.join(' ')}`,
      requestId,
    })

    try {
      self.postMessage({
        type: 'LOG',
        stream: 'stdout',
        message: '[Debug] Calling callMain...',
        requestId,
      })
      // @ts-ignore
      openSSLModule.callMain(fullArgs)
      self.postMessage({
        type: 'LOG',
        stream: 'stdout',
        message: '[Debug] callMain returned',
        requestId,
      })
    } catch (e: any) {
      if (e.name === 'ExitStatus') {
        if (e.status !== 0) {
          throw new Error(`OpenSSL exited with status ${e.status}`)
        }
      } else {
        // console.error("OpenSSL Execution Error:", e); // Removed console.error
        self.postMessage({
          type: 'LOG',
          stream: 'stderr',
          message: `OpenSSL Execution Error: ${e}`,
          requestId,
        })
        if (e.message && e.message.includes('Unreachable')) {
          throw new Error(
            `WASM Crash: The operation caused a critical error (Unreachable code). This usually indicates a build incompatibility or memory issue with this specific algorithm.`
          )
        }
        throw e
      }
    }

    // Scan for output files
    scanOutputFiles(openSSLModule, writtenFiles, requestId)

    // Inform user about public key extraction for genpkey
    if (command === 'genpkey') {
      const files = openSSLModule.FS.readdir('/')
      const privateKeyFile = files.find((f: string) => f.endsWith('.key') && !writtenFiles.has(f))
      if (privateKeyFile) {
        const publicKeyFile = privateKeyFile.replace('.key', '.pub')
        self.postMessage({
          type: 'LOG',
          stream: 'stdout',
          message: `\n💡 To extract the public key, run:\n   openssl pkey -in ${privateKeyFile} -pubout -out ${publicKeyFile}`,
          requestId,
        })
      }
    }
  } catch (error: any) {
    self.postMessage({ type: 'ERROR', error: error.message || 'Execution failed', requestId })
  } finally {
    self.postMessage({ type: 'DONE', requestId })
  }
}

self.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
  const { type } = event.data
  const requestId = event.data.requestId
  try {
    if (type === 'LOAD') {
      await loadOpenSSLScript(event.data.url, requestId)
      self.postMessage({ type: 'READY', requestId })
    } else if (type === 'COMMAND') {
      const { command, args, files } = event.data as {
        type: 'COMMAND'
        command: string
        args: string[]
        files?: { name: string; data: Uint8Array }[]
      }
      await executeCommand(command, args, files, requestId)
    }
  } catch (error: any) {
    self.postMessage({ type: 'ERROR', error: error.message, requestId })
  }
})
