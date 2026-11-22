import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readAdmin, readUser } from '$lib/server/session';
import { deleteObject, getObject, putObject } from '$lib/server/r2';

const MAX_BYTES = 12 * 1024 * 1024;

function safeName(value: string): string {
	const name = value
		.toLowerCase()
		.replace(/[^a-z0-9._-]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 120);
	return name || 'asset.bin';
}

function allowKey(workspaceKey: string, key: string, admin: boolean): boolean {
	if (admin) return key.length > 0 && !key.includes('..');
	return key.startsWith(`${workspaceKey}/`) && !key.includes('..');
}

export const POST: RequestHandler = async (event) => {
	const user = await readUser(event);
	if (!user) return json({ error: 'sign in required' }, { status: 401 });
	let body: { name?: string; contentType?: string; data?: string };
	try {
		body = (await event.request.json()) as typeof body;
	} catch {
		return json({ error: 'invalid json' }, { status: 400 });
	}
	if (!body.data || !body.name) return json({ error: 'name and data are required' }, { status: 400 });
	if (body.data.length > MAX_BYTES * 1.4) return json({ error: 'asset too large' }, { status: 413 });
	let bytes: Uint8Array;
	try {
		const binary = atob(body.data);
		bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	} catch {
		return json({ error: 'data must be base64' }, { status: 400 });
	}
	if (bytes.byteLength > MAX_BYTES) return json({ error: 'asset too large' }, { status: 413 });
	const key = `${user.workspaceKey}/${Date.now()}-${safeName(body.name)}`;
	try {
		await putObject(event, key, bytes, body.contentType?.slice(0, 120) || 'application/octet-stream');
		return json({
			ok: true,
			key,
			size: bytes.byteLength,
			url: `/api/assets?key=${encodeURIComponent(key)}`
		});
	} catch (error) {
		return json({ error: error instanceof Error ? error.message : 'R2 upload failed' }, { status: 502 });
	}
};

export const GET: RequestHandler = async (event) => {
	const [user, admin] = await Promise.all([readUser(event), readAdmin(event)]);
	if (!user && !admin) return json({ error: 'sign in required' }, { status: 401 });
	const key = event.url.searchParams.get('key');
	if (!key) return json({ error: 'key required' }, { status: 400 });
	if (!allowKey(user?.workspaceKey ?? '', key, Boolean(admin))) return json({ error: 'forbidden' }, { status: 403 });
	try {
		const object = await getObject(event, key);
		return new Response(object.body, {
			headers: {
				'Content-Type': object.contentType,
				'Cache-Control': 'private, max-age=300',
				'Content-Disposition': 'inline',
				...(object.etag ? { ETag: object.etag } : {}),
				...(object.size ? { 'Content-Length': object.size } : {})
			}
		});
	} catch (error) {
		return json({ error: error instanceof Error ? error.message : 'R2 read failed' }, { status: 404 });
	}
};

export const DELETE: RequestHandler = async (event) => {
	const [user, admin] = await Promise.all([readUser(event), readAdmin(event)]);
	if (!user && !admin) return json({ error: 'sign in required' }, { status: 401 });
	let body: { key?: string };
	try {
		body = (await event.request.json()) as typeof body;
	} catch {
		return json({ error: 'invalid json' }, { status: 400 });
	}
	if (!body.key) return json({ error: 'key required' }, { status: 400 });
	if (!allowKey(user?.workspaceKey ?? '', body.key, Boolean(admin))) return json({ error: 'forbidden' }, { status: 403 });
	try {
		await deleteObject(event, body.key);
		return json({ ok: true });
	} catch (error) {
		return json({ error: error instanceof Error ? error.message : 'R2 delete failed' }, { status: 502 });
	}
};
