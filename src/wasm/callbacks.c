
// KEYLOG CALLBACK
// Captures secrets: "CLIENT_RANDOM <random> <secret>"
void keylog_callback(const SSL *ssl, const char *line) {
  // Determine side (hacky way: we can't easily pass userdata to keylog callback
  // in standard API without ex_data, but for simulation we can guess or just
  // log it as "keylog") Actually, we can check if ssl == c_ssl or s_ssl if they
  // were global, but they are local. Simpler: Just log it. The UI can display
  // it for both or filter. But we want to associate it with Client or Server.
  // We will attach a side identifier to the SSL object using SSL_set_ex_data if
  // needed, but for now, let's just log it generally.
  log_event("system", "keylog", line);
}

// TRACE CALLBACK
// Captures internal OpenSSL trace output
// category: OSSL_TRACE_CATEGORY_TLS, OSSL_TRACE_CATEGORY_TLS_CIPHER, etc.
// cmd: OSSL_TRACE_CTRL_WRITE, OSSL_TRACE_CTRL_BEGIN, OSSL_TRACE_CTRL_END
size_t trace_callback(const char *buffer, size_t count, int category, int cmd,
                      void *data) {
  if (cmd != OSSL_TRACE_CTRL_WRITE)
    return 0;

  char *side = (char *)data; // We passed side as data

  if (count > 0 && buffer) {
    // We need to null-terminate or handle the buffer carefully
    char msg[4096];
    size_t len = count < 4095 ? count : 4095;
    memcpy(msg, buffer, len);
    msg[len] = 0;

    // Remove trailing newlines
    while (len > 0 && (msg[len - 1] == '\n' || msg[len - 1] == '\r')) {
      msg[--len] = 0;
    }

    if (len == 0)
      return count;

    if (category == OSSL_TRACE_CATEGORY_TLS_CIPHER) {
      // This contains hex dumps of clear/encrypted data
      log_event(side, "crypto_trace_data", msg);
    } else if (category == OSSL_TRACE_CATEGORY_TLS) {
      // General handshake state info
      log_event(side, "crypto_trace_state", msg);
    } else {
      log_event(side, "crypto_trace_other", msg);
    }
  }
  return count;
}
