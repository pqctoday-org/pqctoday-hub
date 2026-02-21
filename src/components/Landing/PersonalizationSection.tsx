/* eslint-disable security/detect-object-injection */
import { Briefcase, Code, ShieldCheck, GraduationCap, Globe, Factory } from 'lucide-react'
import { usePersonaStore } from '@/store/usePersonaStore'
import type { Region } from '@/store/usePersonaStore'
import { useAssessmentStore } from '@/store/useAssessmentStore'
import { PERSONAS, type PersonaId } from '@/data/learningPersonas'
import { REGION_COUNTRY_MAP } from '@/data/personaConfig'
import { AVAILABLE_INDUSTRIES } from '@/hooks/useAssessmentEngine'

const PERSONA_ORDER: PersonaId[] = ['executive', 'developer', 'architect', 'researcher']

const PERSONA_ICONS = {
  Briefcase,
  Code,
  ShieldCheck,
  GraduationCap,
} as const

const REGIONS: { id: Region; label: string }[] = [
  { id: 'americas', label: 'Americas' },
  { id: 'eu', label: 'Europe' },
  { id: 'apac', label: 'APAC' },
  { id: 'global', label: 'Global' },
]

export const PersonalizationSection = () => {
  const {
    selectedPersona,
    selectedRegion,
    selectedIndustry,
    setPersona,
    setRegion,
    setIndustry,
    clearPreferences,
  } = usePersonaStore()
  const { setCountry, setIndustry: setAssessIndustry } = useAssessmentStore()

  const hasAnySelection =
    selectedPersona !== null || selectedRegion !== null || selectedIndustry !== null

  const handlePersona = (id: PersonaId) => {
    setPersona(id === selectedPersona ? null : id)
  }

  const handleRegion = (id: Region) => {
    const next = id === selectedRegion ? null : id
    setRegion(next)
    if (next) {
      const country = REGION_COUNTRY_MAP[next]
      setCountry(country ?? '')
    }
  }

  const handleIndustry = (industry: string) => {
    const next = industry === selectedIndustry ? null : industry
    setIndustry(next)
    if (next) {
      setAssessIndustry(next)
    }
  }

  const handleClear = () => {
    clearPreferences()
  }

  return (
    <section aria-labelledby="personalization-heading" className="glass-panel p-6">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-0.5">
            Personalize your experience
          </p>
          <p className="text-sm text-muted-foreground">
            Select your role, region, and industry to tailor navigation and recommendations.
          </p>
        </div>
        {hasAnySelection && (
          <button
            onClick={handleClear}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4 shrink-0 mt-1"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Row 1 — Role */}
      <div className="mb-4">
        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
          <Briefcase size={12} className="shrink-0" />
          Role
        </p>
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-2"
          role="radiogroup"
          aria-label="Select your role"
        >
          {PERSONA_ORDER.map((id) => {
            const persona = PERSONAS[id]
            const Icon = PERSONA_ICONS[persona.icon]
            const isActive = selectedPersona === id
            return (
              <button
                key={id}
                role="radio"
                aria-checked={isActive}
                onClick={() => handlePersona(id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                  isActive
                    ? 'border-primary/30 bg-primary/10 text-foreground'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/20 hover:text-foreground'
                }`}
              >
                <Icon size={15} className="shrink-0" />
                <span className="truncate">{persona.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Row 2 — Region */}
      <div className="mb-4">
        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
          <Globe size={12} className="shrink-0" />
          Region
        </p>
        <div
          className="grid grid-cols-2 sm:grid-cols-4 gap-2"
          role="radiogroup"
          aria-label="Select your region"
        >
          {REGIONS.map(({ id, label }) => {
            const isActive = selectedRegion === id
            return (
              <button
                key={id}
                role="radio"
                aria-checked={isActive}
                onClick={() => handleRegion(id)}
                className={`px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                  isActive
                    ? 'border-primary/30 bg-primary/10 text-foreground'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/20 hover:text-foreground'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Row 3 — Industry */}
      <div>
        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
          <Factory size={12} className="shrink-0" />
          Industry
        </p>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Select your industry">
          {AVAILABLE_INDUSTRIES.map((industry) => {
            const isActive = selectedIndustry === industry
            return (
              <button
                key={industry}
                role="radio"
                aria-checked={isActive}
                onClick={() => handleIndustry(industry)}
                className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                  isActive
                    ? 'border-primary/30 bg-primary/10 text-foreground'
                    : 'border-border bg-card text-muted-foreground hover:border-primary/20 hover:text-foreground'
                }`}
              >
                {industry}
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
