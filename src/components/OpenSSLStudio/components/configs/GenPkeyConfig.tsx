import React from 'react'

interface GenPkeyConfigProps {
    keyAlgo: string
    setKeyAlgo: (value: string) => void
    keyBits: string
    setKeyBits: (value: string) => void
    curve: string
    setCurve: (value: string) => void
    cipher: string
    setCipher: (value: string) => void
    passphrase: string
    setPassphrase: (value: string) => void
}

export const GenPkeyConfig: React.FC<GenPkeyConfigProps> = ({
    keyAlgo,
    setKeyAlgo,
    keyBits,
    setKeyBits,
    curve,
    setCurve,
    cipher,
    setCipher,
    passphrase,
    setPassphrase,
}) => {
    return (
        <div className="space-y-4 animate-fade-in">
            <span className="text-sm font-bold text-muted uppercase tracking-wider block">
                2. Configuration
            </span>

            <div className="space-y-3">
                <label htmlFor="algo-select" className="text-xs text-muted block">
                    Algorithm
                </label>
                <select
                    id="algo-select"
                    value={keyAlgo}
                    onChange={(e) => setKeyAlgo(e.target.value)}
                    className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
                >
                    <optgroup label="Classic">
                        <option value="rsa">RSA</option>
                        <option value="ec">Elliptic Curve (EC)</option>
                        <option value="ed25519">Ed25519</option>
                        <option value="ed448">Ed448</option>
                        <option value="x25519">X25519</option>
                        <option value="x448">X448</option>
                    </optgroup>
                    <optgroup label="Post-Quantum (ML-KEM)">
                        <option value="mlkem512">ML-KEM-512</option>
                        <option value="mlkem768">ML-KEM-768</option>
                        <option value="mlkem1024">ML-KEM-1024</option>
                    </optgroup>
                    <optgroup label="Post-Quantum (ML-DSA)">
                        <option value="mldsa44">ML-DSA-44</option>
                        <option value="mldsa65">ML-DSA-65</option>
                        <option value="mldsa87">ML-DSA-87</option>
                    </optgroup>
                    <optgroup label="Post-Quantum (SLH-DSA)">
                        <option value="slhdsa128s">SLH-DSA-SHA2-128s</option>
                        <option value="slhdsa128f">SLH-DSA-SHA2-128f</option>
                        <option value="slhdsa192s">SLH-DSA-SHA2-192s</option>
                        <option value="slhdsa192f">SLH-DSA-SHA2-192f</option>
                        <option value="slhdsa256s">SLH-DSA-SHA2-256s</option>
                        <option value="slhdsa256f">SLH-DSA-SHA2-256f</option>
                        <option value="slhdsashake128s">SLH-DSA-SHAKE-128s</option>
                        <option value="slhdsashake128f">SLH-DSA-SHAKE-128f</option>
                        <option value="slhdsashake192s">SLH-DSA-SHAKE-192s</option>
                        <option value="slhdsashake192f">SLH-DSA-SHAKE-192f</option>
                        <option value="slhdsashake256s">SLH-DSA-SHAKE-256s</option>
                        <option value="slhdsashake256f">SLH-DSA-SHAKE-256f</option>
                    </optgroup>
                </select>
            </div>

            {keyAlgo === 'rsa' && (
                <div className="space-y-3">
                    <label htmlFor="bits-select" className="text-xs text-muted block">
                        Key Size (Bits)
                    </label>
                    <select
                        id="bits-select"
                        value={keyBits}
                        onChange={(e) => setKeyBits(e.target.value)}
                        className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
                    >
                        <option value="2048">2048</option>
                        <option value="3072">3072</option>
                        <option value="4096">4096</option>
                    </select>
                </div>
            )}

            {keyAlgo === 'ec' && (
                <div className="space-y-3">
                    <label htmlFor="curve-select" className="text-xs text-muted block">
                        Curve
                    </label>
                    <select
                        id="curve-select"
                        value={curve}
                        onChange={(e) => setCurve(e.target.value)}
                        className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
                    >
                        <option value="P-256">P-256</option>
                        <option value="P-384">P-384</option>
                        <option value="P-521">P-521</option>
                        <option value="secp256k1">secp256k1</option>
                    </select>
                </div>
            )}

            <div className="space-y-3">
                <label htmlFor="cipher-select" className="text-xs text-muted block">
                    Encryption (Optional)
                </label>
                <select
                    id="cipher-select"
                    value={cipher}
                    onChange={(e) => setCipher(e.target.value)}
                    className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
                >
                    <option value="none">None (Unencrypted)</option>
                    <option value="aes-128-cbc">AES-128-CBC</option>
                    <option value="aes-256-cbc">AES-256-CBC</option>
                    <option value="des3">Triple DES</option>
                </select>
            </div>

            {cipher !== 'none' && (
                <div className="space-y-3">
                    <label htmlFor="passphrase-input" className="text-xs text-muted block">
                        Passphrase
                    </label>
                    <input
                        id="passphrase-input"
                        type="password"
                        value={passphrase}
                        onChange={(e) => setPassphrase(e.target.value)}
                        className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary"
                    />
                </div>
            )}
        </div>
    )
}
