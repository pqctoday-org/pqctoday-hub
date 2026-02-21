/* eslint-disable security/detect-object-injection */
import type {
  QuizQuestion,
  QuizCategory,
  QuestionType,
  QuizCategoryMeta,
} from '@/components/PKILearning/modules/Quiz/types'

// ─── CSV file discovery (pick most recent by date stamp) ───

function getLatestQuizFile(): { content: string; filename: string; date: Date } | null {
  const modules = import.meta.glob('./pqcquiz_*.csv', {
    query: '?raw',
    import: 'default',
    eager: true,
  })

  const files = Object.keys(modules)
    .map((path) => {
      // eslint-disable-next-line security/detect-unsafe-regex
      const match = path.match(/pqcquiz_(\d{2})(\d{2})(\d{4})(?:_[^.]*)?\.csv$/)
      if (match) {
        const [, month, day, year] = match
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))

        return { path, date, content: modules[path] as string }
      }
      return null
    })
    .filter((f): f is { path: string; date: Date; content: string } => f !== null)

  if (files.length === 0) {
    console.warn('No dated pqcquiz CSV files found.')
    return null
  }

  files.sort((a, b) => b.date.getTime() - a.date.getTime())
  console.log(`Loading quiz data from: ${files[0].path}`)

  return {
    content: files[0].content,
    filename: files[0].path.split('/').pop() || files[0].path,
    date: files[0].date,
  }
}

// ─── Quote-aware CSV line parser ───

function parseLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"' && line[i + 1] === '"') {
      current += '"'
      i++
    } else if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

// ─── CSV → QuizQuestion[] parser ───

function parseQuizCSV(csvContent: string): QuizQuestion[] {
  const lines = csvContent.trim().split('\n')
  // Header: id,category,type,difficulty,quiz_mode,question,option_a,option_b,option_c,option_d,correct_answer,explanation,learn_more_path
  const results: QuizQuestion[] = []

  for (const line of lines.slice(1)) {
    const v = parseLine(line)
    if (v.length < 13) continue

    const type = v[2] as QuestionType
    const quizMode = v[4] as 'quick' | 'full' | 'both'

    // Build options array with correct IDs
    const options: { id: string; text: string }[] = []
    if (type === 'true-false') {
      if (v[6]) options.push({ id: 'true', text: v[6] })
      if (v[7]) options.push({ id: 'false', text: v[7] })
    } else {
      const ids = ['a', 'b', 'c', 'd']
      for (let i = 0; i < 4; i++) {
        const text = v[6 + i]
        if (text) options.push({ id: ids[i], text })
      }
    }

    // Parse correctAnswer — pipe-delimited for multi-select
    const rawAnswer = v[10]
    const correctAnswer: string | string[] =
      type === 'multi-select' ? rawAnswer.split('|') : rawAnswer

    const q: QuizQuestion = {
      id: v[0],
      category: v[1] as QuizCategory,
      type,
      difficulty: v[3] as 'beginner' | 'intermediate' | 'advanced',
      quizMode,
      question: v[5],
      options,
      correctAnswer,
      explanation: v[11],
    }
    if (v[12]) q.learnMorePath = v[12]
    results.push(q)
  }

  return results
}

// ─── Load and export ───

const file = getLatestQuizFile()
const questions = file ? parseQuizCSV(file.content) : []

export const quizQuestions: QuizQuestion[] = questions

export const quizMetadata = file ? { filename: file.filename, lastUpdate: file.date } : null

// ─── Dynamic category metadata ───

