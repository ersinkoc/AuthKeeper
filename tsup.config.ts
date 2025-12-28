import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'plugins/index': 'src/plugins/index.ts',
    'react/index': 'src/adapters/react/index.ts',
    'vue/index': 'src/adapters/vue/index.ts',
    'svelte/index': 'src/adapters/svelte/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  external: ['react', 'react-dom', 'vue', 'svelte'],
  tsconfig: './tsconfig.build.json',
})
