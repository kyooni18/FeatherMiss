/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export type TranslationResult = {
	sourceLang: string;
	text: string;
	provider: string;
	model: string;
	latencyMs?: number;
	inputTokens?: number;
	outputTokens?: number;
};

export type TranslationInput = {
	text: string;
	sourceLanguage?: string;
	targetLanguage: string;
	context?: string;
};

export type TranslationProvider = {
	readonly name: string;
	readonly model: string;
	translate(input: TranslationInput): Promise<TranslationResult>;
};
