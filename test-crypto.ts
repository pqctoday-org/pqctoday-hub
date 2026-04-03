import { getHsmEngine } from './src/wasm/hsmOrchestrator.ts'
import { hsm_generateECKeyPair } from './src/wasm/softhsm.ts'

async function verify() {
  const hsm = await getHsmEngine()
  console.log('Testing P-256...')
  const k1 = hsm_generateECKeyPair(hsm.module, hsm.hSession, 'P-256', false, '5G Label')
  console.log('P-256 SUCCESS. Handles:', k1)

  console.log('Testing X25519...')
  const k2 = hsm_generateECKeyPair(hsm.module, hsm.hSession, 'X25519', false, '5G Label')
  console.log('X25519 SUCCESS. Handles:', k2)
}
verify().catch(console.error)
