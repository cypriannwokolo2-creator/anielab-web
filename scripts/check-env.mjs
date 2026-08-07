import { execSync } from 'node:child_process';

const files = execSync('git ls-files', { encoding: 'utf-8' }).split('\n');
const leaked = files.filter((f) => {
  if (!f) return false;
  const isEnvFile = /(^|[/\\])\.env[^/\\]*$/.test(f);
  const isExample = f.endsWith('.env.example');
  return isEnvFile && !isExample;
});

if (leaked.length > 0) {
  console.error('Secret policy violation: tracked .env* files detected:');
  for (const f of leaked) console.error('  - ' + f);
  console.error('Remove them with: git rm --cached <file> and add to .gitignore');
  process.exit(1);
}

console.log('check:env passed — no .env* files tracked (only .env.example allowed).');
