import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			routes: {
				include: ['/*'],
				exclude: ['<all>']
			},
			// Demo app is fully client-side; keep Wrangler's emulation in-memory
			// so a stale .wrangler SQLite lock can never block `npm run dev`.
			platformProxy: { persist: false }
		}),
		alias: {
			$lib: './src/lib'
		}
	}
};

export default config;
