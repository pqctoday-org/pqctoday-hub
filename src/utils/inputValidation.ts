/**
 * Input Validation & Sanitization Utilities
 *
 * Prevents command injection and malicious input in OpenSSL operations
 */

/**
 * Sanitize Distinguished Name (DN) fields
 * Removes special DN characters that could break OpenSSL commands
 */
export const sanitizeDNField = (input: string, maxLength: number = 64): string => {
    if (!input || typeof input !== 'string') return '';

    // Remove DN special characters: / = , + " \ < > ;
    const sanitized = input
        .replace(/[/=,+"\\<>;]/g, '')
        .trim()
        .substring(0, maxLength);

    return sanitized;
};

/**
 * Sanitize country code (ISO 3166-1 alpha-2)
 * Must be exactly 2 uppercase letters
 */
export const sanitizeCountryCode = (input: string): string => {
    if (!input || typeof input !== 'string') return 'US';

    const cleaned = input.toUpperCase().replace(/[^A-Z]/g, '');
    return cleaned.length >= 2 ? cleaned.substring(0, 2) : 'US';
};

/**
 * Sanitize Common Name (CN)
 * Allows alphanumerics, dots, hyphens, and asterisks (for wildcards)
 */
export const sanitizeCommonName = (input: string, maxLength: number = 64): string => {
    if (!input || typeof input !== 'string') return '';

    const sanitized = input
        .replace(/[^a-zA-Z0-9.\-*]/g, '')
        .trim()
        .substring(0, maxLength);

    return sanitized;
};

/**
 * Sanitize Organization name
 */
export const sanitizeOrganization = (input: string, maxLength: number = 64): string => {
    return sanitizeDNField(input, maxLength);
};

/**
 * Sanitize file name
 * Removes path traversal attempts and dangerous characters
 */
export const sanitizeFileName = (input: string, maxLength: number = 255): string => {
    if (!input || typeof input !== 'string') return '';

    // Remove path separators and null bytes
    const sanitized = input
        // eslint-disable-next-line no-control-regex
        .replace(/[/\\.\u0000]/g, '')
        .replace(/\.\./g, '')
        .trim()
        .substring(0, maxLength);

    return sanitized;
};

/**
 * Validate email address
 */
export const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Sanitize email for CSR
 */
export const sanitizeEmail = (input: string): string => {
    if (!input || typeof input !== 'string') return '';

    const cleaned = input.trim();
    return validateEmail(cleaned) ? cleaned : '';
};
