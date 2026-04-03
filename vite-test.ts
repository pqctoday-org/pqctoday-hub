import { getHsmEngine } from './src/wasm/hsmOrchestrator'
import { hsm_generateECKeyPair } from './src/wasm/softhsm'

async function verify() {
  console.log('Loading HSM...')
  const hsm = await getHsmEngine()
  console.log('HSM Loaded! Testing X25519...')
  try {
    const args = [hsm.module, hsm.hSession, 'X25519', false, undefined] as const
    const k1 = hsm_generateECKeyPair(...args)
    console.log('[SUCCESS] No Label. Handles:', k1)
  } catch (e) {
    console.error('[FAIL] No Label:', e.message)
  }

  try {
    const args = [hsm.module, hsm.hSession, 'X25519', false, '5G Label'] as const
    const k1 = hsm_generateECKeyPair(...args)
    console.log('[SUCCESS] With Label. Handles:', k1)
  } catch (e) {
    console.error('[FAIL] With Label:', e.message)
  }
}
verify().catch(console.error)
