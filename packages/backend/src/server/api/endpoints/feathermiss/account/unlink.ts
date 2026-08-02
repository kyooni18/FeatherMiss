/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { FeatherMissRepository } from '@/feathermiss/ai/repository.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['feathermiss'],
	requireCredential: true,
	kind: 'write:account',
	res: {
		type: 'null',
		optional: false, nullable: true,
	},
	errors: {
		unavailable: {
			message: 'FeatherMiss storage is unavailable.',
			code: 'UNAVAILABLE',
			id: '03a8c326-a59a-43cb-bdac-3a69aa65cf6e',
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
		super(meta, paramDef, async (_ps, me) => {
			if (this.db == null) throw new ApiError(meta.errors.unavailable);
			await new FeatherMissRepository(this.db).unlinkAccount(me.id);
			return null;
		});
	}
}
