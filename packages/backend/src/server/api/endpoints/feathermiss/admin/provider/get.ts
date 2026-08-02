/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { FeatherMissRepository } from '@/feathermiss/ai/repository.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['feathermiss', 'admin'],
	requireCredential: true,
	requireAdmin: true,
	kind: 'read:admin:meta',
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
			id: 'a76fd1b2-6993-4d26-9d97-bc45475c345a',
			httpStatusCode: 503,
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(@Inject(DI.feathermissDb) private readonly db: Pool | null) {
		super(meta, paramDef, async () => {
			if (this.db == null) throw new ApiError(meta.errors.unavailable);
			const config = await new FeatherMissRepository(this.db).getProviderConfig();
			return {
				configured: config != null,
				providerType: config?.providerType ?? null,
				endpoint: config?.endpoint ?? null,
				model: config?.model ?? null,
				enabled: config?.enabled ?? false,
				hasCredentials: config?.encryptedCredentials != null,
				limits: config?.limits ?? {},
			};
		});
	}
}
