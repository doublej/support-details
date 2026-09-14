import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [sveltekit()],
  // Support is often asked about old phones: build for Safari 14 instead of Vite's default
  // Safari 16.4. Browsers older than that get the ES5 fallback in src/app.html.
  build: { target: ['es2020', 'safari14'] },
})
