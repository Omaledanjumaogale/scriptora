import type { RequestEvent } from '@sveltejs/kit';
import { runtimeEnv } from './env';

type R2Config = {
	endpoint: string;
	bucket: string;
	accessKey: string;
	secretKey: string;
};

function config(event: RequestEvent): R2Config {
	const env = runtimeEnv(event);
	const endpoint = env.R2_ENDPOINT;
	const bucket = env.R2_BUCKET;
	const accessKey = env.R2_ACCESS_KEY_ID;
	const secretKey = env.R2_SECRET_ACCESS_KEY;
	if (!endpoint || !bucket || !accessKey || !secretKey) throw new Error('R2 is not configured');
	return { endpoint: endpoint.replace(/\/$/, ''), bucket, accessKey, secretKey };
}

const encoder = new TextEncoder();

function hex(bytes: ArrayBuffer): string {
	return Array.from(new Uint8Array(bytes))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

async function sha256Hex(data: Uint8Array | string): Promise<string> {
	const bytes = typeof data === 'string' ? encoder.encode(data) : data;
	return hex(await crypto.subtle.digest('SHA-256', bytes as unknown as BufferSource));
}

async function hmac(key: ArrayBuffer | Uint8Array, data: string): Promise<ArrayBuffer> {
	const imported = await crypto.subtle.importKey(
		'raw',
		key as BufferSource,
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	return await crypto.subtle.sign('HMAC', imported, encoder.encode(data));
}

function encodingPath(key: string): string {
	return key
		.split('/')
		.map((part) => encodeURIComponent(part).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`))
		.join('/');
}

async function signedHeaders(
	event: RequestEvent,
	method: 'GET' | 'PUT' | 'DELETE',
	key: string,
	payloadHash: string
): Promise<{ url: string; headers: Record<string, string> }> {
	const cfg = config(event);
	const url = new URL(`${cfg.endpoint}/${encodeURIComponent(cfg.bucket)}/${encodingPath(key)}`);
	const now = new Date();
	const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
	const dateStamp = amzDate.slice(0, 8);
	const region = 'auto';
	const service = 's3';
	const canonicalUri = url.pathname;
	const canonicalHeaders = `host:${url.host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
	const signed = 'host;x-amz-content-sha256;x-amz-date';
	const canonicalRequest = `${method}\n${canonicalUri}\n\n${canonicalHeaders}\n${signed}\n${payloadHash}`;
	const scope = `${dateStamp}/${region}/${service}/aws4_request`;
	const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${await sha256Hex(canonicalRequest)}`;
	const kDate = await hmac(encoder.encode(`AWS4${cfg.secretKey}`), dateStamp);
	const kRegion = await hmac(kDate, region);
	const kService = await hmac(kRegion, service);
	const kSigning = await hmac(kService, 'aws4_request');
	const signature = hex(await hmac(kSigning, stringToSign));
	return {
		url: url.toString(),
		headers: {
			'x-amz-date': amzDate,
			'x-amz-content-sha256': payloadHash,
			Authorization: `AWS4-HMAC-SHA256 Credential=${cfg.accessKey}/${scope}, SignedHeaders=${signed}, Signature=${signature}`
		}
	};
}

export async function putObject(
	event: RequestEvent,
	key: string,
	bytes: Uint8Array,
	contentType: string
): Promise<void> {
	const payloadHash = await sha256Hex(bytes);
	const { url, headers } = await signedHeaders(event, 'PUT', key, payloadHash);
	const res = await fetch(url, {
		method: 'PUT',
		headers: { ...headers, 'Content-Type': contentType },
		body: new Blob([new Uint8Array(bytes)], { type: contentType })
	});
	if (!res.ok) throw new Error(`R2 upload failed (${res.status}): ${(await res.text()).slice(0, 300)}`);
}

export async function getObject(
	event: RequestEvent,
	key: string
): Promise<{ body: ReadableStream; contentType: string; etag: string | null; size: string | null }> {
	const payloadHash = await sha256Hex('');
	const { url, headers } = await signedHeaders(event, 'GET', key, payloadHash);
	const res = await fetch(url, { method: 'GET', headers });
	if (!res.ok) throw new Error(`R2 read failed (${res.status})`);
	return {
		body: res.body as ReadableStream,
		contentType: res.headers.get('content-type') ?? 'application/octet-stream',
		etag: res.headers.get('etag'),
		size: res.headers.get('content-length')
	};
}

export async function deleteObject(event: RequestEvent, key: string): Promise<void> {
	const payloadHash = await sha256Hex('');
	const { url, headers } = await signedHeaders(event, 'DELETE', key, payloadHash);
	const res = await fetch(url, { method: 'DELETE', headers });
	if (!res.ok && res.status !== 404) throw new Error(`R2 delete failed (${res.status})`);
}
