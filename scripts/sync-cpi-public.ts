import { cp, mkdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const repoRoot = process.cwd();
const sourceDir = resolve(repoRoot, 'data', 'cpi');
const targetDir = resolve(repoRoot, 'apps', 'web', 'public', 'data', 'cpi');

async function ensureSourceExists(): Promise<void> {
  try {
    await stat(sourceDir);
  } catch {
    throw new Error(`Missing ${sourceDir}. Run ETL sync before building the web app.`);
  }
}

async function main(): Promise<void> {
  await ensureSourceExists();
  await mkdir(targetDir, { recursive: true });
  await cp(sourceDir, targetDir, { recursive: true, force: true });
  console.log(`Copied CPI assets to ${targetDir}`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
