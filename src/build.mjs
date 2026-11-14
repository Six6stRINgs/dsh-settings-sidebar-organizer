import { readFile, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = async path => (await readFile(new URL(path, root), 'utf8')).replace(/\r\n?/g, '\n');
const stripExports = value => value.replace(/^export\s+(?=(?:async\s+)?(?:function|const|class|let)\b)/gm, '').trim();
const modules = {
  MODEL: stripExports(await read('./src/model.js')),
  PERSISTENCE: stripExports((await read('./src/persistence.js')).replace(/^import[^\n]*\n/gm, '')),
  ATTACHMENT: stripExports(await read('./src/attachment.js')),
  DRAG: stripExports(await read('./src/drag.js')),
  POPOVER: stripExports(await read('./src/popover.js')),
};
let output = await read('./src/client.js');
for (const [name, content] of Object.entries(modules)) {
  const marker = `/* __ORGANIZER_${name}__ */`;
  if (output.split(marker).length !== 2) throw new Error(`Expected exactly one build marker: ${marker}`);
  output = output.replace(marker, () => content);
}
if (process.argv.includes('--check')) {
  const current = await readFile(new URL('./lib/client.js', root), 'utf8');
  if (current.replace(/\r\n?/g, '\n') !== output) {
    console.error('client.js is out of date. Run npm run build and commit the generated bundle.');
    process.exitCode = 1;
  } else console.log('Generated client.js matches its sources.');
} else {
  await writeFile(new URL('./lib/client.js', root), output);
  console.log('Built client.js from the entry and five helper modules (no runtime dependencies bundled).');
}
