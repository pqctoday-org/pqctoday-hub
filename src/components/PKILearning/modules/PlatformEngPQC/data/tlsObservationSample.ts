// SPDX-License-Identifier: AGPL-3.0-only
/** Fictional-service OpenSSL 3.6.3 captures, with peer verification enabled.
 * Both connections use the same cipher suite and RSA-PSS authentication.
 * Only the explicit negotiated-group observation distinguishes their KEX. */
export const TLS_CAPTURE_SAMPLES = {
  hybrid: {
    requested_group: 'X25519MLKEM768',
    exit_code: 0,
    output:
      'Connecting to 127.0.0.1\nCONNECTION ESTABLISHED\nProtocol version: TLSv1.3\nCiphersuite: TLS_AES_256_GCM_SHA384\nPeer certificate: CN=fictional-service.example.test\nHash used: SHA256\nSignature type: rsa_pss_rsae_sha256\nVerification: OK\nVerified peername: fictional-service.example.test\nNegotiated TLS1.3 group: X25519MLKEM768\nDONE\n',
  },
  classical: {
    requested_group: 'X25519',
    exit_code: 0,
    output:
      'Connecting to 127.0.0.1\nCONNECTION ESTABLISHED\nProtocol version: TLSv1.3\nCiphersuite: TLS_AES_256_GCM_SHA384\nPeer certificate: CN=fictional-service.example.test\nHash used: SHA256\nSignature type: rsa_pss_rsae_sha256\nVerification: OK\nVerified peername: fictional-service.example.test\nPeer Temp Key: X25519, 253 bits\nDONE\n',
  },
} as const

export type TlsObservation = {
  result: 'verified' | 'failed' | 'incomplete'
  protocol: string
  cipherSuite: string
  negotiatedGroup: string
  authSignature: string
}

function uniqueField(output: string, pattern: RegExp): string {
  const values = [...output.matchAll(pattern)].map((m) => m[1].trim())
  return new Set(values).size === 1 ? values[0] : ''
}

export function parseTlsObservation(output: string, exitCode: number): TlsObservation {
  const protocol = uniqueField(output, /^Protocol version: (.+)$/gm)
  const cipherSuite = uniqueField(output, /^Ciphersuite: (.+)$/gm)
  const authSignature = uniqueField(output, /^Signature type: (.+)$/gm)
  const groups = [
    ...output.matchAll(/^Negotiated TLS1\.3 group: (.+)$/gm),
    ...output.matchAll(/^Peer Temp Key: ([^,\r\n]+)/gm),
  ].map((m) => m[1].trim())
  const negotiatedGroup = new Set(groups).size === 1 ? groups[0] : ''
  const verified =
    exitCode === 0 &&
    /^CONNECTION ESTABLISHED$/m.test(output) &&
    /^Verification: OK$/m.test(output) &&
    !/^Verification error:/m.test(output)
  const result =
    exitCode !== 0 || /^Verification error:/m.test(output)
      ? 'failed'
      : verified && protocol && cipherSuite
        ? 'verified'
        : 'incomplete'
  return {
    result,
    protocol,
    cipherSuite,
    negotiatedGroup: verified ? negotiatedGroup : '',
    authSignature,
  }
}

export function groupDecision(observation: TlsObservation): string {
  if (observation.result !== 'verified') return 'Connection not verified'
  if (!observation.negotiatedGroup) return 'Negotiated group not observed'
  return ['X25519MLKEM768', 'X25519'].includes(observation.negotiatedGroup)
    ? 'Group allowed by sample policy'
    : 'Group outside sample policy'
}

function label(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll('"', '\\"').replaceAll('\n', '\\n')
}

/** One current observation for a bounded target; replace older observations on each scrape.
 * No metric name here is claimed to be provided by Istio, Envoy or OpenSSL. */
export function tlsObservationMetric(observation: TlsObservation): string {
  return (
    '# HELP hub_sample_tls_observation Current fictional TLS observation (schema 1).\n' +
    '# TYPE hub_sample_tls_observation gauge\n' +
    `hub_sample_tls_observation{schema="1",target="fictional-service",result="${label(observation.result)}",protocol="${label(observation.protocol)}",cipher_suite="${label(observation.cipherSuite)}",negotiated_group="${label(observation.negotiatedGroup)}",auth_signature="${label(observation.authSignature)}"} 1\n`
  )
}

