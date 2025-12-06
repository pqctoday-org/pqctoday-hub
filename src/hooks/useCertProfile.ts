import { useState, useEffect } from 'react'
import type {
  X509Attribute,
  ProfileMetadata,
  ProfileConstraint,
} from '../components/PKILearning/common/types'

// Import Cert profiles
const certProfiles = import.meta.glob('../data/x509_profiles/Cert*.csv', {
  query: '?raw',
  import: 'default',
})

interface UseCertProfileProps {
  initialAttributes: X509Attribute[]
  filterProfileName?: (name: string) => boolean
}

export const useCertProfile = ({ initialAttributes, filterProfileName }: UseCertProfileProps) => {
  const [selectedProfile, setSelectedProfile] = useState<string>('')
  const [availableProfiles, setAvailableProfiles] = useState<string[]>([])
  const [attributes, setAttributes] = useState<X509Attribute[]>(initialAttributes)
  const [profileMetadata, setProfileMetadata] = useState<ProfileMetadata | null>(null)
  const [profileConstraints, setProfileConstraints] = useState<ProfileConstraint[]>([])
  const [loadingError, setLoadingError] = useState<string | null>(null)
  const [log, setLog] = useState<string>('')

  useEffect(() => {
    const profiles = Object.keys(certProfiles)
      .map((path) => {
        return path.split('/').pop() || ''
      })
      .filter((name) => {
        const isCertCsv = name.startsWith('Cert') && name.endsWith('.csv')
        if (!isCertCsv) return false
        return filterProfileName ? filterProfileName(name) : true
      })
    setAvailableProfiles(profiles)
  }, [filterProfileName])

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      // eslint-disable-next-line security/detect-object-injection
      const char = line[i]

      if (char === '"') {
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

  const handleProfileSelect = async (filename: string) => {
    setSelectedProfile(filename)
    setProfileMetadata(null)
    setLoadingError(null)
    if (!filename) return

    try {
      setLog((prev) => prev + `Loading profile: ${filename}...\n`)

      const path = Object.keys(certProfiles).find((p) => p.endsWith(filename))
      if (!path) throw new Error('Profile path not found')

      // eslint-disable-next-line security/detect-object-injection
      const loadProfile = certProfiles[path] as () => Promise<string>
      const content = await loadProfile()

      const lines = content.split('\n').filter((line) => line.trim() !== '')
      if (lines.length < 2) throw new Error('Invalid CSV format')

      // Parse Header
      const headers = parseCSVLine(lines[0])
      const colMap = new Map<string, number>()
      headers.forEach((h, i) => colMap.set(h.trim(), i))

      const getVal = (row: string[], colName: string) => {
        const idx = colMap.get(colName)
        // eslint-disable-next-line security/detect-object-injection
        return idx !== undefined && idx < row.length ? row[idx] : ''
      }

      // Parse Metadata
      const firstRow = parseCSVLine(lines[1])
      const industry = getVal(firstRow, 'Industry')
      const standard = getVal(firstRow, 'Standard')
      const date = getVal(firstRow, 'StandardDate')

      setProfileMetadata({ industry, standard, date })

      // Parse Attributes
      const newAttributes: X509Attribute[] = []
      const newConstraints: ProfileConstraint[] = []

      for (let i = 1; i < lines.length; i++) {
        // eslint-disable-next-line security/detect-object-injection
        const row = parseCSVLine(lines[i])
        const elementType = getVal(row, 'ElementType')

        if (elementType === 'SubjectRDN' || elementType === 'Extension') {
          const name = getVal(row, 'Name')
          const example = getVal(row, 'ExampleValue')
          const description = getVal(row, 'AllowedValuesOrUsage')

          // Separate constraint fields to display them in profile section
          if (name.toLowerCase().includes('constraints')) {
            newConstraints.push({
              name: name,
              value: example,
              description: description,
            })
            continue
          }

          const oid = getVal(row, 'OID')

          const id =
            name === 'commonName'
              ? 'CN'
              : name === 'countryName'
                ? 'C'
                : name === 'organizationName'
                  ? 'O'
                  : name === 'organizationalUnitName'
                    ? 'OU'
                    : name === 'stateOrProvinceName'
                      ? 'ST'
                      : name === 'localityName'
                        ? 'L'
                        : name === 'emailAddress'
                          ? 'emailAddress'
                          : oid

          const label = name
          const criticalVal = getVal(row, 'Critical').toUpperCase()
          const critical =
            elementType === 'SubjectRDN'
              ? criticalVal === '' || criticalVal === 'TRUE'
              : criticalVal === 'TRUE'

          newAttributes.push({
            id: id,
            label: label,
            oid: oid,
            status: critical ? 'mandatory' : 'optional',
            value: example, // Default value from profile
            enabled: critical,
            placeholder: `e.g., ${example}`,
            description: description,
            elementType: elementType,
            source: 'CA',
          })
        }
      }

      // Merge with existing attributes, preserving CSR source and values
      setAttributes((prevAttributes) => {
        return newAttributes.map((newAttr) => {
          // Find if this attribute already exists (from CSR import)
          const existingAttr = prevAttributes.find(
            (prev) => prev.id === newAttr.id || prev.oid === newAttr.oid
          )

          // If it exists and has CSR source, preserve the CSR value and source
          if (existingAttr && existingAttr.source === 'CSR') {
            return {
              ...newAttr,
              value: existingAttr.value, // Keep CSR value
              source: 'CSR', // Keep CSR source
              enabled: true, // Ensure it's enabled since it came from CSR
            }
          }

          // Otherwise use the new profile attribute
          return newAttr
        })
      })
      setProfileConstraints(newConstraints)
      setLog((prev) => prev + `Profile loaded: ${industry} - ${standard} (${date})\n`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setLoadingError(errorMessage)
      setLog((prev) => prev + `Error loading profile: ${errorMessage}\n`)
    }
  }

  const handleAttributeChange = (
    id: string,
    field: keyof X509Attribute,
    value: string | boolean
  ) => {
    setAttributes((prev) =>
      prev.map((attr) => {
        if (attr.id === id) {
          return { ...attr, [field]: value }
        }
        return attr
      })
    )
  }

  return {
    selectedProfile,
    availableProfiles,
    attributes,
    setAttributes,
    profileMetadata,
    profileConstraints,
    handleProfileSelect,
    handleAttributeChange,
    log,
    setLog,
    loadingError,
  }
}
