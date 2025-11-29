
// Convert Uint8Array to Hex String
export const bytesToHex = (bytes: Uint8Array): string => {
    return Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
};

// Convert Hex String to Uint8Array
export const hexToBytes = (hex: string): Uint8Array => {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
    }
    return bytes;
};

// Convert ASCII String to Hex String
export const asciiToHex = (str: string): string => {
    let hex = '';
    for (let i = 0; i < str.length; i++) {
        hex += str.charCodeAt(i).toString(16).padStart(2, '0');
    }
    return hex;
};

// Convert Hex String to ASCII String
export const hexToAscii = (hex: string): string => {
    let str = '';
    for (let i = 0; i < hex.length; i += 2) {
        const code = parseInt(hex.substring(i, i + 2), 16);
        str += String.fromCharCode(code);
    }
    return str;
};

export const isHex = (str: string): boolean => {
    const hexRegex = /^[0-9a-fA-F]*$/;
    return hexRegex.test(str) && str.length % 2 === 0;
};
