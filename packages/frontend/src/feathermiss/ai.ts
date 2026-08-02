/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type * as Misskey from 'misskey-js';
import { $i } from '@/i.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { isFeatherMissAiEnabled } from './config.js';

type FeatherMissTranslationResponse = {
	sourceLang: string;
	text: string;
};

const backgroundEnqueueCache = new Map<string, number>();
const backgroundEnqueueInFlight = new Set<string>();
const BACKGROUND_ENQUEUE_DEDUPLICATION_MS = 5 * 60 * 1000;

/** Queue opt-in background translation for a note currently visible in a selected timeline. */
export async function enqueueBackgroundTranslation(note: Misskey.entities.Note, timelineId: string): Promise<void> {
	if (!isFeatherMissAiEnabled() || $i == null || note.text == null) return;

	const preferences = (await import('./preferences.js')).translationPreferences.value;
	if (!preferences.backgroundEnabled || !preferences.timelineIds.includes(timelineId) || preferences.targetLanguages.length === 0) return;
	const now = Date.now();
	const cacheKey = $i.id + ':' + timelineId + ':' + note.id + ':' + createClientFingerprint(note.text) + ':' + preferences.targetLanguages.join(',');
	for (const [key, expiresAt] of backgroundEnqueueCache) {
		if (expiresAt <= now) backgroundEnqueueCache.delete(key);
	}
	if (backgroundEnqueueCache.has(cacheKey) || backgroundEnqueueInFlight.has(cacheKey)) return;
	backgroundEnqueueInFlight.add(cacheKey);

	await misskeyApi('feathermiss/notes/translate/enqueue', {
		noteId: note.id,
		targetLangs: preferences.targetLanguages,
		timelineId,
	}, $i.token)
		.then(() => backgroundEnqueueCache.set(cacheKey, Date.now() + BACKGROUND_ENQUEUE_DEDUPLICATION_MS))
		.catch(() => undefined)
		.finally(() => backgroundEnqueueInFlight.delete(cacheKey));
}

function createClientFingerprint(text: string): string {
	let hash = 2166136261;
	for (let index = 0; index < text.length; index++) {
		hash ^= text.charCodeAt(index);
		hash = Math.imul(hash, 16777619);
	}
	return (hash >>> 0).toString(16);
}

export async function translateWithFeatherMiss(note: Misskey.entities.Note, targetLang: string): Promise<Misskey.entities.NotesTranslateResponse | null> {
	if (!isFeatherMissAiEnabled() || $i == null || note.text == null) return null;

	const result = await misskeyApi<FeatherMissTranslationResponse>('feathermiss/notes/translate', {
		noteId: note.id,
		targetLang,
	}, $i.token).catch(() => null);
	if (result == null) return null;
	if (typeof result.text !== 'string' || typeof result.sourceLang !== 'string') return null;
	return {
		sourceLang: result.sourceLang,
		text: result.text,
	};
}
