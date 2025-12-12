import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Cast process to any to avoid "Property 'cwd' does not exist on type 'Process'" error
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Mappa la variabile d'ambiente di sistema su process.env per compatibilità col codice esistente
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
        },
        // Proxy specifico per servire i file statici dalla root anche in dev mode
        '/logo.png': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false
        },
        '/favicon.ico': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false
        }
      }
    }
  }
})