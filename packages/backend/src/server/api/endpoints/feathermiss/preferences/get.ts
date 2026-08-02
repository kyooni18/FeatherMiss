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
	kind: 'read:account',
	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			uiGraphics: { type: 'object', optional: true, nullable: false, additionalProperties: true },
			translation: { type: 'object', optional: true, nullable: false, additionalProperties: true },
		},
	},
	errors: {
		unavailable: {
			message: 'FeatherMiss preferences are unavailable.',
			code: 'UNAVAILABLE',
			id: '3c4fa9c3-c8ba-4aa0-bf4f-fb8a5ce9d0c1',
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
	constructor(
		@Inject(DI.feathermissDb) private readonly db: Pool | null,
		private readonly featherMissAiService: FeatherMissAiService,
		@Inject(DI.config) private readonly config: Config,
	) {
		super(meta, paramDef, async (_ps, me, token) => {
			if (this.db == null) throw new ApiError(meta.errors.unavailable);
			await this.featherMissAiService.linkAccount(me.id, this.config.url, token?.permission ?? []);
			const repository = new FeatherMissRepository(this.db);
			const [uiGraphics, translation] = await Promise.all([
				repository.getUiGraphics(me.id),
				repository.getTranslationPreferences(me.id),
			]);
			return { ...(uiGraphics == null ? {} : { uiGraphics }), ...(translation == null ? {} : { translation }) };
		});
	}
}
