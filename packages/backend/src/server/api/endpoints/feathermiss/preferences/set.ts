/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type { Pool } from 'pg';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { FeatherMissRepository } from '@/feathermiss/ai/repository.js';
import { FeatherMissAiService } from '@/feathermiss/ai/service.js';
import type { Config } from '@/config.js';
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
			message: 'FeatherMiss preferences are unavailable.',
			code: 'UNAVAILABLE',
			id: '5b8b0ca0-01bf-456a-bf67-36e1fca3d2f5',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		uiGraphics: { type: 'object', nullable: true, additionalProperties: true },
		translation: { type: 'object', nullable: true, additionalProperties: true },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.feathermissDb) private readonly db: Pool | null,
		private readonly featherMissAiService: FeatherMissAiService,
		@Inject(DI.config) private readonly config: Config,
	) {
		super(meta, paramDef, async (ps, me, token) => {
			if (this.db == null) throw new ApiError(meta.errors.unavailable);
			if (ps.uiGraphics == null && ps.translation == null) throw new ApiError(meta.errors.unavailable);
			await this.featherMissAiService.linkAccount(me.id, this.config.url, token?.permission ?? []);
			const repository = new FeatherMissRepository(this.db);
			if (ps.uiGraphics != null) await repository.saveUiGraphics(me.id, ps.uiGraphics);
			if (ps.translation != null) await repository.saveTranslationPreferences(me.id, ps.translation);
			return null;
		});
	}
}
