import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import { RV_NAMES, PKCS11_PARAMS } from './constants'

export const rvName = (rv: number): string => RV_NAMES[rv] || `CKR_UNKNOWN(0x${rv.toString(16)})`

export const checkRV = (rv: number, op: string): void => {
  const rvu = rv >>> 0
  if (rvu !== 0) {
    throw new Error(`${op} failed: ${rvName(rvu)}`)
  }
}

export const createLoggingProxy = (
  M: SoftHSMModule,
  onLog: (entry: any) => void
): SoftHSMModule => {
  const proxy = new Proxy(M, {
    get(target, prop, receiver) {
      const orig = Reflect.get(target, prop, receiver)
      if (typeof prop !== 'string' || !prop.startsWith('_C_') || typeof orig !== 'function') {
        return orig
      }
      return function (...args: any[]) {
        const start = performance.now()
        const rv = orig.apply(M, args)
        const end = performance.now()

        const rvUnsigned = (rv as number) >>> 0
        const fnName = prop.slice(1)

        // Basic inspect
        const inspect = {
          hasArgs: args.length > 0,
        }

        const entry: any = {
          id: Math.random().toString(36).slice(2),
          timestamp: new Date().toISOString(),
          fnSymbol: fnName,
          args,
          rv: rvUnsigned,
          rvName: rvName(rvUnsigned),
          durationMs: end - start,
          // @ts-ignore
          inspect,
        }

        onLog(entry)
        return rv
      }
    },
  })
  return proxy as SoftHSMModule
}
