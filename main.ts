// Neon Leonida Cover Studio — hand-in program (Node 22, standard library
// only). It gathers the entry — this directory's app/ folder and its
// screenshots/ — into the output directory and writes the dossier the
// make.fun judge reads, using the vendored library.
//
// Run it from the repo root; outside the grader's container the output
// directory comes from MAKEFUN_OUTPUT_DIR instead of /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Start from a clean output directory so stale screenshots or app files
// from an earlier run can never leak into this hand-in.
mkdirSync(outDir, { recursive: true });
rmSync(join(outDir, 'app'), { recursive: true, force: true });
rmSync(join(outDir, 'screenshots'), { recursive: true, force: true });
cpSync(join(repoRoot, 'app'), join(outDir, 'app'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// The scorer's own caps (from the kit's gate): the text cap shapes the
// dossier bytes; the rest refuse an entry the scorer would refuse — more
// than 4 screenshots or one over 256 KiB, more than 993 files in app/,
// more than 48 MiB of app files, or an app path over 1000 bytes.
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);

console.log(`dossier written to ${join(outDir, 'dossier.json')}`);
