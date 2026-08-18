/* eslint-disable */
console.log('[Debug] OpenSSL Static Worker executing...')

// ----------------------------------------------------------------------------
// Core Logic (Loader, Environment, Filesystem)
// ----------------------------------------------------------------------------

var moduleFactory = null
var loadingPromise = null

var loadOpenSSLScript = async (url, requestId) => {
  if (moduleFactory) return
  if (loadingPromise) return loadingPromise

  // Default to relative path from worker location if not absolute
  // Since this file will be at /wasm/openssl-worker.js, /wasm/openssl.js is a sibling
  const scriptUrl = url || '/wasm/openssl.js'

  loadingPromise = (async () => {
    self.postMessage({
      type: 'LOG',
      stream: 'stdout',
      message: `[Debug] loadOpenSSLScript called with url: ${scriptUrl}`,
      requestId,
    })

    try {
      // Shim module.exports to capture the factory
      const global = self
      const originalModule = global.module
      const originalExports = global.exports

      if (!global.module) {
        global.module = { exports: {} }
      }
      if (!global.exports) {
        global.exports = global.module.exports
      }

      // Use importScripts for standard worker script loading
      importScripts(scriptUrl)

      // Check for CommonJS export
      if (global.module.exports && typeof global.module.exports === 'function') {
        moduleFactory = global.module.exports
      } else if (global.module.exports && typeof global.module.exports.default === 'function') {
        moduleFactory = global.module.exports.default
      }
      // Check for global variable
      else if (typeof self.createOpenSSLModule === 'function') {
        moduleFactory = self.createOpenSSLModule
      } else if (typeof createOpenSSLModule === 'function') {
        moduleFactory = createOpenSSLModule
      } else {
        // Restore originals
        if (!originalModule) delete global.module
        if (!originalExports) delete global.exports
        throw new Error(
          'createOpenSSLModule not found in global scope or module.exports after importScripts'
        )
      }

      // Cleanup shims
      if (!originalModule) delete global.module
      if (!originalExports) delete global.exports

      self.postMessage({
        type: 'LOG',
        stream: 'stdout',
        message: '[Debug] Script loaded successfully',
        requestId,
      })
    } catch (e) {
      self.postMessage({
        type: 'LOG',
        stream: 'stderr',
        message: `[Debug] importScripts failed: ${e.message}`,
        requestId,
      })
      self.postMessage({
        type: 'ERROR',
        error: `Failed to load OpenSSL script: ${e.message}`,
        requestId,
      })
      throw e
    }
  })()

  try {
    await loadingPromise
  } catch (e) {
    loadingPromise = null
    throw e
  }
}

var createOpenSSLInstance = async (requestId) => {
  if (!moduleFactory) throw new Error('Module factory not loaded. Call loadOpenSSLScript first.')
  const moduleConfig = {
    noInitialRun: true,
    print: (text) => self.postMessage({ type: 'LOG', stream: 'stdout', message: text, requestId }),
    printErr: (text) =>
      self.postMessage({ type: 'LOG', stream: 'stderr', message: text, requestId }),
    locateFile: (path) => (path.endsWith('.wasm') ? '/wasm/openssl.wasm' : path),
  }
  return await moduleFactory(moduleConfig)
}

var injectEntropy = (module, requestId) => {
  try {
    const seedData = new Uint8Array(4096)
    self.crypto.getRandomValues(seedData)
    module.FS.writeFile('/random.seed', seedData)
    try {
      module.FS.writeFile('/dev/urandom', seedData)
    } catch (e) {}
  } catch (e) {
    self.postMessage({
      type: 'LOG',
      stream: 'stderr',
      message: 'Warning: Failed to inject entropy',
      requestId,
    })
  }
}

var configureEnvironment = (module, requestId) => {
  try {
    try {
      module.FS.mkdir('/ssl')
    } catch (e) {}
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

    // Create config file at multiple locations
    ;['/ssl', '/usr', '/usr/local', '/usr/local/ssl', '/openssl-wasm'].forEach((path) => {
      try {
        module.FS.mkdir(path)
      } catch (e) {}
    })

    module.FS.writeFile('/ssl/openssl.cnf', cnfBytes)
    module.FS.writeFile('/usr/local/ssl/openssl.cnf', cnfBytes)
    module.FS.writeFile('/openssl-wasm/openssl.cnf', cnfBytes)
    module.FS.writeFile('/openssl.cnf', cnfBytes)

    self.postMessage({ type: 'FILE_CREATED', name: 'openssl.cnf', data: cnfBytes, requestId })

    if (module.ENV) {
      module.ENV['OPENSSL_CONF'] = '/ssl/openssl.cnf'
      module.ENV['RANDFILE'] = '/random.seed'
    }
  } catch (e) {
    throw new Error('Failed to configure OpenSSL environment')
  }
}