/** Prometheus/promtool 3.15.0. The explicit sample policy permits classical fallback.
 * This is a policy deviation check, not evidence of an attack or of PQC authentication. */
export const TLS_SAMPLE_ALERT_RULES = `groups:
  - name: fictional-tls-observations
    rules:
      - alert: SampleNegotiatedGroupOutsidePolicy
        expr: hub_sample_tls_observation{schema="1",result="verified",negotiated_group!="",negotiated_group!~"X25519MLKEM768|X25519"} == 1
        labels:
          severity: warning
      - alert: SampleNegotiatedGroupNotObserved
        expr: hub_sample_tls_observation{schema="1",result="verified",negotiated_group=""} == 1
        labels:
          severity: warning
      - alert: SampleTlsObservationFailed
        expr: hub_sample_tls_observation{schema="1",result="failed"} == 1
        labels:
          severity: warning
      - alert: SampleTlsObservationIncomplete
        expr: hub_sample_tls_observation{schema="1",result="incomplete"} == 1
        labels:
          severity: warning
      - alert: SampleTlsObservationAbsent
        expr: absent(hub_sample_tls_observation{schema="1",target="fictional-service"})
        labels:
          severity: warning
`

const hybrid = parseTlsObservation(TLS_CAPTURE_SAMPLES.hybrid.output, 0)
const classical = parseTlsObservation(TLS_CAPTURE_SAMPLES.classical.output, 0)
const alertNames = [
  'SampleNegotiatedGroupOutsidePolicy',
  'SampleNegotiatedGroupNotObserved',
  'SampleTlsObservationFailed',
  'SampleTlsObservationIncomplete',
  'SampleTlsObservationAbsent',
]

export const TLS_ALERT_TEST_CASES: {
  name: string
  observation: TlsObservation | null
  expectedAlert: string | null
}[] = [
  { name: 'captured hybrid allowed', observation: hybrid, expectedAlert: null },
  { name: 'captured classical fallback allowed', observation: classical, expectedAlert: null },
  {
    name: 'authored missing group',
    observation: { ...hybrid, negotiatedGroup: '' },
    expectedAlert: 'SampleNegotiatedGroupNotObserved',
  },
  {
    name: 'authored outside-policy group',
    observation: { ...hybrid, negotiatedGroup: 'secp384r1' },
    expectedAlert: 'SampleNegotiatedGroupOutsidePolicy',
  },
  {
    name: 'authored failed connection',
    observation: { ...hybrid, result: 'failed', negotiatedGroup: '' },
    expectedAlert: 'SampleTlsObservationFailed',
  },
  {
    name: 'authored incomplete observation',
    observation: { ...hybrid, result: 'incomplete', negotiatedGroup: '' },
    expectedAlert: 'SampleTlsObservationIncomplete',
  },
  { name: 'absent observation', observation: null, expectedAlert: 'SampleTlsObservationAbsent' },
]

/** JSON is accepted as YAML by promtool. Save beside sample-rules.yml. */
export const TLS_PROMTOOL_TESTS = {
  rule_files: ['sample-rules.yml'],
  evaluation_interval: '1m',
  tests: TLS_ALERT_TEST_CASES.map(({ name, observation, expectedAlert }) => ({
    name,
    interval: '1m',
    input_series: observation
      ? [
          {
            series: tlsObservationMetric(observation).trim().split('\n').at(-1)!.replace(/ 1$/, ''),
            values: '1 1',
          },
        ]
      : [],
    alert_rule_test: alertNames.map((alertname) => ({
      eval_time: '1m',
      alertname,
      exp_alerts:
        alertname === expectedAlert
          ? [
              {
                exp_labels: observation
                  ? Object.fromEntries(
                      Object.entries({
                        schema: '1',
                        target: 'fictional-service',
                        result: observation.result,
                        protocol: observation.protocol,
                        cipher_suite: observation.cipherSuite,
                        negotiated_group: observation.negotiatedGroup,
                        auth_signature: observation.authSignature,
                        severity: 'warning',
                      }).filter(([, value]) => value !== '')
                    )
                  : { schema: '1', target: 'fictional-service', severity: 'warning' },
                exp_annotations: {},
              },
            ]
          : [],
    })),
  })),
}
