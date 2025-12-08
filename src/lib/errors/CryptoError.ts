export class CryptoError extends Error {
  public readonly code: string
  public readonly originalError?: unknown

  constructor(message: string, code: string, originalError?: unknown) {
    super(message)
    this.name = 'CryptoError'
    this.code = code
    this.originalError = originalError
  }
}

export class KeyGenerationError extends CryptoError {
  constructor(message: string, originalError?: unknown) {
    super(message, 'KEY_GENERATION_FAILED', originalError)
    this.name = 'KeyGenerationError'
  }
}

export class SignatureError extends CryptoError {
  constructor(message: string, originalError?: unknown) {
    super(message, 'SIGNATURE_FAILED', originalError)
    this.name = 'SignatureError'
  }
}

export class VerificationError extends CryptoError {
  constructor(message: string, originalError?: unknown) {
    super(message, 'VERIFICATION_FAILED', originalError)
    this.name = 'VerificationError'
  }
}
