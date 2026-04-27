#include <openssl/bio.h> // For BIO operations
#include <openssl/conf.h>
#include <openssl/err.h>
#include <openssl/objects.h> // For OBJ_nid2sn
#include <openssl/pem.h>     // For PEM_read_bio_X509
#include <openssl/ssl.h>
#include <openssl/trace.h> // For OSSL_trace calls
#include <openssl/x509.h>  // For X509_get_signature_nid
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#else
#define EMSCRIPTEN_KEEPALIVE
#endif

/* HSM mode hooks — defined in tls_simulation_hsm.c. When enabled, the server
 * private key is generated inside the WASM-linked softhsmv3 token and the
 * CertificateVerify sign operation routes through pkcs11-provider during the
 * handshake. Returns 0 on no-op / success; non-zero on error. */
extern int hsm_mode_enabled(void);
extern int hsm_setup_server_credentials(SSL_CTX *s_ctx);

// Helper to append to valid JSON buffer
// Real implementation would use dynamic buffer resizing
#define LOG_BUFFER_SIZE                                                        \
  (10 * 1024 * 1024) // 10MB buffer for PQC keys (McEliece etc)
char log_buffer[LOG_BUFFER_SIZE];
int log_offset = 0;
static const char *current_side = "system"; // Global context for callbacks

// Ex data index to store SSL side identifier
static int ssl_side_ex_data_idx = -1;

// HRR detection: count ClientHello messages per simulation
static int client_hello_count = 0;
static int hrr_detected = 0;

// Helper to translate X509 verification errors to clear educational messages
const char *get_cert_verify_explanation(int verify_err) {
  switch (verify_err) {
  // Chain of Trust failures
  case X509_V_ERR_UNABLE_TO_GET_ISSUER_CERT:
  case X509_V_ERR_UNABLE_TO_GET_ISSUER_CERT_LOCALLY:
    return "Chain of Trust: Unable to find issuer certificate. The CA that "
           "signed this certificate is not in the trusted store.";
  case X509_V_ERR_DEPTH_ZERO_SELF_SIGNED_CERT:
    return "Chain of Trust: Self-signed certificate not in trusted store. Add "
           "the CA certificate to verify this chain.";
  case X509_V_ERR_SELF_SIGNED_CERT_IN_CHAIN:
    return "Chain of Trust: Self-signed certificate in chain but not trusted. "
           "Import the Root CA.";
  case X509_V_ERR_CERT_UNTRUSTED:
    return "Chain of Trust: Certificate is not trusted. Verify the CA is "
           "correctly configured.";
  case X509_V_ERR_CERT_SIGNATURE_FAILURE:
    return "Chain of Trust: Certificate signature verification failed. The "
           "certificate may be corrupt or signed with an unsupported "
           "algorithm.";

  // Validity Period failures
  case X509_V_ERR_CERT_NOT_YET_VALID:
    return "Validity Period: Certificate is not yet valid. The 'Not Before' "
           "date is in the future.";
  case X509_V_ERR_CERT_HAS_EXPIRED:
    return "Validity Period: Certificate has expired. The 'Not After' date has "
           "passed.";
  case X509_V_ERR_ERROR_IN_CERT_NOT_BEFORE_FIELD:
    return "Validity Period: Invalid 'Not Before' date format in certificate.";
  case X509_V_ERR_ERROR_IN_CERT_NOT_AFTER_FIELD:
    return "Validity Period: Invalid 'Not After' date format in certificate.";

  // Key Usage failures
  case X509_V_ERR_INVALID_PURPOSE:
    return "Key Usage: Certificate cannot be used for this purpose. Check if "
           "'clientAuth' or 'serverAuth' Extended Key Usage is set correctly.";

  // Other common errors
  case X509_V_ERR_CERT_REVOKED:
    return "Revocation: Certificate has been revoked by the issuing CA.";
  case X509_V_ERR_NO_EXPLICIT_POLICY:
    return "Policy: No explicit certificate policy found.";

  default:
    return NULL; // Return NULL for unknown errors to use default message
  }
}
void reset_log() {
  log_offset = 0;
  strcpy(log_buffer, "{\"trace\":[");
  log_offset = 10;
}

