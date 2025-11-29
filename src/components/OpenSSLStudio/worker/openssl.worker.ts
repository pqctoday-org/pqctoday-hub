/* eslint-disable no-restricted-globals */

// Types for Worker Messages
export type WorkerMessage =
    | { type: 'COMMAND'; command: string; args: string[] }
    | { type: 'LOAD'; url: string }
    | { type: 'FILE_UPLOAD'; name: string; data: Uint8Array };

export type WorkerResponse =
    | { type: 'LOG'; stream: 'stdout' | 'stderr'; message: string }
    | { type: 'FILE_CREATED'; name: string; data: Uint8Array }
    | { type: 'READY' }
    | { type: 'ERROR'; error: string }
    | { type: 'DONE' };

const ctx: Worker = self as any;

// Emscripten Module Interface
interface EmscriptenModule {
    callMain: (args: string[]) => number;
    FS: {
        writeFile: (path: string, data: Uint8Array) => void;
        readFile: (path: string) => Uint8Array;
        readdir: (path: string) => string[];
        unlink: (path: string) => void;
        stat: (path: string) => any;
        isFile: (mode: number) => boolean;
        llseek: (stream: any, offset: number, whence: number) => any;
        close: (stream: any) => void;
        mkdir: (path: string) => void;
    };
    // ... other Emscripten methods
}

let openSSLModule: EmscriptenModule | null = null;
let moduleLoadingPromise: Promise<void> | null = null;

// Load the WASM Module
const loadModule = async (url: string) => {
    if (openSSLModule) return;
    if (moduleLoadingPromise) return moduleLoadingPromise;

    moduleLoadingPromise = new Promise(async (resolve, reject) => {
        try {
            // Pre-configure Module to prevent auto-execution
            const moduleConfig = {
                noInitialRun: true,
                print: (text: string) => ctx.postMessage({ type: 'LOG', stream: 'stdout', message: text }),
                printErr: (text: string) => ctx.postMessage({ type: 'LOG', stream: 'stderr', message: text }),
                locateFile: (path: string) => {
                    if (path.endsWith('.wasm')) {
                        return '/wasm/openssl.wasm';
                    }
                    return path;
                },
                onRuntimeInitialized: () => {
                    // This callback might be triggered when WASM is ready
                    // We can resolve here if we rely on this
                }
            };

            // @ts-ignore
            self.Module = moduleConfig;

            // Mock CommonJS environment to capture the module export if needed
            // @ts-ignore
            self.exports = {};
            // @ts-ignore
            self.module = { exports: self.exports };

            try {
                // In a module worker, importScripts is not available.
                // We can't use dynamic import() easily because openssl.js is a UMD/CommonJS script, not an ES module.
                // The most robust way is to fetch the text and eval it in the global scope.
                const response = await fetch('/wasm/openssl.js');
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                const scriptContent = await response.text();

                // Indirect eval to execute in global scope
                (0, eval)(scriptContent);
            } catch (e) {
                console.error("Failed to load openssl.js:", e);
                throw new Error("Could not load openssl.js. Please ensure it is in public/wasm/");
            }

            // Wait for runtime to be ready
            // We built with -s MODULARIZE=1 -s EXPORT_NAME='createOpenSSLModule'
            // So we expect a global function 'createOpenSSLModule' that returns a Promise.

            // @ts-ignore
            const factory = self.createOpenSSLModule;

            if (typeof factory === 'function') {
                try {
                    openSSLModule = await factory(moduleConfig);
                    ctx.postMessage({ type: 'READY' });
                    resolve();
                } catch (e: any) {
                    reject(`Module initialization failed: ${e.message}`);
                }
            } else {
                // Fallback for non-modularized builds or if name is different
                // @ts-ignore
                if (self.Module && self.Module instanceof Promise) {
                    // @ts-ignore
                    openSSLModule = await self.Module;
                    ctx.postMessage({ type: 'READY' });
                    resolve();
                } else if (self.Module && self.Module.callMain) {
                    // @ts-ignore
                    openSSLModule = self.Module;
                    ctx.postMessage({ type: 'READY' });
                    resolve();
                } else {
                    reject("createOpenSSLModule factory not found. Check build flags.");
                }
            }
        } catch (error: any) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error("WASM Load Error:", error);
            ctx.postMessage({ type: 'LOG', stream: 'stderr', message: `Failed to load OpenSSL WASM: ${errorMessage}` });
            console.warn("Falling back to mock execution");
            resolve();
        }
    });

    return moduleLoadingPromise;
};

