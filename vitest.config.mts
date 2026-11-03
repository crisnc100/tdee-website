import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// tsconfig keeps JSX as-is for Next, so tests that render a component (the
// /lab page test) need Vite to compile it, and the @/ alias Next resolves.
export default defineConfig({
  oxc: { jsx: { runtime: 'automatic' } },
  resolve: { alias: [{ find: /^@\//, replacement: fileURLToPath(new URL('./src/', import.meta.url)) }] },
});
