export interface X509Attribute {
    id: string
    label: string
    oid: string
    status: 'mandatory' | 'recommended' | 'optional'
    value: string
    enabled: boolean
    placeholder: string
    description: string
    elementType: string
    source?: 'CSR' | 'CA' | 'Manual'
}

export interface ProfileMetadata {
    industry: string
    standard: string
    date: string
}

export interface ProfileConstraint {
    name: string
    value: string
    description: string
}
