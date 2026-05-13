var PqcTpmModule = (() => {
  var _scriptName = globalThis.document?.currentScript?.src
  return async function (moduleArg = {}) {
    var moduleRtn
    var Module = moduleArg
    var ENVIRONMENT_IS_WEB = !!globalThis.window
    var ENVIRONMENT_IS_WORKER = !!globalThis.WorkerGlobalScope
    var ENVIRONMENT_IS_NODE =
      globalThis.process?.versions?.node && globalThis.process?.type != 'renderer'
    var arguments_ = []
    var thisProgram = './this.program'
    var quit_ = (status, toThrow) => {
      throw toThrow
    }
    if (typeof __filename != 'undefined') {
      _scriptName = __filename
    } else if (ENVIRONMENT_IS_WORKER) {
      _scriptName = self.location.href
    }
    var scriptDirectory = ''
    function locateFile(path) {
      if (Module['locateFile']) {
        return Module['locateFile'](path, scriptDirectory)
      }
      return scriptDirectory + path
    }
    var readAsync, readBinary
    if (ENVIRONMENT_IS_NODE) {
      var fs = require('node:fs')
      scriptDirectory = __dirname + '/'
      readBinary = (filename) => {
        filename = isFileURI(filename) ? new URL(filename) : filename
        var ret = fs.readFileSync(filename)
        return ret
      }
      readAsync = async (filename, binary = true) => {
        filename = isFileURI(filename) ? new URL(filename) : filename
        var ret = fs.readFileSync(filename, binary ? undefined : 'utf8')
        return ret
      }
      if (process.argv.length > 1) {
        thisProgram = process.argv[1].replace(/\\/g, '/')
      }
      arguments_ = process.argv.slice(2)
      quit_ = (status, toThrow) => {
        process.exitCode = status
        throw toThrow
      }
    } else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
      try {
        scriptDirectory = new URL('.', _scriptName).href
      } catch {}
      {
        if (ENVIRONMENT_IS_WORKER) {
          readBinary = (url) => {
            var xhr = new XMLHttpRequest()
            xhr.open('GET', url, false)
            xhr.responseType = 'arraybuffer'
            xhr.send(null)
            return new Uint8Array(xhr.response)
          }
        }
        readAsync = async (url) => {
          if (isFileURI(url)) {
            return new Promise((resolve, reject) => {
              var xhr = new XMLHttpRequest()
              xhr.open('GET', url, true)
              xhr.responseType = 'arraybuffer'
              xhr.onload = () => {
                if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) {
                  resolve(xhr.response)
                  return
                }
                reject(xhr.status)
              }
              xhr.onerror = reject
              xhr.send(null)
            })
          }
          var response = await fetch(url, { credentials: 'same-origin' })
          if (response.ok) {
            return response.arrayBuffer()
          }
          throw new Error(response.status + ' : ' + response.url)
        }
      }
    } else {
    }
    var out = console.log.bind(console)
    var err = console.error.bind(console)
    var wasmBinary
    var ABORT = false
    var isFileURI = (filename) => filename.startsWith('file://')
    var readyPromiseResolve, readyPromiseReject
    var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64
    var HEAP64, HEAPU64
    var runtimeInitialized = false
    function updateMemoryViews() {
      var b = wasmMemory.buffer
      HEAP8 = new Int8Array(b)
      HEAP16 = new Int16Array(b)
      Module['HEAPU8'] = HEAPU8 = new Uint8Array(b)
      HEAPU16 = new Uint16Array(b)
      HEAP32 = new Int32Array(b)
      HEAPU32 = new Uint32Array(b)
      HEAPF32 = new Float32Array(b)
      HEAPF64 = new Float64Array(b)
      HEAP64 = new BigInt64Array(b)
      HEAPU64 = new BigUint64Array(b)
    }
    function preRun() {
      if (Module['preRun']) {
        if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']]
        while (Module['preRun'].length) {
          addOnPreRun(Module['preRun'].shift())
        }
      }
      callRuntimeCallbacks(onPreRuns)
    }
    function initRuntime() {
      runtimeInitialized = true
      wasmExports['D']()
    }
    function postRun() {
      if (Module['postRun']) {
        if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']]
        while (Module['postRun'].length) {
          addOnPostRun(Module['postRun'].shift())
        }
      }
      callRuntimeCallbacks(onPostRuns)
    }
    function abort(what) {
      Module['onAbort']?.(what)
      what = 'Aborted(' + what + ')'
      err(what)
      ABORT = true
      what += '. Build with -sASSERTIONS for more info.'
      var e = new WebAssembly.RuntimeError(what)
      readyPromiseReject?.(e)
      throw e
    }
    var wasmBinaryFile
    function findWasmBinary() {
      return locateFile('pqctpm.wasm')
    }
    function getBinarySync(file) {
      if (file == wasmBinaryFile && wasmBinary) {
        return new Uint8Array(wasmBinary)
      }
      if (readBinary) {
        return readBinary(file)
      }
      throw 'both async and sync fetching of the wasm failed'
    }
    async function getWasmBinary(binaryFile) {
      if (!wasmBinary) {
        try {
          var response = await readAsync(binaryFile)
          return new Uint8Array(response)
        } catch {}
      }
      return getBinarySync(binaryFile)
    }
    async function instantiateArrayBuffer(binaryFile, imports) {
      try {
        var binary = await getWasmBinary(binaryFile)
        var instance = await WebAssembly.instantiate(binary, imports)
        return instance
      } catch (reason) {
        err(`failed to asynchronously prepare wasm: ${reason}`)
        abort(reason)
      }
    }
    async function instantiateAsync(binary, binaryFile, imports) {
      if (!binary && !isFileURI(binaryFile) && !ENVIRONMENT_IS_NODE) {
        try {
          var response = fetch(binaryFile, { credentials: 'same-origin' })
          var instantiationResult = await WebAssembly.instantiateStreaming(response, imports)
          return instantiationResult
        } catch (reason) {
          err(`wasm streaming compile failed: ${reason}`)
          err('falling back to ArrayBuffer instantiation')
        }
      }
      return instantiateArrayBuffer(binaryFile, imports)
    }
    function getWasmImports() {
      var imports = { a: wasmImports }
      return imports
    }
    async function createWasm() {
      function receiveInstance(instance, module) {
        wasmExports = instance.exports
        assignWasmExports(wasmExports)
        updateMemoryViews()
        return wasmExports
      }
      function receiveInstantiationResult(result) {
        return receiveInstance(result['instance'])
      }
      var info = getWasmImports()
      if (Module['instantiateWasm']) {
        return new Promise((resolve, reject) => {
          Module['instantiateWasm'](info, (inst, mod) => {
            resolve(receiveInstance(inst, mod))
          })
        })
      }
      wasmBinaryFile ??= findWasmBinary()
      var result = await instantiateAsync(wasmBinary, wasmBinaryFile, info)
      var exports = receiveInstantiationResult(result)
      return exports
    }
    class ExitStatus {
      name = 'ExitStatus'
      constructor(status) {
        this.message = `Program terminated with exit(${status})`
        this.status = status
      }
    }
    var callRuntimeCallbacks = (callbacks) => {
      while (callbacks.length > 0) {
        callbacks.shift()(Module)
      }
    }
    var onPostRuns = []
    var addOnPostRun = (cb) => onPostRuns.push(cb)
    var onPreRuns = []
    var addOnPreRun = (cb) => onPreRuns.push(cb)
    function getValue(ptr, type = 'i8') {
      if (type.endsWith('*')) type = '*'
      switch (type) {
        case 'i1':
          return HEAP8[ptr]
        case 'i8':
          return HEAP8[ptr]
        case 'i16':
          return HEAP16[ptr >> 1]
        case 'i32':
          return HEAP32[ptr >> 2]
        case 'i64':
          return HEAP64[ptr >> 3]
        case 'float':
          return HEAPF32[ptr >> 2]
        case 'double':
          return HEAPF64[ptr >> 3]
        case '*':
          return HEAPU32[ptr >> 2]
        default:
          abort(`invalid type for getValue: ${type}`)
      }
    }
    var noExitRuntime = true
    function setValue(ptr, value, type = 'i8') {
      if (type.endsWith('*')) type = '*'
      switch (type) {
        case 'i1':
          HEAP8[ptr] = value
          break
        case 'i8':
          HEAP8[ptr] = value
          break
        case 'i16':
          HEAP16[ptr >> 1] = value
          break
        case 'i32':
          HEAP32[ptr >> 2] = value
          break
        case 'i64':
          HEAP64[ptr >> 3] = BigInt(value)
          break
        case 'float':
          HEAPF32[ptr >> 2] = value
          break
        case 'double':
          HEAPF64[ptr >> 3] = value
          break
        case '*':
          HEAPU32[ptr >> 2] = value
          break
        default:
          abort(`invalid type for setValue: ${type}`)
      }
    }
    var stackRestore = (val) => __emscripten_stack_restore(val)
    var stackSave = () => _emscripten_stack_get_current()
    var UTF8Decoder = globalThis.TextDecoder && new TextDecoder()
    var findStringEnd = (heapOrArray, idx, maxBytesToRead, ignoreNul) => {
      var maxIdx = idx + maxBytesToRead
      if (ignoreNul) return maxIdx
      while (heapOrArray[idx] && !(idx >= maxIdx)) ++idx
      return idx
    }
    var UTF8ArrayToString = (heapOrArray, idx = 0, maxBytesToRead, ignoreNul) => {
      var endPtr = findStringEnd(heapOrArray, idx, maxBytesToRead, ignoreNul)
      if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
        return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr))
      }
      var str = ''
      while (idx < endPtr) {
        var u0 = heapOrArray[idx++]
        if (!(u0 & 128)) {
          str += String.fromCharCode(u0)
          continue
        }
        var u1 = heapOrArray[idx++] & 63
        if ((u0 & 224) == 192) {
          str += String.fromCharCode(((u0 & 31) << 6) | u1)
          continue
        }
        var u2 = heapOrArray[idx++] & 63
        if ((u0 & 240) == 224) {
          u0 = ((u0 & 15) << 12) | (u1 << 6) | u2
        } else {
          u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (heapOrArray[idx++] & 63)
        }
        if (u0 < 65536) {
          str += String.fromCharCode(u0)
        } else {
          var ch = u0 - 65536
          str += String.fromCharCode(55296 | (ch >> 10), 56320 | (ch & 1023))
        }
      }
      return str
    }
    var UTF8ToString = (ptr, maxBytesToRead, ignoreNul) =>
      ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead, ignoreNul) : ''
    var SYSCALLS = {
      varargs: undefined,
      getStr(ptr) {
        var ret = UTF8ToString(ptr)
        return ret
      },
    }
    function ___syscall_fcntl64(fd, cmd, varargs) {
      SYSCALLS.varargs = varargs
      return 0
    }
    var ___syscall_fstat64 = (fd, buf) => {}
    var ___syscall_getdents64 = (fd, dirp, count) => {}
    function ___syscall_ioctl(fd, op, varargs) {
      SYSCALLS.varargs = varargs
      return 0
    }
    var ___syscall_lstat64 = (path, buf) => {}
    var ___syscall_newfstatat = (dirfd, path, buf, flags) => {}
    function ___syscall_openat(dirfd, path, flags, varargs) {
      SYSCALLS.varargs = varargs
    }
    var ___syscall_stat64 = (path, buf) => {}
    var __abort_js = () => abort('')
    var __emscripten_throw_longjmp = () => {
      throw Infinity
    }
    var INT53_MAX = 9007199254740992
    var INT53_MIN = -9007199254740992
    var bigintToI53Checked = (num) => (num < INT53_MIN || num > INT53_MAX ? NaN : Number(num))
    function __gmtime_js(time, tmPtr) {
      time = bigintToI53Checked(time)
      var date = new Date(time * 1e3)
      HEAP32[tmPtr >> 2] = date.getUTCSeconds()
      HEAP32[(tmPtr + 4) >> 2] = date.getUTCMinutes()
      HEAP32[(tmPtr + 8) >> 2] = date.getUTCHours()
      HEAP32[(tmPtr + 12) >> 2] = date.getUTCDate()
      HEAP32[(tmPtr + 16) >> 2] = date.getUTCMonth()
      HEAP32[(tmPtr + 20) >> 2] = date.getUTCFullYear() - 1900
      HEAP32[(tmPtr + 24) >> 2] = date.getUTCDay()
      var start = Date.UTC(date.getUTCFullYear(), 0, 1, 0, 0, 0, 0)
      var yday = ((date.getTime() - start) / (1e3 * 60 * 60 * 24)) | 0
      HEAP32[(tmPtr + 28) >> 2] = yday
    }
    var stringToUTF8Array = (str, heap, outIdx, maxBytesToWrite) => {
      if (!(maxBytesToWrite > 0)) return 0
      var startIdx = outIdx
      var endIdx = outIdx + maxBytesToWrite - 1
      for (var i = 0; i < str.length; ++i) {
        var u = str.codePointAt(i)
        if (u <= 127) {
          if (outIdx >= endIdx) break
          heap[outIdx++] = u
        } else if (u <= 2047) {
          if (outIdx + 1 >= endIdx) break
          heap[outIdx++] = 192 | (u >> 6)
          heap[outIdx++] = 128 | (u & 63)
        } else if (u <= 65535) {
          if (outIdx + 2 >= endIdx) break
          heap[outIdx++] = 224 | (u >> 12)
          heap[outIdx++] = 128 | ((u >> 6) & 63)
          heap[outIdx++] = 128 | (u & 63)
        } else {
          if (outIdx + 3 >= endIdx) break
          heap[outIdx++] = 240 | (u >> 18)
          heap[outIdx++] = 128 | ((u >> 12) & 63)
          heap[outIdx++] = 128 | ((u >> 6) & 63)
          heap[outIdx++] = 128 | (u & 63)
          i++
        }
      }
      heap[outIdx] = 0
      return outIdx - startIdx
    }
    var stringToUTF8 = (str, outPtr, maxBytesToWrite) =>
      stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite)
    var __tzset_js = (timezone, daylight, std_name, dst_name) => {
      var currentYear = new Date().getFullYear()
      var winter = new Date(currentYear, 0, 1)
      var summer = new Date(currentYear, 6, 1)
      var winterOffset = winter.getTimezoneOffset()
      var summerOffset = summer.getTimezoneOffset()
      var stdTimezoneOffset = Math.max(winterOffset, summerOffset)
      HEAPU32[timezone >> 2] = stdTimezoneOffset * 60
      HEAP32[daylight >> 2] = Number(winterOffset != summerOffset)
      var extractZone = (timezoneOffset) => {
        var sign = timezoneOffset >= 0 ? '-' : '+'
        var absOffset = Math.abs(timezoneOffset)
        var hours = String(Math.floor(absOffset / 60)).padStart(2, '0')
        var minutes = String(absOffset % 60).padStart(2, '0')
        return `UTC${sign}${hours}${minutes}`
      }
      var winterName = extractZone(winterOffset)
      var summerName = extractZone(summerOffset)
      if (summerOffset < winterOffset) {
        stringToUTF8(winterName, std_name, 17)
        stringToUTF8(summerName, dst_name, 17)
      } else {
        stringToUTF8(winterName, dst_name, 17)
        stringToUTF8(summerName, std_name, 17)
      }
    }
    var _emscripten_get_now = () => performance.now()
    var _emscripten_date_now = () => Date.now()
    var nowIsMonotonic = 1
    var checkWasiClock = (clock_id) => clock_id >= 0 && clock_id <= 3
    function _clock_time_get(clk_id, ignored_precision, ptime) {
      ignored_precision = bigintToI53Checked(ignored_precision)
      if (!checkWasiClock(clk_id)) {
        return 28
      }
      var now
      if (clk_id === 0) {
        now = _emscripten_date_now()
      } else if (nowIsMonotonic) {
        now = _emscripten_get_now()
      } else {
        return 52
      }
      var nsec = Math.round(now * 1e3 * 1e3)
      HEAP64[ptime >> 3] = BigInt(nsec)
      return 0
    }
    var readEmAsmArgsArray = []
    var readEmAsmArgs = (sigPtr, buf) => {
      readEmAsmArgsArray.length = 0
      var ch
      while ((ch = HEAPU8[sigPtr++])) {
        var wide = ch != 105
        wide &= ch != 112
        buf += wide && buf % 8 ? 4 : 0
        readEmAsmArgsArray.push(
          ch == 112
            ? HEAPU32[buf >> 2]
            : ch == 106
              ? HEAP64[buf >> 3]
              : ch == 105
                ? HEAP32[buf >> 2]
                : HEAPF64[buf >> 3]
        )
        buf += wide ? 8 : 4
      }
      return readEmAsmArgsArray
    }
    var runEmAsmFunction = (code, sigPtr, argbuf) => {
      var args = readEmAsmArgs(sigPtr, argbuf)
      return ASM_CONSTS[code](...args)
    }
    var _emscripten_asm_const_int = (code, sigPtr, argbuf) => runEmAsmFunction(code, sigPtr, argbuf)
    var getHeapMax = () => 268435456
    var alignMemory = (size, alignment) => Math.ceil(size / alignment) * alignment
    var growMemory = (size) => {
      var oldHeapSize = wasmMemory.buffer.byteLength
      var pages = ((size - oldHeapSize + 65535) / 65536) | 0
      try {
        wasmMemory.grow(pages)
        updateMemoryViews()
        return 1
      } catch (e) {}
    }
    var _emscripten_resize_heap = (requestedSize) => {
      var oldSize = HEAPU8.length
      requestedSize >>>= 0
      var maxHeapSize = getHeapMax()
      if (requestedSize > maxHeapSize) {
        return false
      }
      for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
        var overGrownHeapSize = oldSize * (1 + 0.2 / cutDown)
        overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296)
        var newSize = Math.min(
          maxHeapSize,
          alignMemory(Math.max(requestedSize, overGrownHeapSize), 65536)
        )
        var replacement = growMemory(newSize)
        if (replacement) {
          return true
        }
      }
      return false
    }
    var ENV = {}
    var getExecutableName = () => thisProgram || './this.program'
    var getEnvStrings = () => {
      if (!getEnvStrings.strings) {
        var lang = (globalThis.navigator?.language ?? 'C').replace('-', '_') + '.UTF-8'
        var env = {
          USER: 'web_user',
          LOGNAME: 'web_user',
          PATH: '/',
          PWD: '/',
          HOME: '/home/web_user',
          LANG: lang,
          _: getExecutableName(),
        }
        for (var x in ENV) {
          if (ENV[x] === undefined) delete env[x]
          else env[x] = ENV[x]
        }
        var strings = []
        for (var x in env) {
          strings.push(`${x}=${env[x]}`)
        }
        getEnvStrings.strings = strings
      }
      return getEnvStrings.strings
    }
    var _environ_get = (__environ, environ_buf) => {
      var bufSize = 0
      var envp = 0
      for (var string of getEnvStrings()) {
        var ptr = environ_buf + bufSize
        HEAPU32[(__environ + envp) >> 2] = ptr
        bufSize += stringToUTF8(string, ptr, Infinity) + 1
        envp += 4
      }
      return 0
    }
    var lengthBytesUTF8 = (str) => {
      var len = 0
      for (var i = 0; i < str.length; ++i) {
        var c = str.charCodeAt(i)
        if (c <= 127) {
          len++
        } else if (c <= 2047) {
          len += 2
        } else if (c >= 55296 && c <= 57343) {
          len += 4
          ++i
        } else {
          len += 3
        }
      }
      return len
    }
    var _environ_sizes_get = (penviron_count, penviron_buf_size) => {
      var strings = getEnvStrings()
      HEAPU32[penviron_count >> 2] = strings.length
      var bufSize = 0
      for (var string of strings) {
        bufSize += lengthBytesUTF8(string) + 1
      }
      HEAPU32[penviron_buf_size >> 2] = bufSize
      return 0
    }
    var _fd_close = (fd) => 52
    var _fd_read = (fd, iov, iovcnt, pnum) => 52
    function _fd_seek(fd, offset, whence, newOffset) {
      offset = bigintToI53Checked(offset)
      return 70
    }
    var printCharBuffers = [null, [], []]
    var printChar = (stream, curr) => {
      var buffer = printCharBuffers[stream]
      if (curr === 0 || curr === 10) {
        ;(stream === 1 ? out : err)(UTF8ArrayToString(buffer))
        buffer.length = 0
      } else {
        buffer.push(curr)
      }
    }
    var _fd_write = (fd, iov, iovcnt, pnum) => {
      var num = 0
      for (var i = 0; i < iovcnt; i++) {
        var ptr = HEAPU32[iov >> 2]
        var len = HEAPU32[(iov + 4) >> 2]
        iov += 8
        for (var j = 0; j < len; j++) {
          printChar(fd, HEAPU8[ptr + j])
        }
        num += len
      }
      HEAPU32[pnum >> 2] = num
      return 0
    }
    var getCFunc = (ident) => {
      var func = Module['_' + ident]
      return func
    }
    var writeArrayToMemory = (array, buffer) => {
      HEAP8.set(array, buffer)
    }
    var stackAlloc = (sz) => __emscripten_stack_alloc(sz)
    var stringToUTF8OnStack = (str) => {
      var size = lengthBytesUTF8(str) + 1
      var ret = stackAlloc(size)
      stringToUTF8(str, ret, size)
      return ret
    }
    var ccall = (ident, returnType, argTypes, args, opts) => {
      var toC = {
        string: (str) => {
          var ret = 0
          if (str !== null && str !== undefined && str !== 0) {
            ret = stringToUTF8OnStack(str)
          }
          return ret
        },
        array: (arr) => {
          var ret = stackAlloc(arr.length)
          writeArrayToMemory(arr, ret)
          return ret
        },
      }
      function convertReturnValue(ret) {
        if (returnType === 'string') {
          return UTF8ToString(ret)
        }
        if (returnType === 'boolean') return Boolean(ret)
        return ret
      }
      var func = getCFunc(ident)
      var cArgs = []
      var stack = 0
      if (args) {
        for (var i = 0; i < args.length; i++) {
          var converter = toC[argTypes[i]]
          if (converter) {
            if (stack === 0) stack = stackSave()
            cArgs[i] = converter(args[i])
          } else {
            cArgs[i] = args[i]
          }
        }
      }
      var ret = func(...cArgs)
      function onDone(ret) {
        if (stack !== 0) stackRestore(stack)
        return convertReturnValue(ret)
      }
      ret = onDone(ret)
      return ret
    }
    var cwrap = (ident, returnType, argTypes, opts) => {
      var numericArgs =
        !argTypes || argTypes.every((type) => type === 'number' || type === 'boolean')
      var numericRet = returnType !== 'string'
      if (numericRet && numericArgs && !opts) {
        return getCFunc(ident)
      }
      return (...args) => ccall(ident, returnType, argTypes, args, opts)
    }
    {
      if (Module['noExitRuntime']) noExitRuntime = Module['noExitRuntime']
      if (Module['print']) out = Module['print']
      if (Module['printErr']) err = Module['printErr']
      if (Module['wasmBinary']) wasmBinary = Module['wasmBinary']
      if (Module['arguments']) arguments_ = Module['arguments']
      if (Module['thisProgram']) thisProgram = Module['thisProgram']
      if (Module['preInit']) {
        if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']]
        while (Module['preInit'].length > 0) {
          Module['preInit'].shift()()
        }
      }
    }
    Module['ccall'] = ccall
    Module['cwrap'] = cwrap
    Module['setValue'] = setValue
    Module['getValue'] = getValue
    Module['UTF8ToString'] = UTF8ToString
    Module['stringToUTF8'] = stringToUTF8
    Module['lengthBytesUTF8'] = lengthBytesUTF8
    var ASM_CONSTS = {
      633752: ($0, $1) => {
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
          crypto.getRandomValues(HEAPU8.subarray($0, $0 + $1))
        }
      },
    }
    function pqc_bridge_mlkem_keygen(paramSet, seed, seedLen, pkOut, pkOutMax, skOut, skOutMax) {
      if (!Module._pqcBridge || !Module._pqcBridge.mlkemKeygen) return -1
      return Module._pqcBridge.mlkemKeygen(
        paramSet,
        seed,
        seedLen,
        pkOut,
        pkOutMax,
        skOut,
        skOutMax
      )
    }
    function pqc_bridge_mlkem_encap(paramSet, pk, pkLen, ctOut, ctOutMax, ssOut, ssOutMax) {
      if (!Module._pqcBridge || !Module._pqcBridge.mlkemEncap) return -1
      return Module._pqcBridge.mlkemEncap(paramSet, pk, pkLen, ctOut, ctOutMax, ssOut, ssOutMax)
    }
    function pqc_bridge_mlkem_decap(paramSet, sk, skLen, ct, ctLen, ssOut, ssOutMax) {
      if (!Module._pqcBridge || !Module._pqcBridge.mlkemDecap) return -1
      return Module._pqcBridge.mlkemDecap(paramSet, sk, skLen, ct, ctLen, ssOut, ssOutMax)
    }
    function pqc_bridge_mldsa_sign(paramSet, sk, skLen, digest, digestLen, sigOut, sigOutMax) {
      if (!Module._pqcBridge || !Module._pqcBridge.mldsaSign) return -1
      return Module._pqcBridge.mldsaSign(paramSet, sk, skLen, digest, digestLen, sigOut, sigOutMax)
    }
    function pqc_bridge_mldsa_keygen(paramSet, seed, seedLen, pkOut, pkOutMax, skOut, skOutMax) {
      if (!Module._pqcBridge || !Module._pqcBridge.mldsaKeygen) return -1
      return Module._pqcBridge.mldsaKeygen(
        paramSet,
        seed,
        seedLen,
        pkOut,
        pkOutMax,
        skOut,
        skOutMax
      )
    }
    var _free,
      _malloc,
      _TPMLIB_ChooseTPMVersion,
      _TPMLIB_MainInit,
      _TPMLIB_Terminate,
      _TPMLIB_Process,
      _TPMLIB_SetBufferSize,
      _TPMLIB_SetProfile,
      _TPMLIB_WasManufactured,
      _TPMLIB_SetDebugFD,
      _TPMLIB_SetDebugLevel,
      _tpm_wasm_startup,
      _tpm_wasm_process,
      _tpm_wasm_get_nv_size,
      _tpm_wasm_get_nv,
      _tpm_wasm_set_nv,
      _tpm_wasm_provision_v2p7,
      _tpm_wasm_get_v2p7_status,
      _tpm_wasm_get_v2p7_log,
      _setThrew,
      __emscripten_stack_restore,
      __emscripten_stack_alloc,
      _emscripten_stack_get_current,
      dynCall_iiii,
      dynCall_iiiii,
      dynCall_ii,
      dynCall_iii,
      dynCall_viiii,
      dynCall_viii,
      dynCall_vi,
      dynCall_vii,
      dynCall_i,
      dynCall_v,
      dynCall_iiiiii,
      dynCall_iiiiiiii,
      dynCall_iiiiiii,
      dynCall_iiiiiiiii,
      dynCall_iiiiiiiiii,
      dynCall_jii,
      dynCall_viiiiii,
      dynCall_vjii,
      dynCall_vji,
      dynCall_iiid,
      dynCall_iiiiiiiiiii,
      dynCall_vij,
      dynCall_jiji,
      dynCall_iidiiii,
      memory,
      __indirect_function_table,
      wasmMemory,
      wasmTable
    function assignWasmExports(wasmExports) {
      _free = Module['_free'] = wasmExports['F']
      _malloc = Module['_malloc'] = wasmExports['G']
      _TPMLIB_ChooseTPMVersion = Module['_TPMLIB_ChooseTPMVersion'] = wasmExports['H']
      _TPMLIB_MainInit = Module['_TPMLIB_MainInit'] = wasmExports['I']
      _TPMLIB_Terminate = Module['_TPMLIB_Terminate'] = wasmExports['J']
      _TPMLIB_Process = Module['_TPMLIB_Process'] = wasmExports['K']
      _TPMLIB_SetBufferSize = Module['_TPMLIB_SetBufferSize'] = wasmExports['L']
      _TPMLIB_SetProfile = Module['_TPMLIB_SetProfile'] = wasmExports['M']
      _TPMLIB_WasManufactured = Module['_TPMLIB_WasManufactured'] = wasmExports['N']
      _TPMLIB_SetDebugFD = Module['_TPMLIB_SetDebugFD'] = wasmExports['O']
      _TPMLIB_SetDebugLevel = Module['_TPMLIB_SetDebugLevel'] = wasmExports['P']
      _tpm_wasm_startup = Module['_tpm_wasm_startup'] = wasmExports['Q']
      _tpm_wasm_process = Module['_tpm_wasm_process'] = wasmExports['R']
      _tpm_wasm_get_nv_size = Module['_tpm_wasm_get_nv_size'] = wasmExports['S']
      _tpm_wasm_get_nv = Module['_tpm_wasm_get_nv'] = wasmExports['T']
      _tpm_wasm_set_nv = Module['_tpm_wasm_set_nv'] = wasmExports['U']
      _tpm_wasm_provision_v2p7 = Module['_tpm_wasm_provision_v2p7'] = wasmExports['V']
      _tpm_wasm_get_v2p7_status = Module['_tpm_wasm_get_v2p7_status'] = wasmExports['W']
      _tpm_wasm_get_v2p7_log = Module['_tpm_wasm_get_v2p7_log'] = wasmExports['X']
      _setThrew = wasmExports['Y']
      __emscripten_stack_restore = wasmExports['Z']
      __emscripten_stack_alloc = wasmExports['_']
      _emscripten_stack_get_current = wasmExports['$']
      dynCall_iiii = wasmExports['dynCall_iiii']
      dynCall_iiiii = wasmExports['dynCall_iiiii']
      dynCall_ii = wasmExports['dynCall_ii']
      dynCall_iii = wasmExports['dynCall_iii']
      dynCall_viiii = wasmExports['aa']
      dynCall_viii = wasmExports['dynCall_viii']
      dynCall_vi = wasmExports['dynCall_vi']
      dynCall_vii = wasmExports['dynCall_vii']
      dynCall_i = wasmExports['dynCall_i']
      dynCall_v = wasmExports['dynCall_v']
      dynCall_iiiiii = wasmExports['dynCall_iiiiii']
      dynCall_iiiiiiii = wasmExports['dynCall_iiiiiiii']
      dynCall_iiiiiii = wasmExports['dynCall_iiiiiii']
      dynCall_iiiiiiiii = wasmExports['dynCall_iiiiiiiii']
      dynCall_iiiiiiiiii = wasmExports['dynCall_iiiiiiiiii']
      dynCall_jii = wasmExports['dynCall_jii']
      dynCall_viiiiii = wasmExports['dynCall_viiiiii']
      dynCall_vjii = wasmExports['dynCall_vjii']
      dynCall_vji = wasmExports['dynCall_vji']
      dynCall_iiid = wasmExports['dynCall_iiid']
      dynCall_iiiiiiiiiii = wasmExports['dynCall_iiiiiiiiiii']
      dynCall_vij = wasmExports['dynCall_vij']
      dynCall_jiji = wasmExports['dynCall_jiji']
      dynCall_iidiiii = wasmExports['dynCall_iidiiii']
      memory = wasmMemory = wasmExports['C']
      __indirect_function_table = wasmTable = wasmExports['E']
    }
    var wasmImports = {
      g: ___syscall_fcntl64,
      A: ___syscall_fstat64,
      r: ___syscall_getdents64,
      b: ___syscall_ioctl,
      x: ___syscall_lstat64,
      y: ___syscall_newfstatat,
      h: ___syscall_openat,
      z: ___syscall_stat64,
      l: __abort_js,
      p: __emscripten_throw_longjmp,
      s: __gmtime_js,
      t: __tzset_js,
      k: _clock_time_get,
      m: _emscripten_asm_const_int,
      i: _emscripten_date_now,
      q: _emscripten_resize_heap,
      v: _environ_get,
      w: _environ_sizes_get,
      a: _fd_close,
      e: _fd_read,
      u: _fd_seek,
      f: _fd_write,
      B: invoke_viiii,
      j: pqc_bridge_mldsa_keygen,
      d: pqc_bridge_mldsa_sign,
      n: pqc_bridge_mlkem_decap,
      o: pqc_bridge_mlkem_encap,
      c: pqc_bridge_mlkem_keygen,
    }
    function invoke_viiii(index, a1, a2, a3, a4) {
      var sp = stackSave()
      try {
        dynCall_viiii(index, a1, a2, a3, a4)
      } catch (e) {
        stackRestore(sp)
        if (e !== e + 0) throw e
        _setThrew(1, 0)
      }
    }
    function run() {
      preRun()
      function doRun() {
        Module['calledRun'] = true
        if (ABORT) return
        initRuntime()
        readyPromiseResolve?.(Module)
        Module['onRuntimeInitialized']?.()
        postRun()
      }
      if (Module['setStatus']) {
        Module['setStatus']('Running...')
        setTimeout(() => {
          setTimeout(() => Module['setStatus'](''), 1)
          doRun()
        }, 1)
      } else {
        doRun()
      }
    }
    var wasmExports
    wasmExports = await createWasm()
    run()
    if (runtimeInitialized) {
      moduleRtn = Module
    } else {
      moduleRtn = new Promise((resolve, reject) => {
        readyPromiseResolve = resolve
        readyPromiseReject = reject
      })
    }
    return moduleRtn
  }
})()
if (typeof exports === 'object' && typeof module === 'object') {
  module.exports = PqcTpmModule
  module.exports.default = PqcTpmModule
} else if (typeof define === 'function' && define['amd']) define([], () => PqcTpmModule)
