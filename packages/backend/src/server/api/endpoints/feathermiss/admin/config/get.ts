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
			id: { type: 'string', optional: false, nullable: false },
			enabled: { type: 'boolean', optional: false, nullable: false },
			aiEnabled: { type: 'boolean', optional: false, nullable: false },
			aiKillSwitch: { type: 'boolean', optional: false, nullable: false },
			backgroundTranslationEnabled: { type: 'boolean', optional: false, nullable: false },
			permittedContentScope: { type: 'string', optional: false, nullable: false },
			retentionDays: { type: 'integer', optional: false, nullable: false },
			maxRequestCharacters: { type: 'integer', optional: false, nullable: false },
			rateLimitPerMinute: { type: 'integer', optional: false, nullable: false },
		},
	},
	errors: {
		unavailable: {
			message: 'FeatherMiss storage is unavailable.',
			code: 'UNAVAILABLE',
			id: '7ef6b3d2-8d9d-4e30-9e15-0f7069d76e89',
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
			const config = await new FeatherMissRepository(this.db).getDeploymentConfig();
			if (config == null) throw new ApiError(meta.errors.unavailable);
			return config;
		});
	}
}
