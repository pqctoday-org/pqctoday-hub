#!/usr/bin/env bash
# SPDX-License-Identifier: AGPL-3.0-only
set -euo pipefail
: "${LMS_PYTHON:?Set LMS_PYTHON to the existing Python >=3.10 interpreter}"
exec "$LMS_PYTHON" - "$@" <<'PYBUILD'
import pathlib,subprocess,json,hashlib,shutil,os,sys,base64,platform
if sys.version_info < (3,10):raise SystemExit('Python >=3.10 required')
root=pathlib.Path.cwd();source=pathlib.Path(os.environ['LMS_SOURCE_DIR']).resolve();out=pathlib.Path(os.environ['LMS_BUILD_DIR']).resolve();emcc=pathlib.Path(os.environ['LMS_EMCC']).resolve();lock=json.loads((root/'scripts/lms-source.lock.json').read_text())
sha=lambda b:hashlib.sha256(b).hexdigest()
producer_commit=os.environ.get('LMS_PRODUCER_COMMIT')
assert producer_commit and len(producer_commit)==40,'Set LMS_PRODUCER_COMMIT to the committed exact wrapper/recipe/lock producer'
for name in ['src/wasm/lms_wasm_wrapper.c','scripts/build-lms-wasm.sh','scripts/lms-source.lock.json']:
 committed=subprocess.check_output(['git','show',producer_commit+':'+name],cwd=root)
 assert committed==(root/name).read_bytes(),'Producer commit differs from current input: '+name
def git(*args):return subprocess.check_output(['git',*args],cwd=source,text=True).strip()
assert git('rev-parse','HEAD')==lock['upstream']['commit'] and git('rev-parse','HEAD^{tree}')==lock['upstream']['tree']
assert not git('status','--porcelain'),'Pinned upstream checkout must be clean'
assert not out.exists(),'Use a fresh task-private output/cache directory'
out.mkdir(parents=True);work=out/'src';work.mkdir();vendor=work/'hash-sigs';vendor.mkdir()
for name in git('ls-files').splitlines():
 src=source/name;dest=vendor/name
 if src.is_file():dest.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(src,dest)
