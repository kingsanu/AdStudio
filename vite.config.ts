import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { fileURLToPath, URL } from 'url';

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@canva/components',
        replacement: fileURLToPath(
          new URL('./packages/editor/src/components', import.meta.url)
        ),
      },
      {
        find: '@canva/utils',
        replacement: fileURLToPath(
          new URL('./packages/editor/src/utils', import.meta.url)
        ),
      },
      {
        find: '@canva/types',
        replacement: fileURLToPath(
          new URL('./packages/editor/src/types', import.meta.url)
        ),
      },
      {
        find: '@canva/layers',
        replacement: fileURLToPath(
          new URL('./packages/editor/src/layers', import.meta.url)
        ),
      },
      {
        find: '@canva/hooks',
        replacement: fileURLToPath(
          new URL('./packages/editor/src/hooks', import.meta.url)
        ),
      },
      {
        find: '@canva/icons',
        replacement: fileURLToPath(
          new URL('./packages/editor/src/icons', import.meta.url)
        ),
      },
      {
        find: '@canva/color-picker',
        replacement: fileURLToPath(
          new URL('./packages/editor/src/color-picker', import.meta.url)
        ),
      },
      {
        find: '@canva/drag-and-drop',
        replacement: fileURLToPath(
          new URL('./packages/editor/src/drag-and-drop', import.meta.url)
        ),
      },
      {
        find: '@canva/search-autocomplete',
        replacement: fileURLToPath(
          new URL('./packages/editor/src/search-autocomplete', import.meta.url)
        ),
      },
      {
        find: '@canva/tooltip',
        replacement: fileURLToPath(
          new URL('./packages/editor/src/tooltip', import.meta.url)
        ),
      },
    ],
  },
  plugins: [
    react({
      jsxImportSource: '@emotion/react',
    }),
  ],
});
