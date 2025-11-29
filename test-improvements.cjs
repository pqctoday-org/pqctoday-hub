const fs = require('fs');
const path = require('path');

const checkFileExists = (filePath) => {
    if (fs.existsSync(filePath)) {
        console.log(`✅ File exists: ${filePath}`);
        return true;
    } else {
        console.error(`❌ File missing: ${filePath}`);
        return false;
    }
};

const checkFileContent = (filePath, searchString, description) => {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes(searchString)) {
            console.log(`✅ ${description} found in ${filePath}`);
            return true;
        } else {
            console.error(`❌ ${description} NOT found in ${filePath}`);
            return false;
        }
    } catch (err) {
        console.error(`❌ Error reading ${filePath}: ${err.message}`);
        return false;
    }
};

console.log('--- Verifying Security & Performance Improvements ---\n');

let allPassed = true;

// 1. Check new utility files
allPassed = checkFileExists('src/utils/inputValidation.ts') && allPassed;
allPassed = checkFileExists('src/utils/logger.ts') && allPassed;

// 2. Check Input Sanitization in Workbench
allPassed = checkFileContent('src/components/OpenSSLStudio/Workbench.tsx', 'sanitizeCommonName', 'Input sanitization') && allPassed;

// 3. Check Logger usage
allPassed = checkFileContent('src/wasm/mlkem_wasm.ts', 'logger.error', 'Logger usage') && allPassed;
allPassed = checkFileContent('src/components/Playground/hooks/useKeyGeneration.ts', 'logger.debug', 'Logger usage') && allPassed;

// 4. Check WASM Caching
allPassed = checkFileContent('src/wasm/liboqs_kem.ts', 'instanceCache', 'Instance caching (KEM)') && allPassed;
allPassed = checkFileContent('src/wasm/liboqs_dsa.ts', 'instanceCache', 'Instance caching (DSA)') && allPassed;

// 5. Check Log Rotation
allPassed = checkFileContent('src/components/Playground/PlaygroundContext.tsx', 'updated.slice(0, 1000)', 'Log rotation') && allPassed;

// 6. Check Request IDs
allPassed = checkFileContent('src/components/OpenSSLStudio/worker/types.ts', 'requestId?: string', 'Request ID type') && allPassed;
allPassed = checkFileContent('src/components/OpenSSLStudio/hooks/useOpenSSL.ts', 'requestId', 'Request ID generation') && allPassed;
allPassed = checkFileContent('src/components/OpenSSLStudio/worker/openssl.worker.ts', 'requestId', 'Request ID handling') && allPassed;

// 7. Check Deprecated Method Fix
allPassed = checkFileContent('src/utils/dataInputUtils.ts', 'substring(i, i + 2)', 'Fixed substring method') && allPassed;

console.log('\n---------------------------------------------------');
if (allPassed) {
    console.log('🎉 All verification checks PASSED!');
    process.exit(0);
} else {
    console.error('⚠️ Some verification checks FAILED.');
    process.exit(1);
}
