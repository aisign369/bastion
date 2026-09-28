import { defineConfig } from 'vite';

export default defineConfig({
  root: 'game/bastion',
  build: {
    outDir: '../../dist',
    emptyOutDir: true,
    target: 'es2022',
  },
});
