/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const VERSION = 'v1';

export function encryptFeatherMissSecret(value: string, key = readEncryptionKey()): string {
	const iv = randomBytes(12);
	const cipher = createCipheriv(ALGORITHM, key, iv);
	const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
	const tag = cipher.getAuthTag();
	return [VERSION, iv.toString('base64url'), tag.toString('base64url'), ciphertext.toString('base64url')].join(':');
}

export function decryptFeatherMissSecret(value: string, key = readEncryptionKey()): string {
	const [version, encodedIv, encodedTag, encodedCiphertext] = value.split(':');
	if (version !== VERSION || encodedIv == null || encodedTag == null || encodedCiphertext == null) {
		throw new Error('FEATHERMISS_INVALID_ENCRYPTED_SECRET');
	}

	try {
		const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(encodedIv, 'base64url'));
		decipher.setAuthTag(Buffer.from(encodedTag, 'base64url'));
		return Buffer.concat([
			decipher.update(Buffer.from(encodedCiphertext, 'base64url')),
			decipher.final(),
		]).toString('utf8');
	} catch {
		throw new Error('FEATHERMISS_INVALID_ENCRYPTED_SECRET');
	}
}

export function readEncryptionKey(value = process.env.FEATHERMISS_ENCRYPTION_KEY): Buffer {
	if (value == null || value.length === 0) throw new Error('FEATHERMISS_ENCRYPTION_KEY_REQUIRED');

	if (/^[0-9a-f]{64}$/i.test(value)) return Buffer.from(value, 'hex');
	const decoded = Buffer.from(value, 'base64');
	if (decoded.length === 32) return decoded;
	throw new Error('FEATHERMISS_ENCRYPTION_KEY_INVALID');
}
