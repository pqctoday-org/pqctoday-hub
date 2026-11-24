// SPDX-License-Identifier: AGPL-3.0-only
export const INFOGRAPHIC_SAMPLE_ASSUMPTIONS: Record<
  string,
  { title: string; assumptions: string }
> = {
  'pki-enrollment-protocols': {
    title: 'Sample Enrollment & Composite Framing',
    assumptions:
      'A signing key can sign proof-of-possession data. An ML-KEM key requires a supported non-signature proof: distinguish encrypted-certificate, challenge-response and separately trusted RA assertions. Parallel certificates differ from a composite signature profile combining two signature algorithms.',
  },
  'tls-basics': {
    title: 'Raw and Hybrid Key Shares & Network Assumptions',
    assumptions:
      'Raw ML-KEM-768 key 1,184 B and ciphertext 1,088 B; adding the 32 B X25519 contribution gives hybrid shares of 1,216 B and 1,120 B. A sample 10 \u00d7 1,460 B initial window is 14,600 B. Byte counts do not establish latency or negotiated-profile support.',
  },
  'iot-pqc': {
    title: 'Bounded Constrained-Device Sample Scope',
    assumptions:
      'Fictional Cortex-M4 planning scenario with 80 B usable application payload per frame: ML-KEM-512 public key 800 B needs 10 frames; ciphertext 768 B needs 10; ML-DSA-44 public key 1,312 B needs 17; signature 2,420 B needs 31. At 64 B payload the signature needs 38. These object-only counts exclude protocol, certificate and retransmission costs; measure target resource use separately.',
  },
  'ot-pqc': {
    title: 'Operational Technology Sample Boundary',
    assumptions:
      'Fictional control-loop budget 10 ms, baseline 7 ms and added processing 2 ms yields 9 ms with 1 ms margin; adding 5 ms yields 12 ms and exceeds the budget. These are arithmetic assumptions, not measured hardware results. Assess the actual safety path, zones, failure isolation and update recovery.',
  },
  'hsm-pqc': {
    title: 'Dual-Partition HA & Rollback Assumptions',
    assumptions:
      'Conceptual one-time-index example: signer A exclusively uses 0\u20137 and B 8\u201315. This illustrates allocation only, not an LMS/XMSS parameter set or enforced implementation. Durable atomic state and recovery must prevent reuse; firmware partitions do not by themselves partition signing state. Verify actual vendor-supported state and rollback behavior.',
  },
  'migration-program': {
    title: 'Enterprise vs. Sector Phased Timeline Scope',
    assumptions:
      'Fictional sequential schedule: inventory 6 + pilot 6 + rollout 24 + verification 6 = 42 months (3.5 years). A 12-month rollout extension gives 54 months (4.5 years). Overlap requires dependency analysis. The 3\u20135 year range is illustrative; scope external milestones separately.',
  },
  'emv-payment-pqc': {
    title: 'Payment Terminal Lifecycle & PCI DSS Scope',
    assumptions:
      'Fictional fleet: 10,000 terminals replaced at 2,000/year needs 5 years; at 1,000/year it needs 10 years. An 18-month software/pilot effort can overlap only where dependencies allow. Illustrative hardware and software ranges are planning assumptions; exact scheme, kernel, profile, certificates and key-service dependencies must be checked.',
  },
  'network-security-pqc': {
    title: 'Certificate Byte Sizes & Middlebox Framing',
    assumptions:
      'Raw ML-DSA-65 public key 1,952 B plus signature 3,309 B equals 5,261 B. A certificate using both adds DER metadata; other subject/issuer combinations differ. Fictional encoded chain 18,000 B exceeds a 14,600 B initial window by 3,400 B; 12,000 B fits. This does not predict exact RTT. RFC 9370 additional key exchanges and RFC 7383 fragmentation are distinct.',
  },
  'pqc-testing-validation': {
    title: 'Sample Test Scores vs. Production Assurance',
    assumptions:
      'Fictional suite: 90 valid and 10 invalid cases. Accepting all 100 completes 100 requests but gives only 90 correct outcomes and 10 false accepts. Correctly accepting 90 and rejecting 10 gives 100 correct outcomes for this bounded suite. Algorithm checks, module validation scope and deployment testing establish different things.',
  },
  'crypto-dev-apis': {
    title: 'Joint Algorithm & Key-Protection Requirements',
    assumptions:
      'Fictional requirement: ML-KEM-768 with a nonexportable HSM private key. Candidate A offers the algorithm in software; B offers HSM key protection without that algorithm. Combining checkmarks does not satisfy the joint requirement. Test an implementation that meets both or justify an explicit requirement change.',
  },
  'pqc-hw-acceleration': {
    title: 'Measured Reference Benchmarks vs. Unmeasured Targets',
    assumptions:
      'The seven-platform comparison is measured CPU ML-DSA-65 throughput, including Apple M4 Pro/M5 Max and AMD64. The separate KV260 SLH-DSA FPGA on/off comparison is not included in its CPU row. Hybrid results measure combined HSM mechanisms directly. GPU/NPU paths need separate target-specific evidence; these different scopes cannot be combined into one speed claim.',
  },
}
