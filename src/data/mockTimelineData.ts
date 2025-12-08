export const MOCK_CSV_CONTENT = `Country,FlagCode,OrgName,OrgFullName,OrgLogoUrl,Type,Category,StartYear,EndYear,Title,Description,SourceUrl,SourceDate,Status
Test Country,US,Test Org,Test Organization,,Milestone,Guidance,2024,2024,Test Event,Test Description,https://example.com,2024-01-01,Completed
United States,US,NIST,National Institute of Standards and Technology,,Phase,Discovery,2024,2025,Discovery Phase,Research and discovery phase.,https://nist.gov,2024-01-01,In Progress
United States,US,NIST,National Institute of Standards and Technology,,Milestone,Deadline,2030,2030,Migration Deadline,Complete migration.,https://whitehouse.gov,2024-05-01,Planned
Canada,CA,CCCS,Canadian Centre for Cyber Security,,Phase,Planning,2024,2026,Risk Assessment,Assessing crypto assets.,https://cyber.gc.ca,2024-02-01,In Progress
`

export const MOCK_LIBRARY_CSV_CONTENT = `ReferenceID,DocumentTitle,DownloadUrl,InitialPublicationDate,LastUpdateDate,DocumentStatus,ShortDescription,DocumentType,ApplicableIndustries,AuthorsOrOrganization,Dependencies,RegionScope,AlgorithmFamily,SecurityLevels,ProtocolOrToolImpact,ToolchainSupport,MigrationUrgency
LIB-001,FIPS 203 (ML-KEM),https://example.com,2024-08-13,2024-08-13,Final,Standard for Module-Lattice-Based Key-Encapsulation Mechanism,Standard,Government;Finance,NIST,,Global,ML-KEM,1;3;5,TLS 1.3,High,High
LIB-002,FIPS 204 (ML-DSA),https://example.com,2024-08-13,2024-08-13,Final,Standard for Module-Lattice-Based Digital Signature Standard,Standard,Government;Finance,NIST,,Global,ML-DSA,2;3;5,X.509,High,High
LIB-003,ML-KEM-768,,,,,ML-KEM-768 Algo details,Algorithm,,,,,,ML-KEM,,,,
`
