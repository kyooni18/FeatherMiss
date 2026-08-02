/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const protectedTokenPattern = /```[\s\S]*?```|`[^`\n]+`|https?:\/\/[^\s<]+|@[\p{L}\p{N}_-]+|#[\p{L}\p{N}_-]+|:[A-Za-z0-9_+-]+:/gu;

export const TRANSLATION_PIPELINE_VERSION = '1';
export const TRANSLATION_PROMPT_VERSION = '1';
export const TRANSLATION_MODE = 'on-demand';
export const TRANSLATION_BACKGROUND_MODE = 'background';

export type PreparedTranslation = {
	text: string;
	restore(text: string): string;
};

export function prepareTranslation(text: string, maxCharacters: number): PreparedTranslation {
	const normalized = text.replaceAll('\r\n', '\n').replaceAll('\r', '\n').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
	if (normalized.length === 0) throw new Error('FEATHERMISS_AI_EMPTY_TEXT');
	if (normalized.length > maxCharacters) throw new Error('FEATHERMISS_AI_TEXT_TOO_LARGE');

	const tokens: string[] = [];
	const prepared = normalized.replace(protectedTokenPattern, token => {
		const marker = `⟦FEATHERMISS_${tokens.length}⟧`;
		tokens.push(token);
		return marker;
	});

	return {
		text: prepared,
		restore(translatedText: string): string {
			return tokens.reduce((result, token, index) => {
				const marker = `⟦FEATHERMISS_${index}⟧`;
				if (!result.includes(marker)) throw new Error('FEATHERMISS_AI_MALFORMED_OUTPUT');
				return result.replaceAll(marker, token);
			}, translatedText);
		},
	};
}
