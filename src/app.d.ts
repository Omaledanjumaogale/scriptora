// See https://svelte.dev/docs/kit/types#app
declare global {
	namespace App {
		interface Platform {
			env?: Record<string, string | undefined>;
			ctx?: {
				waitUntil(promise: Promise<unknown>): void;
				passThroughOnException(): void;
			};
			caches?: CacheStorage;
		}
	}
}

export {};
