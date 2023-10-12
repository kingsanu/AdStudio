import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import { fileURLToPath, URL } from "url";
// "@canva/color-picker": ["packages/editor/src/color-picker"],
// "@canva/utils": ["packages/editor/src/utils"],
// "@canva/utils/*": ["packages/editor/src/utils/*"],
// "@canva/hooks": ["packages/editor/src/hooks"],
// "@canva/hooks/*": ["packages/editor/src/hooks/*"],
// "@canva/types": ["packages/editor/src/types"],
// "@canva/types/*": ["packages/editor/src/types/*"],
// "@canva/layers": ["packages/editor/src/layers"],
// "@canva/layers/*": ["packages/editor/src/layers/*"],
// "@canva/components": ["packages/editor/src/components"],
// "@canva/components/*": ["packages/editor/src/components/*"]
// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: [
      { find: '@canva/components', replacement: fileURLToPath(new URL('./packages/editor/src/components', import.meta.url)) },
      { find: '@canva/utils', replacement: fileURLToPath(new URL('./packages/editor/src/utils', import.meta.url)) },
      { find: '@canva/types', replacement: fileURLToPath(new URL('./packages/editor/src/types', import.meta.url)) },
      { find: '@canva/layers', replacement: fileURLToPath(new URL('./packages/editor/src/layers', import.meta.url)) },
      { find: '@canva/hooks', replacement: fileURLToPath(new URL('./packages/editor/src/hooks', import.meta.url)) },
      { find: '@canva/color-picker', replacement: fileURLToPath(new URL('./packages/editor/src/color-picker', import.meta.url)) },
    ]
  },
  plugins: [react({ jsxImportSource: "@emotion/react" })],
})
