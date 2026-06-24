// SPDX-License-Identifier: GPL-3.0-only
/**
 * Sample enterprise crypto inventory for the InventoryLifecycleSimulator.
 *
 * Promoted to the shared canonical estate at `@/data/cryptoEstate` so the CBOM
 * module and this module use ONE dataset; re-exported here to preserve this
 * module's existing import surface.
 */
export {
  SAMPLE_INVENTORY,
  LOOP_STAGES,
  LOOP_STAGE_LABELS,
  type InventoryAsset,
  type LoopStage,
  type ClassifyTag,
} from '@/data/cryptoEstate'
