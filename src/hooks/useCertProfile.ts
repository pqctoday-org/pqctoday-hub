// SPDX-License-Identifier: AGPL-3.0-only
import { useState, useEffect, useRef } from 'react'
import { parseX509Profile } from '../components/PKILearning/common/profileSemantics'
import type { X509Attribute, ProfileMetadata } from '../components/PKILearning/common/types'

// Import Cert profiles
const certProfiles = import.meta.glob('../data/x509_profiles/Cert*.csv', {
  query: '?raw',
  import: 'default',
})

const csrProfiles = import.meta.glob('../data/x509_profiles/CSR*.csv', {
  query: '?raw',
  import: 'default',
})

interface UseCertProfileProps {
  profileKind?: 'certificate' | 'csr'
  initialAttributes: X509Attribute[]
  filterProfileName?: (name: string) => boolean
}

export const useCertProfile = ({
  initialAttributes,
  filterProfileName,
  profileKind = 'certificate',
}: UseCertProfileProps) => {
  const [selectedProfile, setSelectedProfile] = useState<string>('')
  const [availableProfiles, setAvailableProfiles] = useState<string[]>([])
  const [attributes, setAttributes] = useState<X509Attribute[]>(initialAttributes)
  const [profileMetadata, setProfileMetadata] = useState<ProfileMetadata | null>(null)
  const [loadingError, setLoadingError] = useState<string | null>(null)
  const [log, setLog] = useState<string>('')
  const [loadingProfile, setLoadingProfile] = useState(false)
  const request = useRef(0)
  const profilesSource = profileKind === 'csr' ? csrProfiles : certProfiles

  useEffect(() => {
    const profiles = Object.keys(profilesSource)
      .map((path) => {
        return path.split('/').pop() || ''
      })
      .filter((name) => {
        const isCertCsv =
          name.startsWith(profileKind === 'csr' ? 'CSR' : 'Cert') && name.endsWith('.csv')
        if (!isCertCsv) return false
        return filterProfileName ? filterProfileName(name) : true
      })
    setAvailableProfiles(profiles)
  }, [filterProfileName, profileKind, profilesSource])

  const handleProfileSelect = async (selection: string) => {
    // FilterDropdown's clear option sends All; the profile API also accepts an empty value.
    const filename = selection === 'All' ? '' : selection
    const requestId = ++request.current
    setLoadingProfile(Boolean(filename))
    setSelectedProfile(filename)
    setProfileMetadata(null)
    setLoadingError(null)
    if (!filename) {
      setAttributes((previous) =>
        initialAttributes.map((initial) => {
          const current = previous.find((a) => a.id === initial.id)
          return current && initial.elementType === 'SubjectRDN'
            ? { ...initial, value: current.value, source: current.source }
            : { ...initial }
        })
      )
      return
    }

    try {
      setLog((prev) => prev + `Loading profile: ${filename}...\n`)

      const path = Object.keys(profilesSource).find((p) => p.endsWith(filename))
      if (!path) throw new Error('Profile path not found')

      // eslint-disable-next-line security/detect-object-injection
      const loadProfile = profilesSource[path] as () => Promise<string>
      const content = await loadProfile()
      if (request.current !== requestId) return

      const { attributes: newAttributes, metadata } = parseX509Profile(content)
      setProfileMetadata(metadata)
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
      setLog(
        (prev) =>
          prev +
          `Profile loaded: ${metadata.industry} - ${metadata.standard} (${metadata.date}). Populated examples are selected for review; presence requirements are not established.\n`
      )
    } catch (error) {
      if (request.current !== requestId) return
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setLoadingError(errorMessage)
      setLog((prev) => prev + `Error loading profile: ${errorMessage}\n`)
    } finally {
      if (request.current === requestId) setLoadingProfile(false)
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
    handleProfileSelect,
    handleAttributeChange,
    log,
    setLog,
    loadingError,
    loadingProfile,
  }
}
