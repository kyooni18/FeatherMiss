/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { decryptFeatherMissSecret, encryptFeatherMissSecret, readEncryptionKey } from './crypto.js';

const key = Buffer.alloc(32, 7);

describe('FeatherMiss secret encryption', () => {
	test('round-trips credentials with authenticated encryption', () => {
		const encrypted = encryptFeatherMissSecret('provider-secret', key);

		expect(encrypted.startsWith('v1:')).toBe(true);
		expect(decryptFeatherMissSecret(encrypted, key)).toBe('provider-secret');
	});

	test('rejects tampered ciphertext and a wrong key', () => {
		const encrypted = encryptFeatherMissSecret('provider-secret', key);
		const parts = encrypted.split(':');
		parts[3] = `${parts[3][0] === 'A' ? 'B' : 'A'}${parts[3].slice(1)}`;

		expect(() => decryptFeatherMissSecret(parts.join(':'), key)).toThrow('FEATHERMISS_INVALID_ENCRYPTED_SECRET');
		expect(() => decryptFeatherMissSecret(encrypted, Buffer.alloc(32, 8))).toThrow('FEATHERMISS_INVALID_ENCRYPTED_SECRET');
	});

	test('accepts hexadecimal and base64 deployment keys', () => {
		expect(readEncryptionKey(key.toString('hex'))).toEqual(key);
		expect(readEncryptionKey(key.toString('base64'))).toEqual(key);
		expect(() => readEncryptionKey()).toThrow('FEATHERMISS_ENCRYPTION_KEY_REQUIRED');
		expect(() => readEncryptionKey('invalid')).toThrow('FEATHERMISS_ENCRYPTION_KEY_INVALID');
	});
});
