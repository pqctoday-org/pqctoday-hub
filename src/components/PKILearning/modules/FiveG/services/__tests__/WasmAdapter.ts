
import * as path from 'path'
import * as fs from 'fs'

// Absolute path to the WASM directory in the project
const WASM_DIR = path.resolve(__dirname, '../../../../../../../public/wasm')

const opensslJsPath = path.join(WASM_DIR, 'openssl.js')

// Helper to load legacy script
const loadScript = () => {
    const code = fs.readFileSync(opensslJsPath, 'utf8')
    // We wrap it in a function that returns createOpenSSLModule
    const factory = new Function('require', 'process', '__dirname', 'global', code + ';\nreturn createOpenSSLModule;')
    return factory(require, process, WASM_DIR, global) // Pass global for generic
}

const createOpenSSLModule = loadScript()

export class WasmAdapter {

    // Persistent virtual filesystem to simulate state across multiple module instantiations
    private fsMap = new Map<string, Uint8Array>()

    async execute(command: string, inputFiles: { name: string; data: Uint8Array }[] = []) {
        let stdout = ''
        let stderr = ''

        // Update fsMap with new inputs
        for (const f of inputFiles) {
            this.fsMap.set(f.name, f.data)
        }

        // Init fresh module
        const module = await createOpenSSLModule({
            noInitialRun: true,
            locateFile: (pathName: string) => {
                if (pathName.endsWith('.wasm')) {
                    return path.join(WASM_DIR, 'openssl.wasm')
                }
                return pathName
            },
            print: (text: string) => { stdout += text + '\n' },
            printErr: (text: string) => { stderr += text + '\n' },
            // Intercept quit to avoid process.exit in tests
            quit: (status: number, toThrow: any) => {
                throw new Error('EXIT_STATUS:' + status)
            }
        })

        // Setup FS
        try {
            module.FS.mkdir('/ssl')
        } catch (e) { }

        // Config files
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
`
        try {
            module.FS.writeFile('/ssl/openssl.cnf', minimalConfig)
            if (module.ENV) {
                module.ENV['OPENSSL_CONF'] = '/ssl/openssl.cnf'
            } else {
                try { module.FS.writeFile('/usr/local/ssl/openssl.cnf', minimalConfig) } catch (e) { }
                try { module.FS.writeFile('/openssl.cnf', minimalConfig) } catch (e) { }
            }
        } catch (e) { }

        // Hydrate FS from fsMap
        for (const [name, data] of this.fsMap.entries()) {
            try {
                module.FS.writeFile('/' + name, data)
            } catch (e) { }
        }

        // Parse command
        const parts = command.trim().split(/\s+/)
        let args = parts
        if (args[0] === 'openssl') args.shift()

        try {
            module.callMain(args)
        } catch (e: any) {
            if (e.message && e.message.startsWith('EXIT_STATUS:')) {
                const status = parseInt(e.message.split(':')[1])
                if (status !== 0) stderr += `Exited with status ${status}\n`
            } else if (e.name === 'ExitStatus') {
                if (e.status !== 0) stderr += `Exited with status ${e.status}\n`
            } else {
                stderr += `[Error] ${e.message}\n`
            }
        }

        // Sync back to fsMap
        const outputFiles: { name: string, data: Uint8Array }[] = []

        // We scan for all files in root
        try {
            const allFiles = module.FS.readdir('/')
            for (const fname of allFiles) {
                if (fname === '.' || fname === '..' || fname === 'tmp' || fname === 'home' || fname === 'dev' || fname === 'proc' || fname === 'ssl') continue

                try {
                    const stat = module.FS.stat('/' + fname)
                    if (module.FS.isFile(stat.mode)) {
                        const content = module.FS.readFile('/' + fname)
                        // Update persistent store
                        this.fsMap.set(fname, content)
                        outputFiles.push({ name: fname, data: content })
                    }
                } catch (e) { }
            }
        } catch (e) { }

        return {
            stdout,
            stderr,
            files: outputFiles
        }
    }

    async init() {
        // No-op
    }
}
