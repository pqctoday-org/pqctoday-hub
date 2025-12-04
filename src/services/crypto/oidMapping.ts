export const KNOWN_OIDS: Record<string, string> = {
  '2.5.4.3': 'commonName',
  '2.5.4.6': 'countryName',
  '2.5.4.10': 'organizationName',
  '2.5.4.11': 'organizationalUnitName',
  '2.5.4.8': 'stateOrProvinceName',
  '2.5.4.7': 'localityName',
  '2.5.4.9': 'streetAddress',
  '2.5.4.5': 'serialNumber',
  '2.5.4.17': 'postalCode',
  '2.5.4.97': 'organizationIdentifier',
  '1.2.840.113549.1.9.1': 'emailAddress',
  '0.9.2342.19200300.100.1.25': 'domainComponent',
  '2.5.4.4': 'surname',
  '2.5.4.42': 'givenName',
  '2.5.4.43': 'initials',
  '2.5.4.65': 'pseudonym',
  '2.5.4.12': 'title',
  '2.5.4.46': 'dnQualifier',
}

export const getOidName = (oid: string): string | undefined => {
  return KNOWN_OIDS[oid]
}

export const isKnownOid = (oid: string): boolean => {
  return !!KNOWN_OIDS[oid]
}
