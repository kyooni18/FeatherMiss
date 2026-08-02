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
			deleted: { type: 'integer', optional: false, nullable: false },
		},
	},
	errors: {
		unavailable: {
			message: 'FeatherMiss storage is unavailable.',
			code: 'UNAVAILABLE',
			id: 'e9cf2d64-2f6c-4c54-ae00-7c6f2d16ae77',
			httpStatusCode: 503,
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		accountId: { type: 'string', format: 'misskey:id', nullable: true },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(@Inject(DI.feathermissDb) private readonly db: Pool | null) {
		super(meta, paramDef, async (ps) => {
			if (this.db == null) throw new ApiError(meta.errors.unavailable);
			const repository = new FeatherMissRepository(this.db);
			const deleted = ps.accountId == null
				? await repository.purgeAllTranslations()
				: await repository.purgeAccountTranslations(ps.accountId);
			await repository.cancelTranslationJobs(ps.accountId ?? undefined);
			return { deleted };
		});
	}
}
