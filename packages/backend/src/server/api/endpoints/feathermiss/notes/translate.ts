/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import ms from 'ms';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { HttpRequestService } from '@/core/HttpRequestService.js';
import { FeatherMissAiService } from '@/feathermiss/ai/service.js';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import type { MiAccessToken } from '@/models/AccessToken.js';
import { ApiError } from '../../../error.js';

export const meta = {
	description: 'Translate a note with the optional FeatherMiss AI provider.',
	tags: ['feathermiss'],

	requireCredential: true,

	limit: {
		duration: ms('1minute'),
		max: 10,
	},
	kind: 'read:account',

	res: {
		type: 'object',
		optional: true, nullable: false,
		properties: {
			sourceLang: { type: 'string', optional: false, nullable: false },
			text: { type: 'string', optional: false, nullable: false },
		},
	},

	errors: {
		unavailable: {
			message: 'FeatherMiss AI translation is unavailable.',
			code: 'UNAVAILABLE',
			id: '9e6fd9c1-3d79-4bb0-971b-1f6e8c2b73b6',
		},
		noSuchNote: {
			message: 'No such note.',
			code: 'NO_SUCH_NOTE',
			id: 'b5c7d7d6-5b1b-4ae2-9e0d-7e4d90ddda91',
		},
		cannotTranslateInvisibleNote: {
			message: 'Cannot translate invisible note.',
			code: 'CANNOT_TRANSLATE_INVISIBLE_NOTE',
			id: '46a5c09f-5e5f-4d2a-ae3f-6a40c8d7f0b5',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		noteId: { type: 'string', format: 'misskey:id' },
		targetLang: { type: 'string' },
	},
	required: ['noteId', 'targetLang'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private featherMissAiService: FeatherMissAiService,
		private httpRequestService: HttpRequestService,
		@Inject(DI.config) private config: Config,
	) {
		super(meta, paramDef, async (ps, me, token) => {
			if (!(await this.featherMissAiService.isAvailable())) throw new ApiError(meta.errors.unavailable);
			if (!(await this.canUseTranslator(token))) throw new ApiError(meta.errors.unavailable);
			await this.featherMissAiService.linkAccount(me.id, this.config.url, token?.permission ?? []);

			const note = await this.fetchNoteThroughMisskeyApi(ps.noteId, token);
			if (note.text == null) return;

			try {
				return await this.featherMissAiService.translateNote(me.id, note.id, note.text, ps.targetLang);
			} catch (error) {
				if (error instanceof Error && error.message === 'FEATHERMISS_AI_INVALID_LANGUAGE') throw new ApiError(meta.errors.unavailable);
				throw new ApiError(meta.errors.unavailable);
			}
		});
	}

	private async canUseTranslator(token: MiAccessToken | null): Promise<boolean> {
		if (token == null) return false;
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

	private async fetchNoteThroughMisskeyApi(noteId: string, token: MiAccessToken | null): Promise<{ id: string; text: string | null }> {
		if (token == null) throw new ApiError(meta.errors.unavailable);

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
		if (typeof note.id !== 'string' || (note.text !== null && typeof note.text !== 'string')) {
			throw new ApiError(meta.errors.unavailable);
		}
		return { id: note.id, text: note.text ?? null };
	}
}