patch=lock['portable_sha256_patch'];header=vendor/patch['file'];text=header.read_text();assert text.count(patch['from'])==patch['count'];header.write_text(text.replace(patch['from'],patch['to']))
assert '#define SECRET_METHOD 2' in (vendor/'config.h').read_text()
wrapper=root/lock['wrapper'];shutil.copyfile(wrapper,work/'lms_wasm_wrapper.c')
version=subprocess.check_output([sys.executable,str(emcc),'--version'],text=True).splitlines()[0];assert lock['emcc_version'] in version,version
inputs={'producerSourceCommit':producer_commit,'buildRecipeSha256':sha((root/'scripts/build-lms-wasm.sh').read_bytes()),'upstream':lock['upstream'],'wrapperSha256':sha(wrapper.read_bytes()),'sourceLockSha256':sha((root/'scripts/lms-source.lock.json').read_bytes()),'portableHeaderSha256':sha(header.read_bytes()),'configSha256':sha((vendor/'config.h').read_bytes()),'pythonVersion':platform.python_version(),'emccVersion':version,'emccScriptSha256':sha(emcc.read_bytes()),'optimization':'O3','abiVersion':1}
build_id=sha(json.dumps(inputs,sort_keys=True,separators=(',',':')).encode());factory='createLmsModule_'+build_id
cmd=[sys.executable,str(emcc),'-I'+str(vendor),str(work/'lms_wasm_wrapper.c'),*[str(vendor/n) for n in lock['sources']],'-O3','-ffile-prefix-map='+str(work)+'=.','-sWASM=1','-sEXPORTED_FUNCTIONS='+json.dumps(lock['exports'],separators=(',',':')),'-sEXPORTED_RUNTIME_METHODS='+json.dumps(['ccall','cwrap','getValue','setValue','HEAPU8','HEAP32'],separators=(',',':')),'-sALLOW_MEMORY_GROWTH=1','-sMODULARIZE=1','-sEXPORT_NAME='+factory,'-o',str(out/'lms.generated.js')]
# Emscripten invokes its own python3-shebang launcher while building syslibs.
# Bind that child interpreter locally; never change global PATH/install/config.
toolbin=out/'toolchain-bin';toolbin.mkdir();(toolbin/'python3').symlink_to(sys.executable)
assert subprocess.check_output([str(toolbin/'python3'),'--version'],text=True).strip().startswith('Python 3.14.')
env={**os.environ,'PATH':str(toolbin)+os.pathsep+os.environ.get('PATH',''),'EMSDK_PYTHON':sys.executable,'EM_CACHE':str(out/'cache'),'EMCC_CORES':str(lock['compiler_workers'])}
with (out/'compile.log').open('wb') as log:q=subprocess.run(cmd,env=env,stdout=log,stderr=log)
(out/'compile-receipt.json').write_text(json.dumps({'command':cmd,'exit_code':q.returncode,'signal':-q.returncode if q.returncode<0 else None,'compilerWorkers':lock['compiler_workers'],'inputs':inputs},indent=2))
if q.returncode:raise SystemExit(q.returncode)
wasm=(out/'lms.generated.wasm').read_bytes();wh=sha(wasm);wasmname='lms.'+wh+'.wasm';js=(out/'lms.generated.js').read_text();assert js.count('lms.generated.wasm')==1,'Generated WASM reference changed; inspect rather than guess';js=js.replace('lms.generated.wasm',wasmname);jh=sha(js.encode());jsname='lms.'+jh+'.js';pair=sha(json.dumps({'abiVersion':1,'jsSha256':jh,'wasmSha256':wh},sort_keys=True,separators=(',',':')).encode())
publish=out/'artifacts';publish.mkdir();(publish/wasmname).write_bytes(wasm);(publish/jsname).write_text(js)
descriptor={'abiVersion':1,'buildId':build_id,'pairId':pair,'factoryName':factory,'jsUrl':'/wasm/lms/'+jsname,'jsSha256':jh,'jsIntegrity':'sha256-'+base64.b64encode(bytes.fromhex(jh)).decode(),'wasmUrl':'/wasm/lms/'+wasmname,'wasmSha256':wh}
licence=vendor/lock['upstream_license']['file'];assert sha(licence.read_bytes())==lock['upstream_license']['sha256']
sha_header=(vendor/'sha256.c').read_text().split('*/',1)[0]+'*/\n'
notice='LMS/HSS standalone WebAssembly sample engine\n\nUpstream: cisco/hash-sigs commit '+lock['upstream']['commit']+'\n\nCisco upstream licence (verbatim):\n'+licence.read_text()+'\nPortable SHA-256 attribution from sha256.c (verbatim):\n'+sha_header+'\nThe Hub caller wrapper is AGPL-3.0-only. Its licence does not replace the upstream terms above. Emscripten/runtime licence texts are retained by the Hub canonical engine notice system.\n'
notice_name='lms.'+pair+'.NOTICES.txt';(publish/notice_name).write_text(notice)
descriptor.update(noticesUrl='/wasm/'+notice_name,noticesSha256=sha(notice.encode()))
(out/'descriptor.json').write_text(json.dumps(descriptor,indent=2))
info={'schema':1,'pair':descriptor,'producer':'pqctoday-org/pqctoday-hub','producerSourceCommit':producer_commit,'sourceInputs':inputs,'exports':lock['exports'],'note':'New pinned build; historical fixed-path binary origin remains unknown. No private paths/key state.'}
(publish/('lms.'+pair+'.buildinfo.json')).write_text(json.dumps(info,indent=2)+'\n')
(out/'lmsArtifact.generated.ts').write_text('// SPDX-License-Identifier: AGPL-3.0-only\n// Generated by scripts/build-lms-wasm.sh; reviewed with matching immutable resources.\nexport const LMS_ARTIFACT = '+json.dumps(descriptor,indent=2)+' as const\n')
print(json.dumps({'result':'built_private_only','pair':descriptor,'output':str(out)}),flush=True)
PYBUILD
