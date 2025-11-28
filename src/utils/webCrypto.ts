/**
 * Web Crypto API Utilities
 * 
 * This module provides wrappers around the Web Crypto API for classical
 * cryptographic algorithms (RSA, ECDSA, Ed25519, AES, SHA).
 * 
 * All functions return Promises and work with Uint8Array for binary data.
 */

// ============================================================================
// Type Definitions
// ============================================================================

export type RSAKeySize = 2048 | 3072 | 4096;
export type AESKeySize = 128 | 256;
export type HashAlgorithm = 'SHA-256' | 'SHA-384';

export interface KeyPairResult {
    publicKey: CryptoKey;
    privateKey: CryptoKey;
    publicKeyHex: string;
    privateKeyHex: string;
}

// ============================================================================
// RSA-PSS (Signature Algorithm)
// ============================================================================

/**
 * Generate RSA-PSS key pair
 * @param keySize - RSA modulus length (2048, 3072, or 4096 bits)
 * @returns Key pair with hex-encoded keys
 */
export async function generateRSAKeyPair(keySize: RSAKeySize): Promise<KeyPairResult> {
    const keyPair = await crypto.subtle.generateKey(
        {
            name: 'RSA-PSS',
            modulusLength: keySize,
            publicExponent: new Uint8Array([1, 0, 1]), // 65537
            hash: 'SHA-256',
        },
        true, // extractable
        ['sign', 'verify']
    ) as CryptoKeyPair;

    // Export keys to get hex representation
    const publicKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
    const privateKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);

    return {
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
        publicKeyHex: JSON.stringify(publicKeyJwk),
        privateKeyHex: JSON.stringify(privateKeyJwk),
    };
}

/**
 * Sign data using RSA-PSS
 * @param privateKey - RSA private key
 * @param data - Data to sign
 * @returns Signature as Uint8Array
 */
export async function signRSA(privateKey: CryptoKey, data: Uint8Array): Promise<Uint8Array> {
    const signature = await crypto.subtle.sign(
        {
            name: 'RSA-PSS',
            saltLength: 32, // Recommended salt length
        },
        privateKey,
        data as BufferSource
    );

    return new Uint8Array(signature);
}

/**
 * Verify RSA-PSS signature
 * @param publicKey - RSA public key
 * @param signature - Signature to verify
 * @param data - Original data
 * @returns True if signature is valid
 */
export async function verifyRSA(
    publicKey: CryptoKey,
    signature: Uint8Array,
    data: Uint8Array
): Promise<boolean> {
    return await crypto.subtle.verify(
        {
            name: 'RSA-PSS',
            saltLength: 32,
        },
        publicKey,
        signature as BufferSource,
        data as BufferSource
    );
}

// ============================================================================
// ECDSA P-256 (Signature Algorithm)
// ============================================================================

/**
 * Generate ECDSA P-256 key pair
 * @returns Key pair with hex-encoded keys
 */
export async function generateECDSAKeyPair(): Promise<KeyPairResult> {
    const keyPair = await crypto.subtle.generateKey(
        {
            name: 'ECDSA',
            namedCurve: 'P-256',
        },
        true, // extractable
        ['sign', 'verify']
    ) as CryptoKeyPair;

    // Export keys
    const publicKeyRaw = await crypto.subtle.exportKey('raw', keyPair.publicKey);
    const privateKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);

    return {
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
        publicKeyHex: arrayBufferToHex(publicKeyRaw),
        privateKeyHex: JSON.stringify(privateKeyJwk),
    };
}

/**
 * Sign data using ECDSA P-256
 * @param privateKey - ECDSA private key
 * @param data - Data to sign
 * @returns Signature as Uint8Array
 */
export async function signECDSA(privateKey: CryptoKey, data: Uint8Array): Promise<Uint8Array> {
    const signature = await crypto.subtle.sign(
        {
            name: 'ECDSA',
            hash: 'SHA-256',
        },
        privateKey,
        data as BufferSource
    );

    return new Uint8Array(signature);
}

/**
 * Verify ECDSA signature
 * @param publicKey - ECDSA public key
 * @param signature - Signature to verify
 * @param data - Original data
 * @returns True if signature is valid
 */
export async function verifyECDSA(
    publicKey: CryptoKey,
    signature: Uint8Array,
    data: Uint8Array
): Promise<boolean> {
    return await crypto.subtle.verify(
        {
            name: 'ECDSA',
            hash: 'SHA-256',
        },
        publicKey,
        signature as BufferSource,
        data as BufferSource
    );
}

// ============================================================================
// Ed25519 (Signature Algorithm)
// ============================================================================

/**
 * Generate Ed25519 key pair
 * @returns Key pair with hex-encoded keys
 */
export async function generateEd25519KeyPair(): Promise<KeyPairResult> {
    const keyPair = await crypto.subtle.generateKey(
        {
            name: 'Ed25519',
        },
        true, // extractable
        ['sign', 'verify']
    ) as CryptoKeyPair;

    // Export keys
    const publicKeyRaw = await crypto.subtle.exportKey('raw', keyPair.publicKey);
    const privateKeyRaw = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

    return {
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
        publicKeyHex: arrayBufferToHex(publicKeyRaw),
        privateKeyHex: arrayBufferToHex(privateKeyRaw),
    };
}

/**
 * Sign data using Ed25519
 * @param privateKey - Ed25519 private key
 * @param data - Data to sign
 * @returns Signature as Uint8Array
 */
export async function signEd25519(privateKey: CryptoKey, data: Uint8Array): Promise<Uint8Array> {
    const signature = await crypto.subtle.sign(
        {
            name: 'Ed25519',
        },
        privateKey,
        data as BufferSource
    );

    return new Uint8Array(signature);
}

