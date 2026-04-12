// SPDX-License-Identifier: GPL-3.0-only
/**
 * Minimal type stubs for Capacitor plugin packages used via dynamic import.
 * All imports are wrapped in try/catch and guarded by isNativeApp() — these
 * declarations exist solely to satisfy the TypeScript compiler.
 */

declare module '@capacitor/haptics' {
  export enum ImpactStyle {
    Light = 'LIGHT',
    Medium = 'MEDIUM',
    Heavy = 'HEAVY',
  }
  export enum NotificationType {
    Success = 'SUCCESS',
    Warning = 'WARNING',
    Error = 'ERROR',
  }
  export const Haptics: {
    impact(options: { style: ImpactStyle }): Promise<void>
    notification(options: { type: NotificationType }): Promise<void>
  }
}

declare module '@capacitor/browser' {
  export const Browser: {
    open(options: { url: string; presentationStyle?: string }): Promise<void>
  }
}

declare module '@capacitor/share' {
  export const Share: {
    share(options: {
      title: string
      text?: string
      url?: string
      dialogTitle?: string
    }): Promise<void>
  }
}

declare module '@capacitor/app' {
  export const App: {
    addListener(event: 'backButton', handler: () => void): Promise<unknown>
    addListener(
      event: 'appStateChange',
      handler: (state: { isActive: boolean }) => void
    ): Promise<unknown>
    exitApp(): Promise<void>
  }
}

declare module '@capacitor/preferences' {
  export const Preferences: {
    get(options: { key: string }): Promise<{ value: string | null }>
    set(options: { key: string; value: string }): Promise<void>
  }
}