void log_event(const char *side, const char *event, const char *details) {
  // 1. Check if we have enough space for this entry + the eventual footer
  // Buffer can hold up to 16KB of escaped details + JSON overhead (~200 bytes)
  // Footer needs ~128 bytes. Total entry max = ~17KB
  size_t footer_reserve = 512;
  size_t max_entry_size = 17000;
  if (log_offset + max_entry_size >= LOG_BUFFER_SIZE - footer_reserve) {
    // Buffer full, silently drop event to preserve footer space
    return;
  }

  // 2. Add comma if not first item
  if (log_offset > 10) {
    log_buffer[log_offset++] = ',';
    log_buffer[log_offset] = 0;
  }

  // 3. Escape special characters (16KB buffer for PQC keys/traces)
  char safe_details[16384];
  if (details) {
    const char *src = details;
    char *dst = safe_details;
    int len = 0;
    while (*src && len < 16370) {
      unsigned char c = (unsigned char)*src;
      // Escape JSON control chars
      if (c == '"' || c == '\\') {
        *dst++ = '\\';
        *dst++ = c;
        len += 2;
      } else if (c == '\n') {
        *dst++ = '\\';
        *dst++ = 'n';
        len += 2;
      } else if (c == '\r') {
        *dst++ = '\\';
        *dst++ = 'r';
        len += 2;
      } else if (c == '\t') {
        *dst++ = '\\';
        *dst++ = 't';
        len += 2;
      } else if (c < 32 || c > 126) {
        *dst++ = '?';
        len++; // Replace non-printables
      } else {
        *dst++ = c;
        len++;
      }
      src++;
    }
    *dst = 0;
  } else {
    safe_details[0] = 0;
  }

  // 4. Write directly to buffer at offset (O(1))
  int written = snprintf(
      log_buffer + log_offset, LOG_BUFFER_SIZE - log_offset - footer_reserve,
      "{\"side\":\"%s\",\"event\":\"%s\",\"details\":\"%s\"}", side, event,
      safe_details);

  if (written > 0) {
    log_offset += written;
  }
}

void close_log(const char *status, const char *error) {
  // 5. Append Footer - We guaranteed space in log_event
  // But strictly ensure we don't overflow
  size_t remaining = LOG_BUFFER_SIZE - log_offset;

  // Basic footer
  snprintf(log_buffer + log_offset, remaining,
           "],\"status\":\"%s\",\"error\":\"%s\"}", status, error ? error : "");
}

// Helper: Inspect CA file and log its key type
void log_ca_details(const char *side, const char *caFile) {
  BIO *b = BIO_new_file(caFile, "r");
  if (!b)
    return;

  X509 *cert = PEM_read_bio_X509(b, NULL, NULL, NULL);
  if (cert) {
    EVP_PKEY *pkey = X509_get_pubkey(cert);
    if (pkey) {
      // EVP_PKEY_get0_type_name() works for all OpenSSL 3.x key types
      // including PQC (ML-DSA, SLH-DSA). EVP_PKEY_base_id()/OBJ_nid2sn()
      // returns NID_undef for provider-based keys.
      const char *name = EVP_PKEY_get0_type_name(pkey);
      char details[256];
      snprintf(details, sizeof(details), "CA Key Type: %s",
               (name && name[0]) ? name : "Unknown");
      log_event(side, "config_ca_details", details);

      EVP_PKEY_free(pkey);
    }
    X509_free(cert);
  }
  BIO_free(b);
}

// CONFIGURATION PARSER
void apply_config(SSL_CTX *ctx, const char *path, const char *side) {
  if (!path || access(path, F_OK) != 0)
    return;

  CONF *conf = NCONF_new(NULL);
  if (!NCONF_load(conf, path, NULL)) {
    char err[128];
    snprintf(err, sizeof(err), "Failed to load config: %s", path);
    log_event(side, "warning", err);
    NCONF_free(conf);
    return;
  }

  log_event(side, "config", "Loaded configuration file");

  char *section = "system_default_sect";

  // 1. Cipher Suites
  char *ciphers = NCONF_get_string(conf, section, "Ciphersuites");
  if (ciphers && strlen(ciphers) > 0) {
    if (SSL_CTX_set_ciphersuites(ctx, ciphers) == 1) {
      char msg[256];
      snprintf(msg, sizeof(msg), "Set Ciphers: %s", ciphers);
      log_event(side, "config_ciphers", msg);
    } else {
      log_event(side, "error", "Failed to set Ciphersuites");
    }
  }

  // 2. Groups
  char *groups = NCONF_get_string(conf, section, "Groups");
  if (groups && strlen(groups) > 0) {
    if (SSL_CTX_set1_groups_list(ctx, groups) == 1) {
      log_event(side, "config_groups", groups);
    }
  }

  // 3. Signature Algorithms
  char *sigalgs = NCONF_get_string(conf, section, "SignatureAlgorithms");
  if (sigalgs && strlen(sigalgs) > 0) {
    if (SSL_CTX_set1_sigalgs_list(ctx, sigalgs) == 1) {
      log_event(side, "config_sigalgs", sigalgs);
    }
  }

  // 4. Verify Mode
  char *verify = NCONF_get_string(conf, section, "VerifyMode");
  if (verify) {
    int mode = SSL_VERIFY_NONE;
    if (strstr(verify, "Peer"))
      mode |= SSL_VERIFY_PEER;
    if (strstr(verify, "Request"))
      mode |= SSL_VERIFY_FAIL_IF_NO_PEER_CERT;

    if (mode != SSL_VERIFY_NONE) {
      SSL_CTX_set_verify(ctx, mode, NULL);
      log_event(side, "config_verify", "Enabled Client Verification");
    }
  }

  // 5. CA File (Critical for Verify)
  char *caFile = NCONF_get_string(conf, section, "VerifyCAFile");
  if (caFile) {
    if (SSL_CTX_load_verify_locations(ctx, caFile, NULL) == 1) {
      log_event(side, "config_ca", "Loaded CA File");

      // INSPECT CA CERTIFICATE TYPE
      log_ca_details(side, caFile);

      // Set Client CA List for server to request correct certs
      STACK_OF(X509_NAME) *list = SSL_load_client_CA_file(caFile);
      if (list)
        SSL_CTX_set_client_CA_list(ctx, list);
    }
  }

  NCONF_free(conf);
}

