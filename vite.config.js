import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Habilitar Fast Refresh para cambios en tiempo real
      fastRefresh: true,
    }),
  ],
  server: {
    // Habilitar HMR (Hot Module Replacement)
    hmr: {
      overlay: true, // Mostrar errores en overlay
      protocol: 'ws', // Protocolo WebSocket para HMR
      host: 'localhost',
      port: 5173,
    },
    // Configurar el file watcher para detectar cambios
    // En macOS, a veces es necesario usar polling para detectar cambios correctamente
    watch: {
      usePolling: true, // Usar polling para detectar cambios (más confiable en macOS)
      interval: 200, // Intervalo de polling en ms (cada 200ms - más frecuente)
      binaryInterval: 1000, // Intervalo para archivos binarios
      ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/.vite/**'], // Ignorar estos directorios
      followSymlinks: false, // No seguir enlaces simbólicos
    },
    // Puerto del servidor
    port: 5173,
    // Habilitar recarga automática
    strictPort: false,
    // Habilitar recarga automática cuando cambien archivos
    force: false,
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@features': path.resolve(__dirname, 'src/features'),
      '@app': path.resolve(__dirname, 'src/app'),
      '@i18n': path.resolve(__dirname, 'src/i18n'),
    },
  },
  optimizeDeps: {
    include: ['react-i18next', 'i18next', 'i18next-browser-languagedetector'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
  esbuild: {
    loader: 'tsx',
  },
});
