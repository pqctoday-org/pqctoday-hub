// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { AssessWizard } from './AssessWizard'
import '@testing-library/jest-dom'

// Mock framer-motion
vi.mock(
  'framer-motion',
  async () => (await import('../../test/mocks/framer-motion')).framerMotionMock
)

// Mock react-router-dom Link + useSearchParams — wizard steps use Link for contextual exploration links
vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }: { children: React.ReactNode; to: string }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
}))

// Mock algorithmsData so Step3Crypto renders without actual CSV loading
vi.mock('../../data/algorithmsData', () => ({
  loadAlgorithmsData: vi.fn().mockResolvedValue([
    {
      classical: 'RSA',
      keySize: '2048-bit',
      pqc: 'ML-KEM-512',
      function: 'Encryption/KEM',
      deprecationDate: '2030',
      standardizationDate: '2024',
    },
    {
      classical: 'ECDH (P-256)',
      keySize: '256-bit',
      pqc: 'ML-KEM-512',
      function: 'Encryption/KEM',
      deprecationDate: '2035',
      standardizationDate: '2024',
    },
    {
      classical: 'ECDSA (P-256)',
      keySize: '256-bit',
      pqc: 'ML-DSA-44',
      function: 'Signature',
      deprecationDate: '2035',
      standardizationDate: '2024',
    },
    {
      classical: 'Ed25519',
      keySize: '256-bit',
      pqc: 'ML-DSA-44',
      function: 'Signature',
      deprecationDate: '2035',
      standardizationDate: '2024',
    },
    {
      classical: 'AES-128',
      keySize: '128-bit',
      pqc: 'AES-256',
      function: 'Symmetric',
      deprecationDate: '2030',
      standardizationDate: '2001',
    },
    {
      classical: 'SHA-256',
      keySize: '256-bit',
      pqc: 'SHA3-256',
      function: 'Hash',
      deprecationDate: 'N/A',
      standardizationDate: '2015',
    },
  ]),
}))

// Mock pqcAlgorithmsData for any remaining imports in the wizard and other steps
vi.mock('../../data/pqcAlgorithmsData', () => ({
  loadPQCAlgorithmsData: vi.fn().mockResolvedValue([]),
  isClassical: vi.fn().mockReturnValue(false),
  isPQC: vi.fn().mockReturnValue(false),
  isHash: vi.fn().mockReturnValue(false),
  getPerformanceCategory: vi.fn().mockReturnValue('Moderate'),
  getSecurityLevelColor: vi.fn().mockReturnValue(''),
  getPerformanceColor: vi.fn().mockReturnValue(''),
}))

// Mock timelineData so country step renders without CSV loading issues
vi.mock('../../data/timelineData', () => ({
  timelineData: [
    { countryName: 'United States', flagCode: 'us', bodies: [] },
    { countryName: 'Germany', flagCode: 'de', bodies: [] },
  ],
  transformToGanttData: () => [],
}))

// Mock complianceData — Step5Compliance imports complianceFrameworks directly
vi.mock('../../data/complianceData', () => ({
  complianceFrameworks: [
    {
      id: 'FIPS-140-3',
      label: 'FIPS 140-3',
      description: 'NIST cryptographic module validation',
      industries: ['Government & Defense', 'Finance & Banking', 'Technology'],
      countries: ['United States', 'Canada'],
      requiresPQC: true,
      deadline: '2030 (NIST IR 8547 deprecation target)',
      notes: 'PQC algorithms in FIPS scope',
      enforcementBody: 'NIST',
      libraryRefs: [],
      timelineRefs: [],
      bodyType: 'certification_body',
      website: 'https://csrc.nist.gov',
    },
    {
      id: 'SOC-2',
      label: 'SOC 2',
      description: 'Service Organization Control audit framework',
      industries: ['Technology', 'Finance & Banking', 'Healthcare'],
      countries: [],
      requiresPQC: false,
      deadline: 'Ongoing',
      notes: 'No explicit PQC timeline',
      enforcementBody: 'AICPA',
      libraryRefs: [],
      timelineRefs: [],
      bodyType: 'compliance_framework',
    },
    {
      id: 'NIST',
      label: 'NIST',
      description: 'National Institute of Standards and Technology',
      industries: ['Government & Defense', 'Finance & Banking', 'Technology'],
      countries: ['United States'],
      requiresPQC: true,
      deadline: 'Ongoing',
      notes: 'Primary PQC standardization body',
      enforcementBody: 'NIST',
      libraryRefs: [],
      timelineRefs: [],
      bodyType: 'standardization_body',
    },
  ],
  complianceAsIndustryConfigs: [],
  complianceDB: {
    'FIPS 140-3': {
      requiresPQC: true,
      deadline: '2030 (NIST IR 8547 deprecation target)',
      notes: 'PQC algorithms in FIPS scope',
    },
    'SOC 2': { requiresPQC: false, deadline: 'Ongoing', notes: 'No explicit PQC timeline' },
    NIST: { requiresPQC: true, deadline: 'Ongoing', notes: 'Primary PQC standardization body' },
  },
  complianceMetadata: null,
}))

