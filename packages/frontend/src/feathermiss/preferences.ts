/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { computed, ref } from 'vue';
import { $i } from '@/i.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { DEFAULT_UI_GRAPHICS, isFeatherMissDeploymentEnabled, normalizeUiGraphics } from './config.js';

/** The presentation preferences owned by the FeatherMiss integration layer. */
export type UiGraphicsStore = {
	enabled: boolean;
	radius: number;
	buttonRadius: number;
	buttonPillRadius: number;
	mobileDockRadius: number;
	mobileDockPaddingX: number;
	mobileDockPaddingTop: number;
	mobileDockPaddingBottom: number;
	blur: number;
	saturate: number;
	brightness: number;
	panelAlpha: number;
	popupAlpha: number;
	navAlpha: number;
	pageAlpha: number;
	borderAlpha: number;
	borderWidth: number;
	overlayOpacity: number;
	modalBlur: number;
	squircleSize: number;
	popupRadiusOffset: number;
	postFormRadiusOffset: number;
	focusWidth: number;
	focusOffset: number;
	shadowStrength: number;
	shadowYOffset: number;
	shadowRaisedStrength: number;
	shadowRaisedYOffset: number;
	spacingScale: number;
	menuItemHeight: number;
	menuMinWidth: number;
	floatingGap: number;
	drawerWidth: number;
	dialogPadding: number;
	tooltipRadius: number;
	motionScale: number;
	motionDistance: number;
};

export const FEATHERMISS_PREFERENCE_KEY = 'uiGraphics' as const;

export type TranslationPreferences = {
	backgroundEnabled: boolean;
	targetLanguages: string[];
	timelineIds: string[];
};

export const DEFAULT_TRANSLATION_PREFERENCES: Readonly<TranslationPreferences> = Object.freeze({
	backgroundEnabled: false,
	targetLanguages: [],
	timelineIds: [],
});

const graphicsState = ref<UiGraphicsStore>(normalizeUiGraphics(DEFAULT_UI_GRAPHICS));
const translationState = ref<TranslationPreferences>({ ...DEFAULT_TRANSLATION_PREFERENCES });
let initializedAccountId: string | null = null;
let persistTimer: number | null = null;
let translationPersistTimer: number | null = null;

/** Load extension-owned preferences without involving Misskey's preference or registry storage. */
export async function initializeFeatherMissPreferences(): Promise<void> {
	if (!isFeatherMissDeploymentEnabled() || $i == null) return;
	if (initializedAccountId === $i.id) return;

	initializedAccountId = $i.id;
	graphicsState.value = normalizeUiGraphics(DEFAULT_UI_GRAPHICS);
	translationState.value = { ...DEFAULT_TRANSLATION_PREFERENCES };
	try {
		const result = await misskeyApi<{ uiGraphics?: unknown; translation?: unknown }>('feathermiss/preferences/get', {}, $i.token);
		if (result.uiGraphics != null && typeof result.uiGraphics === 'object' && !Array.isArray(result.uiGraphics)) {
			graphicsState.value = normalizeUiGraphics(result.uiGraphics as Partial<UiGraphicsStore>);
		}
		if (result.translation != null && typeof result.translation === 'object' && !Array.isArray(result.translation)) {
			translationState.value = normalizeTranslationPreferences(result.translation as Partial<TranslationPreferences>);
		}
	} catch (error) {
		console.warn('[FeatherMiss] preferences could not be loaded; using defaults.', error);
	}
}

function normalizeTranslationPreferences(value: Partial<TranslationPreferences> | null | undefined): TranslationPreferences {
	const source = value ?? {};
	const targetLanguages = Array.isArray(source.targetLanguages) ? source.targetLanguages : [];
	const timelineIds = Array.isArray(source.timelineIds) ? source.timelineIds : [];
	return {
		backgroundEnabled: source.backgroundEnabled === true,
		targetLanguages: [...new Set(targetLanguages.filter((language): language is string => typeof language === 'string').map(language => language.trim().toLowerCase().split('-')[0]).filter(language => /^[a-z]{2,8}$/.test(language)))].slice(0, 8),
		timelineIds: [...new Set(timelineIds.filter((timelineId): timelineId is string => typeof timelineId === 'string' && timelineId.length > 0))].slice(0, 64),
	};
}

function persistUiGraphics() {
	if (!isFeatherMissDeploymentEnabled() || $i == null) return;
	const account = $i;
	if (persistTimer != null) window.clearTimeout(persistTimer);
	persistTimer = window.setTimeout(() => {
		persistTimer = null;
		if ($i == null || $i.id !== account.id) return;
		void misskeyApi('feathermiss/preferences/set', { uiGraphics: graphicsState.value }, account.token).catch(error => {
			console.warn('[FeatherMiss] preferences could not be saved.', error);
		});
	}, 250);
}

export const uiGraphics = computed<UiGraphicsStore>({
	get: () => graphicsState.value,
	set: value => {
		graphicsState.value = normalizeUiGraphics(value);
		persistUiGraphics();
	},
});

function persistTranslationPreferences() {
	if (!isFeatherMissDeploymentEnabled() || $i == null) return;
	const account = $i;
	if (translationPersistTimer != null) window.clearTimeout(translationPersistTimer);
	translationPersistTimer = window.setTimeout(() => {
		translationPersistTimer = null;
		if ($i == null || $i.id !== account.id) return;
		void misskeyApi('feathermiss/preferences/set', { translation: translationState.value }, account.token).catch(error => {
			console.warn('[FeatherMiss] translation preferences could not be saved.', error);
		});
	}, 250);
}

export const translationPreferences = computed<TranslationPreferences>({
	get: () => translationState.value,
	set: value => {
		translationState.value = normalizeTranslationPreferences(value);
		persistTranslationPreferences();
	},
});
