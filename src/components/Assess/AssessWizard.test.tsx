import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { AssessWizard } from './AssessWizard'
import '@testing-library/jest-dom'

// Mock framer-motion
vi.mock(
  'framer-motion',
  async () => (await import('../../test/mocks/framer-motion')).framerMotionMock
)

// Mock timelineData so country step renders without CSV loading issues
vi.mock('../../data/timelineData', () => ({
  timelineData: [
    { countryName: 'United States', flagCode: 'us', bodies: [] },
    { countryName: 'Germany', flagCode: 'de', bodies: [] },
  ],
  transformToGanttData: () => [],
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
  cryptoUnknown: false,
  dataSensitivity: [] as string[],
  sensitivityUnknown: false,
  complianceRequirements: [] as string[],
  complianceUnknown: false,
  migrationStatus: '' as string,
  cryptoUseCases: [] as string[],
  useCasesUnknown: false,
  dataRetention: [] as string[],
  retentionUnknown: false,
  credentialLifetime: [] as string[],
  credentialLifetimeUnknown: false,
  systemCount: '' as string,
  teamSize: '' as string,
  cryptoAgility: '' as string,
  infrastructure: [] as string[],
  infrastructureUnknown: false,
  vendorDependency: '' as string,
  vendorUnknown: false,
  timelinePressure: '' as string,
  isComplete: false,
  lastResult: null,
  lastWizardUpdate: null,
  setStep: vi.fn(),
  setAssessmentMode: vi.fn(),
  setIndustry: vi.fn(),
  setCountry: vi.fn(),
  toggleCrypto: vi.fn(),
  setCryptoUnknown: vi.fn(),
  toggleDataSensitivity: vi.fn(),
  setSensitivityUnknown: vi.fn(),
  toggleCompliance: vi.fn(),
  setComplianceUnknown: vi.fn(),
  setMigrationStatus: vi.fn(),
  toggleCryptoUseCase: vi.fn(),
  setUseCasesUnknown: vi.fn(),
  toggleDataRetention: vi.fn(),
  setRetentionUnknown: vi.fn(),
  toggleCredentialLifetime: vi.fn(),
  setCredentialLifetimeUnknown: vi.fn(),
  setSystemCount: vi.fn(),
  setTeamSize: vi.fn(),
  setCryptoAgility: vi.fn(),
  toggleInfrastructure: vi.fn(),
  setInfrastructureUnknown: vi.fn(),
  setVendorDependency: vi.fn(),
  setVendorUnknown: vi.fn(),
  setTimelinePressure: vi.fn(),
  markComplete: vi.fn(),
  setResult: vi.fn(),
  editFromStep: vi.fn(),
  reset: vi.fn(),
  getInput: vi.fn(() => null),
}

vi.mock('../../store/useAssessmentStore', () => ({
  useAssessmentStore: (selector?: (s: typeof mockStore) => unknown) =>
    selector ? selector(mockStore) : mockStore,
}))

describe('AssessWizard', () => {
  const onComplete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockStore.currentStep = 0
    mockStore.industry = ''
    mockStore.country = ''
    mockStore.currentCrypto = []
    mockStore.cryptoUnknown = false
    mockStore.dataSensitivity = []
    mockStore.sensitivityUnknown = false
    mockStore.complianceRequirements = []
    mockStore.complianceUnknown = false
    mockStore.migrationStatus = ''
    mockStore.cryptoUseCases = []
    mockStore.useCasesUnknown = false
    mockStore.dataRetention = []
    mockStore.retentionUnknown = false
    mockStore.credentialLifetime = []
    mockStore.credentialLifetimeUnknown = false
    mockStore.systemCount = ''
    mockStore.teamSize = ''
    mockStore.cryptoAgility = ''
    mockStore.infrastructure = []
    mockStore.infrastructureUnknown = false
    mockStore.vendorDependency = ''
    mockStore.vendorUnknown = false
    mockStore.timelinePressure = ''
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('step indicator', () => {
    it('renders progress group with 14 step labels', () => {
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
      expect(screen.getByText('Vendors')).toBeInTheDocument()
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

    it('renders algorithm selection', () => {
      render(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByText('What cryptography do you use today?')).toBeInTheDocument()
      expect(screen.getByRole('group', { name: 'Algorithm selection' })).toBeInTheDocument()
    })

    it('calls toggleCrypto when an algorithm is clicked', () => {
      render(<AssessWizard onComplete={onComplete} />)
      fireEvent.click(screen.getByRole('button', { name: /RSA-2048/ }))
      expect(mockStore.toggleCrypto).toHaveBeenCalledWith('RSA-2048')
    })

    it('disables Next when no algorithms selected', () => {
      render(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByRole('button', { name: /Next/ })).toBeDisabled()
    })

    it('enables Next when algorithms are selected', () => {
      mockStore.currentCrypto = ['RSA-2048']
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

    it('renders compliance framework options', () => {
      render(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByText(/Which compliance frameworks/)).toBeInTheDocument()
      // With no industry selected the universal group renders
      expect(
        screen.getByRole('group', { name: 'Universal compliance frameworks' })
      ).toBeInTheDocument()
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

  describe('step 13: Timeline Pressure', () => {
    beforeEach(() => {
      mockStore.currentStep = 13
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
    it('renders universal frameworks only when no industry config matches', () => {
      mockStore.currentStep = 4
      mockStore.industry = 'Other'
      render(<AssessWizard onComplete={onComplete} />)
      // Universal frameworks should be visible
      expect(screen.getByText('FIPS 140-3')).toBeInTheDocument()
      // No industry banner since no industry-specific frameworks
      expect(screen.queryByText(/Showing frameworks commonly required/)).not.toBeInTheDocument()
    })

    it('shows only universal section with no industry divider for empty industry', () => {
      mockStore.currentStep = 4
      mockStore.industry = ''
      render(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByText('FIPS 140-3')).toBeInTheDocument()
      expect(screen.queryByText('Universal frameworks')).not.toBeInTheDocument()
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

  describe('step 11: Infrastructure', () => {
    beforeEach(() => {
      mockStore.currentStep = 11
    })

    it('renders infrastructure options', () => {
      render(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByText(/What infrastructure affects your cryptography/)).toBeInTheDocument()
    })

    it('allows proceeding without selecting infrastructure (it is optional)', () => {
      render(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByRole('button', { name: /Next/ })).toBeEnabled()
    })

    it('calls toggleInfrastructure when an option is clicked', () => {
      render(<AssessWizard onComplete={onComplete} />)
      fireEvent.click(screen.getByRole('button', { name: /^Cloud KMS/ }))
      expect(mockStore.toggleInfrastructure).toHaveBeenCalledWith('Cloud KMS (AWS, Azure, GCP)')
    })
  })

  describe('step 12: Vendor Dependency', () => {
    beforeEach(() => {
      mockStore.currentStep = 12
    })

    it('renders vendor dependency options', () => {
      render(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByText(/How do you manage cryptographic dependencies/)).toBeInTheDocument()
    })

    it('disables Next when no vendor dependency is selected', () => {
      render(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByRole('button', { name: /Next/ })).toBeDisabled()
    })

    it('enables Next when vendor dependency is selected', () => {
      mockStore.vendorDependency = 'heavy-vendor'
      render(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByRole('button', { name: /Next/ })).toBeEnabled()
    })

    it('calls setVendorDependency when an option is clicked', () => {
      render(<AssessWizard onComplete={onComplete} />)
      fireEvent.click(screen.getByRole('radio', { name: /^Mixed/ }))
      expect(mockStore.setVendorDependency).toHaveBeenCalledWith('mixed')
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

      // 12. Infrastructure
      mockStore.infrastructure = ['Cloud Storage']
      rerender(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByText(/What infrastructure affects your cryptography/)).toBeInTheDocument()
      goNext()

      // 13. Vendors
      mockStore.vendorDependency = 'in-house'
      rerender(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByText(/How do you manage cryptographic dependencies/)).toBeInTheDocument()
      goNext()

      // 14. Timeline
      mockStore.timelinePressure = 'no-deadline'
      rerender(<AssessWizard onComplete={onComplete} />)
      expect(screen.getByText(/Do you have a migration deadline/)).toBeInTheDocument()

      // Ensure Generate Report is enabled
      expect(screen.getByRole('button', { name: 'Generate Report' })).toBeEnabled()
    })
  })
})
