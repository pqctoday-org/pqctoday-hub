import { describe, it, expect } from 'vitest'
import { parseThreatsCSV } from './threatsData'

describe('parseThreatsCSV', () => {
    it('should parse valid CSV content correctly', () => {
        const csvContent = `industry,threat_id,threat_description,criticality,crypto_at_risk,pqc_replacement,main_source
Financial Services,FIN-001,"Description with commas, and quotes",Critical,"RSA, ECDSA","ML-KEM",Source 1
Government,GOV-001,Simple description,High,RSA,ML-DSA,Source 2`

        const result = parseThreatsCSV(csvContent)

        expect(result).toHaveLength(2)
        expect(result[0]).toEqual({
            industry: 'Financial Services',
            threatId: 'FIN-001',
            description: 'Description with commas, and quotes',
            criticality: 'Critical',
            cryptoAtRisk: 'RSA, ECDSA',
            pqcReplacement: 'ML-KEM',
            source: 'Source 1',
        })
        expect(result[1]).toEqual({
            industry: 'Government',
            threatId: 'GOV-001',
            description: 'Simple description',
            criticality: 'High',
            cryptoAtRisk: 'RSA',
            pqcReplacement: 'ML-DSA',
            source: 'Source 2',
        })
    })

    it('should handle empty CSV content', () => {
        const result = parseThreatsCSV('')
        expect(result).toEqual([])
    })

    it('should handle CSV with only headers', () => {
        const csvContent = `industry,threat_id,threat_description,criticality,crypto_at_risk,pqc_replacement,main_source`
        const result = parseThreatsCSV(csvContent)
        expect(result).toEqual([])
    })
})
