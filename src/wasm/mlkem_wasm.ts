// Wrapper for mlkem-wasm
import { createLogger } from '../utils/logger';

const logger = createLogger('mlkem_wasm');
let mlkem: any = null;

/**
 * Loads the `mlkem-wasm` module dynamically.
 * Ensures the module is loaded only once.
 * 
 * @returns The loaded WASM module instance.
 */
export const load = async () => {
    if (!mlkem) {
        try {
            // @ts-ignore
            mlkem = await import('mlkem-wasm');

            // Check if it's a default export or named exports
            if (mlkem.default) {
                mlkem = mlkem.default;
            }
        } catch (e) {
            logger.error('[mlkem_wasm] Import failed:', e);
            throw e;
        }
    }
    return mlkem;
};

/**
 * Generates a key pair using the `mlkem-wasm` library.
 * 
 * @param params - Algorithm parameters.
 * @param exportPublic - Whether to export the public key.
 * @param ops - Allowed operations.
 * @returns An object containing `publicKey` and `secretKey` as Uint8Arrays.
 */
export const generateKey = async (params: any, exportPublic = true, ops?: string[]) => {
    const mod = await load();
    try {
        const keypair = await mod.generateKey(params, exportPublic, ops);

        // Export keys to raw bytes
        const publicKey = new Uint8Array(await mod.exportKey("raw-public", keypair.publicKey));
        const secretKey = new Uint8Array(await mod.exportKey("raw-seed", keypair.privateKey));

        return { publicKey, secretKey };
    } catch (e) {
        logger.error('[mlkem_wasm] generateKey failed:', e);
        throw e;
    }
};

/**
 * Encapsulates a shared secret using a public key.
 * 
 * @param params - Algorithm parameters.
 * @param publicKeyBytes - The public key as a Uint8Array.
 * @returns An object containing `ciphertext` and `sharedKey` as Uint8Arrays.
 */
export const encapsulateBits = async (params: any, publicKeyBytes: Uint8Array) => {
    const mod = await load();
    // Import the key from bytes
    const publicKey = await mod.importKey("raw-public", publicKeyBytes, params, true, ["encapsulateBits"]);
    const result = await mod.encapsulateBits(params, publicKey);

    // Convert ArrayBuffers to Uint8Arrays
    return {
        ciphertext: new Uint8Array(result.ciphertext),
        sharedKey: new Uint8Array(result.sharedKey)
    };
};

/**
 * Decapsulates a shared secret using a private key.
 * 
 * @param params - Algorithm parameters.
 * @param secretKeyBytes - The private key as a Uint8Array.
 * @param ciphertext - The ciphertext to decapsulate.
 * @returns The recovered shared secret as a Uint8Array.
 */
export const decapsulateBits = async (params: any, secretKeyBytes: Uint8Array, ciphertext: Uint8Array) => {
    const mod = await load();
    // Import the key from bytes
    const secretKey = await mod.importKey("raw-seed", secretKeyBytes, params, true, ["decapsulateBits"]);
    const result = await mod.decapsulateBits(params, secretKey, ciphertext);

    // Convert ArrayBuffer to Uint8Array
    return new Uint8Array(result);
};
