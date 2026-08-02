/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import ms from 'ms';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { HttpRequestService } from '@/core/HttpRequestService.js';
import { FeatherMissAiService } from '@/feathermiss/ai/service.js';
import type { Config } from '@/config.js';
import type { MiAccessToken } from '@/models/AccessToken.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../../../error.js';

export const meta = {
	description: 'Queue a note for opt-in FeatherMiss background translation.',
	tags: ['feathermiss'],
	requireCredential: true,
	limit: {
		duration: ms('1minute'),
		max: 10,
	},
	kind: 'read:account',
	res: {
		type: 'object',
		properties: {
			jobIds: { type: 'array', items: { type: 'string' }, optional: false, nullable: false },
		},
	},
	errors: {
		unavailable: {
			message: 'FeatherMiss background translation is unavailable.',
			code: 'UNAVAILABLE',
			id: 'd85b0cb4-1019-4ed8-865a-2a8fe1b9c578',
		},
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: 'e413866d-98b7-4fc4-ae8a-7da3177832b1',
		},
		cannotTranslateInvisibleNote: {
			message: 'Cannot translate invisible note.',
			code: 'CANNOT_TRANSLATE_INVISIBLE_NOTE',
			id: 'af54a27c-8a52-4d37-91e6-5f77d0b6e4d2',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		noteId: { type: 'string', format: 'misskey:id' },
		targetLangs: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 8 },
		timelineId: { type: 'string', minLength: 1, maxLength: 128 },
	},
	required: ['noteId', 'targetLangs', 'timelineId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private readonly featherMissAiService: FeatherMissAiService,
		private readonly httpRequestService: HttpRequestService,
		@Inject(DI.config) private readonly config: Config,
	) {
		super(meta, paramDef, async (ps, me, token) => {
			if (!(await this.featherMissAiService.isAvailable())) throw new ApiError(meta.errors.unavailable);
			if (token == null) throw new ApiError(meta.errors.unavailable);
			if (!(await this.canUseTranslator(token))) throw new ApiError(meta.errors.unavailable);
			await this.featherMissAiService.linkAccount(me.id, this.config.url, token.permission);

			const note = await this.fetchNoteThroughMisskeyApi(ps.noteId, token);
			if (note.text == null) throw new ApiError(meta.errors.unavailable);
			try {
				return { jobIds: await this.featherMissAiService.enqueueBackgroundTranslations(me.id, note.id, note.text, ps.targetLangs, ps.timelineId) };
			} catch {
				throw new ApiError(meta.errors.unavailable);
			}
		});
	}

	private async canUseTranslator(token: MiAccessToken): Promise<boolean> {
		try {
			const response = await this.httpRequestService.send(`${this.config.apiUrl}/i`, {
				method: 'POST',
				body: JSON.stringify({ i: token.token }),
				headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
				timeout: 5000,
				isLocalAddressAllowed: true,
			}, { throwErrorWhenResponseNotOk: false });
			if (!response.ok) return false;
			const account = await response.json() as { policies?: { canUseTranslator?: unknown } };
			return account.policies?.canUseTranslator === true;
		} catch {
			return false;
		}
	}

	private async fetchNoteThroughMisskeyApi(noteId: string, token: MiAccessToken): Promise<{ id: string; text: string | null }> {
		const response = await this.httpRequestService.send(`${this.config.apiUrl}/notes/show`, {
			method: 'POST',
			body: JSON.stringify({ i: token.token, noteId }),
			headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
			timeout: 5000,
			isLocalAddressAllowed: true,
		}, { throwErrorWhenResponseNotOk: false });

		if (!response.ok) {
			const body = await response.json().catch(() => null) as { error?: { code?: string } } | null;
			if (body?.error?.code === 'NO_SUCH_NOTE') throw new ApiError(meta.errors.noSuchNote);
			if (body?.error?.code === 'CANNOT_SHOW_NOTE') throw new ApiError(meta.errors.cannotTranslateInvisibleNote);
			throw new ApiError(meta.errors.unavailable);
		}

		const note = await response.json() as { id?: unknown; text?: unknown };
		if (typeof note.id !== 'string' || (note.text !== null && typeof note.text !== 'string')) throw new ApiError(meta.errors.unavailable);
		return { id: note.id, text: note.text ?? null };
	}
}