const CATEGORY_CONFIG: Record<QuizCategory, { label: string; description: string; icon: string }> =
  {
    'pqc-fundamentals': {
      label: 'PQC Fundamentals',
      description: 'Quantum threats, HNDL attacks, and the basics of post-quantum cryptography.',
      icon: 'Shield',
    },
    'algorithm-families': {
      label: 'Algorithm Families',
      description:
        'Lattice-based, code-based, and hash-based PQC algorithms — names, properties, and trade-offs.',
      icon: 'Layers',
    },
    'nist-standards': {
      label: 'NIST Standards',
      description: 'FIPS standards, security levels, and the NIST PQC standardization process.',
      icon: 'FileCheck',
    },
    'migration-planning': {
      label: 'Migration Planning',
      description: 'Migration frameworks, crypto agility, CBOM, and hybrid deployment strategies.',
      icon: 'Route',
    },
    compliance: {
      label: 'Compliance & Regulations',
      description: 'CNSA 2.0, ANSSI, eIDAS 2.0, and global PQC compliance deadlines.',
      icon: 'Scale',
    },
    'protocol-integration': {
      label: 'Protocol Integration',
      description: 'PQC in TLS, IPsec, CMS/S/MIME, OpenPGP, 5G, and SSH protocols.',
      icon: 'Network',
    },
    'industry-threats': {
      label: 'Industry Threats',
      description: 'Sector-specific quantum risks across finance, healthcare, telecom, and more.',
      icon: 'AlertTriangle',
    },
    'crypto-operations': {
      label: 'Crypto Operations',
      description:
        'KEMs vs signatures, key sizes, encapsulation, performance, and practical trade-offs.',
      icon: 'Key',
    },
    'digital-assets': {
      label: 'Digital Assets',
      description:
        'Blockchain cryptography, elliptic curves, HD wallets, and post-quantum threats to digital assets.',
      icon: 'Bitcoin',
    },
    'tls-basics': {
      label: 'TLS Basics',
      description:
        'TLS 1.3 handshake, cipher suites, key exchange, certificates, and PQC integration.',
      icon: 'Lock',
    },
    'pki-infrastructure': {
      label: 'PKI Infrastructure',
      description:
        'X.509 certificates, certificate authorities, digital signatures, and PQC migration for PKI.',
      icon: 'Award',
    },
    'digital-id': {
      label: 'Digital Identity',
      description:
        'eIDAS 2.0, EUDI Wallets, credential formats, trust frameworks, and post-quantum readiness for digital identity.',
      icon: 'Fingerprint',
    },
    '5g-security': {
      label: '5G Security',
      description:
        'SUCI subscriber privacy, 5G-AKA authentication, MILENAGE, SIM provisioning, and post-quantum upgrades for 5G networks.',
      icon: 'Radio',
    },
    'quantum-threats': {
      label: 'Quantum Threats',
      description:
        "Shor's and Grover's algorithms, CRQC timelines, HNDL attack mechanics, and security level degradation.",
      icon: 'Zap',
    },
    'hybrid-crypto': {
      label: 'Hybrid Cryptography',
      description:
        'Hybrid KEMs, composite signatures, X25519MLKEM768, dual-OID certificates, and transition standards.',
      icon: 'Combine',
    },
    'crypto-agility': {
      label: 'Crypto Agility',
      description:
        'Abstraction layers, CBOM scanning, provider model, CycloneDX, and the 7-phase migration framework.',
      icon: 'Repeat',
    },
    'vpn-ssh-pqc': {
      label: 'VPN/IPsec & SSH',
      description:
        'IKEv2 with ML-KEM, SSH hybrid key exchange, WireGuard Rosenpass, and protocol size comparisons.',
      icon: 'Shield',
    },
    'stateful-signatures': {
      label: 'Stateful Signatures',
      description:
        'LMS/HSS, XMSS/XMSS^MT, Merkle tree signatures, one-time signature state, and NIST SP 800-208.',
      icon: 'GitBranch',
    },
    'email-signing': {
      label: 'Email & Document Signing',
      description:
        'S/MIME, CMS SignedData/EnvelopedData, RFC 9629 KEMRecipientInfo, and PQC migration for email.',
      icon: 'Mail',
    },
    'key-management': {
      label: 'Key Management & HSM',
      description:
        'Key lifecycle (NIST SP 800-57), HSM FIPS 140-3, PKCS#11 operations, and PQC key rotation planning.',
      icon: 'KeyRound',
    },
  }

// Compute question counts dynamically from loaded data
const categoryCounts = new Map<QuizCategory, number>()
for (const q of questions) {
  categoryCounts.set(q.category, (categoryCounts.get(q.category) || 0) + 1)
}

export const quizCategories: QuizCategoryMeta[] = (
  Object.keys(CATEGORY_CONFIG) as QuizCategory[]
).map((id) => ({
  id,
  ...CATEGORY_CONFIG[id],
  questionCount: categoryCounts.get(id) || 0,
}))
