var a = Object.defineProperty
var r = (n, e, s) =>
  e in n ? a(n, e, { enumerable: !0, configurable: !0, writable: !0, value: s }) : (n[e] = s)
var i = (n, e, s) => r(n, typeof e != 'symbol' ? e + '' : e, s)
var o = class {
  constructor(e) {
    i(this, 'origin')
    i(this, 'iframe')
    i(this, 'options')
    i(this, 'boundHandleMessage')
    ;((this.options = e),
      (this.origin = new URL(e.pqcOrigin).origin),
      (this.iframe = e.iframe),
      (this.boundHandleMessage = this.handleMessage.bind(this)),
      window.addEventListener('message', this.boundHandleMessage))
  }
  post(e) {
    this.iframe.contentWindow && this.iframe.contentWindow.postMessage(e, this.origin)
  }
  async handleMessage(e) {
    if (e.origin !== this.origin) return
    let s = e.data
    if (!(!s || typeof s != 'object' || typeof s.type != 'string'))
      try {
        switch (s.type) {
          case 'pqc:ready':
            if ((this.post({ type: 'pqc:challenge' }), this.options.getToken)) {
              let t = await this.options.getToken()
              this.post({ type: 'pqc:auth', token: t })
            }
            break
          case 'pqc:authExpired':
            if (this.options.getToken) {
              let t = await this.options.getToken()
              this.post({ type: 'pqc:auth', token: t })
            }
            break
          case 'pqc:load':
            if (this.options.onLoadSnapshot) {
              let t = await this.options.onLoadSnapshot(s.userId)
              this.post({ type: 'pqc:loadResponse', snapshot: t })
            }
            break
          case 'pqc:save':
            this.options.onSaveSnapshot && (await this.options.onSaveSnapshot(s.userId, s.snapshot))
            break
          case 'pqc:event':
            this.options.onEvents && (await this.options.onEvents(s.userId, s.events))
            break
          case 'pqc:resize':
            this.options.onResize && typeof s.height == 'number' && this.options.onResize(s.height)
            break
        }
      } catch (t) {
        console.error('[PQC Embed Error]', t)
      }
  }
  destroy() {
    window.removeEventListener('message', this.boundHandleMessage)
  }
}
export { o as PQCEmbed }
