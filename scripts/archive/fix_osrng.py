import re

path = '../softhsmv3/rust/src/ffi.rs'
with open(path) as f:
    text = f.read()

text = text.replace('use rand::rngs::OsRng;\n', '')

old_mlkem = '''                let mut rng = OsRng;
                match ps {
                    CKP_ML_KEM_512 => {
                        let (dk, ek) = ml_kem::MlKem512::generate(&mut rng);
                        pub_attrs.insert(CKA_VALUE, ek.as_bytes().as_slice().to_vec());
                        prv_attrs.insert(CKA_VALUE, dk.as_bytes().as_slice().to_vec());
                    }
                    CKP_ML_KEM_768 => {
                        let (dk, ek) = ml_kem::MlKem768::generate(&mut rng);
                        pub_attrs.insert(CKA_VALUE, ek.as_bytes().as_slice().to_vec());
                        prv_attrs.insert(CKA_VALUE, dk.as_bytes().as_slice().to_vec());
                    }
                    CKP_ML_KEM_1024 => {
                        let (dk, ek) = ml_kem::MlKem1024::generate(&mut rng);
                        pub_attrs.insert(CKA_VALUE, ek.as_bytes().as_slice().to_vec());
                        prv_attrs.insert(CKA_VALUE, dk.as_bytes().as_slice().to_vec());
                    }
                    _ => return CKR_MECHANISM_PARAM_INVALID,
                }'''

new_mlkem = '''                with_rng!(rng, {
                    match ps {
                        CKP_ML_KEM_512 => {
                            let (dk, ek) = ml_kem::MlKem512::generate(&mut rng);
                            pub_attrs.insert(CKA_VALUE, ek.as_bytes().as_slice().to_vec());
                            prv_attrs.insert(CKA_VALUE, dk.as_bytes().as_slice().to_vec());
                        }
                        CKP_ML_KEM_768 => {
                            let (dk, ek) = ml_kem::MlKem768::generate(&mut rng);
                            pub_attrs.insert(CKA_VALUE, ek.as_bytes().as_slice().to_vec());
                            prv_attrs.insert(CKA_VALUE, dk.as_bytes().as_slice().to_vec());
                        }
                        CKP_ML_KEM_1024 => {
                            let (dk, ek) = ml_kem::MlKem1024::generate(&mut rng);
                            pub_attrs.insert(CKA_VALUE, ek.as_bytes().as_slice().to_vec());
                            prv_attrs.insert(CKA_VALUE, dk.as_bytes().as_slice().to_vec());
                        }
                        _ => return CKR_MECHANISM_PARAM_INVALID,
                    }
                });'''
text = text.replace(old_mlkem, new_mlkem)

old_slh = '''                let mut rng = OsRng;
                match ps {
                    CKP_SLH_DSA_SHA2_128F => {
                        let (pk, sk) = crate::slh_dsa_keygen::slh_dsa_sha2_128f_generate(&mut rng);
                        (CKP_SLH_DSA_SHA2_128F, sk, pk)
                    }
                    CKP_SLH_DSA_SHA2_128S => {
                        let (pk, sk) = crate::slh_dsa_keygen::slh_dsa_sha2_128s_generate(&mut rng);
                        (CKP_SLH_DSA_SHA2_128S, sk, pk)
                    }
                    CKP_SLH_DSA_SHA2_192F => {
                        let (pk, sk) = crate::slh_dsa_keygen::slh_dsa_sha2_192f_generate(&mut rng);
                        (CKP_SLH_DSA_SHA2_192F, sk, pk)
                    }
                    CKP_SLH_DSA_SHA2_192S => {
                        let (pk, sk) = crate::slh_dsa_keygen::slh_dsa_sha2_192s_generate(&mut rng);
                        (CKP_SLH_DSA_SHA2_192S, sk, pk)
                    }
                    CKP_SLH_DSA_SHA2_256F => {
                        let (pk, sk) = crate::slh_dsa_keygen::slh_dsa_sha2_256f_generate(&mut rng);
                        (CKP_SLH_DSA_SHA2_256F, sk, pk)
                    }
                    CKP_SLH_DSA_SHA2_256S => {
                        let (pk, sk) = crate::slh_dsa_keygen::slh_dsa_sha2_256s_generate(&mut rng);
                        (CKP_SLH_DSA_SHA2_256S, sk, pk)
                    }
                    _ => return CKR_MECHANISM_PARAM_INVALID,
                }'''

