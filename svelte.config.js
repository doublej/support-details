import adapter from '@sveltejs/adapter-static'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    // One prerendered page. Reports travel in the URL fragment, so there is no server side.
    adapter: adapter(),
  },
}

export default config