// Helper: Process pending reads
int process_reads(SSL *ssl, const char *side) {
  current_side = side; // Set context for decryption traces
  char buf[4096];
  int read_bytes = SSL_read(ssl, buf, sizeof(buf) - 1);
  if (read_bytes > 0) {
    buf[read_bytes] = 0; // Null terminate
    char msg[4200];
    snprintf(msg, sizeof(msg), "Received: %s", buf);
    log_event(side, "message_received", msg);
    return 1;
  }

  int err = SSL_get_error(ssl, read_bytes);
  if (err == SSL_ERROR_ZERO_RETURN) {
    log_event(side, "connection_closed",
              "Peer closed connection (close_notify)");
    return -1; // Closed
  }
  // SSL_ERROR_WANT_READ is normal if no data
  return 0;
}

// Helper: Flush BIOs (move data between memory buffers)
// KEYLOG CALLBACK - logs secrets with proper side attribution
void keylog_callback(const SSL *ssl, const char *line) {
  // Retrieve the side from ex_data
  const char *side = "system";
  if (ssl_side_ex_data_idx >= 0) {
    side = (const char *)SSL_get_ex_data(ssl, ssl_side_ex_data_idx);
    if (!side)
      side = "system";
  }
  log_event(side, "keylog", line);
}

// TRACE CALLBACK
size_t trace_callback(const char *buffer, size_t count, int category, int cmd,
                      void *data) {
  if (cmd != OSSL_TRACE_CTRL_WRITE)
    return 0;

  const char *side = current_side; // Use global context

  if (count > 0 && buffer) {
    char msg[16384];
    size_t len = count < 16383 ? count : 16383;
    memcpy(msg, buffer, len);
    msg[len] = 0;

    // Remove trailing newlines
    while (len > 0 && (msg[len - 1] == '\n' || msg[len - 1] == '\r')) {
      msg[--len] = 0;
    }

    if (len == 0)
      return count;

    const char *event_type = "crypto_trace_other";
    if (category == OSSL_TRACE_CATEGORY_TLS_CIPHER) {
      event_type = "crypto_trace_data";
    } else if (category == OSSL_TRACE_CATEGORY_TLS) {
      event_type = "crypto_trace_state";
    } else if (category == OSSL_TRACE_CATEGORY_INIT) {
      event_type = "crypto_trace_init";
    } else if (category == OSSL_TRACE_CATEGORY_PROVIDER) {
      event_type = "crypto_trace_provider";
    } else if (category == OSSL_TRACE_CATEGORY_QUERY ||
               category == OSSL_TRACE_CATEGORY_STORE) {
      event_type = "crypto_trace_evp";
    } else if (category == OSSL_TRACE_CATEGORY_DECODER ||
               category == OSSL_TRACE_CATEGORY_ENCODER) {
      event_type = "crypto_trace_coder";
    }

    log_event(side, event_type, msg);
  }
  return count;
}

