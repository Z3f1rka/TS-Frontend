import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from 'tailwindcss'
import copy from "rollup-plugin-copy";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [vue(), vueJsx(), vueDevTools(), tailwindcss(), copy({
      targets: [
        {
          // The Nutrient Web SDK requires its assets to be in the `public` directory so it can load them.
          src: "node_modules/@nutrient-sdk/viewer/dist/nutrient-viewer-lib",
          dest: "public/",
        },
      ],
      hook: "buildStart",}),],
    server: { host: env.HOST, port: env.PORT },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
