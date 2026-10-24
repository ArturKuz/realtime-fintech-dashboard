// GitHub Pages serves 404.html for unknown paths. Making it a copy of index.html lets a reload of a
// deep link such as /settings boot the app, and the Angular router then shows the right page.
import { copyFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const outputDir = process.argv[2];
if (!outputDir) {
  console.error('Usage: node scripts/copy-404.mjs <build output directory>');
  process.exit(1);
}

const indexFile = join(outputDir, 'index.html');
if (!existsSync(indexFile)) {
  console.error(`copy-404: ${indexFile} not found. Run the build first.`);
  process.exit(1);
}

copyFileSync(indexFile, join(outputDir, '404.html'));
console.log(`copy-404: ${join(outputDir, '404.html')} created`);
