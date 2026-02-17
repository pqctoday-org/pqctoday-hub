import { saveAs } from 'file-saver'
import type { LearningProgress } from './types'

/**
 * Service for importing/exporting learning progress files and checking storage health.
 * Persistence is handled by Zustand persist middleware in useModuleStore.
 */
export class ProgressService {
  /**
   * Export progress to downloadable JSON file
   */
  static exportToFile(progress: LearningProgress): void {
    const json = JSON.stringify(progress, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `pki-learning-progress-${timestamp}.json`

    saveAs(blob, filename)
  }

  /**
   * Import progress from uploaded JSON file
   */
  static async importFromFile(file: File): Promise<LearningProgress> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const json = e.target?.result as string
          const progress = JSON.parse(json) as LearningProgress

          // Validate format with detailed errors
          const validation = this.validateProgressFormat(progress)
          if (!validation.valid) {
            throw new Error(`Invalid progress file format: ${validation.errors.join('; ')}`)
          }

          // Migrate if needed (version compatibility)
          const migratedProgress = this.migrateProgress(progress)

          resolve(migratedProgress)
        } catch (error) {
          if (error instanceof SyntaxError) {
            reject(new Error('Invalid JSON file. Please check the file format.'))
          } else if (error instanceof Error) {
            reject(error)
          } else {
            reject(new Error(`Failed to parse progress file: ${error}`))
          }
        }
      }

      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsText(file)
    })
  }

  /**
   * Check storage health and availability
   */
  static async checkStorageHealth(): Promise<{
    available: boolean
    quotaUsed: number
    quotaTotal: number
    warnings: string[]
  }> {
    const warnings: string[] = []
    let available = false
    let quotaUsed = 0
    let quotaTotal = 0

    try {
      // Check if localStorage is available and writable
      const testKey = '__storage-health-check__'
      try {
        localStorage.setItem(testKey, '1')
        localStorage.removeItem(testKey)
        available = true
      } catch {
        available = false
        warnings.push('Storage is not writable. You may be in private browsing mode.')
      }

      // Check storage quota if available
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate()
        quotaUsed = estimate.usage || 0
        quotaTotal = estimate.quota || 0

        // Warn if using > 80% of quota
        if (quotaTotal > 0 && quotaUsed / quotaTotal > 0.8) {
          const percentUsed = Math.round((quotaUsed / quotaTotal) * 100)
          warnings.push(`Storage is ${percentUsed}% full. Consider exporting your progress.`)
        }
      }
    } catch {
      available = false
      warnings.push('Failed to check storage availability')
    }

    return { available, quotaUsed, quotaTotal, warnings }
  }

  /**
   * Validate progress file format with detailed error reporting
   */
  private static validateProgressFormat(progress: unknown): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = progress as any

    // Basic type checks
    if (typeof p !== 'object' || p === null) {
      errors.push('Progress must be an object')
      return { valid: false, errors }
    }

    if (typeof p.version !== 'string') {
      errors.push('Version must be a string')
    }

    if (typeof p.timestamp !== 'number') {
      errors.push('Timestamp must be a number')
    } else {
      // Validate timestamp is reasonable (2020-2100)
      const year = new Date(p.timestamp).getFullYear()
      if (year < 2020 || year > 2100) {
        errors.push(`Timestamp year ${year} is out of reasonable range (2020-2100)`)
      }
    }

    // Validate modules structure
    if (typeof p.modules !== 'object' || p.modules === null) {
      errors.push('Modules must be an object')
    } else {
      Object.entries(p.modules).forEach(([moduleId, module]) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const m = module as any

        if (typeof m !== 'object' || m === null) {
          errors.push(`Module ${moduleId} must be an object`)
          return
        }

        // Validate status enum
        if (!['not-started', 'in-progress', 'completed'].includes(m.status)) {
          errors.push(
            `Module ${moduleId} has invalid status: ${m.status}. Must be 'not-started', 'in-progress', or 'completed'`
          )
        }

        // Validate timeSpent
        if (typeof m.timeSpent !== 'number') {
          errors.push(`Module ${moduleId} timeSpent must be a number`)
        } else if (m.timeSpent < 0 || m.timeSpent > 1000000) {
          errors.push(
            `Module ${moduleId} timeSpent ${m.timeSpent} is out of range (0-1000000 seconds)`
          )
        }

        // Validate completedSteps
        if (!Array.isArray(m.completedSteps)) {
          errors.push(`Module ${moduleId} completedSteps must be an array`)
        }

        // Validate quizScores
        if (typeof m.quizScores !== 'object' || m.quizScores === null) {
          errors.push(`Module ${moduleId} quizScores must be an object`)
        } else {
          Object.entries(m.quizScores).forEach(([quizId, score]) => {
            if (typeof score !== 'number') {
              errors.push(`Module ${moduleId} quiz ${quizId} score must be a number`)
            } else if (score < 0 || score > 100) {
              errors.push(
                `Module ${moduleId} quiz ${quizId} score ${score} is out of range (0-100)`
              )
            }
          })
        }

        // Validate lastVisited
        if (typeof m.lastVisited !== 'number') {
          errors.push(`Module ${moduleId} lastVisited must be a number`)
        }
      })
    }

    // Validate artifacts structure
    if (typeof p.artifacts !== 'object' || p.artifacts === null) {
      errors.push('Artifacts must be an object')
    } else {
      if (!Array.isArray(p.artifacts.keys)) {
        errors.push('Artifacts.keys must be an array')
      }
      if (!Array.isArray(p.artifacts.certificates)) {
        errors.push('Artifacts.certificates must be an array')
      }
      if (!Array.isArray(p.artifacts.csrs)) {
        errors.push('Artifacts.csrs must be an array')
      }
    }

    // Validate preferences
    if (p.preferences) {
      if (!['light', 'dark'].includes(p.preferences.theme)) {
        errors.push('Preferences.theme must be "light" or "dark"')
      }
    }

    return { valid: errors.length === 0, errors }
  }

  /**
   * Migrate progress from older versions
   */
  private static migrateProgress(progress: LearningProgress): LearningProgress {
    const currentVersion = '1.0.0'

    // Ensure artifacts exist (migration from pre-Module 3 state)
    if (!progress.artifacts) {
      progress.artifacts = {
        keys: [],
        certificates: [],
        csrs: [],
      }
    }

    if (progress.version === currentVersion) {
      return progress
    }

    // Handle version migrations
    if (!progress.version || progress.version === '0.9.0') {
      // Migrate from v0.9.0 to v1.0.0
      progress = {
        ...progress,
        version: currentVersion,
        // Add new fields with defaults
      }
    }

    return progress
  }
}
