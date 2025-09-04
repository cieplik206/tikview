import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  optimizeDeps: {
    // Exclude index-build.html from dependency scanning
    entries: ['index.html'],
    exclude: ['index-build.html']
  },
  server: {
    proxy: {
      '/api': {
        target: `http://localhost:${env.PROXY_PORT || 3001}`,
        changeOrigin: true,
        secure: false
      },
      '/rest': {
        target: env.VITE_ROUTER_URL,
        changeOrigin: true,
        secure: false, // Allow self-signed certificates
        configure: (proxy) => {
          // Add Basic Auth header if needed
          proxy.on('proxyReq', (_proxyReq, _req, _res) => {
            // You can add auth headers here if needed
            // Example: proxyReq.setHeader('Authorization', 'Basic ' + Buffer.from('username:password').toString('base64'));
          });
        }
      }
    }
  },
  build: {
    outDir: 'bundle',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        entryFileNames: 'assets/index.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'assets/index.css';
          }
          return 'assets/[name].[ext]';
        },
        // Disable code splitting - everything in one file
        manualChunks: undefined,
        inlineDynamicImports: true
      }
    }
  }
  }
})