/**
 * Verify Ed25519 signature
 * @param publicKey - Ed25519 public key
 * @param signature - Signature to verify
 * @param data - Original data
 * @returns True if signature is valid
 */
export async function verifyEd25519(
    publicKey: CryptoKey,
    signature: Uint8Array,
    data: Uint8Array
): Promise<boolean> {
    return await crypto.subtle.verify(
        {
            name: 'Ed25519',
        },
        publicKey,
        signature as BufferSource,
        data as BufferSource
    );
}

// ============================================================================
// ECDH (Key Exchange)
// ============================================================================

/**
 * Generate ECDH P-256 key pair for key exchange
 * @returns Key pair with hex-encoded keys
 */
export async function generateECDHKeyPair(): Promise<KeyPairResult> {
    const keyPair = await crypto.subtle.generateKey(
        {
            name: 'ECDH',
            namedCurve: 'P-256',
        },
        true, // extractable
        ['deriveKey', 'deriveBits']
    ) as CryptoKeyPair;

    // Export keys
    const publicKeyRaw = await crypto.subtle.exportKey('raw', keyPair.publicKey);
    const privateKeyJwk = await crypto.subtle.exportKey('jwk', keyPair.privateKey);

    return {
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
        publicKeyHex: arrayBufferToHex(publicKeyRaw),
        privateKeyHex: JSON.stringify(privateKeyJwk),
    };
}

/**
 * Generate X25519 key pair for key exchange
 * @returns Key pair with hex-encoded keys
 */
export async function generateX25519KeyPair(): Promise<KeyPairResult> {
    const keyPair = await crypto.subtle.generateKey(
        {
            name: 'X25519',
        },
        true, // extractable
        ['deriveKey', 'deriveBits']
    ) as CryptoKeyPair;

    // Export keys
    const publicKeyRaw = await crypto.subtle.exportKey('raw', keyPair.publicKey);
    const privateKeyRaw = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

    return {
        publicKey: keyPair.publicKey,
        privateKey: keyPair.privateKey,
        publicKeyHex: arrayBufferToHex(publicKeyRaw),
        privateKeyHex: arrayBufferToHex(privateKeyRaw),
    };
}

/**
 * Derive shared secret using ECDH
 * @param privateKey - Your private key
 * @param publicKey - Other party's public key
 * @returns Shared secret as Uint8Array
 */
export async function deriveSharedSecret(
    privateKey: CryptoKey,
    publicKey: CryptoKey
): Promise<Uint8Array> {
    const algorithm = privateKey.algorithm.name as 'ECDH' | 'X25519';

    const sharedBits = await crypto.subtle.deriveBits(
        {
            name: algorithm,
            public: publicKey,
        },
        privateKey,
        256 // 256 bits = 32 bytes
    );

    return new Uint8Array(sharedBits);
}

// ============================================================================
// AES-GCM (Symmetric Encryption)
// ============================================================================

/**
 * Generate AES-GCM key
 * @param keySize - Key size in bits (128 or 256)
 * @returns AES key
 */
export async function generateAESKey(keySize: AESKeySize): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
        {
            name: 'AES-GCM',
            length: keySize,
        },
        true, // extractable
        ['encrypt', 'decrypt']
    ) as CryptoKey;
}

/**
 * Encrypt data using AES-GCM
 * @param key - AES key
 * @param data - Data to encrypt
 * @param iv - Initialization vector (12 bytes recommended)
 * @returns Encrypted data as Uint8Array
 */
export async function encryptAES(
    key: CryptoKey,
    data: Uint8Array,
    iv: Uint8Array
): Promise<Uint8Array> {
    const encrypted = await crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv as BufferSource,
        },
        key,
        data as BufferSource
    );

    return new Uint8Array(encrypted);
}

/**
 * Decrypt data using AES-GCM
 * @param key - AES key
 * @param encryptedData - Data to decrypt
 * @param iv - Initialization vector (same as used for encryption)
 * @returns Decrypted data as Uint8Array
 */
export async function decryptAES(
    key: CryptoKey,
    encryptedData: Uint8Array,
    iv: Uint8Array
): Promise<Uint8Array> {
    const decrypted = await crypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: iv as BufferSource,
        },
        key,
        encryptedData as BufferSource
    );

    return new Uint8Array(decrypted);
}

// ============================================================================
// Hashing
// ============================================================================

/**
 * Hash data using specified algorithm
 * @param algorithm - Hash algorithm (SHA-256 or SHA-384)
 * @param data - Data to hash
 * @returns Hash as Uint8Array
 */
export async function hash(algorithm: HashAlgorithm, data: Uint8Array): Promise<Uint8Array> {
    const hashBuffer = await crypto.subtle.digest(algorithm, data as BufferSource);
    return new Uint8Array(hashBuffer);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert ArrayBuffer to hex string
 */
export function arrayBufferToHex(buffer: ArrayBuffer): string {
    return Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Convert hex string to Uint8Array
 */
export function hexToUint8Array(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
}

/**
 * Generate random bytes (for IVs, salts, etc.)
 */
export function getRandomBytes(length: number): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Check if Web Crypto API is available
 */
export function isWebCryptoSupported(): boolean {
    return typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined';
}

/**
 * Check if a specific algorithm is supported
 */
export async function isAlgorithmSupported(algorithm: string): Promise<boolean> {
    try {
        if (algorithm === 'Ed25519' || algorithm === 'X25519') {
            // Try to generate a key pair to test support
            await crypto.subtle.generateKey(
                { name: algorithm },
                false,
                algorithm === 'Ed25519' ? ['sign', 'verify'] : ['deriveKey']
            );
            return true;
        }
        return true; // Other algorithms are widely supported
    } catch {
        return false;
    }
}
