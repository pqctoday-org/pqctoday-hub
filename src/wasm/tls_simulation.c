#include <openssl/conf.h>
#include <openssl/err.h>
#include <openssl/ssl.h>
#include <openssl/trace.h> // Added for OSSL_trace calls
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#else
#define EMSCRIPTEN_KEEPALIVE
#endif

// Helper to append to valid JSON buffer
// Real implementation would use dynamic buffer resizing
#define LOG_BUFFER_SIZE                                                        \
  (10 * 1024 * 1024) // 10MB buffer for PQC keys (McEliece etc)
char log_buffer[LOG_BUFFER_SIZE];
int log_offset = 0;
static const char *current_side = "system"; // Global context for callbacks

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
// KEYLOG CALLBACK
void keylog_callback(const SSL *ssl, const char *line) {
  // We log generic keylogs. To distinguish, we'd need ex_data, but for now
  // the content (CLIENT_RANDOM) is enough to identify common secrets.
  log_event("system", "keylog", line);
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
    }

    log_event(side, event_type, msg);
  }
  return count;
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
  if (access("/ssl/ca.crt", F_OK) == 0) {
    if (SSL_CTX_load_verify_locations(c_ctx, "/ssl/ca.crt", NULL) > 0)
      SSL_CTX_set_verify(c_ctx, SSL_VERIFY_PEER, NULL);
  }
  log_event("client", "init", "Created TLS 1.3 Client Context");

  // 3. Configure Server
  SSL_CTX_set_min_proto_version(s_ctx, TLS1_3_VERSION);
  SSL_CTX_set_max_proto_version(s_ctx, TLS1_3_VERSION);

  if (server_conf_path)
    apply_config(s_ctx, server_conf_path, "server");

  if (access("/ssl/server.crt", F_OK) == 0) {
    SSL_CTX_use_certificate_file(s_ctx, "/ssl/server.crt", SSL_FILETYPE_PEM);
  }
  if (access("/ssl/server.key", F_OK) == 0) {
    SSL_CTX_use_PrivateKey_file(s_ctx, "/ssl/server.key", SSL_FILETYPE_PEM);
  }
  if (access("/ssl/ca.crt", F_OK) == 0) {
    SSL_CTX_load_verify_locations(s_ctx, "/ssl/ca.crt", NULL);
    STACK_OF(X509_NAME) *list = SSL_load_client_CA_file("/ssl/ca.crt");
    if (list)
      SSL_CTX_set_client_CA_list(s_ctx, list);
  }
  log_event("server", "init", "Created TLS 1.3 Server Context");

  // 4. Connect BIOs
  c_ssl = SSL_new(c_ctx);
  s_ssl = SSL_new(s_ctx);
  BIO_new_bio_pair(&c_bio, 0, &s_bio, 0);
  SSL_set_bio(c_ssl, c_bio, c_bio); // Up ref
  SSL_set_bio(s_ssl, s_bio, s_bio); // Up ref

  // 5. Handshake
  SSL_set_connect_state(c_ssl);
  SSL_set_accept_state(s_ssl);

  // Setup Keylogging
  SSL_CTX_set_keylog_callback(c_ctx, keylog_callback);
  SSL_CTX_set_keylog_callback(s_ctx, keylog_callback);

  // Setup Tracing (Global)
  // We use a trick: trace_callback uses 'current_side' global variable
  OSSL_trace_set_callback(OSSL_TRACE_CATEGORY_TLS, trace_callback, NULL);
  OSSL_trace_set_callback(OSSL_TRACE_CATEGORY_TLS_CIPHER, trace_callback, NULL);
  OSSL_trace_set_callback(OSSL_TRACE_CATEGORY_X509V3_POLICY, trace_callback,
                          NULL);

  int steps = 0;
  int handshake_done = 0;
  while (steps < 20 && !handshake_done) {
    steps++;
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
          SSL_write(c_ssl, msg, strlen(msg));
          // Server needs to read it
          process_reads(s_ssl, "server");
        } else if (strncmp(line, "SERVER_SEND:", 12) == 0) {
          const char *msg = line + 12;
          current_side = "server";
          SSL_write(s_ssl, msg, strlen(msg));
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

// Dummy symbols for CMP (excluded from build due to test dependencies)
#include <stdio.h>
int cmp_main(int argc, char **argv) {
  printf("CMP command not supported in WASM build\n");
  return 1;
}
void *cmp_options = NULL;
