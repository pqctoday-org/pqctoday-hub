import { ComplianceRecord } from './types.js'

export interface ValidationResult {
    valid: boolean
    errors: string[]
    warnings: string[]
}

/**
 * Validates a single compliance record for data quality
 */
export const validateRecord = (record: ComplianceRecord): ValidationResult => {
    const errors: string[] = []
    const warnings: string[] = []

    // Required fields
    if (!record.id) errors.push('Missing ID')
    if (!record.date) errors.push('Missing date')
    if (!record.source) errors.push('Missing source')
    if (!record.type) errors.push('Missing type')

    // Date validation
    if (record.date) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/
        if (!dateRegex.test(record.date)) {
            errors.push(`Invalid date format: ${record.date}`)
        } else {
            const d = new Date(record.date)
            if (isNaN(d.getTime())) {
                errors.push(`Invalid date: ${record.date}`)
            } else if (d > new Date()) {
                warnings.push(`Future date: ${record.date}`)
            }
        }
    }

    // Product name
    if (!record.productName) {
        warnings.push('Missing product name')
    } else if (record.productName.length < 3) {
        warnings.push(`Short product name: ${record.productName}`)
    }

    // Vendor
    if (!record.vendor || record.vendor === 'Unknown Vendor') {
        warnings.push('Missing or unknown vendor')
    }

    // Link validation
    if (record.link && !record.link.startsWith('http')) {
        warnings.push(`Invalid link format: ${record.link}`)
    }

    return {
        valid: errors.length === 0,
        errors,
        warnings,
    }
}

/**
 * Validates a full dataset and returns summary statistics
 */
export const validateDataset = (
    records: ComplianceRecord[]
): {
    valid: number
    invalid: number
    warnings: number
    details: Array<{ id: string; errors: string[]; warnings: string[] }>
} => {
    let valid = 0
    let invalid = 0
    let warningCount = 0
    const details: Array<{ id: string; errors: string[]; warnings: string[] }> = []

    for (const record of records) {
        const result = validateRecord(record)
        if (result.valid) valid++
        else {
            invalid++
            details.push({ id: record.id, errors: result.errors, warnings: result.warnings })
        }
        if (result.warnings.length > 0) warningCount++
    }

    return { valid, invalid, warnings: warningCount, details }
}

/**
 * Logs validation results in a readable format
 */
export const logValidationResults = (
    results: ReturnType<typeof validateDataset>
): void => {
    console.log('\n[Validation] Results:')
    console.log(`  ✅ Valid records: ${results.valid}`)
    console.log(`  ❌ Invalid records: ${results.invalid}`)
    console.log(`  ⚠️ Records with warnings: ${results.warnings}`)

    if (results.invalid > 0) {
        console.log('\n[Validation] Invalid record details:')
        results.details.slice(0, 10).forEach((d) => {
            console.log(`  - ${d.id}: ${d.errors.join(', ')}`)
        })
        if (results.details.length > 10) {
            console.log(`  ... and ${results.details.length - 10} more`)
        }
    }
}