new_slh = '''                with_rng!(rng, {
                    match ps {
                        CKP_SLH_DSA_SHA2_128F => {
                            let (pk, sk) = crate::slh_dsa_keygen::slh_dsa_sha2_128f_generate(&mut rng);
                            (CKP_SLH_DSA_SHA2_128F, sk, pk)
                        }
                        CKP_SLH_DSA_SHA2_128S => {
                            let (pk, sk) = crate::slh_dsa_keygen::slh_dsa_sha2_128s_generate(&mut rng);
                            (CKP_SLH_DSA_SHA2_128S, sk, pk)
                        }
                        CKP_SLH_DSA_SHA2_192F => {
                            let (pk, sk) = crate::slh_dsa_keygen::slh_dsa_sha2_192f_generate(&mut rng);
                            (CKP_SLH_DSA_SHA2_192F, sk, pk)
                        }
                        CKP_SLH_DSA_SHA2_192S => {
                            let (pk, sk) = crate::slh_dsa_keygen::slh_dsa_sha2_192s_generate(&mut rng);
                            (CKP_SLH_DSA_SHA2_192S, sk, pk)
                        }
                        CKP_SLH_DSA_SHA2_256F => {
                            let (pk, sk) = crate::slh_dsa_keygen::slh_dsa_sha2_256f_generate(&mut rng);
                            (CKP_SLH_DSA_SHA2_256F, sk, pk)
                        }
                        CKP_SLH_DSA_SHA2_256S => {
                            let (pk, sk) = crate::slh_dsa_keygen::slh_dsa_sha2_256s_generate(&mut rng);
                            (CKP_SLH_DSA_SHA2_256S, sk, pk)
                        }
                        _ => return CKR_MECHANISM_PARAM_INVALID,
                    }
                })'''
text = text.replace(old_slh, new_slh)

old_ecdsa_256 = '''            let mut rng = rand::rngs::OsRng;
            let (sig_bytes, _) = sk.sign_recoverable_with_rng(&mut rng, digest);'''
new_ecdsa_256 = '''            let (sig_bytes, _) = with_rng!(rng, { sk.sign_recoverable_with_rng(&mut rng, digest) });'''
text = text.replace(old_ecdsa_256, new_ecdsa_256)

old_ecdsa_384 = '''            let mut rng = rand::rngs::OsRng;
            let (sig_bytes, _) = sk.sign_recoverable_with_rng(&mut rng, digest);'''
new_ecdsa_384 = '''            let (sig_bytes, _) = with_rng!(rng, { sk.sign_recoverable_with_rng(&mut rng, digest) });'''
text = text.replace(old_ecdsa_384, new_ecdsa_384)

old_ecdsa_256_ref = '''            let mut rng = rand::rngs::OsRng;
            let (sig_bytes, _) = sk.sign_recoverable_with_rng(&mut rng, &digest);'''
new_ecdsa_256_ref = '''            let (sig_bytes, _) = with_rng!(rng, { sk.sign_recoverable_with_rng(&mut rng, &digest) });'''
text = text.replace(old_ecdsa_256_ref, new_ecdsa_256_ref)

old_ecc = '''    let priv_bytes_vec = match bit_len {
        256 => {
            let mut rng = OsRng;
            let sk = p256::SecretKey::random(&mut rng);
            let pk = sk.public_key();
            let pk_sec1 = pk.to_sec1_bytes();
            pub_bytes = pk_sec1.to_vec();
            sk.to_bytes().to_vec()
        }
        384 => {
            let mut rng = OsRng;
            let sk = p384::SecretKey::random(&mut rng);
            let pk = sk.public_key();
            let pk_sec1 = pk.to_sec1_bytes();
            pub_bytes = pk_sec1.to_vec();
            sk.to_bytes().to_vec()
        }
        _ => return CKR_TEMPLATE_INCONSISTENT,
    };'''
new_ecc = '''    let priv_bytes_vec = match bit_len {
        256 => {
            let sk = with_rng!(rng, { p256::SecretKey::random(&mut rng) });
            let pk = sk.public_key();
            let pk_sec1 = pk.to_sec1_bytes();
            pub_bytes = pk_sec1.to_vec();
            sk.to_bytes().to_vec()
        }
        384 => {
            let sk = with_rng!(rng, { p384::SecretKey::random(&mut rng) });
            let pk = sk.public_key();
            let pk_sec1 = pk.to_sec1_bytes();
            pub_bytes = pk_sec1.to_vec();
            sk.to_bytes().to_vec()
        }
        _ => return CKR_TEMPLATE_INCONSISTENT,
    };'''
text = text.replace(old_ecc, new_ecc)

old_rsa_2 = '''                let mut rng = rand::rngs::OsRng;
                // Note: The original RSA keygen logic was mocked out here. Just leaving structure for now.
                vec![]'''
new_rsa_2 = '''                with_rng!(rng, { rsa::RsaPrivateKey::new(&mut rng, mod_len as usize * 8).ok() });
                // Note: The original RSA keygen logic was mocked out. Just leaving structure for now.
                vec![]'''
text = text.replace(old_rsa_2, new_rsa_2)

old_rngs_osrng = 'use rand::rngs::OsRng;'
text = text.replace(old_rngs_osrng, '')

with open(path, 'w') as f:
    f.write(text)
