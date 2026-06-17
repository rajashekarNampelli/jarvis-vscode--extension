import { build, context } from 'esbuild';

const watch = process.argv.includes('--watch');

const opts = {
  entryPoints: ['src/extension.ts'],
  outfile: 'dist/extension.js',
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  external: ['vscode'],
  sourcemap: true,
  minify: false,
};

if (watch) {
  const ctx = await context(opts);
  await ctx.watch();
  console.log('Watching extension host…');
} else {
  await build(opts);
  console.log('Extension host built → dist/extension.js');
}
