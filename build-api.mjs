import { build } from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

await build({
  entryPoints: [path.resolve(__dirname, 'server/app.ts')],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outfile: path.resolve(__dirname, 'api/index.js'),
  alias: {
    '@workspace/api-zod': path.resolve(__dirname, 'lib/api-zod/src/index.ts'),
    '@workspace/db': path.resolve(__dirname, 'lib/db/src/index.ts'),
  },
  external: [
    'express',
    'cors',
    'pg',
    'pino',
    'pino-http',
    'cookie-parser',
    'drizzle-orm',
    'drizzle-zod',
    'zod',
  ],
  banner: {
    js: `// Auto-generated Vercel serverless function entrypoint
import { createRequire as __crReq } from 'module';
const require = __crReq(import.meta.url);
`,
  },
});
console.log('Successfully bundled api/index.js');