var writeInputFiles = (module, files, requestId) => {
  const writtenFiles = new Set()
  for (const file of files) {
    try {
      module.FS.writeFile('/' + file.name, file.data)
      writtenFiles.add(file.name)
    } catch (e) {
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

var scanOutputFiles = (module, inputFiles, requestId) => {
  try {
    const files = module.FS.readdir('/')
    for (const file of files) {
      if (['.', '..', 'tmp', 'dev', 'proc', 'ssl'].includes(file)) continue
      if (inputFiles.has(file)) continue
      try {
        const stat = module.FS.stat('/' + file)
        if (module.FS.isFile(stat.mode)) {
          if (/\.(key|pub|csr|crt|sig|txt|bin|p12|pem|enc|der|p7b)$/.test(file)) {
            const content = module.FS.readFile('/' + file)
            self.postMessage({ type: 'FILE_CREATED', name: file, data: content, requestId })
          }
        }
      } catch (e) {}
    }
  } catch (e) {}
}

// ----------------------------------------------------------------------------
// Strategies
// ----------------------------------------------------------------------------

class BaseStrategy {
  prepare(module, requestId) {
    configureEnvironment(module, requestId)
  }
  getArgs(command, args) {
    return [command, ...args]
  }
}

class CryptoStrategy {
  prepare(module, requestId) {
    injectEntropy(module, requestId)
    configureEnvironment(module, requestId)
  }
  getArgs(command, args) {
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
  'pkeyutl',
]

var getStrategy = (command) => {
  if (CRYPTO_COMMANDS.includes(command)) {
    return new CryptoStrategy()
  }
  return new BaseStrategy()
}

// ----------------------------------------------------------------------------
// Main Execution
// ----------------------------------------------------------------------------

var executeCommand = async (command, args, inputFiles = [], requestId) => {
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
  } catch (e) {
    self.postMessage({
      type: 'LOG',
      stream: 'stderr',
      message: `[Debug] Initialization failed: ${e.message}`,
      requestId,
    })
    throw new Error(`Failed to initialize OpenSSL: ${e.message}`)
  }

  try {
    const strategy = getStrategy(command)
    const writtenFiles = writeInputFiles(openSSLModule, inputFiles, requestId)
    strategy.prepare(openSSLModule, requestId)
    const fullArgs = strategy.getArgs(command, args)

    self.postMessage({
      type: 'LOG',
      stream: 'stdout',
      message: `Executing: openssl ${fullArgs.join(' ')}`,
      requestId,
    })

    try {
      openSSLModule.callMain(fullArgs)
    } catch (e) {
      if (e.name === 'ExitStatus') {
        if (e.status !== 0) {
          throw new Error(`OpenSSL exited with status ${e.status}`)
        }
      } else {
        self.postMessage({
          type: 'LOG',
          stream: 'stderr',
          message: `OpenSSL Execution Error: ${e}`,
          requestId,
        })
        if (e.message && e.message.includes('Unreachable')) {
          throw new Error(`WASM Crash: The operation caused a critical error (Unreachable code).`)
        }
        throw e
      }
    }

    scanOutputFiles(openSSLModule, writtenFiles, requestId)

    if (command === 'genpkey') {
      const files = openSSLModule.FS.readdir('/')
      const privateKeyFile = files.find((f) => f.endsWith('.key') && !writtenFiles.has(f))
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
  } catch (error) {
    self.postMessage({ type: 'ERROR', error: error.message || 'Execution failed', requestId })
  } finally {
    self.postMessage({ type: 'DONE', requestId })
  }
}

self.addEventListener('message', async (event) => {
  const { type, requestId } = event.data
  try {
    if (type === 'LOAD') {
      await loadOpenSSLScript(event.data.url, requestId)
      self.postMessage({ type: 'READY', requestId })
    } else if (type === 'COMMAND') {
      const { command, args, files } = event.data
      await executeCommand(command, args, files, requestId)
    }
  } catch (error) {
    self.postMessage({ type: 'ERROR', error: error.message, requestId })
  }
})
