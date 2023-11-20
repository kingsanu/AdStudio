import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { fileURLToPath, URL } from 'url';

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: [
      {
        find: 'canva-editor/components',
        replacement: fileURLToPath(
          new URL('./packages/editor/src/components', import.meta.url)
        ),
      },
      {
        find: 'canva-editor/utils',
        replacement: fileURLToPath(
          new URL('./packages/editor/src/utils', import.meta.url)
        ),
      },
      {
        find: 'canva-editor/types',
        replacement: fileURLToPath(
          new URL('./packages/editor/src/types', import.meta.url)
        ),
      },
      {
        find: 'canva-editor/layers',
        replacement: fileURLToPath(
          new URL('./packages/editor/src/layers', import.meta.url)
        ),
      },
      {
        find: 'canva-editor/hooks',
        replacement: fileURLToPath(
          new URL('./packages/editor/src/hooks', import.meta.url)
        ),
      },
      {
        find: 'canva-editor/layout',
        replacement: fileURLToPath(
          new URL('./packages/editor/src/layout', import.meta.url)
        ),
      },
      {
        find: 'canva-editor/icons',
        replacement: fileURLToPath(
          new URL('./packages/editor/src/icons', import.meta.url)
        ),
      },
      {
        find: 'canva-editor/color-picker',
        replacement: fileURLToPath(
          new URL('./packages/editor/src/color-picker', import.meta.url)
        ),
      },
      {
        find: 'canva-editor/drag-and-drop',
        replacement: fileURLToPath(
          new URL('./packages/editor/src/drag-and-drop', import.meta.url)
        ),
      },
      {
        find: 'canva-editor/search-autocomplete',
        replacement: fileURLToPath(
          new URL('./packages/editor/src/search-autocomplete', import.meta.url)
        ),
      },
      {
        find: 'canva-editor/tooltip',
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
