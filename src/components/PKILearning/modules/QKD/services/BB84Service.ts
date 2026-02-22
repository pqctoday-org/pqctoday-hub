/* eslint-disable security/detect-object-injection */
/**
 * BB84 Quantum Key Distribution Protocol Simulation
 *
 * Pure classical simulation of the BB84 protocol for educational purposes.
 * No actual quantum operations — all randomness from crypto.getRandomValues().
 */

export type Basis = '+' | 'x'
export type BitValue = 0 | 1

/** Visual representation of qubit polarization */
export type Polarization = '↕' | '↔' | '⤢' | '⤡'

export interface Qubit {
  bitValue: BitValue
  basis: Basis
  polarization: Polarization
}

export interface BB84SimulationState {
  phase: BB84Phase
  numQubits: number
  /** Alice's prepared qubits */
  aliceQubits: Qubit[]
  /** Bob's randomly chosen measurement bases */
  bobBases: Basis[]
  /** Bob's measurement results (null until measured) */
  bobMeasurements: (BitValue | null)[]
  /** Whether each position used matching bases */
  matchingBases: boolean[]
  /** Sifted key from Alice's perspective */
  siftedKeyAlice: BitValue[]
  /** Sifted key from Bob's perspective */
  siftedKeyBob: BitValue[]
  /** Eve eavesdropping enabled */
  evePresent: boolean
  /** Probability (0-1) that Eve intercepts a given qubit */
  eveInterceptionRate: number
  /** Which qubits Eve intercepted */
  eveInterceptions: boolean[]
  /** Eve's measurement results */
  eveMeasurements: (BitValue | null)[]
  /** Probability (0-1) of random bit flip during transmission/measurement */
  channelNoise: number
  /** Calculated QBER from sample */
  qber: number | null
  /** Sample size used for QBER estimation */
  sampleSize: number | null
  /** Whether the key is deemed secure (QBER < threshold) */
  isSecure: boolean | null
}

export type BB84Phase =
  | 'idle'
  | 'prepare'
  | 'transmit'
  | 'measure'
  | 'reconcile'
  | 'sift'
  | 'detect'
  | 'complete'

export const BB84_PHASES: BB84Phase[] = [
  'prepare',
  'transmit',
  'measure',
  'reconcile',
  'sift',
  'detect',
  'complete',
]

export const PHASE_LABELS: Record<BB84Phase, string> = {
  idle: 'Ready',
  prepare: 'Alice Prepares Qubits',
  transmit: 'Quantum Channel Transmission',
  measure: 'Bob Measures Qubits',
  reconcile: 'Basis Reconciliation',
  sift: 'Key Sifting',
  detect: 'Eavesdropper Detection',
  complete: 'Protocol Complete',
}

/** QBER threshold above which we abort (Eve detected) */
const QBER_THRESHOLD = 0.11

/** Fraction of sifted key bits used for QBER estimation */
const SAMPLE_FRACTION = 0.25

/** Get secure random bit */
function randomBit(): BitValue {
  const arr = new Uint8Array(1)
  crypto.getRandomValues(arr)
  return (arr[0] & 1) as BitValue
}

/** Get secure random basis */
function randomBasis(): Basis {
  return randomBit() === 0 ? '+' : 'x'
}

/** Map bit + basis to polarization symbol */
function toPolarization(bit: BitValue, basis: Basis): Polarization {
  if (basis === '+') return bit === 0 ? '↕' : '↔'
  return bit === 0 ? '⤢' : '⤡'
}

/**
 * Measure a qubit in a given basis.
 * - If bases match: deterministic result (same as prepared bit)
 * - If bases differ: random result (50/50)
 */
function measureQubit(qubit: Qubit, measureBasis: Basis): BitValue {
  if (qubit.basis === measureBasis) {
    return qubit.bitValue
  }
  // Wrong basis → random outcome
  return randomBit()
}

export function createInitialState(
  numQubits: number,
  evePresent: boolean,
  eveInterceptionRate: number = 1.0,
  channelNoise: number = 0.0
): BB84SimulationState {
  return {
    phase: 'idle',
    numQubits,
    aliceQubits: [],
    bobBases: [],
    bobMeasurements: [],
    matchingBases: [],
    siftedKeyAlice: [],
    siftedKeyBob: [],
    evePresent,
    eveInterceptionRate,
    eveInterceptions: [],
    eveMeasurements: [],
    channelNoise,
    qber: null,
    sampleSize: null,
    isSecure: null,
  }
}

/** Phase 1: Alice prepares random qubits in random bases */
export function prepareQubits(state: BB84SimulationState): BB84SimulationState {
  const aliceQubits: Qubit[] = []
  for (let i = 0; i < state.numQubits; i++) {
    const bit = randomBit()
    const basis = randomBasis()
    aliceQubits.push({
      bitValue: bit,
      basis,
      polarization: toPolarization(bit, basis),
    })
  }
  return { ...state, phase: 'prepare', aliceQubits }
}

