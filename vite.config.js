import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0',
    hmr: {
      clientPort: 5173,
      overlay: true
    }
  },
  resolve: {
    alias: {
      'src': path.resolve(__dirname, './src')
    },
    extensions: ['.js', '.jsx', '.json']
  },
  // Properly handle static assets from public folder
  publicDir: 'public',
  build: {
    outDir: 'build',
    assetsDir: 'assets'
  },
  // Configure esbuild to handle JSX in .js files
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: []
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx'
      }
    }
  }
}); 