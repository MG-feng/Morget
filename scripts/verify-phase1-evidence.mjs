import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const tauriDir = path.join(rootDir, 'apps/desktop/src-tauri');
const evidenceDir = path.join(rootDir, 'evidence', 'phase1');
const verifierPath = fileURLToPath(import.meta.url);

const MAX_INSTALLER_SIZE_BYTES = 50 * 1024 * 1024;
const verifierHash = crypto.createHash('sha256').update(fs.readFileSync(verifierPath)).digest('hex');

const EVIDENCE = {
  timestamp: new Date().toISOString(),
  verifier: { path: 'scripts/verify-phase1-evidence.mjs', sha256: verifierHash },
  environment: { nodeVersion: process.version, platform: process.platform, arch: process.arch },
  git: { pre: {}, post: {}, changedDuringVerification: false },
  h5_rust_component_tests: { status: 'NOT_RUN', exitCode: null },
  h6_installer_build: { status: 'NOT_RUN', exitCode: null, artifact: {} }
};

if (!fs.existsSync(evidenceDir)) fs.mkdirSync(evidenceDir, { recursive: true });

function run(cmd, args, cwd) {
  const res = spawnSync(cmd, args, { cwd, encoding: 'utf8', shell: process.platform === 'win32' });
  return { stdout: res.stdout || '', stderr: res.stderr || '', exitCode: res.status, success: res.status === 0 };
}

function getGitState() {
  const c = run('git', ['rev-parse', 'HEAD'], rootDir);
  const s = run('git', [
    'status', '--porcelain', '--',
    ':(exclude)*Cargo.lock',
    ':(exclude)*Cargo.toml',
    ':(exclude)apps/desktop/src-tauri/target',
    ':(exclude)node_modules',
    ':(exclude)evidence'
  ], rootDir);
  return { commit: c.stdout.trim(), status: s.stdout.trim(), clean: s.stdout.trim() === '' };
}

console.log('🔍 Starting Phase 1 Final Evidence Verification...');

// Clear Rust build cache to ensure fresh build with latest permissions
console.log('🧹 Clearing Rust build cache...');
const targetPath = path.join(tauriDir, 'target');
if (fs.existsSync(targetPath)) {
  try {
    fs.rmSync(targetPath, { recursive: true, force: true });
    console.log('✅ Build cache cleared');
  } catch (err) {
    console.warn('⚠️ Warning: Could not fully clear build cache:', err.message);
  }
}

EVIDENCE.git.pre = getGitState();
if (!EVIDENCE.git.pre.clean) {
  console.error('🔴 FATAL: Working Tree dirty BEFORE verification');
  console.error(EVIDENCE.git.pre.status);
  process.exit(1);
}

// H5: Rust Tests
console.log('--- [H5] Rust Tests ---');
const h5 = run('cargo', ['test', '--lib'], tauriDir);
EVIDENCE.h5_rust_component_tests = { status: h5.success ? 'PASS' : 'FAIL', exitCode: h5.exitCode };
if (!h5.success) console.error('🔴 H5 FAIL:', h5.stderr);

// H6: Tauri Build
console.log('--- [H6] Tauri Build ---');
const bundleDir = path.join(tauriDir, 'target/release/bundle/nsis');
if (fs.existsSync(bundleDir)) fs.rmSync(bundleDir, { recursive: true, force: true });

const h6 = run('pnpm', ['tauri', 'build'], rootDir);
if (h6.success) {
  const files = fs.readdirSync(bundleDir).filter(f => f.endsWith('.exe'));
  if (files.length === 0) {
    EVIDENCE.h6_installer_build = { status: 'FAIL_ARTIFACT_MISSING', exitCode: 0 };
  } else if (files.length > 1) {
    EVIDENCE.h6_installer_build = { status: 'FAIL_ARTIFACT_COUNT_INVALID', exitCode: 0 };
  } else {
    const p = path.join(bundleDir, files[0]);
    const stats = fs.statSync(p);
    if (stats.size >= MAX_INSTALLER_SIZE_BYTES) {
      EVIDENCE.h6_installer_build = { status: 'FAIL_ARTIFACT_TOO_LARGE', exitCode: 0 };
    } else {
      EVIDENCE.h6_installer_build = {
        status: 'PASS',
        exitCode: 0,
        artifact: {
          path: path.relative(rootDir, p),
          sizeBytes: stats.size,
          sha256: crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')
        }
      };
    }
  }
} else {
  EVIDENCE.h6_installer_build = { status: 'FAIL_BUILD_ERROR', exitCode: h6.exitCode };
  console.error('🔴 H6 FAIL:', h6.stderr);
}

EVIDENCE.git.post = getGitState();
EVIDENCE.git.changedDuringVerification = EVIDENCE.git.pre.commit !== EVIDENCE.git.post.commit;

const evidenceJson = JSON.stringify(EVIDENCE, null, 2);
fs.writeFileSync(path.join(evidenceDir, 'evidence.json'), evidenceJson);
const hash = crypto.createHash('sha256').update(evidenceJson).digest('hex');
fs.writeFileSync(path.join(evidenceDir, 'evidence.json.sha256'), `${hash}  evidence.json\n`);

console.log('\n=== PHASE 1 EVIDENCE ===\n' + evidenceJson);

const pass =
  EVIDENCE.h5_rust_component_tests.status === 'PASS' &&
  EVIDENCE.h6_installer_build.status === 'PASS' &&
  !EVIDENCE.git.changedDuringVerification;

if (pass) {
  console.log('\n🟢 PHASE 1 EVIDENCE VERIFIED. READY FOR FREEZE.');
  process.exit(0);
} else {
  console.error('\n🔴 PHASE 1 EVIDENCE NOT COMPLETE.');
  process.exit(1);
}