// Mock industryAssessConfig — default empty (backward-compat); overridden per describe block
vi.mock('../../data/industryAssessConfig', () => ({
  industryComplianceConfigs: [],
  industryUseCaseConfigs: [],
  industryRetentionConfigs: [],
  universalRetentionConfigs: [
    {
      id: 'under-1y',
      label: 'Less than 1 year',
      description: 'Data that needs to stay confidential for under a year',
      industries: [],
      retentionYears: 1,
    },
    {
      id: '1-5y',
      label: '1-5 years',
      description: 'Data with a short to medium confidentiality window',
      industries: [],
      retentionYears: 5,
    },
    {
      id: '5-10y',
      label: '5-10 years',
      description: 'Data requiring a medium to long-term confidentiality window',
      industries: [],
      retentionYears: 10,
    },
    {
      id: '10-25y',
      label: '10-25 years',
      description: 'Data requiring long-term confidentiality protection',
      industries: [],
      retentionYears: 25,
    },
    {
      id: '25-plus',
      label: '25+ years',
      description: 'Data with very long or archival confidentiality requirements',
      industries: [],
      retentionYears: 30,
    },
    {
      id: 'indefinite',
      label: 'Indefinite',
      description: 'Data with no defined expiration of confidentiality',
      industries: [],
      retentionYears: 50,
    },
  ],
  industrySensitivityConfigs: [],
  metadata: null,
  getIndustryConfigs: () => [],
}))

const mockStore = {
  currentStep: 0,
  assessmentMode: null,
  industry: '',
  country: '',
  currentCrypto: [] as string[],
  currentCryptoCategories: [] as string[],
  cryptoUnknown: false,
  dataSensitivity: [] as string[],
  sensitivityUnknown: false,
  complianceRequirements: [] as string[],
  complianceUnknown: false,
  migrationStatus: '' as string,
  migrationUnknown: false,
  cryptoUseCases: [] as string[],
  useCasesUnknown: false,
  dataRetention: [] as string[],
  retentionUnknown: false,
  credentialLifetime: [] as string[],
  credentialLifetimeUnknown: false,
  systemCount: '' as string,
  teamSize: '' as string,
  cryptoAgility: '' as string,
  agilityUnknown: false,
  infrastructure: [] as string[],
  infrastructureUnknown: false,
  infrastructureSubCategories: {} as Record<string, string[]>,
  vendorDependency: '' as string,
  vendorUnknown: false,
  timelinePressure: '' as string,
  timelineUnknown: false,
  assessmentStatus: 'not-started' as const,
  lastResult: null,
  lastWizardUpdate: null,
  completedAt: null,
  lastModifiedAt: null,
  previousRiskScore: null,
  setStep: vi.fn(),
  setAssessmentMode: vi.fn(),
  setIndustry: vi.fn(),
  setCountry: vi.fn(),
  toggleCrypto: vi.fn(),
  toggleCryptoCategory: vi.fn(),
  setCryptoUnknown: vi.fn(),
  toggleDataSensitivity: vi.fn(),
  setSensitivityUnknown: vi.fn(),
  toggleCompliance: vi.fn(),
  setComplianceUnknown: vi.fn(),
  setMigrationStatus: vi.fn(),
  setMigrationUnknown: vi.fn(),
  toggleCryptoUseCase: vi.fn(),
  setUseCasesUnknown: vi.fn(),
  toggleDataRetention: vi.fn(),
  setRetentionUnknown: vi.fn(),
  toggleCredentialLifetime: vi.fn(),
  setCredentialLifetimeUnknown: vi.fn(),
  setSystemCount: vi.fn(),
  setTeamSize: vi.fn(),
  setCryptoAgility: vi.fn(),
  setAgilityUnknown: vi.fn(),
  toggleInfrastructure: vi.fn(),
  setInfrastructureUnknown: vi.fn(),
  setInfrastructureSubCategory: vi.fn(),
  setVendorDependency: vi.fn(),
  setVendorUnknown: vi.fn(),
  setTimelinePressure: vi.fn(),
  setTimelineUnknown: vi.fn(),
  markComplete: vi.fn(),
  setResult: vi.fn(),
  editFromStep: vi.fn(),
  reset: vi.fn(),
  getInput: vi.fn(() => null),
}

