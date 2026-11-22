import type { RequestEvent } from '@sveltejs/kit';
import { runtimeEnv } from './env';

export type SessionUser = {
	sub: string;
	email: string;
	name: string;
	avatar?: string;
	provider: 'google' | 'github';
	workspaceKey: string;
};

export type AdminSession = { email: string; scope: 'admin' };

const USER_COOKIE = 'scriptora_session';
const ADMIN_COOKIE = 'scriptora_admin';
const STATE_COOKIE = 'scriptora_oauth_state';

function bytesToB64url(bytes: Uint8Array): string {
	let binary = '';
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function strToB64url(value: string): string {
	return bytesToB64url(new TextEncoder().encode(value));
}

function b64urlToStr(value: string): string {
	const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
	const binary = atob(padded);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
	return new TextDecoder().decode(bytes);
}

async function hmac(secret: string, payload: string): Promise<string> {
	const key = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
	return bytesToB64url(new Uint8Array(signature));
}

function constantTimeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let mismatch = 0;
	for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
	return mismatch === 0;
}

function secret(event?: RequestEvent): string {
	const value = runtimeEnv(event).ADMIN_SESSION_SECRET;
	if (!value) throw new Error('ADMIN_SESSION_SECRET is not configured');
	return value;
}

export async function workspaceKeyFor(email: string): Promise<string> {
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(email.trim().toLowerCase()));
	return `scriptora-${bytesToB64url(new Uint8Array(digest)).slice(0, 24)}`;
}

async function signToken(payload: Record<string, unknown>, event?: RequestEvent): Promise<string> {
	const body = strToB64url(JSON.stringify(payload));
	return `${body}.${await hmac(secret(event), body)}`;
}

async function verifyToken<T>(token: string | undefined, event?: RequestEvent): Promise<T | null> {
	if (!token || !token.includes('.')) return null;
	const [body, signature] = token.split('.');
	if (!body || !signature) return null;
	try {
		const expected = await hmac(secret(event), body);
		if (!constantTimeEqual(signature, expected)) return null;
		const payload = JSON.parse(b64urlToStr(body)) as T & { exp?: number };
		if (!payload.exp || payload.exp < Date.now()) return null;
		return payload;
	} catch {
		return null;
	}
}

export async function issueUserSession(event: RequestEvent, user: Omit<SessionUser, 'workspaceKey'>): Promise<SessionUser> {
	const workspaceKey = await workspaceKeyFor(user.email);
	const full: SessionUser = { ...user, workspaceKey };
	const token = await signToken(
		{ ...full, scope: 'user', iat: Date.now(), exp: Date.now() + 7 * 86_400_000 },
		event
	);
	event.cookies.set(USER_COOKIE, token, {
		path: '/',
		httpOnly: true,
		secure: event.url.protocol === 'https:',
		sameSite: 'lax',
		maxAge: 7 * 86_400
	});
	return full;
}

export async function issueAdminSession(event: RequestEvent, email: string): Promise<void> {
	const token = await signToken({ email, scope: 'admin', iat: Date.now(), exp: Date.now() + 12 * 3_600_000 }, event);
	event.cookies.set(ADMIN_COOKIE, token, {
		path: '/',
		httpOnly: true,
		secure: event.url.protocol === 'https:',
		sameSite: 'strict',
		maxAge: 12 * 3_600
	});
}

export async function readUser(event: RequestEvent): Promise<SessionUser | null> {
	const payload = await verifyToken<SessionUser & { scope?: string }>(event.cookies.get(USER_COOKIE), event);
	return payload?.scope === 'user' ? payload : null;
}

export async function readAdmin(event: RequestEvent): Promise<AdminSession | null> {
	const payload = await verifyToken<AdminSession & { scope?: string }>(event.cookies.get(ADMIN_COOKIE), event);
	return payload?.scope === 'admin' ? payload : null;
}

export function clearSessionCookie(event: RequestEvent): void {
	event.cookies.delete(USER_COOKIE, { path: '/' });
}

export function clearAdminCookie(event: RequestEvent): void {
	event.cookies.delete(ADMIN_COOKIE, { path: '/' });
}

export function setOAuthState(event: RequestEvent, state: string): void {
	event.cookies.set(STATE_COOKIE, state, {
		path: '/',
		httpOnly: true,
		secure: event.url.protocol === 'https:',
		sameSite: 'lax',
		maxAge: 600
	});
}

export function readOAuthState(event: RequestEvent): string | null {
	return event.cookies.get(STATE_COOKIE) ?? null;
}

export function clearOAuthState(event: RequestEvent): void {
	event.cookies.delete(STATE_COOKIE, { path: '/' });
}

export function makeOAuthState(): string {
	return bytesToB64url(crypto.getRandomValues(new Uint8Array(24)));
}

export async function passwordMatches(event: RequestEvent, email: string, password: string): Promise<boolean> {
	const env = runtimeEnv(event);
	const expectedEmail = env.SUPER_ADMIN_EMAIL ?? '';
	const expectedPassword = env.SUPER_ADMIN_PASSWORD ?? '';
	if (!expectedEmail || !expectedPassword) return false;
	const emailOk = constantTimeEqual(email.trim().toLowerCase(), expectedEmail.trim().toLowerCase());
	const passwordOk = constantTimeEqual(password, expectedPassword);
	return emailOk && passwordOk;
}