// MSG CALLBACK — detects individual handshake messages including HRR
void msg_callback(int write_p, int version, int content_type,
                  const void *buf, size_t len, SSL *ssl, void *arg) {
  // Only process handshake messages (content_type 22)
  if (content_type != SSL3_RT_HANDSHAKE || len < 1)
    return;

  const char *side = "system";
  if (ssl_side_ex_data_idx >= 0) {
    side = (const char *)SSL_get_ex_data(ssl, ssl_side_ex_data_idx);
    if (!side)
      side = "system";
  }

  unsigned char msg_type = ((const unsigned char *)buf)[0];

  // Track ClientHello sends from the client side
  // msg_type 1 = ClientHello, write_p = 1 means sending
  if (msg_type == 1 && write_p && strcmp(side, "client") == 0) {
    client_hello_count++;
    if (client_hello_count == 1) {
      log_event("client", "handshake_msg", "ClientHello sent (initial)");
    } else if (client_hello_count == 2) {
      hrr_detected = 1;
      log_event("client", "hello_retry",
                "HelloRetryRequest: Server requested different key exchange "
                "group. Client sending second ClientHello with updated "
                "key_share. Handshake is now 2-RTT instead of 1-RTT.");
    }
  }

  // Detect ServerHello (msg_type 2) received by client
  // In TLS 1.3, HelloRetryRequest is a ServerHello with a special random
  // OpenSSL state machine handles this internally; we detect it via the
  // client_hello_count (if a second ClientHello follows, HRR happened)
  if (msg_type == 2 && !write_p && strcmp(side, "client") == 0) {
    if (client_hello_count == 1 && !hrr_detected) {
      // First ServerHello — could be HRR or real ServerHello
      // We'll know after the next message (if client sends another CH)
      log_event("client", "handshake_msg", "ServerHello received");
    }
  }

  // CertificateVerify (msg_type 15) sent by server — when HSM mode is active
  // the private key lives in softhsmv3 and pkcs11-provider routes sign through
  // C_SignInit + C_Sign.  We synthesise those log events here so the PKCS#11
  // log panel shows the sign operation that happened in the HSM.
  if (msg_type == 15 && write_p && strcmp(side, "server") == 0 &&
      hsm_mode_enabled()) {
    log_event("server", "pkcs11_call",
              "C_SignInit(CKM_ML_DSA) — CertificateVerify: ML-DSA sign over TLS transcript hash");
    char sig_msg[128];
    snprintf(sig_msg, sizeof(sig_msg),
             "C_Sign → ML-DSA signature (%zu B) over TLS 1.3 transcript hash (private key never exposed)",
             len);
    log_event("server", "pkcs11_call", sig_msg);
    log_event("server", "pkcs11_call",
              "CertificateVerify routed through pkcs11-provider → softhsmv3");
  }
}

// INFO CALLBACK - logs TLS handshake state transitions
void info_callback(const SSL *ssl, int where, int ret) {
  const char *side = "system";
  if (ssl_side_ex_data_idx >= 0) {
    side = (const char *)SSL_get_ex_data(ssl, ssl_side_ex_data_idx);
    if (!side)
      side = "system";
  }

  // Log handshake lifecycle events
  if (where & SSL_CB_HANDSHAKE_START) {
    log_event(side, "handshake_start", "TLS handshake initiated");
  }
  if (where & SSL_CB_HANDSHAKE_DONE) {
    log_event(side, "handshake_done", "TLS handshake completed");
  }

  // Log specific TLS 1.3 state transitions
  if (where & SSL_CB_LOOP) {
    const char *state = SSL_state_string_long(ssl);
    if (state && strlen(state) > 0) {
      log_event(side, "handshake_state", state);
    }
  }

  // Log alerts
  if (where & SSL_CB_ALERT) {
    char msg[256];
    const char *alert_type = (where & SSL_CB_READ) ? "received" : "sending";
    snprintf(msg, sizeof(msg), "Alert %s: %s %s", alert_type,
             SSL_alert_type_string_long(ret), SSL_alert_desc_string_long(ret));
    log_event(side, "alert", msg);
  }
}

// Helper to pump data between BIOs and log wire format
int pump_flash_drive(BIO *from, BIO *to, const char *sender) {
  char buf[16384];
  int total = 0;
  int pending = BIO_pending(from);

  while (pending > 0) {
    int read = BIO_read(from, buf, sizeof(buf));
    if (read <= 0)
      break;

    // Log Wire Data
    char msg[4096]; // Sufficient for 1024 bytes hex (3 chars/byte + overhead)
    char *p = msg;
    int limit = read > 1024 ? 1024 : read; // Cap log size

    for (int i = 0; i < limit; i++) {
      p += sprintf(p, "%02X ", (unsigned char)buf[i]);
    }
    if (read > limit)
      sprintf(p, "... (%d bytes)", read);

    // Use new event type
    log_event(sender, "wire_data", msg);

    BIO_write(to, buf, read);
    total += read;
    pending = BIO_pending(from);
  }
  return total;
}