vi.mock('../../store/useAssessmentStore', () => {
  const hook = (selector?: (s: typeof mockStore) => unknown) =>
    selector ? selector(mockStore) : mockStore
  hook.getState = () => mockStore
  return { useAssessmentStore: hook }
})

const personaStoreState: Record<string, unknown> = {
  selectedIndustry: null,
  selectedRegion: null,
  selectedPersona: null,
  experienceLevel: null,
}

vi.mock('../../store/usePersonaStore', () => ({
  usePersonaStore: (selector?: (s: Record<string, unknown>) => unknown) =>
    selector ? selector(personaStoreState) : personaStoreState,
}))

// jsdom does not implement scrollIntoView
Element.prototype.scrollIntoView = vi.fn()

describe('AssessWizard', () => {
  const onComplete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockStore.currentStep = 0
    mockStore.industry = ''
    mockStore.country = ''
    mockStore.currentCrypto = []
    mockStore.currentCryptoCategories = []
    mockStore.cryptoUnknown = false
    mockStore.dataSensitivity = []
    mockStore.sensitivityUnknown = false
    mockStore.complianceRequirements = []
    mockStore.complianceUnknown = false
    mockStore.migrationStatus = ''
    mockStore.migrationUnknown = false
    mockStore.cryptoUseCases = []
    mockStore.useCasesUnknown = false
    mockStore.dataRetention = []
    mockStore.retentionUnknown = false
    mockStore.credentialLifetime = []
    mockStore.credentialLifetimeUnknown = false
    mockStore.systemCount = ''
    mockStore.teamSize = ''
    mockStore.cryptoAgility = ''
    mockStore.agilityUnknown = false
    mockStore.infrastructure = []
    mockStore.infrastructureUnknown = false
    mockStore.infrastructureSubCategories = {}
    mockStore.vendorDependency = ''
    mockStore.vendorUnknown = false
    mockStore.timelinePressure = ''
    mockStore.timelineUnknown = false
    // Reset persona store state
    personaStoreState.selectedPersona = null
    personaStoreState.selectedIndustry = null
    personaStoreState.selectedRegion = null
    personaStoreState.experienceLevel = null
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('step indicator', () => {
    it('renders progress group with 13 step labels', () => {
      render(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByRole('group', { name: 'Assessment progress' })).toBeInTheDocument()
      expect(screen.getByText('Industry')).toBeInTheDocument()
      expect(screen.getByText('Country')).toBeInTheDocument()
      expect(screen.getByText('Crypto')).toBeInTheDocument()
      expect(screen.getByText('Sensitivity')).toBeInTheDocument()
      expect(screen.getByText('Compliance')).toBeInTheDocument()
      expect(screen.getByText('Migration')).toBeInTheDocument()
      expect(screen.getByText('Use Cases')).toBeInTheDocument()
      expect(screen.getByText('Retention')).toBeInTheDocument()
      expect(screen.getByText('Credential')).toBeInTheDocument()
      expect(screen.getByText('Scale')).toBeInTheDocument()
      expect(screen.getByText('Agility')).toBeInTheDocument()
      expect(screen.getByText('Infra')).toBeInTheDocument()
      expect(screen.queryByText('Vendors')).not.toBeInTheDocument()
      expect(screen.getByText('Timeline')).toBeInTheDocument()
    })

    it('marks the current step with aria-current', () => {
      mockStore.currentStep = 2
      render(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByLabelText(/Step 3.*current/)).toHaveAttribute('aria-current', 'step')
    })

    it('shows checkmark for completed steps', () => {
      mockStore.currentStep = 2
      render(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByLabelText(/Step 1.*completed/)).toHaveTextContent('✓')
      expect(screen.getByLabelText(/Step 2.*completed/)).toHaveTextContent('✓')
    })
  })

  describe('step 1: Industry', () => {
    it('renders industry selection', () => {
      render(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByText('What industry are you in?')).toBeInTheDocument()
      expect(screen.getByRole('radiogroup', { name: 'Industry selection' })).toBeInTheDocument()
    })

    it('renders industry options as radio buttons', () => {
      render(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByRole('radio', { name: 'Finance & Banking' })).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: 'Government & Defense' })).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: 'Technology' })).toBeInTheDocument()
    })

    it('calls setIndustry when an option is clicked', () => {
      render(<AssessWizard onComplete={onComplete} />)
      fireEvent.click(screen.getByRole('radio', { name: 'Technology' }))
      expect(mockStore.setIndustry).toHaveBeenCalledWith('Technology')
    })

    it('disables Next when no industry selected', () => {
      render(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByRole('button', { name: /Next/ })).toBeDisabled()
    })

    it('enables Next when industry is selected', () => {
      mockStore.industry = 'Technology'
      render(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByRole('button', { name: /Next/ })).toBeEnabled()
    })
  })

  describe('step 2: Country', () => {
    beforeEach(() => {
      mockStore.currentStep = 1
    })

    it('renders country selection', () => {
      render(<AssessWizard onComplete={onComplete} />)
      expect(
        screen.getByText(/Which jurisdiction applies to your organization/)
      ).toBeInTheDocument()
      expect(screen.getByRole('radiogroup', { name: 'Country selection' })).toBeInTheDocument()
    })

    it('renders country options from timeline data', () => {
      render(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByRole('radio', { name: /Germany/ })).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: /United States/ })).toBeInTheDocument()
    })

    it('calls setCountry when a country is clicked', () => {
      render(<AssessWizard onComplete={onComplete} />)
      fireEvent.click(screen.getByRole('radio', { name: /Germany/ }))
      expect(mockStore.setCountry).toHaveBeenCalledWith('Germany')
    })

    it('disables Next when no country selected', () => {
      render(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByRole('button', { name: /Next/ })).toBeDisabled()
    })

    it('enables Next when country is selected', () => {
      mockStore.country = 'Germany'
      render(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByRole('button', { name: /Next/ })).toBeEnabled()
    })
  })

  describe('step 3: Crypto', () => {
    beforeEach(() => {
      mockStore.currentStep = 2
    })

    it('renders category selection', () => {
      render(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByText('What cryptography do you use today?')).toBeInTheDocument()
      expect(
        screen.getByRole('group', { name: 'Algorithm category selection' })
      ).toBeInTheDocument()
    })

    it('calls toggleCryptoCategory when a category is clicked', () => {
      render(<AssessWizard onComplete={onComplete} />)
      fireEvent.click(screen.getByRole('button', { name: /Key Exchange/ }))
      expect(mockStore.toggleCryptoCategory).toHaveBeenCalledWith('Key Exchange')
    })

    it('disables Next when no categories selected', () => {
      render(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByRole('button', { name: /Next/ })).toBeDisabled()
    })

    it('enables Next when a category is selected', () => {
      mockStore.currentCryptoCategories = ['Signatures']
      render(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByRole('button', { name: /Next/ })).toBeEnabled()
    })

    it('shows quantum-vulnerable warning text', () => {
      render(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByText(/Quantum-vulnerable algorithm/)).toBeInTheDocument()
    })
  })

  describe('step 4: Sensitivity', () => {
    beforeEach(() => {
      mockStore.currentStep = 3
    })

    it('renders sensitivity options', () => {
      render(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByText('How sensitive is your data?')).toBeInTheDocument()
      expect(screen.getByRole('group', { name: 'Data sensitivity levels' })).toBeInTheDocument()
    })

    it('renders all four sensitivity levels as toggle buttons', () => {
      render(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByRole('button', { name: /^Low/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /^Medium/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /^High/ })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /^Critical/ })).toBeInTheDocument()
    })

    it('calls toggleDataSensitivity when an option is clicked', () => {
      render(<AssessWizard onComplete={onComplete} />)
      fireEvent.click(screen.getByRole('button', { name: /^Critical/ }))
      expect(mockStore.toggleDataSensitivity).toHaveBeenCalledWith('critical')
    })

    it('disables Next when no sensitivity selected', () => {
      render(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByRole('button', { name: /Next/ })).toBeDisabled()
    })

    it('enables Next when at least one sensitivity is selected', () => {
      mockStore.dataSensitivity = ['high']
      render(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByRole('button', { name: /Next/ })).toBeEnabled()
    })

    it('shows HNDL explanation', () => {
      render(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByText(/Harvest Now, Decrypt Later/)).toBeInTheDocument()
    })
  })

  describe('step 5: Compliance', () => {
    beforeEach(() => {
      mockStore.currentStep = 4
    })

    it('renders compliance framework options grouped by bodyType', () => {
      render(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByText(/Which compliance frameworks/)).toBeInTheDocument()
      // Frameworks grouped by bodyType — certification schemes and compliance frameworks visible
      expect(screen.getByRole('group', { name: 'Certification Schemes' })).toBeInTheDocument()
      expect(screen.getByRole('group', { name: 'Compliance Frameworks' })).toBeInTheDocument()
    })

    it('calls toggleCompliance when a framework is clicked', () => {
      render(<AssessWizard onComplete={onComplete} />)
      fireEvent.click(screen.getByRole('button', { name: /FIPS 140-3/ }))
      expect(mockStore.toggleCompliance).toHaveBeenCalledWith('FIPS 140-3')
    })

    it('enables Next even with no compliance selected (optional step)', () => {
      render(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByRole('button', { name: /Next/ })).toBeEnabled()
    })
  })

  describe('step 6: Migration', () => {
    beforeEach(() => {
      mockStore.currentStep = 5
    })

    it('renders migration status options', () => {
      render(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByRole('heading', { name: /PQC migration status/ })).toBeInTheDocument()
      expect(screen.getByRole('radiogroup', { name: 'Migration status' })).toBeInTheDocument()
    })

    it('disables Next when no migration status selected', () => {
      render(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByRole('button', { name: /Next/ })).toBeDisabled()
    })

    it('enables Next when migration status is selected', () => {
      mockStore.migrationStatus = 'not-started'
      render(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByRole('button', { name: /Next/ })).toBeEnabled()
    })
  })

  describe('step 12: Timeline Pressure', () => {
    beforeEach(() => {
      mockStore.currentStep = 12
    })

    it('renders timeline pressure options', () => {
      render(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByText(/Do you have a migration deadline/)).toBeInTheDocument()
    })

    it('shows Generate Report button instead of Next', () => {
      mockStore.timelinePressure = 'no-deadline'
      render(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByRole('button', { name: 'Generate Report' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /^Next$/ })).not.toBeInTheDocument()
    })

    it('disables Generate Report when no timeline pressure selected', () => {
      render(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByRole('button', { name: 'Generate Report' })).toBeDisabled()
    })

    it('shows loading state and calls callbacks after clicking Generate Report', () => {
      vi.useFakeTimers()
      mockStore.timelinePressure = 'no-deadline'
      render(<AssessWizard onComplete={onComplete} />)

      fireEvent.click(screen.getByRole('button', { name: 'Generate Report' }))
      expect(screen.getByText('Generating...')).toBeInTheDocument()

      act(() => {
        vi.advanceTimersByTime(300)
      })

      expect(mockStore.markComplete).toHaveBeenCalledOnce()
      expect(onComplete).toHaveBeenCalledOnce()
    })

    it('calls setTimelinePressure when an option is clicked', () => {
      render(<AssessWizard onComplete={onComplete} />)
      fireEvent.click(screen.getByRole('radio', { name: /^No Specific Deadline/ }))
      expect(mockStore.setTimelinePressure).toHaveBeenCalledWith('no-deadline')
    })
  })

  describe('navigation', () => {
    it('disables Previous button on first step', () => {
      render(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByRole('button', { name: /Previous/ })).toBeDisabled()
    })

    it('calls setStep(1) on Next click from step 0', () => {
      mockStore.industry = 'Technology'
      render(<AssessWizard onComplete={onComplete} />)
      fireEvent.click(screen.getByRole('button', { name: /Next/ }))
      expect(mockStore.setStep).toHaveBeenCalledWith(1)
    })

    it('calls setStep with previous step on Previous click', () => {
      mockStore.currentStep = 2
      render(<AssessWizard onComplete={onComplete} />)
      fireEvent.click(screen.getByRole('button', { name: /Previous/ }))
      expect(mockStore.setStep).toHaveBeenCalledWith(1)
    })

    it('enables Previous button after step 0', () => {
      mockStore.currentStep = 1
      render(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByRole('button', { name: /Previous/ })).toBeEnabled()
    })

    it('calls reset when Reset button is clicked', () => {
      render(<AssessWizard onComplete={onComplete} />)
      fireEvent.click(screen.getByRole('button', { name: /Reset/ }))
      expect(mockStore.reset).toHaveBeenCalledOnce()
    })
  })

  describe('step 5: compliance — industry-aware', () => {
    it('renders frameworks grouped by bodyType when industry is Other', () => {
      mockStore.currentStep = 4
      mockStore.industry = 'Other'
      render(<AssessWizard onComplete={onComplete} />)
      // All frameworks visible (universal) grouped by bodyType
      expect(screen.getByText('FIPS 140-3')).toBeInTheDocument()
      expect(screen.getByText('SOC 2')).toBeInTheDocument()
    })

    it('shows frameworks for empty industry (all shown)', () => {
      mockStore.currentStep = 4
      mockStore.industry = ''
      render(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByText('FIPS 140-3')).toBeInTheDocument()
      expect(screen.getByText('SOC 2')).toBeInTheDocument()
    })

    it('filters frameworks by industry', () => {
      mockStore.currentStep = 4
      mockStore.industry = 'Healthcare'
      render(<AssessWizard onComplete={onComplete} />)
      // SOC 2 includes Healthcare in its 3-industry list → shown as universal
      expect(screen.getByText('SOC 2')).toBeInTheDocument()
    })
  })

  describe('step 7: use cases — industry-aware', () => {
    it('renders general use cases only when no industry config matches', () => {
      mockStore.currentStep = 6
      mockStore.industry = 'Other'
      render(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByText('TLS/HTTPS')).toBeInTheDocument()
      expect(screen.queryByText(/Showing use cases common in/)).not.toBeInTheDocument()
    })
  })

  describe('step 8: retention — industry-aware', () => {
    it('renders universal options only when no industry config matches', () => {
      mockStore.currentStep = 7
      mockStore.industry = 'Other'
      render(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByText('Less than 1 year')).toBeInTheDocument()
      expect(screen.queryByText(/Showing retention periods common in/)).not.toBeInTheDocument()
    })

    it('all universal retention options are present for empty industry', () => {
      mockStore.currentStep = 7
      mockStore.industry = ''
      render(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByText('Less than 1 year')).toBeInTheDocument()
      expect(screen.getByText('1-5 years')).toBeInTheDocument()
      expect(screen.getByText('5-10 years')).toBeInTheDocument()
      expect(screen.getByText('Indefinite')).toBeInTheDocument()
    })
  })

  describe('step 9: Org Scale', () => {
    beforeEach(() => {
      mockStore.currentStep = 9
    })

    it('renders organization scale options', () => {
      render(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByText(/What is your organizational scale/)).toBeInTheDocument()
      expect(screen.getByRole('radiogroup', { name: 'Number of systems' })).toBeInTheDocument()
    })

    it('disables Next when no scale is selected', () => {
      render(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByRole('button', { name: /Next/ })).toBeDisabled()
    })

    it('enables Next when scale and team size are selected', () => {
      mockStore.systemCount = '100-200'
      mockStore.teamSize = '1-10'
      render(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByRole('button', { name: /Next/ })).toBeEnabled()
    })

    it('calls setSystemCount when an option is clicked', () => {
      render(<AssessWizard onComplete={onComplete} />)
      fireEvent.click(screen.getByRole('radio', { name: '51-200 systems' }))
      expect(mockStore.setSystemCount).toHaveBeenCalledWith('51-200')
    })

    it('calls setTeamSize when an option is clicked', () => {
      render(<AssessWizard onComplete={onComplete} />)
      fireEvent.click(screen.getByRole('radio', { name: '51-200 engineers' }))
      expect(mockStore.setTeamSize).toHaveBeenCalledWith('51-200')
    })
  })

  describe('step 10: Crypto Agility', () => {
    beforeEach(() => {
      mockStore.currentStep = 10
    })

    it('renders crypto agility options', () => {
      render(<AssessWizard onComplete={onComplete} />)
      expect(
        screen.getByText(/How easily can you swap cryptographic algorithms/)
      ).toBeInTheDocument()
    })

    it('disables Next when no agility is selected', () => {
      render(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByRole('button', { name: /Next/ })).toBeDisabled()
    })

    it('enables Next when agility is selected', () => {
      mockStore.cryptoAgility = 'hardcoded'
      render(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByRole('button', { name: /Next/ })).toBeEnabled()
    })

    it('calls setCryptoAgility when an option is clicked', () => {
      render(<AssessWizard onComplete={onComplete} />)
      fireEvent.click(screen.getByRole('radio', { name: /^Partially Abstracted/ }))
      expect(mockStore.setCryptoAgility).toHaveBeenCalledWith('partially-abstracted')
    })
  })

  describe('step 11: Infrastructure + Vendor Dependency (merged)', () => {
    beforeEach(() => {
      mockStore.currentStep = 11
    })

    it('renders infrastructure options', () => {
      render(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByText(/What infrastructure handles your cryptography/)).toBeInTheDocument()
    })

    it('renders vendor dependency options in the same step', () => {
      render(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByText(/How do you manage cryptographic dependencies/)).toBeInTheDocument()
    })

    it('allows proceeding without selecting infrastructure (it is optional)', () => {
      render(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByRole('button', { name: /Next/ })).toBeEnabled()
    })

    it('calls toggleInfrastructure when a layer card is clicked', () => {
      render(<AssessWizard onComplete={onComplete} />)
      fireEvent.click(screen.getByRole('button', { name: 'Cloud' }))
      expect(mockStore.toggleInfrastructure).toHaveBeenCalledWith('Cloud')
    })

    it('calls setVendorDependency when an option is clicked', () => {
      render(<AssessWizard onComplete={onComplete} />)
      fireEvent.click(screen.getByRole('radio', { name: /^Mixed/ }))
      expect(mockStore.setVendorDependency).toHaveBeenCalledWith('mixed')
    })
  })

  describe('proficiency-based auto-suggest', () => {
    it('proficiency "new" auto-suggests unknown on sensitivity step (general)', () => {
      personaStoreState.experienceLevel = 'new'
      personaStoreState.selectedPersona = 'developer'
      mockStore.currentStep = 3 // sensitivity
      render(<AssessWizard onComplete={onComplete} />)
      expect(mockStore.setSensitivityUnknown).toHaveBeenCalledWith(true)
    })

    it('proficiency "basics" auto-suggests unknown on crypto step (technical)', () => {
      personaStoreState.experienceLevel = 'basics'
      personaStoreState.selectedPersona = 'developer'
      mockStore.currentStep = 2 // crypto
      render(<AssessWizard onComplete={onComplete} />)
      expect(mockStore.setCryptoUnknown).toHaveBeenCalledWith(true)
    })

    it('proficiency "basics" does NOT auto-suggest on sensitivity step (general)', () => {
      personaStoreState.experienceLevel = 'basics'
      personaStoreState.selectedPersona = 'developer'
      mockStore.currentStep = 3 // sensitivity
      render(<AssessWizard onComplete={onComplete} />)
      expect(mockStore.setSensitivityUnknown).not.toHaveBeenCalled()
    })

    it('proficiency "expert" does NOT auto-suggest on any step', () => {
      personaStoreState.experienceLevel = 'expert'
      personaStoreState.selectedPersona = 'developer'
      mockStore.currentStep = 2 // crypto
      render(<AssessWizard onComplete={onComplete} />)
      expect(mockStore.setCryptoUnknown).not.toHaveBeenCalled()
    })

    it('executive persona auto-suggests on crypto regardless of proficiency', () => {
      personaStoreState.selectedPersona = 'executive'
      personaStoreState.experienceLevel = null
      mockStore.currentStep = 2 // crypto
      render(<AssessWizard onComplete={onComplete} />)
      expect(mockStore.setCryptoUnknown).toHaveBeenCalledWith(true)
    })

    it('does not auto-suggest when user already selected a value', () => {
      personaStoreState.experienceLevel = 'new'
      personaStoreState.selectedPersona = 'developer'
      mockStore.currentStep = 3 // sensitivity
      mockStore.dataSensitivity = ['high'] // already selected
      render(<AssessWizard onComplete={onComplete} />)
      expect(mockStore.setSensitivityUnknown).not.toHaveBeenCalled()
    })
  })

  describe('Wizard Full Traversal', () => {
    it('can traverse from step 0 to step 13 by filling required fields', () => {
      // For this test, reset currentStep
      mockStore.currentStep = 0

      const { rerender } = render(<AssessWizard onComplete={onComplete} />)

      // Navigate forward step by step by simulating the store update
      const goNext = () => {
        mockStore.currentStep += 1
        rerender(<AssessWizard onComplete={onComplete} />)
      }

      // 1. Industry
      mockStore.industry = 'Technology'
      rerender(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByRole('button', { name: /Next/ })).toBeEnabled()
      goNext()

      // 2. Country
      mockStore.country = 'Germany'
      rerender(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByText(/Which jurisdiction applies/)).toBeInTheDocument()
      goNext()

      // 3. Crypto
      mockStore.currentCrypto = ['RSA-2048']
      rerender(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByText(/What cryptography do you use today/)).toBeInTheDocument()
      goNext()

      // 4. Sensitivity
      mockStore.dataSensitivity = ['high']
      rerender(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByText(/How sensitive is your data/)).toBeInTheDocument()
      goNext()

      // 5. Compliance
      mockStore.complianceRequirements = ['FIPS 140-3']
      rerender(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByText(/Which compliance frameworks/)).toBeInTheDocument()
      goNext()

      // 6. Migration Status
      mockStore.migrationStatus = 'not-started'
      rerender(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByRole('radiogroup', { name: 'Migration status' })).toBeInTheDocument()
      goNext()

      // 7. Use Cases
      mockStore.cryptoUseCases = ['TLS/HTTPS']
      rerender(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByText(/Where do you use cryptography/)).toBeInTheDocument()
      goNext()

      // 8. Retention
      mockStore.dataRetention = ['1-5y']
      rerender(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByText(/How long must your data stay confidential/)).toBeInTheDocument()
      goNext()

      // 9. Credential Lifetime
      mockStore.credentialLifetime = ['1-3y']
      rerender(<AssessWizard onComplete={onComplete} />)
      expect(
        screen.getByText(/How long must your digital signatures.*certificates remain trusted/)
      ).toBeInTheDocument()
      goNext()

      // 10. Scale
      mockStore.systemCount = '1-10'
      mockStore.teamSize = '1-10'
      rerender(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByText(/What is your organizational scale/)).toBeInTheDocument()
      goNext()

      // 11. Agility
      mockStore.cryptoAgility = 'hardcoded'
      rerender(<AssessWizard onComplete={onComplete} />)
      expect(
        screen.getByText(/How easily can you swap cryptographic algorithms/)
      ).toBeInTheDocument()
      goNext()

      // 12. Infrastructure + Vendors (merged)
      mockStore.infrastructure = ['Cloud Storage']
      mockStore.vendorDependency = 'in-house'
      rerender(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByText(/What infrastructure handles your cryptography/)).toBeInTheDocument()
      expect(screen.getByText(/How do you manage cryptographic dependencies/)).toBeInTheDocument()
      goNext()

      // 13. Timeline
      mockStore.timelinePressure = 'no-deadline'
      rerender(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByText(/Do you have a migration deadline/)).toBeInTheDocument()

      // Ensure Generate Report is enabled
      expect(screen.getByRole('button', { name: 'Generate Report' })).toBeEnabled()
    })
  })
})
