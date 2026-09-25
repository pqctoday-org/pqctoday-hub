// SPDX-License-Identifier: GPL-3.0-only
/**
 * The five SOC detection use cases from the Applied Quantum
 * "SOC Implementation" section. Each is buildable on existing
 * SIEM, network-monitoring, and certificate-management infrastructure.
 *
 * The use cases themselves live in `@/data/socQuantumPlaybook` (shared with
 * the Threats page's Detection & Response tabs); this is the Detection
 * Planner's view of them.
 */
import { SOC_USE_CASES } from '@/data/socQuantumPlaybook'

export interface DetectionUseCase {
  id: string
  code: string
  title: string
  summary: string
  severity: string
}

export const DETECTION_USE_CASES: DetectionUseCase[] = SOC_USE_CASES.map(
  ({ id, code, title, summary, severity }) => ({ id, code, title, summary, severity })
)