// Main execution function exposed to JS
EMSCRIPTEN_KEEPALIVE
char *execute_tls_simulation(const char *client_conf_path,
                             const char *server_conf_path,
                             const char *script_path) {
  SSL_CTX *c_ctx = NULL;
  SSL_CTX *s_ctx = NULL;
  SSL *c_ssl = NULL;
  SSL *s_ssl = NULL;
  BIO *c_bio = NULL;
  BIO *s_bio = NULL;
  int ret = 0;

  reset_log();
  client_hello_count = 0;
  hrr_detected = 0;

  // 1. Initialize Contexts
  c_ctx = SSL_CTX_new(TLS_client_method());
  s_ctx = SSL_CTX_new(TLS_server_method());

  if (!c_ctx || !s_ctx) {
    close_log("error", "Failed to create SSL contexts");
    return log_buffer;
  }

  // 2. Configure Client
  SSL_CTX_set_min_proto_version(c_ctx, TLS1_3_VERSION);
  SSL_CTX_set_max_proto_version(c_ctx, TLS1_3_VERSION);

  if (client_conf_path)
    apply_config(c_ctx, client_conf_path, "client");

  if (access("/ssl/client.crt", F_OK) == 0) {
    SSL_CTX_use_certificate_file(c_ctx, "/ssl/client.crt", SSL_FILETYPE_PEM);
    if (access("/ssl/client.key", F_OK) == 0)
      SSL_CTX_use_PrivateKey_file(c_ctx, "/ssl/client.key", SSL_FILETYPE_PEM);
  }
  // Load CA to verify server certificate
  if (access("/ssl/client-ca.crt", F_OK) == 0) {
    if (SSL_CTX_load_verify_locations(c_ctx, "/ssl/client-ca.crt", NULL) > 0)
      SSL_CTX_set_verify(c_ctx, SSL_VERIFY_PEER, NULL);
  }
  log_event("client", "init", "Created TLS 1.3 Client Context");

  // 3. Configure Server
  SSL_CTX_set_min_proto_version(s_ctx, TLS1_3_VERSION);
  SSL_CTX_set_max_proto_version(s_ctx, TLS1_3_VERSION);

  if (server_conf_path)
    apply_config(s_ctx, server_conf_path, "server");

  if (hsm_mode_enabled()) {
    /* HSM mode: server private key is generated inside softhsmv3 and
     * referenced via a pkcs11: URI loaded through pkcs11-provider. The PEM
     * server.key on disk (if any) is intentionally ignored. */
    if (hsm_setup_server_credentials(s_ctx) != 0) {
      log_event("server", "warning",
                "HSM setup failed; falling back to PEM server cert/key");
      if (access("/ssl/server.crt", F_OK) == 0)
        SSL_CTX_use_certificate_file(s_ctx, "/ssl/server.crt", SSL_FILETYPE_PEM);
      if (access("/ssl/server.key", F_OK) == 0)
        SSL_CTX_use_PrivateKey_file(s_ctx, "/ssl/server.key", SSL_FILETYPE_PEM);
    } else if (access("/ssl/hsm-server.crt", F_OK) == 0) {
      /* HSM succeeded: the server cert is self-signed with ML-DSA-65.
       * Add it to the client's trust store so the chain-of-trust check passes. */
      SSL_CTX_load_verify_locations(c_ctx, "/ssl/hsm-server.crt", NULL);
      SSL_CTX_set_verify(c_ctx, SSL_VERIFY_PEER, NULL);
      log_event("client", "hsm_ca_loaded",
                "HSM self-signed cert added to client trust store");
    }
  } else {
    if (access("/ssl/server.crt", F_OK) == 0) {
      SSL_CTX_use_certificate_file(s_ctx, "/ssl/server.crt", SSL_FILETYPE_PEM);
    }
    if (access("/ssl/server.key", F_OK) == 0) {
      SSL_CTX_use_PrivateKey_file(s_ctx, "/ssl/server.key", SSL_FILETYPE_PEM);
    }
  }
  // Load CA to verify client certificate (mTLS)
  if (access("/ssl/server-ca.crt", F_OK) == 0) {
    SSL_CTX_load_verify_locations(s_ctx, "/ssl/server-ca.crt", NULL);
    STACK_OF(X509_NAME) *list = SSL_load_client_CA_file("/ssl/server-ca.crt");
    if (list)
      SSL_CTX_set_client_CA_list(s_ctx, list);
  }
  log_event("server", "init", "Created TLS 1.3 Server Context");

  // 4. Connect BIOs
  c_ssl = SSL_new(c_ctx);
  s_ssl = SSL_new(s_ctx);

  // Initialize ex_data index if not done
  // 4. Connect BIOs using Memory BIOs (Manual Pump to capture wire data)
  BIO *c_wbio = BIO_new(BIO_s_mem()); // Client Writes -> Server Reads
  BIO *c_rbio = BIO_new(BIO_s_mem()); // Client Reads <- Server Writes
  BIO *s_wbio = BIO_new(BIO_s_mem()); // Server Writes -> Client Reads
  BIO *s_rbio = BIO_new(BIO_s_mem()); // Server Reads <- Client Writes

  SSL_set_bio(c_ssl, c_rbio, c_wbio);
  SSL_set_bio(s_ssl, s_rbio, s_wbio);

  // Initialize ex_data index if not done
  BIO_set_mem_eof_return(c_rbio, -1);
  BIO_set_mem_eof_return(s_rbio, -1);

  if (ssl_side_ex_data_idx < 0) {
    ssl_side_ex_data_idx = SSL_get_ex_new_index(0, NULL, NULL, NULL, NULL);
  }

  // Set side identifier on each SSL object
  SSL_set_ex_data(c_ssl, ssl_side_ex_data_idx, (void *)"client");
  SSL_set_ex_data(s_ssl, ssl_side_ex_data_idx, (void *)"server");

  // 5. Handshake
  SSL_set_connect_state(c_ssl);
  SSL_set_accept_state(s_ssl);

  // Setup Info Callbacks for handshake state logging
  SSL_set_info_callback(c_ssl, info_callback);
  SSL_set_info_callback(s_ssl, info_callback);

  // Setup Message Callback for HRR detection
  SSL_CTX_set_msg_callback(c_ctx, msg_callback);
  SSL_CTX_set_msg_callback(s_ctx, msg_callback);

  // Setup Keylogging
  SSL_CTX_set_keylog_callback(c_ctx, keylog_callback);
  SSL_CTX_set_keylog_callback(s_ctx, keylog_callback);

  // Setup Tracing (Global)
  // We use a trick: trace_callback uses 'current_side' global variable
  OSSL_trace_set_callback(OSSL_TRACE_CATEGORY_TLS, trace_callback, NULL);
  OSSL_trace_set_callback(OSSL_TRACE_CATEGORY_TLS_CIPHER, trace_callback, NULL);
  // OSSL_trace_set_callback(OSSL_TRACE_CATEGORY_INIT, trace_callback, NULL); //
  // Too verbose
  OSSL_trace_set_callback(OSSL_TRACE_CATEGORY_DECODER, trace_callback, NULL);
  OSSL_trace_set_callback(OSSL_TRACE_CATEGORY_ENCODER, trace_callback, NULL);
  OSSL_trace_set_callback(OSSL_TRACE_CATEGORY_PROVIDER, trace_callback, NULL);
  OSSL_trace_set_callback(OSSL_TRACE_CATEGORY_QUERY, trace_callback, NULL);
  OSSL_trace_set_callback(OSSL_TRACE_CATEGORY_STORE, trace_callback, NULL);
  OSSL_trace_set_callback(OSSL_TRACE_CATEGORY_X509V3_POLICY, trace_callback,
                          NULL);

  int steps = 0;
  int handshake_done = 0;
  while (steps < 20 && !handshake_done) {
    steps++;
    // Pump data between BIOs
    pump_flash_drive(c_wbio, s_rbio, "client");
    pump_flash_drive(s_wbio, c_rbio, "server");

    int c_done = SSL_is_init_finished(c_ssl);
    int s_done = SSL_is_init_finished(s_ssl);

    if (!c_done) {
      current_side = "client";
      int r = SSL_do_handshake(c_ssl);
      if (r <= 0) {
        int err = SSL_get_error(c_ssl, r);
        if (err != SSL_ERROR_WANT_READ && err != SSL_ERROR_WANT_WRITE) {
          char msg[512];
          char ssl_err[256];
          ERR_error_string_n(ERR_get_error(), ssl_err, sizeof(ssl_err));
          snprintf(msg, sizeof(msg), "Client handshake error: %d - %s", err,
                   ssl_err);
          log_event("client", "error", msg);

          // Check for certificate verification error and log explanation
          long verify_err = SSL_get_verify_result(c_ssl);
          if (verify_err != X509_V_OK) {
            const char *explanation = get_cert_verify_explanation(verify_err);
            if (explanation) {
              log_event("client", "cert_verify_error", explanation);
            } else {
              char verify_msg[256];
              snprintf(verify_msg, sizeof(verify_msg),
                       "Certificate verification failed: %s",
                       X509_verify_cert_error_string(verify_err));
              log_event("client", "cert_verify_error", verify_msg);
            }
          }

          close_log("failed", "Client handshake failed");
          goto cleanup;
        }
      }
    }
    if (!s_done) {
      current_side = "server";
      int r = SSL_do_handshake(s_ssl);
      if (r <= 0) {
        int err = SSL_get_error(s_ssl, r);
        if (err != SSL_ERROR_WANT_READ && err != SSL_ERROR_WANT_WRITE) {
          char msg[512];
          char ssl_err[256];
          ERR_error_string_n(ERR_get_error(), ssl_err, sizeof(ssl_err));
          snprintf(msg, sizeof(msg), "Server handshake error: %d - %s", err,
                   ssl_err);
          log_event("server", "error", msg);

          // Check for certificate verification error (mTLS client cert
          // validation)
          long verify_err = SSL_get_verify_result(s_ssl);
          if (verify_err != X509_V_OK) {
            const char *explanation = get_cert_verify_explanation(verify_err);
            if (explanation) {
              log_event("server", "cert_verify_error", explanation);
            } else {
              char verify_msg[256];
              snprintf(verify_msg, sizeof(verify_msg),
                       "Client certificate verification failed: %s",
                       X509_verify_cert_error_string(verify_err));
              log_event("server", "cert_verify_error", verify_msg);
            }
          }

          close_log("failed", "Server handshake failed");
          goto cleanup;
        }
      }
    }

    if (SSL_is_init_finished(c_ssl) && SSL_is_init_finished(s_ssl)) {
      handshake_done = 1;
      char msg[128];
      snprintf(msg, sizeof(msg), "Negotiated: %s", SSL_get_cipher_name(c_ssl));
      log_event("connection", "established", msg);

      // Log HRR status and round-trip count
      if (hrr_detected) {
        log_event("connection", "hello_retry_summary",
                  "HelloRetryRequest occurred: handshake used 2-RTT (group "
                  "mismatch between initial ClientHello and server preference)");
        log_event("connection", "round_trips", "2");
      } else {
        log_event("connection", "round_trips", "1");
      }

      // Log the negotiated key exchange group (X25519, P-256, ML-KEM, Hybrid,
      // etc.)
      int group_nid = SSL_get_negotiated_group(c_ssl);

      char group_debug[128];
      snprintf(group_debug, sizeof(group_debug), "Debug: Group NID=%d",
               group_nid);
      log_event("connection", "debug", group_debug);

      if (group_nid > 0) {
        // Use SSL_group_to_name (OpenSSL 3.x API) - works for PQC/Hybrid groups
        const char *group_name = SSL_group_to_name(c_ssl, group_nid);
        char group_msg[128];
        if (group_name && strlen(group_name) > 0) {
          snprintf(group_msg, sizeof(group_msg), "Key Exchange: %s",
                   group_name);
        } else {
          // Final fallback: raw NID (should rarely happen with
          // SSL_group_to_name)
          snprintf(group_msg, sizeof(group_msg), "Key Exchange: NID-%d",
                   group_nid);
        }
        log_event("connection", "key_exchange", group_msg);
      } else {
        log_event("connection", "debug", "Debug: No negotiated group (NID<=0)");
      }

      // Log the negotiated TLS 1.3 signature scheme as a human-readable name.
      // SSL_get_peer_signature_nid() returns the HASH NID (e.g. NID_sha256=672),
      // not the scheme.  We combine the hash NID with the key type NID and the
      // peer cert pubkey type to reconstruct the full scheme name.
      int hash_nid = 0, type_nid = 0;
      SSL_get_peer_signature_nid(c_ssl, &hash_nid);
      SSL_get_peer_signature_type_nid(c_ssl, &type_nid);

      // Fallback: server's own sig nids
      if (hash_nid == 0) SSL_get_signature_nid(s_ssl, &hash_nid);
      if (type_nid == 0) SSL_get_signature_type_nid(s_ssl, &type_nid);

      // Resolve peer public key type from the server cert (most reliable for PQC)
      X509 *srv_cert = SSL_get_certificate(s_ssl); // non-owning
      EVP_PKEY *srv_pkey = srv_cert ? X509_get0_pubkey(srv_cert) : NULL;
      const char *pkey_type = srv_pkey ? EVP_PKEY_get0_type_name(srv_pkey) : NULL;

      // Map hash NID → lowercase suffix
      const char *hash_sfx = NULL;
      if      (hash_nid == NID_sha224) hash_sfx = "sha224";
      else if (hash_nid == NID_sha256) hash_sfx = "sha256";
      else if (hash_nid == NID_sha384) hash_sfx = "sha384";
      else if (hash_nid == NID_sha512) hash_sfx = "sha512";

      char scheme[128] = "";

      // ML-DSA — pkey type name IS the algorithm, no hash suffix
      if (pkey_type && (strstr(pkey_type, "ML-DSA") || strstr(pkey_type, "MLDSA"))) {
        if      (strstr(pkey_type, "44")) snprintf(scheme, sizeof(scheme), "mldsa44");
        else if (strstr(pkey_type, "65")) snprintf(scheme, sizeof(scheme), "mldsa65");
        else if (strstr(pkey_type, "87")) snprintf(scheme, sizeof(scheme), "mldsa87");
        else snprintf(scheme, sizeof(scheme), "%s", pkey_type);
      }
      // SLH-DSA — similarly no separate hash suffix in the scheme name
      else if (pkey_type && strstr(pkey_type, "SLH-DSA")) {
        snprintf(scheme, sizeof(scheme), "%s", pkey_type);
      }
      // EdDSA — no hash suffix
      else if (type_nid == EVP_PKEY_ED25519 ||
               (pkey_type && strcmp(pkey_type, "ED25519") == 0)) {
        snprintf(scheme, sizeof(scheme), "ed25519");
      }
      else if (type_nid == EVP_PKEY_ED448 ||
               (pkey_type && strcmp(pkey_type, "ED448") == 0)) {
        snprintf(scheme, sizeof(scheme), "ed448");
      }
      // RSA-PSS (TLS 1.3 always uses PSS for RSA)
      else if (type_nid == EVP_PKEY_RSA_PSS ||
               (pkey_type && strcmp(pkey_type, "RSA") == 0)) {
        if (hash_sfx)
          snprintf(scheme, sizeof(scheme), "rsa_pss_rsae_%s", hash_sfx);
        else
          snprintf(scheme, sizeof(scheme), "rsa_pss_rsae_nid%d", hash_nid);
      }
      // ECDSA — derive curve from key bits
      else if (type_nid == EVP_PKEY_EC ||
               (pkey_type && strcmp(pkey_type, "EC") == 0)) {
        const char *curve = "secp256r1"; // default
        if (srv_pkey) {
          int bits = EVP_PKEY_get_bits(srv_pkey);
          if (bits == 384) curve = "secp384r1";
          else if (bits == 521) curve = "secp521r1";
        }
        if (hash_sfx)
          snprintf(scheme, sizeof(scheme), "ecdsa_%s_%s", curve, hash_sfx);
        else
          snprintf(scheme, sizeof(scheme), "ecdsa_%s_nid%d", curve, hash_nid);
      }
      // Unknown — show type + hash NIDs
      else {
        snprintf(scheme, sizeof(scheme), "type%d_hash%d", type_nid, hash_nid);
      }

      char sig_msg[160];
      snprintf(sig_msg, sizeof(sig_msg), "Peer Signature Algorithm: %s", scheme);
      log_event("connection", "signature_algorithm", sig_msg);
    }
  }

  if (!handshake_done) {
    log_event("connection", "error", "Handshake not completed after max steps");
    close_log("failed", "Handshake timeout");
    goto cleanup;
  }

  // 6. Post-Handshake Script Processing
  if (script_path && access(script_path, F_OK) == 0) {
    FILE *f = fopen(script_path, "r");
    if (f) {
      char line[1024];
      while (fgets(line, sizeof(line), f)) {
        // Strip newline
        line[strcspn(line, "\n")] = 0;
        if (strlen(line) == 0)
          continue;

        if (strncmp(line, "CLIENT_SEND:", 12) == 0) {
          const char *msg = line + 12;
          current_side = "client";
          // Log the message being sent (before encryption)
          char send_msg[4200];
          snprintf(send_msg, sizeof(send_msg), "Sending: %s", msg);
          log_event("client", "message_sent", send_msg);
          SSL_write(c_ssl, msg, strlen(msg));

          // Move data from Client Write BIO to Server Read BIO
          pump_flash_drive(c_wbio, s_rbio, "client");

          // Server needs to read it
          process_reads(s_ssl, "server");
        } else if (strncmp(line, "SERVER_SEND:", 12) == 0) {
          const char *msg = line + 12;
          current_side = "server";
          // Log the message being sent (before encryption)
          char send_msg[4200];
          snprintf(send_msg, sizeof(send_msg), "Sending: %s", msg);
          log_event("server", "message_sent", send_msg);
          SSL_write(s_ssl, msg, strlen(msg));

          // Move data from Server Write BIO to Client Read BIO
          pump_flash_drive(s_wbio, c_rbio, "server");

          // Client needs to read it
          process_reads(c_ssl, "client");
        } else if (strcmp(line, "CLIENT_DISCONNECT") == 0) {
          log_event("client", "action", "Sending close_notify");
          SSL_shutdown(c_ssl);                    // Send close_notify
          int r = process_reads(s_ssl, "server"); // Server receives it
          // Server should technically respond with close_notify
          if (r == -1)
            SSL_shutdown(s_ssl);
        } else if (strcmp(line, "SERVER_DISCONNECT") == 0) {
          log_event("server", "action", "Sending close_notify");
          SSL_shutdown(s_ssl);
          int r = process_reads(c_ssl, "client");
          if (r == -1)
            SSL_shutdown(c_ssl);
        }
      }
      fclose(f);
    }
  }

  close_log("success", NULL);

cleanup:
  if (c_ssl)
    SSL_free(c_ssl);
  if (s_ssl)
    SSL_free(s_ssl);
  if (c_ctx)
    SSL_CTX_free(c_ctx);
  if (s_ctx)
    SSL_CTX_free(s_ctx);

  return log_buffer;
}

// Dummy CMP functions to satisfy linker
typedef struct options_st {
  const char *name;
  int retval;
  int valType;
} OPTIONS;

int cmp_main(int argc, char **argv) { return 0; }

const OPTIONS cmp_options[] = {{NULL}};
