// SPDX-License-Identifier: GPL-3.0-only
import type { OrbitProfile, RadHardProcessor } from './aerospaceConstants'

export const ORBIT_PROFILES: OrbitProfile[] = [
  {
    id: 'leo',
    name: 'Low Earth Orbit (LEO)',
    altitudeKm: [200, 2000],
    typicalRTTms: 40,
    seuRatePerBitDay: 1e-7,
    seuRateSolarMax: 5e-7,
    radiationEnvironment:
      'Below inner Van Allen belt. Moderate trapped proton flux. South Atlantic Anomaly (SAA) causes localized high-SEU zones.',
    typicalLifetimeYears: 7,
    examples: ['Starlink', 'OneWeb', 'Iridium NEXT', 'Planet Labs', 'ISS'],
  },
  {
    id: 'meo',
    name: 'Medium Earth Orbit (MEO)',
    altitudeKm: [2000, 35786],
    typicalRTTms: 125,
    seuRatePerBitDay: 1e-5,
    seuRateSolarMax: 1e-4,
    radiationEnvironment:
      'Traverses inner Van Allen belt (peak proton flux at ~3,000 km). Highest cumulative radiation dose. 10-100 krad TID over mission life.',
    typicalLifetimeYears: 12,
    examples: ['GPS III', 'Galileo', 'GLONASS-K', 'O3b mPOWER'],
  },
  {
    id: 'geo',
    name: 'Geostationary Orbit (GEO)',
    altitudeKm: [35786, 35786],
    typicalRTTms: 600,
    seuRatePerBitDay: 1e-6,
    seuRateSolarMax: 1e-5,
    radiationEnvironment:
      'Above outer Van Allen belt. Electron-dominated environment. Solar particle events cause episodic high-SEU periods. 10-50 krad TID over 15-year life.',
    typicalLifetimeYears: 15,
    examples: ['Inmarsat-6', 'SES-17', 'ViaSat-3', 'GOES-T', 'Milstar'],
  },
  {
    id: 'heo',
    name: 'Highly Elliptical Orbit (HEO)',
    altitudeKm: [500, 40000],
    typicalRTTms: 400,
    seuRatePerBitDay: 1e-5,
    seuRateSolarMax: 5e-5,
    radiationEnvironment:
      'Passes through both Van Allen belts on each orbit. Perigee in LEO, apogee above GEO. Maximum radiation exposure variability.',
    typicalLifetimeYears: 10,
    examples: ['Molniya (Russian comms)', 'Tundra (SBIRS)', 'Sirius XM'],
  },
  {
    id: 'sso',
    name: 'Sun-Synchronous Orbit (SSO)',
    altitudeKm: [600, 800],
    typicalRTTms: 40,
    seuRatePerBitDay: 2e-7,
    seuRateSolarMax: 1e-6,
    radiationEnvironment:
      'Polar inclination passes through auroral zones with enhanced particle flux. Otherwise similar to LEO. Higher SEU rates near poles.',
    typicalLifetimeYears: 7,
    examples: ['Landsat 9', 'Sentinel-2', 'NOAA-21', 'WorldView Legion'],
  },
]

export const RAD_HARD_PROCESSORS: RadHardProcessor[] = [
  {
    id: 'rad750',
    name: 'RAD750',
    manufacturer: 'BAE Systems',
    architecture: 'PowerPC 750',
    clockMhz: 200,
    ramMB: 256,
    flashMB: 64,
    tidKrad: 200,
    seuImmune: false,
    pqcCapability: {
      mlkem512: true,
      mlkem768: true,
      mldsa44: true,
      mldsa65: true,
      lms: true,
      xmss: true,
    },
    notes:
      'Workhorse of NASA/JPL missions (Mars rovers, Juno, JWST). At 200 MHz, ML-KEM-768 keygen takes ~50 ms vs <1 ms on modern x86. Feasible but slow.',
  },
  {
    id: 'rad5545',
    name: 'RAD5545',
    manufacturer: 'BAE Systems',
    architecture: 'Quad-core PowerPC e5500',
    clockMhz: 466,
    ramMB: 2048,
    flashMB: 256,
    tidKrad: 100,
    seuImmune: false,
    pqcCapability: {
      mlkem512: true,
      mlkem768: true,
      mldsa44: true,
      mldsa65: true,
      lms: true,
      xmss: true,
    },
    notes:
      'Latest BAE rad-hard processor. Quad-core allows dedicated crypto partition. 2 GB RAM supports full PQC library stack. GPU-class compared to RAD750.',
  },
  {
    id: 'gr740',
    name: 'GR740',
    manufacturer: 'Cobham Gaisler',
    architecture: 'SPARC V8 (quad-core LEON4)',
    clockMhz: 250,
    ramMB: 128,
    flashMB: 32,
    tidKrad: 300,
    seuImmune: false,
    pqcCapability: {
      mlkem512: true,
      mlkem768: true,
      mldsa44: true,
      mldsa65: false,
      lms: true,
      xmss: true,
    },
    notes:
      'ESA-selected processor for European missions (JUICE, ExoMars). 128 MB RAM limits ML-DSA-65 key generation under concurrent workloads. LEON4 SPARC core is well-supported by RTEMS.',
  },
  {
    id: 'va10820',
    name: 'VA10820',
    manufacturer: 'Vorago Technologies',
    architecture: 'ARM Cortex-M0',
    clockMhz: 50,
    ramMB: 0.128,
    flashMB: 0.256,
    tidKrad: 50,
    seuImmune: true,
    pqcCapability: {
      mlkem512: false,
      mlkem768: false,
      mldsa44: false,
      mldsa65: false,
      lms: true,
      xmss: false,
    },
    notes:
      'Ultra-low-power rad-hard MCU for CubeSats and sensors. 128 KB RAM only supports hash-based signature verification (LMS). No lattice-based PQC feasible.',
  },
  {
    id: 'samrh71f20',
    name: 'SAMRH71F20',
    manufacturer: 'Microchip',
    architecture: 'ARM Cortex-M7',
    clockMhz: 150,
    ramMB: 1,
    flashMB: 2,
    tidKrad: 100,
    seuImmune: false,
    pqcCapability: {
      mlkem512: true,
      mlkem768: false,
      mldsa44: true,
      mldsa65: false,
      lms: true,
      xmss: true,
    },
    notes:
      'Space-grade Cortex-M7 with hardware FPU. 1 MB RAM sufficient for ML-KEM-512 and ML-DSA-44 but not the larger variants. Good fit for LEO smallsats.',
  },
]

/**
 * Calculate SEU-adjusted key refresh interval.
 * Returns recommended hours between key rotations to keep
 * probability of key corruption below a threshold.
 */
export function calculateKeyRefreshInterval(
  seuRate: number,
  keySizeBits: number,
  targetCorruptionProb: number = 0.001
): number {
  // P(corruption) = 1 - (1 - seuRate)^(keySizeBits * hours * 24)
  // Approximation for small rates: P ≈ seuRate * keySizeBits * days
  // Solve for days: days = targetProb / (seuRate * keySizeBits)
  const days = targetCorruptionProb / (seuRate * keySizeBits)
  return Math.max(1, Math.round(days * 24)) // Return hours, minimum 1 hour
}

/** Solar activity multiplier for SEU rates */
export const SOLAR_ACTIVITY_MULTIPLIER: Record<string, number> = {
  minimum: 1.0,
  moderate: 3.0,
  maximum: 10.0,
}
