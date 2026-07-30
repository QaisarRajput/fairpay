import { readdir, stat } from 'node:fs/promises';
import { resolve } from 'node:path';

const CHUNKS_DIR = resolve(process.cwd(), 'apps', 'web', '.next', 'static', 'chunks');
// ponytail: baseline-driven threshold; tighten later with chunk splitting and route-level budgets.
const LIMIT_BYTES = 900 * 1024;

async function main(): Promise<void> {
  const entries = await readdir(CHUNKS_DIR);
  const jsFiles = entries.filter((name) => name.endsWith('.js'));

  if (jsFiles.length === 0) {
    throw new Error(`No JS chunks found in ${CHUNKS_DIR}. Run a web build first.`);
  }

  let totalBytes = 0;

  for (const fileName of jsFiles) {
    const info = await stat(resolve(CHUNKS_DIR, fileName));
    totalBytes += info.size;
  }

  if (totalBytes > LIMIT_BYTES) {
    throw new Error(
      `Chunk budget exceeded: ${(totalBytes / 1024).toFixed(1)} KB > ${(LIMIT_BYTES / 1024).toFixed(1)} KB.`,
    );
  }

  console.log(`Chunk budget passed: ${(totalBytes / 1024).toFixed(1)} KB / ${(LIMIT_BYTES / 1024).toFixed(1)} KB`);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
