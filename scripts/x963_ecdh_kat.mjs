import crypto from 'crypto';

const alice = crypto.createECDH('prime256v1');
alice.generateKeys();
const bob = crypto.createECDH('prime256v1');
bob.generateKeys();

const z = alice.computeSecret(bob.getPublicKey());

console.log('Alice Priv:', alice.getPrivateKey().toString('hex'));
console.log('Bob Pub (uncompressed):', bob.getPublicKey().toString('hex'));
console.log('Z (Shared Secret):', z.toString('hex'));

function x963_kdf(z, sharedInfo, keyLen) {
    let out = Buffer.alloc(0);
    let counter = 1;
    while (out.length < keyLen) {
        let counterBuf = Buffer.alloc(4);
        counterBuf.writeUInt32BE(counter, 0);
        let hash = crypto.createHash('sha256');
        hash.update(z);
        hash.update(counterBuf);
        hash.update(sharedInfo);
        out = Buffer.concat([out, hash.digest()]);
        counter++;
    }
    return out.slice(0, keyLen);
}

const SharedInfo = Buffer.from('5g_suci_ephemeral_pub_key_mock_data_1234567890abcdef', 'utf8');
const K = x963_kdf(z, SharedInfo, 64);

console.log('\nSharedInfo:', SharedInfo.toString('hex'));
console.log('K (Output):', K.toString('hex'));
