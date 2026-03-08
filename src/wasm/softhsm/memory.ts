import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import { RV_NAMES, CK_ATTRIBUTE_SIZE } from './constants'

export const readUlong = (M: SoftHSMModule, ptr: number): number => M.HEAP32[ptr >> 2]

export const writeUlong = (M: SoftHSMModule, ptr: number, value: number): void => {
  M.HEAP32[ptr >> 2] = value
}

export const allocUlong = (M: SoftHSMModule): number => M._malloc(4)

export const writeBytes = (M: SoftHSMModule, data: Uint8Array): number => {
  const ptr = M._malloc(data.length)
  M.HEAPU8.set(data, ptr)
  return ptr
}

export const writeStr = (M: SoftHSMModule, s: string): number => {
  const bytes = new TextEncoder().encode(s)
  const ptr = M._malloc(bytes.length + 1)
  M.HEAPU8.set(bytes, ptr)
  M.HEAPU8[ptr + bytes.length] = 0
  return ptr
}
