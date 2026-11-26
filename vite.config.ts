import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 550,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three';
          if (id.includes('node_modules/lucide-react')) return 'icons';
          if (
            id.includes('node_modules/firebase/firestore') ||
            id.includes('node_modules/@firebase/firestore')
          ) {
            return 'firebase-db';
          }
          if (
            id.includes('node_modules/firebase') ||
            id.includes('node_modules/@firebase')
          ) {
            return 'firebase-core';
          }
          if (id.includes('/src/data/')) return 'templates-data';
          if (id.includes('/src/utils/threeContentBuilder')) return 'three-builder';
          if (id.includes('/src/components/Warehouse3DViewport')) {
            return 'viewport-3d';
          }
          if (
            id.includes('/src/components/ViewportContextMenu') ||
            id.includes('/src/components/EverydayHomeView') ||
            id.includes('/src/components/InteriorStudioModal') ||
            id.includes('/src/components/Scene3DBackgroundModal')
          ) {
            return 'studio-modals';
          }
          return undefined;
        },
      },
    },
  },
});
