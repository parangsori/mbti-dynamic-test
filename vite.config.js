import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import packageJson from './package.json' with { type: 'json' };

export default defineConfig({
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version)
  },
  esbuild: {
    drop: ['console', 'debugger']
  },
  build: {
    assetsDir: 'assets/build',
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-motion': ['framer-motion']
        }
      }
    }
  },
  server: {
    host: true,
    port: 5173,
    allowedHosts: ['.trycloudflare.com']
  },
  preview: {
    allowedHosts: ['.trycloudflare.com']
  }
});
