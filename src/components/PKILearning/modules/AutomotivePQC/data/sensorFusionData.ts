// SPDX-License-Identifier: AGPL-3.0-only
import type { SensorType, AlgorithmThroughput } from './automotiveConstants'

// ---------------------------------------------------------------------------
// Sensor Profiles
// ---------------------------------------------------------------------------

export interface SensorProfile {
  id: SensorType
  name: string
  /** Megabytes per second raw data rate */
  dataRateMBps: number
  /** Messages per second requiring authentication */
  messageFrequencyHz: number
  /** Average message size in bytes */
  messageSizeBytes: number
  /** Maximum acceptable end-to-end latency for safety */
  latencyBudgetMs: number
  currentAuth: string
  description: string
  quantumThreat: string
}

export const SENSOR_PROFILES: SensorProfile[] = [
  {
    id: 'lidar',
    name: 'LiDAR',
    dataRateMBps: 300,
    messageFrequencyHz: 20,
    messageSizeBytes: 15_000_000,
    latencyBudgetMs: 100,
    currentAuth: 'ECDSA P-256 per point cloud frame',
    description:
      '3D point cloud for obstacle detection and mapping. Generates massive data volumes requiring real-time authentication.',
    quantumThreat:
      'Forgery, not harvest-now-decrypt-later: an attacker able to break ECDSA could forge frame signatures to inject phantom obstacles. Replaying recorded frames is a separate attack that signatures alone do not stop (freshness or counters are needed).',
  },
  {
    id: 'radar',
    name: 'Radar',
    dataRateMBps: 15,
    messageFrequencyHz: 50,
    messageSizeBytes: 300_000,
    latencyBudgetMs: 50,
    currentAuth: 'HMAC-SHA-256 per radar return',
    description:
      'Velocity and range detection for adaptive cruise control and collision avoidance.',
    quantumThreat: 'Forged radar data could mask real obstacles or inject phantom targets.',
  },
  {
    id: 'camera',
    name: 'Camera (8MP)',
    dataRateMBps: 40,
    messageFrequencyHz: 30,
    messageSizeBytes: 1_333_000,
    latencyBudgetMs: 67,
    currentAuth: 'ECDSA P-256 per frame (when signed)',
    description: 'Visual perception for lane detection, sign recognition, pedestrian detection.',
    quantumThreat:
      'Frame injection with forged signatures could mislead lane-keeping and object detection.',
  },
  {
    id: 'ultrasonic',
    name: 'Ultrasonic',
    dataRateMBps: 0.01,
    messageFrequencyHz: 10,
    messageSizeBytes: 1000,
    latencyBudgetMs: 200,
    currentAuth: 'None (trusted bus)',
    description:
      'Short-range parking sensors. Low data rate, typically trusted via physical bus isolation.',
    quantumThreat: 'Low risk — short-range, low-value data. Bus-level protection sufficient.',
  },
  {
    id: 'gps-imu',
    name: 'GPS / IMU',
    dataRateMBps: 0.1,
    messageFrequencyHz: 100,
    messageSizeBytes: 1000,
    latencyBudgetMs: 10,
    currentAuth: 'None (trusted); GPS spoofing protection via multi-constellation',
    description: 'Position and motion data for localization. High frequency, small messages.',
    // Dormant field: the Sensor Data Integrity Simulator does not render quantumThreat.
    // Galileo OSNMA (IDD ICD issue 1.1, January 2024) authenticates the navigation message
    // with TESLA keyed tags; the TESLA root key is authenticated by an ECDSA digital signature
    // (classical, not post-quantum). Galileo's OSNMA information note says authentication does
    // not prevent spoofing, does not protect against jamming, and a position computed from
    // non-verified ranging information cannot be considered authenticated.
    quantumThreat:
      'GNSS spoofing is already possible without a quantum computer. Galileo OSNMA authenticates the navigation message with TESLA keyed tags whose root key is signed with classical ECDSA (not post-quantum). It does not authenticate ranging and does not stop jamming, so it is one layer, not a complete anti-spoofing answer.',
  },
  {
    id: 'v2x',
    name: 'V2X Messages (BSM/CAM)',
    dataRateMBps: 0.003,
    messageFrequencyHz: 10,
    messageSizeBytes: 300,
    latencyBudgetMs: 100,
    currentAuth: 'ECDSA P-256 (IEEE 1609.2)',
    description:
      'Basic Safety Messages (BSM, ~300 bytes) broadcast 10 Hz per vehicle. Per-vehicle rate is ~3 KB/s; in dense traffic (100+ vehicles in range), aggregate received V2X traffic can reach 0.3–0.5 MB/s.',
    quantumThreat:
      'Quantum forgery of V2X signatures enables fake safety alerts, ghost vehicles, or traffic manipulation.',
  },
]

// ---------------------------------------------------------------------------
// Shared authored timing inputs; no retained hardware/build measurement establishes these as benchmarks.
export const AUTOMOTIVE_TIMING_BASIS =
  'Hub-authored primitive-operation timing inputs in milliseconds. Parameter sets are named per row; no measured hardware, compiler/build or workload is established for these values. Use them for the sample arithmetic, then measure your own target.'

export const ALGORITHM_THROUGHPUT: AlgorithmThroughput[] = [
  {
    algorithm: 'ECDSA P-256',
    signingTimeMs: 0.3,
    verificationTimeMs: 0.8,
    signatureBytes: 64,
    publicKeyBytes: 33,
  },
  {
    algorithm: 'ML-DSA-44',
    signingTimeMs: 0.8,
    verificationTimeMs: 0.3,
    signatureBytes: 2420,
    publicKeyBytes: 1312,
  },
  {
    algorithm: 'ML-DSA-65',
    signingTimeMs: 1.4,
    verificationTimeMs: 0.5,
    signatureBytes: 3309,
    publicKeyBytes: 1952,
  },
  {
    algorithm: 'FN-DSA-512 (estimated)',
    signingTimeMs: 2.0,
    verificationTimeMs: 0.15,
    signatureBytes: 666,
    publicKeyBytes: 897,
  },
  {
    algorithm: 'SLH-DSA-SHA2-128s',
    signingTimeMs: 120,
    verificationTimeMs: 3.5,
    signatureBytes: 7856,
    publicKeyBytes: 32,
  },
  {
    algorithm: 'LMS (H10/W4, pre-computed)',
    signingTimeMs: 0.1,
    verificationTimeMs: 0.05,
    signatureBytes: 2512, // RFC 8554 H10/W4 with the HSS header (was 2156, unsourced)
    publicKeyBytes: 60, // HSS L=1 public key (plain LMS is 56 B); kept consistent with the 2,512 B HSS signature
  },
]

// ---------------------------------------------------------------------------
// Compute: messages per second an algorithm can sign
// ---------------------------------------------------------------------------

export function computeSigningCapacity(
  algorithm: AlgorithmThroughput,
  sensorFrequencyHz: number
): { canKeepUp: boolean; utilization: number; msPerMessage: number } {
  const msPerMessage = algorithm.signingTimeMs + algorithm.verificationTimeMs
  const maxMessagesPerSecond = 1000 / msPerMessage
  const utilization = (sensorFrequencyHz / maxMessagesPerSecond) * 100
  return {
    canKeepUp: utilization <= 100,
    utilization: Math.min(utilization, 100),
    msPerMessage,
  }
}
