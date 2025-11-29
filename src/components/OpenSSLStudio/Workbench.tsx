import { useState, useEffect } from 'react';
import { useOpenSSLStore } from './store';
import { useOpenSSL } from './hooks/useOpenSSL';
import { Play, Settings, Key, FileText, Shield, Info } from 'lucide-react';
import clsx from 'clsx';


export const Workbench = () => {
    const { setCommand, isProcessing } = useOpenSSLStore();
    const { executeCommand } = useOpenSSL();
    const [category, setCategory] = useState<'genpkey' | 'req' | 'x509' | 'enc' | 'dgst' | 'rand' | 'version'>('genpkey');

    // Key Gen State
    const [keyAlgo, setKeyAlgo] = useState('rsa');
    const [keyBits, setKeyBits] = useState('2048');
    const [curve, setCurve] = useState('P-256');
    const [cipher, setCipher] = useState('none');
    const [passphrase, setPassphrase] = useState('password123');

    // Certificate / CSR State
    const [certDays, setCertDays] = useState('365');
    const [commonName, setCommonName] = useState('example.com');
    const [org, setOrg] = useState('My Organization');
    const [country, setCountry] = useState('US');
    const [digestAlgo, setDigestAlgo] = useState('sha256');

    // Sign/Verify State
    const [signAction, setSignAction] = useState<'sign' | 'verify'>('sign');
    const [sigHashAlgo, setSigHashAlgo] = useState('sha256');

    // Random Data State
    const [randBytes, setRandBytes] = useState('32');
    const [randHex, setRandHex] = useState(true);

    // Effect to update command preview
    useEffect(() => {
        let cmd = 'openssl';

        // Helper to build Subject DN string
        const subj = `/C=${country}/O=${org}/CN=${commonName}`;

        if (category === 'genpkey') {
            if (keyAlgo === 'rsa') {
                cmd += ` genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:${keyBits}`;
            } else if (keyAlgo === 'ec') {
                cmd += ` genpkey -algorithm EC -pkeyopt ec_paramgen_curve:${curve}`;
            } else {
                cmd += ` genpkey -algorithm ${keyAlgo.toUpperCase()}`;
            }

            if (cipher !== 'none') {
                cmd += ` -${cipher} -pass pass:${passphrase}`;
            }
            cmd += ` -out private.key`;
        } else if (category === 'req') {
            // If the key is encrypted, we might need -passin, but for now assuming unencrypted or handled by context
            // In a real app we'd need to track if private.key is encrypted.
            cmd += ` req -new -key private.key -out request.csr -${digestAlgo} -subj "${subj}"`;
        } else if (category === 'x509') {
            cmd += ` req -x509 -new -key private.key -out certificate.crt -days ${certDays} -${digestAlgo} -subj "${subj}"`;
        } else if (category === 'dgst') {
            cmd += ` dgst -${sigHashAlgo}`;
            if (signAction === 'sign') {
                cmd += ` -sign private.key -out data.sig data.txt`;
            } else {
                cmd += ` -verify public.key -signature data.sig data.txt`;
            }
        } else if (category === 'rand') {
            cmd += ` rand`;
            if (randHex) cmd += ` -hex`;
            cmd += ` -out random.bin ${randBytes}`;
        } else if (category === 'version') {
            cmd += ` version -a`;
        }
        setCommand(cmd);
    }, [category, keyAlgo, keyBits, curve, cipher, passphrase, certDays, commonName, org, country, digestAlgo, signAction, sigHashAlgo, randBytes, randHex, setCommand]);

    const handleRun = () => {
        executeCommand(useOpenSSLStore.getState().command);
    };

    return (
        <div className="h-full flex flex-col gap-6 p-4">
            <div className="space-y-4">
                <label className="text-sm font-bold text-muted uppercase tracking-wider block">0. Configuration</label>
                <button
                    onClick={() => {
                        const configFile = useOpenSSLStore.getState().files.find(f => f.name === 'openssl.cnf');
                        if (configFile) {
                            useOpenSSLStore.getState().setEditingFile(configFile);
                        } else {
                            // If not found (e.g. not loaded yet), maybe show a toast or just nothing
                            console.warn("openssl.cnf not found in memory yet");
                        }
                    }}
                    className="w-full p-3 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-muted hover:text-white transition-colors flex items-center gap-2 text-sm"
                >
                    <Settings size={16} /> Edit OpenSSL Config (openssl.cnf)
                </button>
            </div>

            <div className="space-y-4">
                <label className="text-sm font-bold text-muted uppercase tracking-wider block">1. Select Operation</label>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => setCategory('genpkey')}
                        className={clsx("p-3 rounded-lg border text-left transition-colors flex items-center gap-2",
                            category === 'genpkey' ? "bg-primary/20 border-primary text-primary" : "bg-white/5 border-white/10 hover:bg-white/10 text-muted")}
                    >
                        <Key size={16} /> Key Generation
                    </button>
                    <button
                        onClick={() => setCategory('req')}
                        className={clsx("p-3 rounded-lg border text-left transition-colors flex items-center gap-2",
                            category === 'req' ? "bg-primary/20 border-primary text-primary" : "bg-white/5 border-white/10 hover:bg-white/10 text-muted")}
                    >
                        <FileText size={16} /> CSR (Request)
                    </button>
                    <button
                        onClick={() => setCategory('x509')}
                        className={clsx("p-3 rounded-lg border text-left transition-colors flex items-center gap-2",
                            category === 'x509' ? "bg-primary/20 border-primary text-primary" : "bg-white/5 border-white/10 hover:bg-white/10 text-muted")}
                    >
                        <Shield size={16} /> Certificate
                    </button>
                    <button
                        onClick={() => setCategory('dgst')}
                        className={clsx("p-3 rounded-lg border text-left transition-colors flex items-center gap-2",
                            category === 'dgst' ? "bg-primary/20 border-primary text-primary" : "bg-white/5 border-white/10 hover:bg-white/10 text-muted")}
                    >
                        <Settings size={16} /> Sign / Verify
                    </button>
                    <button
                        onClick={() => setCategory('rand')}
                        className={clsx("p-3 rounded-lg border text-left transition-colors flex items-center gap-2",
                            category === 'rand' ? "bg-primary/20 border-primary text-primary" : "bg-white/5 border-white/10 hover:bg-white/10 text-muted")}
                    >
                        <Shield size={16} /> Random Data
                    </button>
                    <button
                        onClick={() => setCategory('version')}
                        className={clsx("p-3 rounded-lg border text-left transition-colors flex items-center gap-2",
                            category === 'version' ? "bg-primary/20 border-primary text-primary" : "bg-white/5 border-white/10 hover:bg-white/10 text-muted")}
                    >
                        <Info size={16} /> Version Info
                    </button>
                </div>
            </div>

            {category === 'rand' && (
                <div className="space-y-4 animate-fade-in">
                    <label className="text-sm font-bold text-muted uppercase tracking-wider block">2. Configuration</label>

                    <div className="space-y-3">
                        <label className="text-xs text-muted block">Number of Bytes</label>
                        <input
                            type="number"
                            value={randBytes}
                            onChange={(e) => setRandBytes(e.target.value)}
                            className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
                            min="1"
                            max="4096"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="randHex"
                            checked={randHex}
                            onChange={(e) => setRandHex(e.target.checked)}
                            className="rounded border-white/20 bg-black/40 text-primary focus:ring-primary"
                        />
                        <label htmlFor="randHex" className="text-sm text-white cursor-pointer select-none">
                            Output as Hex String
                        </label>
                    </div>
                </div>
            )}

            {category === 'version' && (
                <div className="space-y-4 animate-fade-in">
                    <label className="text-sm font-bold text-muted uppercase tracking-wider block">2. Configuration</label>
                    <div className="text-sm text-muted">
                        No configuration needed. This command displays detailed version information about the OpenSSL build.
                    </div>
                </div>
            )}

            {category === 'genpkey' && (
                <div className="space-y-4 animate-fade-in">
                    <label className="text-sm font-bold text-muted uppercase tracking-wider block">2. Configuration</label>

                    <div className="space-y-3">
                        <label className="text-xs text-muted block">Algorithm</label>
                        <select
                            value={keyAlgo}
                            onChange={(e) => setKeyAlgo(e.target.value)}
                            className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
                        >
                            <option value="rsa">RSA (Rivest–Shamir–Adleman)</option>
                            <option value="ec">EC (Elliptic Curve)</option>
                            <option value="ed25519">Ed25519 (Edwards-curve DSA)</option>
                            <option value="x25519">X25519 (Curve25519)</option>
                            <option value="ed448">Ed448 (Edwards-curve DSA)</option>
                            <option value="x448">X448 (Curve448)</option>
                        </select>
                    </div>

                    {keyAlgo === 'rsa' && (
                        <div className="space-y-3">
                            <label className="text-xs text-muted block">Key Size (Bits)</label>
                            <select
                                value={keyBits}
                                onChange={(e) => setKeyBits(e.target.value)}
                                className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
                            >
                                <option value="2048">2048 bits</option>
                                <option value="3072">3072 bits</option>
                                <option value="4096">4096 bits</option>
                                <option value="8192">8192 bits</option>
                            </select>
                        </div>
                    )}

                    {keyAlgo === 'ec' && (
                        <div className="space-y-3">
                            <label className="text-xs text-muted block">Elliptic Curve</label>
                            <select
                                value={curve}
                                onChange={(e) => setCurve(e.target.value)}
                                className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
                            >
                                <option value="P-256">P-256 (prime256v1)</option>
                                <option value="P-384">P-384 (secp384r1)</option>
                                <option value="P-521">P-521 (secp521r1)</option>
                                <option value="secp256k1">secp256k1 (Bitcoin)</option>
                            </select>
                        </div>
                    )}

                    <div className="space-y-3">
                        <label className="text-xs text-muted block">Encryption (Passphrase)</label>
                        <select
                            value={cipher}
                            onChange={(e) => setCipher(e.target.value)}
                            className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
                        >
                            <option value="none">None (Unencrypted)</option>
                            <option value="aes-256-cbc">AES-256-CBC</option>
                            <option value="aes-128-cbc">AES-128-CBC</option>
                            <option value="aria-256-cbc">ARIA-256-CBC</option>
                            <option value="camellia-256-cbc">Camellia-256-CBC</option>
                        </select>
                    </div>

                    {cipher !== 'none' && (
                        <div className="space-y-3 animate-fade-in">
                            <label className="text-xs text-muted block">Passphrase</label>
                            <input
                                type="password"
                                value={passphrase}
                                onChange={(e) => setPassphrase(e.target.value)}
                                className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
                                placeholder="Enter passphrase"
                            />
                        </div>
                    )}
                </div>
            )}

            {(category === 'req' || category === 'x509') && (
                <div className="space-y-4 animate-fade-in">
                    <label className="text-sm font-bold text-muted uppercase tracking-wider block">2. Subject Information</label>

                    <div className="space-y-3">
                        <label className="text-xs text-muted block">Common Name (CN)</label>
                        <input
                            type="text"
                            value={commonName}
                            onChange={(e) => setCommonName(e.target.value)}
                            className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
                            placeholder="e.g. example.com"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-3">
                            <label className="text-xs text-muted block">Organization (O)</label>
                            <input
                                type="text"
                                value={org}
                                onChange={(e) => setOrg(e.target.value)}
                                className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-xs text-muted block">Country (C)</label>
                            <input
                                type="text"
                                value={country}
                                onChange={(e) => setCountry(e.target.value)}
                                maxLength={2}
                                className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs text-muted block">Digest Algorithm</label>
                        <select
                            value={digestAlgo}
                            onChange={(e) => setDigestAlgo(e.target.value)}
                            className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
                        >
                            <option value="sha256">SHA-256</option>
                            <option value="sha384">SHA-384</option>
                            <option value="sha512">SHA-512</option>
                            <option value="sha3-256">SHA3-256</option>
                            <option value="sha3-512">SHA3-512</option>
                        </select>
                    </div>

                    {category === 'x509' && (
                        <div className="space-y-3 pt-2 border-t border-white/10">
                            <label className="text-xs text-muted block">Validity (Days)</label>
                            <input
                                type="number"
                                value={certDays}
                                onChange={(e) => setCertDays(e.target.value)}
                                className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
                            />
                        </div>
                    )}
                </div>
            )}

            {category === 'dgst' && (
                <div className="space-y-4 animate-fade-in">
                    <label className="text-sm font-bold text-muted uppercase tracking-wider block">2. Configuration</label>

                    <div className="space-y-3">
                        <label className="text-xs text-muted block">Action</label>
                        <div className="flex bg-black/40 rounded-lg p-1 border border-white/20">
                            <button
                                onClick={() => setSignAction('sign')}
                                className={clsx("flex-1 py-1.5 rounded text-sm font-medium transition-colors", signAction === 'sign' ? "bg-primary text-white" : "text-muted hover:text-white")}
                            >
                                Sign
                            </button>
                            <button
                                onClick={() => setSignAction('verify')}
                                className={clsx("flex-1 py-1.5 rounded text-sm font-medium transition-colors", signAction === 'verify' ? "bg-primary text-white" : "text-muted hover:text-white")}
                            >
                                Verify
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs text-muted block">Hash Algorithm</label>
                        <select
                            value={sigHashAlgo}
                            onChange={(e) => setSigHashAlgo(e.target.value)}
                            className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
                        >
                            <option value="sha256">SHA-256</option>
                            <option value="sha384">SHA-384</option>
                            <option value="sha512">SHA-512</option>
                            <option value="sha3-256">SHA3-256</option>
                            <option value="sha3-384">SHA3-384</option>
                            <option value="sha3-512">SHA3-512</option>
                            <option value="shake128">SHAKE-128</option>
                            <option value="shake256">SHAKE-256</option>
                            <option value="blake2s256">BLAKE2s-256</option>
                            <option value="blake2b512">BLAKE2b-512</option>
                        </select>
                    </div>
                </div>
            )}



            <div className="mt-auto pt-6">
                <button
                    onClick={handleRun}
                    disabled={isProcessing}
                    className="w-full btn-primary flex items-center justify-center gap-2 py-3 text-lg font-bold shadow-lg shadow-primary/20"
                >
                    {isProcessing ? <Settings className="animate-spin" /> : <Play fill="currentColor" />}
                    Run Command
                </button>
            </div>
        </div>
    );
};
