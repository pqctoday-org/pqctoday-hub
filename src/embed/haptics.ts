// SPDX-License-Identifier: GPL-3.0-only
import { isNativeApp } from './platform'

/**
 * Haptic feedback utilities for native context.
 * Silent no-op when running in a browser — safe to call unconditionally.
 */

export async function hapticImpact(style: 'light' | 'medium' | 'heavy' = 'medium'): Promise<void> {
  if (!isNativeApp()) return
  try {
    const { Haptics, ImpactStyle } = await import(/* @vite-ignore */ '@capacitor/haptics')
    const styleMap = {
      light: ImpactStyle.Light,
      medium: ImpactStyle.Medium,
      heavy: ImpactStyle.Heavy,
    }
    await Haptics.impact({ style: styleMap[style] })
  } catch {
    /* graceful no-op */
  }
}

export async function hapticNotification(
  type: 'success' | 'warning' | 'error' = 'success'
): Promise<void> {
  if (!isNativeApp()) return
  try {
    const { Haptics, NotificationType } = await import(/* @vite-ignore */ '@capacitor/haptics')
    const typeMap = {
      success: NotificationType.Success,
      warning: NotificationType.Warning,
      error: NotificationType.Error,
    }
    await Haptics.notification({ type: typeMap[type] })
  } catch {
    /* graceful no-op */
  }
}
