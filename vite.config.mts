// Plugins
import Components from 'unplugin-vue-components/vite'
import Vue from '@vitejs/plugin-vue'
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'
import ViteFonts from 'unplugin-fonts/vite'
import VueRouter from 'unplugin-vue-router/vite'
import compression from 'vite-plugin-compression'

// Utilities
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  optimizeDeps: {
    exclude: ['vue-router', 'unplugin-vue-router/runtime', 'unplugin-vue-router/data-loaders']
  },
  plugins: [
    compression({
      algorithm: 'brotliCompress',
      threshold: 512, // Reducir el umbral para comprimir archivos más pequeños
      deleteOriginFile: false,
      filter: /\.(js|mjs|json|css|html)$/i,
      compressionOptions: {
        level: 11 // Nivel máximo de compresión para Brotli
      }
    }),
    compression({
      algorithm: 'gzip',
      threshold: 512,
      deleteOriginFile: false,
      filter: /\.(js|mjs|json|css|html)$/i,
      compressionOptions: {
        level: 9 // Nivel máximo de compresión para Gzip
      }
    }),
    VueRouter(),
    Vue({
      template: { transformAssetUrls },
    }),
    // https://github.com/vuetifyjs/vuetify-loader/tree/master/packages/vite-plugin#readme
    Vuetify({
      autoImport: true,
      styles: {
        configFile: 'src/styles/settings.scss',
      },
    }),
    Components(),
    ViteFonts({
      google: {
        families: [ {
          name: 'Roboto',
          styles: 'wght@100;300;400;500;700;900',
        }],
      },
    }),
  ],
  define: { 'process.env': {} },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    extensions: [
      '.js',
      '.json',
      '.jsx',
      '.mjs',
      '.ts',
      '.tsx',
      '.vue',
    ],
  },
  server: {
    port: 3000,
    host: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 3000,
      timeout: 5000,
      overlay: true
    }
  },
  css: {
    preprocessorOptions: {
      sass: {
        api: 'modern-compiler',
      },
    },
  },
})
