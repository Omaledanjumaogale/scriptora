export async function archiveAsset(blob: Blob, name: string): Promise<{ key: string; url: string; size: number }> {
	const buffer = new Uint8Array(await blob.arrayBuffer());
	let binary = '';
	for (let i = 0; i < buffer.length; i += 0x8000) {
		binary += String.fromCharCode(...buffer.subarray(i, i + 0x8000));
	}
	const res = await fetch('/api/assets', {
		method: 'POST',
		credentials: 'same-origin',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ name, contentType: blob.type || 'application/octet-stream', data: btoa(binary) })
	});
	const data = (await res.json()) as { key?: string; url?: string; size?: number; error?: string };
	if (!res.ok || !data.key || !data.url) throw new Error(data.error ?? 'Asset archive failed');
	return { key: data.key, url: data.url, size: data.size ?? blob.size };
}