const executeCommand = async (command: string, args: string[]) => {
    if (!openSSLModule) {
        throw new Error("OpenSSL module not loaded");
    }

    try {
        // 1. Inject entropy: Create a seed file
        // 4096 bytes to be sure
        const seedData = new Uint8Array(4096);
        self.crypto.getRandomValues(seedData);
        openSSLModule.FS.writeFile('/random.seed', seedData);

        // Try to seed /dev/urandom directly if it exists (some Emscripten envs use this)
        try {
            openSSLModule.FS.writeFile('/dev/urandom', seedData);
            ctx.postMessage({ type: 'LOG', stream: 'stdout', message: 'Debug: Seeded /dev/urandom' });
        } catch (e) {
            // It might be a character device or read-only, which is fine if it's already hooked to crypto
            // ctx.postMessage({ type: 'LOG', stream: 'stdout', message: 'Debug: Could not seed /dev/urandom' });
        }

        // 2. Setup Configuration
        try { openSSLModule.FS.mkdir('/ssl'); } catch (e) { }

        // Use a minimal config to ensure providers are loaded correctly.
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
`;
        const cnfBytes = new TextEncoder().encode(minimalConfig);
        openSSLModule.FS.writeFile('/ssl/openssl.cnf', cnfBytes);

        // Send config file to UI so user can view/edit it
        ctx.postMessage({
            type: 'FILE_CREATED',
            name: 'openssl.cnf',
            data: cnfBytes
        });

        // 3. Set Environment Variables
        // @ts-ignore
        if (openSSLModule.ENV) {
            // @ts-ignore
            openSSLModule.ENV['OPENSSL_CONF'] = '/ssl/openssl.cnf';
            // @ts-ignore
            openSSLModule.ENV['RANDFILE'] = '/random.seed';
        } else {
            console.warn("ENV object not found on Module. Environment variables might not be set.");
        }

        // 4. Prepare Arguments
        // Prepend -rand /random.seed to ensure OpenSSL has entropy
        // We REMOVE -config and -provider because they are not valid arguments for subcommands like 'rand' or 'genpkey' directly
        // when invoking via callMain in some builds. The 'openssl' CLI wrapper handles them, but we might be hitting the subcommand directly
        // or the build doesn't support them as args.
        // We rely on OPENSSL_CONF env var for config.
        const fullArgs = [command, '-rand', '/random.seed', ...args];

        ctx.postMessage({ type: 'LOG', stream: 'stdout', message: `Executing: openssl ${command} ${args.join(' ')}` });

        // 5. Execute
        try {
            // @ts-ignore
            openSSLModule.callMain(fullArgs);
        } catch (e: any) {
            // Emscripten throws ExitStatus on exit(0) or exit(1)
            if (e.name === 'ExitStatus') {
                // This is normal termination
                if (e.status !== 0) {
                    throw new Error(`OpenSSL exited with status ${e.status}`);
                }
            } else {
                throw e;
            }
        }

        // 6. Check for output files
        // We scan the root directory for new files
        const files = openSSLModule.FS.readdir('/');
        for (const file of files) {
            if (file === '.' || file === '..' || file === 'tmp' || file === 'dev' || file === 'proc' || file === 'ssl') continue;

            try {
                const stat = openSSLModule.FS.stat('/' + file);
                if (openSSLModule.FS.isFile(stat.mode)) {
                    // We simply read all files in root and send them back
                    if (file.endsWith('.key') || file.endsWith('.csr') || file.endsWith('.crt') || file.endsWith('.sig') || file.endsWith('.txt') || file.endsWith('.bin')) {
                        const content = openSSLModule.FS.readFile('/' + file);
                        ctx.postMessage({ type: 'FILE_CREATED', name: file, data: content });
                    }
                }
            } catch (e) {
                // Ignore read errors
            }
        }

    } catch (error: any) {
        ctx.postMessage({ type: 'ERROR', error: error.message || 'Execution failed' });
    } finally {
        ctx.postMessage({ type: 'DONE' });
    }
};

// ... Keep mockExecute for fallback ...
const mockExecute = async (command: string, args: string[]) => {
    // ... (Existing mock logic) ...
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 800));

    const getArg = (flag: string) => {
        const idx = args.indexOf(flag);
        return idx !== -1 && idx + 1 < args.length ? args[idx + 1] : null;
    };

    const hasFlag = (flag: string) => args.includes(flag);

    if (command === 'genpkey') {
        const algo = getArg('-algorithm') || 'RSA';
        const pkeyopt = getArg('-pkeyopt');

        ctx.postMessage({ type: 'LOG', stream: 'stdout', message: `[MOCK] Generating ${algo} private key...` });
        if (pkeyopt) ctx.postMessage({ type: 'LOG', stream: 'stdout', message: `[MOCK] Option: ${pkeyopt}` });

        await new Promise(resolve => setTimeout(resolve, 500));
        ctx.postMessage({ type: 'LOG', stream: 'stdout', message: '................+++++' });
        ctx.postMessage({ type: 'LOG', stream: 'stdout', message: '.......+++++' });

        const mockKey = new TextEncoder().encode(`-----BEGIN PRIVATE KEY-----\nMOCK_${algo}_KEY_DATA...\n-----END PRIVATE KEY-----`);
        ctx.postMessage({ type: 'FILE_CREATED', name: 'private.key', data: mockKey });

    } else if (command === 'req') {
        if (hasFlag('-x509')) {
            const days = getArg('-days') || '365';
            const subj = getArg('-subj');
            ctx.postMessage({ type: 'LOG', stream: 'stdout', message: `[MOCK] Generating self-signed certificate (${days} days)...` });
            if (subj) ctx.postMessage({ type: 'LOG', stream: 'stdout', message: `[MOCK] Subject: ${subj}` });

            await new Promise(resolve => setTimeout(resolve, 800));
            const mockCert = new TextEncoder().encode('-----BEGIN CERTIFICATE-----\nMOCK_CERTIFICATE_DATA...\n-----END CERTIFICATE-----');
            ctx.postMessage({ type: 'FILE_CREATED', name: 'certificate.crt', data: mockCert });
        } else {
            const subj = getArg('-subj');
            ctx.postMessage({ type: 'LOG', stream: 'stdout', message: '[MOCK] Generating Certificate Signing Request...' });
            if (subj) ctx.postMessage({ type: 'LOG', stream: 'stdout', message: `[MOCK] Subject: ${subj}` });

            await new Promise(resolve => setTimeout(resolve, 600));
            const mockCsr = new TextEncoder().encode('-----BEGIN CERTIFICATE REQUEST-----\nMOCK_CSR_DATA...\n-----END CERTIFICATE REQUEST-----');
            ctx.postMessage({ type: 'FILE_CREATED', name: 'request.csr', data: mockCsr });
        }

    } else if (command === 'dgst') {
        const signKey = getArg('-sign');
        const verifyKey = getArg('-verify');
        const signature = getArg('-signature');
        const outFile = getArg('-out');
        const hash = args.find(a => a.startsWith('-') && !['sign', 'verify', 'out', 'signature', 'keyform'].includes(a.substring(1))) || '-sha256';

        if (signKey) {
            ctx.postMessage({ type: 'LOG', stream: 'stdout', message: `[MOCK] Signing data using ${hash.substring(1)}...` });
            await new Promise(resolve => setTimeout(resolve, 500));
            const mockSig = new Uint8Array([0x30, 0x45, 0x02, 0x21]);
            ctx.postMessage({ type: 'FILE_CREATED', name: outFile || 'data.sig', data: mockSig });
        } else if (verifyKey && signature) {
            ctx.postMessage({ type: 'LOG', stream: 'stdout', message: `[MOCK] Verifying signature using ${hash.substring(1)}...` });
            await new Promise(resolve => setTimeout(resolve, 500));
            ctx.postMessage({ type: 'LOG', stream: 'stdout', message: '[MOCK] Verified OK' });
        }
    } else {
        ctx.postMessage({ type: 'LOG', stream: 'stderr', message: `[MOCK] Command not implemented: ${command}` });
    }
    ctx.postMessage({ type: 'DONE' });
};

ctx.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
    const { type } = event.data;

    try {
        if (type === 'LOAD') {
            await loadModule(event.data.url);
        } else if (type === 'COMMAND') {
            const { command, args } = event.data as { type: 'COMMAND'; command: string; args: string[] };
            await executeCommand(command, args);
        } else if (type === 'FILE_UPLOAD') {
            const { name, data } = event.data as { type: 'FILE_UPLOAD'; name: string; data: Uint8Array };
            if (openSSLModule) {
                // Write to MEMFS
                try {
                    openSSLModule.FS.writeFile('/' + name, data);
                    // ctx.postMessage({ type: 'LOG', stream: 'stdout', message: `[System] Synced ${name} to MEMFS` });
                } catch (e) {
                    // ctx.postMessage({ type: 'LOG', stream: 'stderr', message: `[System] Failed to sync ${name}: ${e}` });
                }
            }
        }
    } catch (error: any) {
        ctx.postMessage({ type: 'ERROR', error: error.message });
    }
});
