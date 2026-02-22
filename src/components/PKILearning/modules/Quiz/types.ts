export type QuestionType = 'multiple-choice' | 'true-false' | 'multi-select'

export type QuizCategory =
  | 'pqc-fundamentals'
  | 'algorithm-families'
  | 'nist-standards'
  | 'migration-planning'
  | 'compliance'
  | 'protocol-integration'
  | 'industry-threats'
  | 'crypto-operations'
  | 'digital-assets'
  | 'tls-basics'
  | 'pki-infrastructure'
  | 'digital-id'
  | '5g-security'
  | 'quantum-threats'
  | 'hybrid-crypto'
  | 'crypto-agility'
  | 'vpn-ssh-pqc'
  | 'stateful-signatures'
  | 'email-signing'
  | 'key-management'

export interface QuizOption {
  id: string
  text: string
}

export interface QuizQuestion {
  id: string
  category: QuizCategory
  type: QuestionType
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  /** Controls pool eligibility: 'both' = all modes, 'quick' = quick quiz only, 'full' = full assessment only */
  quizMode: 'quick' | 'full' | 'both'
  question: string
  options: QuizOption[]
  /** For multiple-choice and true-false: single correct option ID. For multi-select: array of correct option IDs. */
  correctAnswer: string | string[]
  /** Educational explanation shown after answering */
  explanation: string
  /** Optional link to relevant app page for deeper learning */
  learnMorePath?: string
  /** Personas that this question is relevant for */
  personas: string[]
}

export interface QuizCategoryMeta {
  id: QuizCategory
  label: string
  description: string
  icon: string
  questionCount: number
}

export interface QuizSessionState {
  selectedCategories: QuizCategory[]
  questions: QuizQuestion[]
  currentIndex: number
  answers: Record<string, string | string[]>
  results: Record<string, boolean>
  hasSubmittedCurrent: boolean
  isComplete: boolean
  startedAt: number
}

export interface CategoryScore {
  correct: number
  total: number
  percentage: number
}

export interface QuizScoreSummary {
  overall: CategoryScore
  byCategory: Partial<Record<QuizCategory, CategoryScore>>
  byDifficulty: Record<string, CategoryScore>
  timeSpentSeconds: number
}

export type QuizMode = 'quick' | 'full' | 'category'
