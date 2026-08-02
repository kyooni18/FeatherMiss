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
	kind: 'write:admin:meta',
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
			id: '59d67d1c-40c1-4f1d-95a5-6b30ac0f550f',
			httpStatusCode: 503,
		},
		invalidScope: {
			message: 'The FeatherMiss content scope is invalid.',
			code: 'INVALID_CONTENT_SCOPE',
			id: 'cd9af9d9-9a3e-4d18-9cf0-71d9e4302ad5',
			httpStatusCode: 400,
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		enabled: { type: 'boolean' },
		aiEnabled: { type: 'boolean' },
		aiKillSwitch: { type: 'boolean' },
		backgroundTranslationEnabled: { type: 'boolean' },
		permittedContentScope: { type: 'string', enum: ['notes-on-demand', 'selected-timelines'] },
		retentionDays: { type: 'integer', minimum: 1, maximum: 3650 },
		maxRequestCharacters: { type: 'integer', minimum: 1, maximum: 1000000 },
		rateLimitPerMinute: { type: 'integer', minimum: 1, maximum: 100000 },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(@Inject(DI.feathermissDb) private readonly db: Pool | null) {
		super(meta, paramDef, async (ps) => {
			if (this.db == null) throw new ApiError(meta.errors.unavailable);
			if (ps.permittedContentScope != null && !['notes-on-demand', 'selected-timelines'].includes(ps.permittedContentScope)) {
				throw new ApiError(meta.errors.invalidScope);
			}
			return await new FeatherMissRepository(this.db).updateDeploymentConfig({
				enabled: ps.enabled,
				aiEnabled: ps.aiEnabled,
				aiKillSwitch: ps.aiKillSwitch,
				backgroundTranslationEnabled: ps.backgroundTranslationEnabled,
				permittedContentScope: ps.permittedContentScope,
				retentionDays: ps.retentionDays,
				maxRequestCharacters: ps.maxRequestCharacters,
				rateLimitPerMinute: ps.rateLimitPerMinute,
			});
		});
	}
}