/** Phase 2: Transmit through quantum channel (Eve may intercept) */
export function transmitQubits(state: BB84SimulationState): BB84SimulationState {
  const eveInterceptions: boolean[] = []
  const eveMeasurements: (BitValue | null)[] = []
  // Eve intercepts qubits based on interception rate
  const transmittedQubits = state.aliceQubits.map((qubit) => {
    if (state.evePresent && Math.random() < state.eveInterceptionRate) {
      eveInterceptions.push(true)
      // Eve measures in random basis
      const eveBasis = randomBasis()
      const eveResult = measureQubit(qubit, eveBasis)
      eveMeasurements.push(eveResult)
      // Eve re-prepares the qubit in her measured basis (disturbing the state)
      return {
        bitValue: eveResult,
        basis: eveBasis,
        polarization: toPolarization(eveResult, eveBasis),
      }
    }
    eveInterceptions.push(false)
    eveMeasurements.push(null)
    return qubit
  })

  return {
    ...state,
    phase: 'transmit',
    aliceQubits: state.aliceQubits, // Keep Alice's original qubits for display
    eveInterceptions,
    eveMeasurements,
    // Store transmitted qubits (possibly disturbed) for Bob's measurement
    bobMeasurements: transmittedQubits.map(() => null),
    _transmittedQubits: transmittedQubits, // Internal: what Bob actually receives
  } as BB84SimulationState & { _transmittedQubits: Qubit[] }
}

/** Phase 3: Bob measures each qubit in a random basis */
export function measureQubits(state: BB84SimulationState): BB84SimulationState {
  const bobBases: Basis[] = []
  const bobMeasurements: BitValue[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const transmitted = (state as any)._transmittedQubits || state.aliceQubits

  for (let i = 0; i < state.numQubits; i++) {
    const bobBasis = randomBasis()
    bobBases.push(bobBasis)
    let result = measureQubit(transmitted[i], bobBasis)
    // Apply channel noise (random flip)
    if (Math.random() < state.channelNoise) {
      result = result === 0 ? 1 : 0
    }
    bobMeasurements.push(result)
  }

  return { ...state, phase: 'measure', bobBases, bobMeasurements }
}

/** Phase 4: Alice and Bob compare bases over classical channel */
export function reconcileBases(state: BB84SimulationState): BB84SimulationState {
  const matchingBases = state.aliceQubits.map((q, i) => q.basis === state.bobBases[i])
  return { ...state, phase: 'reconcile', matchingBases }
}

/** Phase 5: Discard non-matching positions to get sifted key */
export function siftKey(state: BB84SimulationState): BB84SimulationState {
  const siftedKeyAlice: BitValue[] = []
  const siftedKeyBob: BitValue[] = []

  state.matchingBases.forEach((match, i) => {
    if (match) {
      siftedKeyAlice.push(state.aliceQubits[i].bitValue)
      siftedKeyBob.push(state.bobMeasurements[i] as BitValue)
    }
  })

  return { ...state, phase: 'sift', siftedKeyAlice, siftedKeyBob }
}

/** Phase 6: Estimate QBER by sampling bits and comparing */
export function detectEavesdropper(state: BB84SimulationState): BB84SimulationState {
  const sampleSize = Math.max(1, Math.floor(state.siftedKeyAlice.length * SAMPLE_FRACTION))
  let errors = 0

  // Compare the first sampleSize bits
  for (let i = 0; i < sampleSize; i++) {
    if (state.siftedKeyAlice[i] !== state.siftedKeyBob[i]) {
      errors++
    }
  }

  const qber = sampleSize > 0 ? errors / sampleSize : 0
  const isSecure = qber < QBER_THRESHOLD

  return {
    ...state,
    phase: 'detect',
    qber,
    sampleSize,
    isSecure,
  }
}

/** Advance to complete phase */
export function completeProtocol(state: BB84SimulationState): BB84SimulationState {
  return { ...state, phase: 'complete' }
}

/** Advance the protocol by one phase */
export function advancePhase(state: BB84SimulationState): BB84SimulationState {
  switch (state.phase) {
    case 'idle':
      return prepareQubits(state)
    case 'prepare':
      return transmitQubits(state)
    case 'transmit':
      return measureQubits(state)
    case 'measure':
      return reconcileBases(state)
    case 'reconcile':
      return siftKey(state)
    case 'sift':
      return detectEavesdropper(state)
    case 'detect':
      return completeProtocol(state)
    default:
      return state
  }
}

/** Run the full protocol in one go (useful for testing) */
export function runFullProtocol(
  numQubits: number,
  evePresent: boolean,
  eveInterceptionRate: number = 1.0,
  channelNoise: number = 0.0
): BB84SimulationState {
  let state = createInitialState(numQubits, evePresent, eveInterceptionRate, channelNoise)
  while (state.phase !== 'complete') {
    state = advancePhase(state)
  }
  return state
}

/** Get the final usable key (sifted key minus sample bits) */
export function getFinalKey(state: BB84SimulationState): BitValue[] {
  if (!state.isSecure || state.sampleSize === null) return []
  // Remove the sample bits used for QBER estimation
  return state.siftedKeyAlice.slice(state.sampleSize)
}

/** Convert bit array to hex string */
export function bitsToHex(bits: BitValue[]): string {
  if (bits.length === 0) return '(empty)'
  let hex = ''
  for (let i = 0; i < bits.length; i += 4) {
    const nibble = bits.slice(i, i + 4)
    while (nibble.length < 4) nibble.push(0)
    const val = nibble.reduce<number>((acc, bit, j) => acc | (bit << (3 - j)), 0 as number)
    hex += val.toString(16)
  }
  return hex
}
