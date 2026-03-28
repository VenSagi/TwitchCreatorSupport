/**
 * Run Prisma against Postgres over the Compose network (hostname `postgres:5432`).
 * Use on Windows when host `npm run db:migrate` fails (P1000) or when mounting
 * the whole repo into a Linux container would mix Windows Prisma engines with Linux Node.
 */
import { spawnSync } from 'child_process';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const v = (pkg.dependencies?.prisma || '^5.22.0').replace(/^[\^~]/, '');

const mode = process.argv[2];
if (!mode || !['migrate', 'seed'].includes(mode)) {
  console.error('Usage: node scripts/run-prisma-docker.mjs <migrate|seed>');
  process.exit(1);
}

const migrateCmd = `npm init -y >/dev/null 2>&1 && npm install prisma@${v} && npx prisma migrate deploy --schema prisma/schema.prisma`;
const seedCmd = `npm init -y >/dev/null 2>&1 && npm install prisma@${v} @prisma/client@${v} ts-node@10.9.2 typescript@5.7.3 @types/node@22.10.7 && npx prisma generate --schema prisma/schema.prisma && export TS_NODE_COMPILER_OPTIONS='{"module":"CommonJS"}' && npx ts-node prisma/seed.ts`;

const inner = mode === 'migrate' ? migrateCmd : seedCmd;

const args = [
  'compose',
  '--profile',
  'tools',
  'run',
  '--rm',
  '--build',
  'db-tools',
  'sh',
  '-c',
  inner,
];

const r = spawnSync('docker', args, { stdio: 'inherit', cwd: root, shell: false });
process.exit(r.status ?? 1);
