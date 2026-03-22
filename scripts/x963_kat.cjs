const crypto = require('crypto')

function x963_kdf(z, sharedInfo, keyLen) {
  let out = Buffer.alloc(0)
  let counter = 1
  while (out.length < keyLen) {
    let counterBuf = Buffer.alloc(4)
    counterBuf.writeUInt32BE(counter, 0)
    let hash = crypto.createHash('sha256')
    hash.update(z)
    hash.update(counterBuf)
    hash.update(sharedInfo)
    out = Buffer.concat([out, hash.digest()])
    counter++
  }
  return out.slice(0, keyLen)
}

// Generate test vectors
const Z = Buffer.from('0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20', 'hex')
const SharedInfo = Buffer.from('5g_suci_ephemeral_pub_key_mock_data_1234567890abcdef', 'utf8')
const K = x963_kdf(Z, SharedInfo, 64)

console.log('Z:', Z.toString('hex'))
console.log('SharedInfo:', SharedInfo.toString('hex'))
console.log('Output(64 bytes):', K.toString('hex'))
