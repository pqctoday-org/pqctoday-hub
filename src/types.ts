export interface Key {
    id: string;
    name: string;
    type: 'public' | 'private' | 'symmetric';
    algorithm: string;
    value: string; // For mock mode or hex representation
    data?: Uint8Array | CryptoKey; // For WASM mode (Uint8Array) or Web Crypto API (CryptoKey)
    dataType?: 'string' | 'binary' | 'cryptokey';
    timestamp: number;
}

export interface LogEntry {
    id: string;
    timestamp: string;
    keyLabel: string;
    operation: string;
    result: string;
    executionTime: number; // in ms
}
