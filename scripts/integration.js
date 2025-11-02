#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

function runCmd(command, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { stdio: 'inherit', shell: true, ...opts });
    proc.on('close', code => {
      if (code === 0) return resolve();
      const err = new Error(`${command} ${args.join(' ')} exited with code ${code}`);
      err.code = code; reject(err);
    });
    proc.on('error', reject);
  });
}

(async () => {
  try {
    console.log('1) Running backend smoke tests...');
    await runCmd('node', ['backend/test/smokeTest.js']);

    console.log('\n2) Running frontend lint (this may take a few seconds)...');
    const frontendDir = path.join(process.cwd(), 'frontend', 'my-app');
    await runCmd('npm', ['run', 'lint'], { cwd: frontendDir });

    console.log('\nIntegration check completed — all steps passed ✅');
    process.exit(0);
  } catch (err) {
    console.error('\nIntegration check failed:', err.message || err);
    process.exit(err.code || 1);
  }
})();
