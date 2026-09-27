import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

// A second, standalone Vitest config (separate from the `test` block in
// ./vite.config.ts) for the student unit/component suite under src/project/.
// It inherits the Svelte plugin, happy-dom, globals and setup file from the
// main config and only narrows which specs run and what coverage is measured.
const config = mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      name: 'web:student',
      // Node >= 25 ships its own global `localStorage` that shadows happy-dom's
      // and is undefined without --localstorage-file; the repo pins Node 24,
      // this keeps the suite working on newer Node too.
      execArgv: ['--no-experimental-webstorage'],
      coverage: {
        provider: 'v8',
        include: [
          'src/lib/utils/album-utils.ts',
          'src/lib/utils/string-utils.ts',
          'src/lib/utils/shared-links.ts',
          'src/lib/utils/timeline-util.ts',
          'src/lib/utils/byte-units.ts',
          'src/routes/auth/login/+page.svelte',
          'src/lib/components/pages/SharedLinkPage.svelte',
        ],
        reporter: ['text', 'html'],
        reportsDirectory: 'coverage-student',
      },
    },
  }),
);

// mergeConfig concatenates arrays, so replace `include` rather than append to it.
config.test.include = ['src/project/**/*.spec.ts'];

export default config;
