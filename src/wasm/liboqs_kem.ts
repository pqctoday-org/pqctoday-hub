// Wrapper for @openforge-sh/liboqs (ML-KEM)
/* eslint-disable */
import { createMLKEM512, createMLKEM768, createMLKEM1024 } from '@openforge-sh/liboqs';

/**
 * Generates a new ML-KEM key pair.
 * 
 * @param params - Configuration object containing the algorithm name (e.g., 'ML-KEM-768').
 * @param _exportPublic - (Optional) Whether to export the public key. Defaults to true.
 * @param _ops - (Optional) List of allowed operations.
 * @returns An object containing the generated `publicKey` and `secretKey` as Uint8Arrays.
 */
export const generateKey = async (params: { name: string }, _exportPublic = true, _ops?: string[]) => {
    let createAlgo;
    switch (params.name) {
        case 'ML-KEM-512': createAlgo = createMLKEM512; break;
        case 'ML-KEM-768': createAlgo = createMLKEM768; break;
        case 'ML-KEM-1024': createAlgo = createMLKEM1024; break;
        default: throw new Error(`Unknown algorithm: ${params.name}`);
    }

    const instance = await createAlgo();
    try {
        const keypair = instance.generateKeyPair();
        return {
            publicKey: keypair.publicKey,
            secretKey: keypair.secretKey
        };
    } finally {
        if (instance.destroy) instance.destroy();
    }
};

/**
 * Decapsulates a shared secret from a ciphertext using a private key.
 * 
 * @param params - Configuration object containing the algorithm name.
 * @param secretKey - The private key to use for decapsulation.
 * @param ciphertext - The ciphertext to decapsulate.
 * @returns The recovered shared secret as a Uint8Array.
 */
export const decapsulateBits = async (params: { name: string }, secretKey: Uint8Array, ciphertext: Uint8Array) => {
    let createAlgo;
    switch (params.name) {
        case 'ML-KEM-512': createAlgo = createMLKEM512; break;
        case 'ML-KEM-768': createAlgo = createMLKEM768; break;
        case 'ML-KEM-1024': createAlgo = createMLKEM1024; break;
        default: throw new Error(`Unknown algorithm: ${params.name}`);
    }

    const instance = await createAlgo();
    try {
        return instance.decapsulate(ciphertext, secretKey);
    } finally {
        if (instance.destroy) instance.destroy();
    }
};

/**
 * Encapsulates a shared secret for a given public key.
 * 
 * @param params - Configuration object containing the algorithm name.
 * @param publicKey - The public key to encapsulate against.
 * @returns An object containing the `ciphertext` and the generated `sharedKey`.
 */
export const encapsulateBits = async (params: { name: string }, publicKey: Uint8Array) => {
    let createAlgo;
    switch (params.name) {
        case 'ML-KEM-512': createAlgo = createMLKEM512; break;
        case 'ML-KEM-768': createAlgo = createMLKEM768; break;
        case 'ML-KEM-1024': createAlgo = createMLKEM1024; break;
        default: throw new Error(`Unknown algorithm: ${params.name}`);
    }

    const instance = await createAlgo();
    try {
        const result = instance.encapsulate(publicKey);
        return {
            ciphertext: result.ciphertext,
            sharedKey: result.sharedSecret
        };
    } finally {
        if (instance.destroy) instance.destroy();
    }
};
