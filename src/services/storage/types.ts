export interface StoredKeyPair {
  id: string
  name: string
  algorithm: string
  keySize: number
  created: number
  publicKey: string // PEM format
  privateKey?: string // Optional, encrypted or omitted
  description?: string
}

export interface StoredCertificate {
  id: string
  name: string
  pem: string
  created: number
  metadata: {
    subject: string
    issuer: string
    serial: string
    notBefore: number
    notAfter: number
  }
  tags: string[]
  keyPairId?: string
}

export interface StoredCSR {
  id: string
  name: string
  pem: string
  created: number
  keyPairId?: string
}

export interface LearningProgress {
  version: string // Format version for compatibility
  timestamp: number // Last save timestamp

  // Module completion
  modules: {
    [moduleId: string]: {
      status: 'not-started' | 'in-progress' | 'completed'
      lastVisited: number
      timeSpent: number // Seconds
      completedSteps: string[]
      quizScores: { [quizId: string]: number }
    }
  }

  // Generated artifacts (keys, certs, CSRs)
  artifacts: {
    keys: StoredKeyPair[]
    certificates: StoredCertificate[]
    csrs: StoredCSR[]
  }

  // EJBCA connections (if used)
  ejbcaConnections: {
    [name: string]: {
      url: string
      lastUsed: number
      // No credentials stored!
    }
  }

  // User preferences
  preferences: {
    theme: 'light' | 'dark'
    defaultKeyType: string
    autoSave: boolean
  }

  // Learning notes
  notes: {
    [moduleId: string]: string
  }
}
