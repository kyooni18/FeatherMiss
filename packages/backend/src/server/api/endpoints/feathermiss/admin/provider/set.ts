/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { encryptFeatherMissSecret } from '@/feathermiss/ai/crypto.js';
import { FeatherMissAiService } from '@/feathermiss/ai/service.js';
import { FeatherMissRepository } from '@/feathermiss/ai/repository.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['feathermiss', 'admin'],
	requireCredential: true,
	requireAdmin: true,
	kind: 'write:admin:meta',
	res: {
		type: 'object',
		properties: {
			configured: { type: 'boolean', optional: false, nullable: false },
			providerType: { type: 'string', optional: false, nullable: true },
			endpoint: { type: 'string', optional: false, nullable: true },
			model: { type: 'string', optional: false, nullable: true },
			enabled: { type: 'boolean', optional: false, nullable: false },
			hasCredentials: { type: 'boolean', optional: false, nullable: false },
			limits: { type: 'object', optional: false, nullable: false, additionalProperties: true },
		},
	},
	errors: {
		unavailable: {
			message: 'FeatherMiss storage is unavailable.',
			code: 'UNAVAILABLE',
			id: 'db1a0c71-2b49-4e50-b4ba-23ee14d0c57d',
			httpStatusCode: 503,
		},
		encryptionKeyRequired: {
			message: 'FEATHERMISS_ENCRYPTION_KEY must be configured before saving credentials.',
			code: 'ENCRYPTION_KEY_REQUIRED',
			id: 'c56e38ee-4e9d-4cd8-a58e-2fb6bd3d2cbf',
			httpStatusCode: 503,
		},
		encryptionKeyInvalid: {
			message: 'FEATHERMISS_ENCRYPTION_KEY must decode to exactly 32 bytes.',
			code: 'ENCRYPTION_KEY_INVALID',
			id: '7920f0fa-1a22-4e79-b3df-dfef11fd7b7f',
			httpStatusCode: 503,
		},
		invalidProvider: {
			message: 'The FeatherMiss AI provider is invalid.',
			code: 'INVALID_PROVIDER',
			id: 'd66750c0-42d0-4dba-8b85-69b8db7fa6a0',
			httpStatusCode: 400,
		},
		invalidEndpoint: {
			message: 'The FeatherMiss AI endpoint must use HTTP or HTTPS.',
			code: 'INVALID_ENDPOINT',
			id: 'a3ea7095-9e8b-4c89-a870-1b1e30e8191b',
			httpStatusCode: 400,
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		providerType: { type: 'string', enum: ['openai-compatible', 'openai-responses'] },
		endpoint: { type: 'string', nullable: true },
		model: { type: 'string', nullable: true },
		apiKey: { type: 'string', nullable: true },
		enabled: { type: 'boolean' },
		limits: {
			type: 'object',
			nullable: true,
			properties: {
				timeoutMs: { type: 'number', minimum: 1 },
				maxConcurrent: { type: 'integer', minimum: 1 },
				maxRetries: { type: 'integer', minimum: 0 },
				circuitFailureThreshold: { type: 'integer', minimum: 1 },
				circuitResetMs: { type: 'number', minimum: 1 },
			},
			additionalProperties: false,
		},
	},
	required: ['providerType', 'enabled'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.feathermissDb) private readonly db: Pool | null,
		private readonly featherMissAiService: FeatherMissAiService,
	) {
		super(meta, paramDef, async (ps) => {
			if (this.db == null) throw new ApiError(meta.errors.unavailable);
			if (ps.providerType !== 'openai-compatible' && ps.providerType !== 'openai-responses') throw new ApiError(meta.errors.invalidProvider);
			if (ps.endpoint != null) {
				try {
					const url = new URL(ps.endpoint);
					if ((url.protocol !== 'http:' && url.protocol !== 'https:') || url.username !== '' || url.password !== '') throw new Error('invalid endpoint');
				} catch {
					throw new ApiError(meta.errors.invalidEndpoint);
				}
			}

			const repository = new FeatherMissRepository(this.db);
			const current = await repository.getProviderConfig();
			let encryptedCredentials = current?.encryptedCredentials ?? null;
			if (ps.apiKey !== undefined) {
				if (ps.apiKey == null || ps.apiKey.length === 0) {
					encryptedCredentials = null;
				} else {
					try {
						encryptedCredentials = encryptFeatherMissSecret(ps.apiKey);
					} catch (error) {
						if (error instanceof Error && error.message === 'FEATHERMISS_ENCRYPTION_KEY_REQUIRED') {
							throw new ApiError(meta.errors.encryptionKeyRequired);
						}
						if (error instanceof Error && error.message === 'FEATHERMISS_ENCRYPTION_KEY_INVALID') {
							throw new ApiError(meta.errors.encryptionKeyInvalid);
						}
						throw error;
					}
				}
			}

			await repository.saveProviderConfig({
				providerType: ps.providerType,
				endpoint: ps.endpoint ?? null,
				encryptedCredentials,
				model: ps.model ?? null,
				enabled: ps.enabled,
				limits: ps.limits ?? {},
			});
			await this.featherMissAiService.reloadProvider();
			const saved = await repository.getProviderConfig();
			return {
				configured: saved != null,
				providerType: saved?.providerType ?? null,
				endpoint: saved?.endpoint ?? null,
				model: saved?.model ?? null,
				enabled: saved?.enabled ?? false,
				hasCredentials: saved?.encryptedCredentials != null,
				limits: saved?.limits ?? {},
			};
		});
	}
}
