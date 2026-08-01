/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { UiGraphicsStore } from '@/feathermiss/preferences.js';

export { type UiGraphicsStore } from '@/feathermiss/preferences.js';

/** Resolve the build-time override while keeping the existing preference as the default. */
export function resolveFeatherMissEnabled(preferenceEnabled: boolean): boolean {
	const override = (import.meta as ImportMeta & {
		readonly env?: Record<string, string | undefined>;
	}).env?.FEATHERMISS_UI;
	if (override === '0' || override === 'false') return false;
	if (override === '1' || override === 'true') return true;
	return preferenceEnabled;
}

export function isFeatherMissEnabled(): boolean {
	return window.document.documentElement.getAttribute('data-feathermiss') === 'enabled';
}

export function setFeatherMissEnabled(enabled: boolean): void {
	const root = window.document.documentElement;
	if (enabled) {
		root.setAttribute('data-feathermiss', 'enabled');
	} else {
		root.removeAttribute('data-feathermiss');
	}
}

export const DEFAULT_UI_GRAPHICS: Readonly<UiGraphicsStore> = Object.freeze({
	enabled: true,
	radius: 14,
	buttonRadius: 13,
	buttonPillRadius: 999,
	mobileDockRadius: 24,
	mobileDockPaddingX: 10,
	mobileDockPaddingTop: 8,
	mobileDockPaddingBottom: 2,
	blur: 12,
	saturate: 128,
	brightness: 102,
	panelAlpha: 0.66,
	popupAlpha: 0.72,
	navAlpha: 0.68,
	pageAlpha: 0.72,
	borderAlpha: 0.09,
	borderWidth: 1,
	overlayOpacity: 0.2,
	modalBlur: 7,
	squircleSize: 30,
	popupRadiusOffset: 8,
	postFormRadiusOffset: 10,
	focusWidth: 2,
	focusOffset: 2,
	shadowStrength: 0.78,
	shadowYOffset: 12,
	shadowRaisedStrength: 0.86,
	shadowRaisedYOffset: 22,
	spacingScale: 1.06,
	menuItemHeight: 38,
	menuMinWidth: 220,
	floatingGap: 10,
	drawerWidth: 324,
	dialogPadding: 30,
	tooltipRadius: 10,
	motionScale: 1,
	motionDistance: 10,
});

export type UiGraphicsPresetKey = 'feather' | 'airy' | 'frosted' | 'solid' | 'compact';

export const UI_GRAPHICS_PRESETS: Readonly<Record<UiGraphicsPresetKey, Readonly<UiGraphicsStore>>> = Object.freeze({
	feather: DEFAULT_UI_GRAPHICS,
	airy: Object.freeze({
		...DEFAULT_UI_GRAPHICS,
		radius: 18,
		buttonRadius: 16,
		mobileDockRadius: 28,
		blur: 15,
		panelAlpha: 0.58,
		popupAlpha: 0.66,
		navAlpha: 0.61,
		pageAlpha: 0.64,
		modalBlur: 9,
		popupRadiusOffset: 10,
		shadowStrength: 0.66,
		shadowRaisedStrength: 0.75,
		spacingScale: 1.18,
		menuItemHeight: 42,
		menuMinWidth: 232,
		floatingGap: 12,
		dialogPadding: 36,
		tooltipRadius: 12,
		motionScale: 1.06,
		motionDistance: 12,
	}),
	frosted: Object.freeze({
		...DEFAULT_UI_GRAPHICS,
		blur: 20,
		saturate: 145,
		brightness: 106,
		panelAlpha: 0.48,
		popupAlpha: 0.56,
		navAlpha: 0.5,
		pageAlpha: 0.58,
		borderAlpha: 0.14,
		modalBlur: 12,
		shadowStrength: 0.92,
		shadowRaisedStrength: 1.04,
	}),
	solid: Object.freeze({
		...DEFAULT_UI_GRAPHICS,
		blur: 0,
		saturate: 100,
		brightness: 100,
		panelAlpha: 0.96,
		popupAlpha: 0.98,
		navAlpha: 0.96,
		pageAlpha: 0.98,
		borderAlpha: 0.12,
		overlayOpacity: 0.28,
		modalBlur: 0,
		shadowStrength: 0.55,
		shadowRaisedStrength: 0.68,
	}),
	compact: Object.freeze({
		...DEFAULT_UI_GRAPHICS,
		radius: 10,
		buttonRadius: 9,
		mobileDockRadius: 18,
		mobileDockPaddingX: 6,
		mobileDockPaddingTop: 4,
		mobileDockPaddingBottom: 0,
		blur: 8,
		popupRadiusOffset: 6,
		postFormRadiusOffset: 6,
		spacingScale: 0.86,
		menuItemHeight: 32,
		menuMinWidth: 196,
		floatingGap: 7,
		drawerWidth: 300,
		dialogPadding: 22,
		tooltipRadius: 8,
		motionScale: 0.88,
		motionDistance: 7,
	}),
});

const OVERRIDE_KEYS = [
	'--MI-radius',
	'--MI-buttonRadius',
	'--MI-buttonPillRadius',
	'--MI-mobileDockRadius',
	'--MI-mobileDockPaddingX',
	'--MI-mobileDockPaddingTop',
	'--MI-mobileDockPaddingBottom',
	'--MI-surfaceFilter',
	'--MI-surfacePanel',
	'--MI-surfacePopup',
	'--MI-surfaceNav',
	'--MI-surfacePage',
	'--MI-surfaceBorder',
	'--MI-surfaceBorderWidth',
	'--MI-surfaceShadow',
	'--MI-surfaceShadowRaised',
	'--MI-overlayOpacity',
	'--MI-squircleSize',
	'--MI-popupRadiusOffset',
	'--MI-popupRadius',
	'--MI-drawerRadius',
	'--MI-postFormRadiusOffset',
	'--MI-uiModalBlur',
	'--MI-modalBgFilter',
	'--MI-focusOutlineWidth',
	'--MI-focusOutlineOffset',
	'--MI-spacingScale',
	'--MI-space7',
	'--MI-space8',
	'--MI-space10',
	'--MI-space12',
	'--MI-space13',
	'--MI-space16',
	'--MI-space18',
	'--MI-space20',
	'--MI-space21',
	'--MI-space24',
	'--MI-space30',
	'--MI-menuItemHeight',
	'--MI-menuMinWidth',
	'--MI-floatingGap',
	'--MI-floatingGapDouble',
	'--MI-drawerWidth',
	'--MI-dialogPadding',
	'--MI-dialogPaddingNarrow',
	'--MI-tooltipRadius',
	'--MI-motionScale',
	'--MI-motionDistance',
	'--MI-motionDistance35',
	'--MI-motionDistance40',
	'--MI-motionDistance45',
	'--MI-motionDistanceNegative35',
	'--MI-motionDistanceNegative3',
	'--MI-motionDurationFast',
	'--MI-motionDurationNormal',
	'--MI-motionDurationSlow',
] as const;

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

export function normalizeUiGraphics(value: Partial<UiGraphicsStore> | null | undefined): UiGraphicsStore {
	const source = value ?? {};
	return {
		enabled: source.enabled ?? DEFAULT_UI_GRAPHICS.enabled,
		radius: clamp(source.radius ?? DEFAULT_UI_GRAPHICS.radius, 0, 48),
		buttonRadius: clamp(source.buttonRadius ?? DEFAULT_UI_GRAPHICS.buttonRadius, 0, 48),
		buttonPillRadius: clamp(source.buttonPillRadius ?? DEFAULT_UI_GRAPHICS.buttonPillRadius, 0, 999),
		mobileDockRadius: clamp(source.mobileDockRadius ?? DEFAULT_UI_GRAPHICS.mobileDockRadius, 0, 48),
		mobileDockPaddingX: clamp(source.mobileDockPaddingX ?? DEFAULT_UI_GRAPHICS.mobileDockPaddingX, 0, 32),
		mobileDockPaddingTop: clamp(source.mobileDockPaddingTop ?? DEFAULT_UI_GRAPHICS.mobileDockPaddingTop, 0, 32),
		mobileDockPaddingBottom: clamp(source.mobileDockPaddingBottom ?? DEFAULT_UI_GRAPHICS.mobileDockPaddingBottom, 0, 40),
		blur: clamp(source.blur ?? DEFAULT_UI_GRAPHICS.blur, 0, 30),
		saturate: clamp(source.saturate ?? DEFAULT_UI_GRAPHICS.saturate, 50, 220),
		brightness: clamp(source.brightness ?? DEFAULT_UI_GRAPHICS.brightness, 80, 130),
		panelAlpha: clamp(source.panelAlpha ?? DEFAULT_UI_GRAPHICS.panelAlpha, 0.2, 1),
		popupAlpha: clamp(source.popupAlpha ?? DEFAULT_UI_GRAPHICS.popupAlpha, 0.2, 1),
		navAlpha: clamp(source.navAlpha ?? DEFAULT_UI_GRAPHICS.navAlpha, 0.2, 1),
		pageAlpha: clamp(source.pageAlpha ?? DEFAULT_UI_GRAPHICS.pageAlpha, 0.2, 1),
		borderAlpha: clamp(source.borderAlpha ?? DEFAULT_UI_GRAPHICS.borderAlpha, 0, 0.5),
		borderWidth: clamp(source.borderWidth ?? DEFAULT_UI_GRAPHICS.borderWidth, 0, 4),
		overlayOpacity: clamp(source.overlayOpacity ?? DEFAULT_UI_GRAPHICS.overlayOpacity, 0, 0.8),
		modalBlur: clamp(source.modalBlur ?? DEFAULT_UI_GRAPHICS.modalBlur, 0, 24),
		squircleSize: clamp(source.squircleSize ?? DEFAULT_UI_GRAPHICS.squircleSize, 8, 48),
		popupRadiusOffset: clamp(source.popupRadiusOffset ?? DEFAULT_UI_GRAPHICS.popupRadiusOffset, 0, 32),
		postFormRadiusOffset: clamp(source.postFormRadiusOffset ?? DEFAULT_UI_GRAPHICS.postFormRadiusOffset, 0, 32),
		focusWidth: clamp(source.focusWidth ?? DEFAULT_UI_GRAPHICS.focusWidth, 1, 8),
		focusOffset: clamp(source.focusOffset ?? DEFAULT_UI_GRAPHICS.focusOffset, -8, 8),
		shadowStrength: clamp(source.shadowStrength ?? DEFAULT_UI_GRAPHICS.shadowStrength, 0, 2),
		shadowYOffset: clamp(source.shadowYOffset ?? DEFAULT_UI_GRAPHICS.shadowYOffset, 0, 40),
		shadowRaisedStrength: clamp(source.shadowRaisedStrength ?? DEFAULT_UI_GRAPHICS.shadowRaisedStrength, 0, 2),
		shadowRaisedYOffset: clamp(source.shadowRaisedYOffset ?? DEFAULT_UI_GRAPHICS.shadowRaisedYOffset, 0, 70),
		spacingScale: clamp(source.spacingScale ?? DEFAULT_UI_GRAPHICS.spacingScale, 0.72, 1.4),
		menuItemHeight: clamp(source.menuItemHeight ?? DEFAULT_UI_GRAPHICS.menuItemHeight, 28, 52),
		menuMinWidth: clamp(source.menuMinWidth ?? DEFAULT_UI_GRAPHICS.menuMinWidth, 176, 320),
		floatingGap: clamp(source.floatingGap ?? DEFAULT_UI_GRAPHICS.floatingGap, 4, 24),
		drawerWidth: clamp(source.drawerWidth ?? DEFAULT_UI_GRAPHICS.drawerWidth, 260, 420),
		dialogPadding: clamp(source.dialogPadding ?? DEFAULT_UI_GRAPHICS.dialogPadding, 12, 56),
		tooltipRadius: clamp(source.tooltipRadius ?? DEFAULT_UI_GRAPHICS.tooltipRadius, 4, 24),
		motionScale: clamp(source.motionScale ?? DEFAULT_UI_GRAPHICS.motionScale, 0.5, 1.8),
		motionDistance: clamp(source.motionDistance ?? DEFAULT_UI_GRAPHICS.motionDistance, 0, 28),
	};
}

export function cloneUiGraphicsPreset(key: UiGraphicsPresetKey): UiGraphicsStore {
	return { ...UI_GRAPHICS_PRESETS[key] };
}

export function findUiGraphicsPreset(value: Partial<UiGraphicsStore> | null | undefined): UiGraphicsPresetKey | null {
	const normalized = normalizeUiGraphics(value);
	for (const [key, preset] of Object.entries(UI_GRAPHICS_PRESETS) as [UiGraphicsPresetKey, Readonly<UiGraphicsStore>][]) {
		if ((Object.keys(DEFAULT_UI_GRAPHICS) as (keyof UiGraphicsStore)[]).every(field => normalized[field] === preset[field])) return key;
	}
	return null;
}

function supportsRelativeColor(): boolean {
	return typeof CSS !== 'undefined' && CSS.supports?.('color', 'color(from white srgb r g b / 0.5)');
}

function supportsColorMix(): boolean {
	return typeof CSS !== 'undefined' && CSS.supports?.('color', 'color-mix(in srgb, white 50%, transparent)');
}

export function withAlphaFromCssColor(value: string, alpha: number): string | null {
	const normalizedAlpha = Math.min(1, Math.max(0, alpha));
	const hex = value.trim().match(/^#([0-9a-f]{3,8})$/i);
	if (hex != null) {
		const raw = hex[1];
		if (![3, 4, 6, 8].includes(raw.length)) return null;
		const expanded = raw.length <= 4
			? [...raw].map(character => character + character).join('')
			: raw;
		const red = Number.parseInt(expanded.slice(0, 2), 16);
		const green = Number.parseInt(expanded.slice(2, 4), 16);
		const blue = Number.parseInt(expanded.slice(4, 6), 16);
		const sourceAlpha = expanded.length === 8 ? Number.parseInt(expanded.slice(6, 8), 16) / 255 : 1;
		return `rgba(${red}, ${green}, ${blue}, ${(sourceAlpha * normalizedAlpha).toFixed(3)})`;
	}

	const rgb = value.trim().match(/^rgba?\(\s*([\d.]+%?)\s*[, ]\s*([\d.]+%?)\s*[, ]\s*([\d.]+%?)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/i);
	if (rgb == null) return null;

	const channel = (raw: string): number => raw.endsWith('%')
		? Number.parseFloat(raw) * 2.55
		: Number.parseFloat(raw);
	const red = Math.min(255, Math.max(0, channel(rgb[1])));
	const green = Math.min(255, Math.max(0, channel(rgb[2])));
	const blue = Math.min(255, Math.max(0, channel(rgb[3])));
	const sourceAlpha = rgb[4] == null
		? 1
		: rgb[4].endsWith('%')
			? Number.parseFloat(rgb[4]) / 100
			: Number.parseFloat(rgb[4]);
	if (![red, green, blue, sourceAlpha].every(Number.isFinite)) return null;

	return `rgba(${Math.round(red)}, ${Math.round(green)}, ${Math.round(blue)}, ${Math.min(1, Math.max(0, sourceAlpha * normalizedAlpha)).toFixed(3)})`;
}

function alphaColor(themeVariable: string, alpha: number): string {
	const percentage = `${(alpha * 100).toFixed(2)}%`;
	if (supportsRelativeColor()) {
		return `color(from var(${themeVariable}) srgb r g b / ${alpha.toFixed(3)})`;
	}
	if (supportsColorMix()) {
		return `color-mix(in srgb, var(${themeVariable}) ${percentage}, transparent)`;
	}

	const resolved = typeof window !== 'undefined'
		? window.getComputedStyle(window.document.documentElement).getPropertyValue(themeVariable)
		: '';
	return withAlphaFromCssColor(resolved, alpha) ?? `var(${themeVariable})`;
}

function shadowColor(alpha: number): string {
	return supportsRelativeColor() || supportsColorMix()
		? alphaColor('--MI_THEME-shadow', alpha)
		: `rgba(0, 0, 0, ${alpha.toFixed(3)})`;
}

export function motionDuration(baseMilliseconds: number, graphics: Partial<UiGraphicsStore> | null | undefined): number {
	if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return 1;
	return Math.round(baseMilliseconds * normalizeUiGraphics(graphics).motionScale);
}

export function applyUiGraphics(
	value: Partial<UiGraphicsStore> | null | undefined,
	options: { surfaceBlur: boolean; modalBlur: boolean },
): void {
	const root = window.document.documentElement;
	const graphics = normalizeUiGraphics(value);
	setFeatherMissEnabled(graphics.enabled);

	root.classList.toggle('uiGraphicsEnabled', graphics.enabled);
	root.classList.toggle('uiSurfaceBlurDisabled', !options.surfaceBlur);

	if (!graphics.enabled) {
		for (const key of OVERRIDE_KEYS) root.style.removeProperty(key);
		root.style.setProperty('--MI-modalBgFilter', options.modalBlur ? 'blur(var(--MI-uiModalBlur))' : 'none');
		return;
	}

	const supportsBackdrop = typeof CSS !== 'undefined' && (
		CSS.supports('backdrop-filter', 'blur(1px)') ||
		CSS.supports('-webkit-backdrop-filter', 'blur(1px)')
	);
	const useBackdropFilter = options.surfaceBlur && supportsBackdrop;
	const filter = useBackdropFilter
		? `${graphics.blur > 0 ? `blur(${graphics.blur}px) ` : ''}saturate(${graphics.saturate}%) brightness(${graphics.brightness}%)`
		: 'none';
	const surfaceAlpha = (alpha: number): number => useBackdropFilter ? alpha : Math.max(alpha, 0.94);

	root.style.setProperty('--MI-radius', `${graphics.radius}px`);
	root.style.setProperty('--MI-buttonRadius', `${graphics.buttonRadius}px`);
	root.style.setProperty('--MI-buttonPillRadius', `${graphics.buttonPillRadius}px`);
	root.style.setProperty('--MI-mobileDockRadius', `${graphics.mobileDockRadius}px`);
	root.style.setProperty('--MI-mobileDockPaddingX', `${graphics.mobileDockPaddingX}px`);
	root.style.setProperty('--MI-mobileDockPaddingTop', `${graphics.mobileDockPaddingTop}px`);
	root.style.setProperty('--MI-mobileDockPaddingBottom', `${graphics.mobileDockPaddingBottom}px`);
	root.style.setProperty('--MI-surfaceFilter', filter);
	root.style.setProperty('--MI-surfacePanel', alphaColor('--MI_THEME-panel', surfaceAlpha(graphics.panelAlpha)));
	root.style.setProperty('--MI-surfacePopup', alphaColor('--MI_THEME-popup', surfaceAlpha(graphics.popupAlpha)));
	root.style.setProperty('--MI-surfaceNav', alphaColor('--MI_THEME-navBg', surfaceAlpha(graphics.navAlpha)));
	root.style.setProperty('--MI-surfacePage', alphaColor('--MI_THEME-bg', surfaceAlpha(graphics.pageAlpha)));
	root.style.setProperty('--MI-surfaceBorder', alphaColor('--MI_THEME-fg', graphics.borderAlpha));
	root.style.setProperty('--MI-surfaceBorderWidth', `${graphics.borderWidth.toFixed(2)}px`);
	root.style.setProperty('--MI-overlayOpacity', graphics.overlayOpacity.toFixed(3));
	root.style.setProperty('--MI-squircleSize', `${graphics.squircleSize}px`);
	root.style.setProperty('--MI-popupRadiusOffset', `${graphics.popupRadiusOffset}px`);
	root.style.setProperty('--MI-popupRadius', `${graphics.radius + graphics.popupRadiusOffset}px`);
	root.style.setProperty('--MI-drawerRadius', `${Math.max(18, graphics.radius + 10)}px`);
	root.style.setProperty('--MI-postFormRadiusOffset', `${graphics.postFormRadiusOffset}px`);
	root.style.setProperty('--MI-uiModalBlur', `${graphics.modalBlur.toFixed(1)}px`);
	root.style.setProperty('--MI-modalBgFilter', options.modalBlur && graphics.modalBlur > 0 ? `blur(${graphics.modalBlur.toFixed(1)}px)` : 'none');
	root.style.setProperty('--MI-focusOutlineWidth', `${graphics.focusWidth}px`);
	root.style.setProperty('--MI-focusOutlineOffset', `${graphics.focusOffset}px`);
	root.style.setProperty('--MI-spacingScale', graphics.spacingScale.toFixed(3));
	for (const size of [7, 8, 10, 12, 13, 16, 18, 20, 21, 24, 30] as const) {
		root.style.setProperty(`--MI-space${size}`, `${(size * graphics.spacingScale).toFixed(2)}px`);
	}
	root.style.setProperty('--MI-menuItemHeight', `${graphics.menuItemHeight}px`);
	root.style.setProperty('--MI-menuMinWidth', `${graphics.menuMinWidth}px`);
	root.style.setProperty('--MI-floatingGap', `${graphics.floatingGap}px`);
	root.style.setProperty('--MI-floatingGapDouble', `${graphics.floatingGap * 2}px`);
	root.style.setProperty('--MI-drawerWidth', `${graphics.drawerWidth}px`);
	root.style.setProperty('--MI-dialogPadding', `${graphics.dialogPadding}px`);
	root.style.setProperty('--MI-dialogPaddingNarrow', `${Math.max(12, graphics.dialogPadding * 0.55).toFixed(2)}px`);
	root.style.setProperty('--MI-tooltipRadius', `${graphics.tooltipRadius}px`);
	const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
	const effectiveMotionScale = reduceMotion ? 0 : graphics.motionScale;
	const effectiveMotionDistance = reduceMotion ? 0 : graphics.motionDistance;
	root.style.setProperty('--MI-motionScale', effectiveMotionScale.toFixed(3));
	root.style.setProperty('--MI-motionDistance', `${effectiveMotionDistance}px`);
	root.style.setProperty('--MI-motionDistance35', `${(effectiveMotionDistance * 0.35).toFixed(2)}px`);
	root.style.setProperty('--MI-motionDistance40', `${(effectiveMotionDistance * 0.4).toFixed(2)}px`);
	root.style.setProperty('--MI-motionDistance45', `${(effectiveMotionDistance * 0.45).toFixed(2)}px`);
	root.style.setProperty('--MI-motionDistanceNegative35', `${(effectiveMotionDistance * -0.35).toFixed(2)}px`);
	root.style.setProperty('--MI-motionDistanceNegative3', `${(effectiveMotionDistance * -3).toFixed(2)}px`);
	root.style.setProperty('--MI-motionDurationFast', reduceMotion ? '1ms' : `${Math.round(130 * effectiveMotionScale)}ms`);
	root.style.setProperty('--MI-motionDurationNormal', reduceMotion ? '1ms' : `${Math.round(220 * effectiveMotionScale)}ms`);
	root.style.setProperty('--MI-motionDurationSlow', reduceMotion ? '1ms' : `${Math.round(340 * effectiveMotionScale)}ms`);
	root.style.setProperty('--MI-surfaceShadow', `0 ${graphics.shadowYOffset.toFixed(1)}px ${(graphics.shadowYOffset * 2.7).toFixed(1)}px ${shadowColor(0.24 * graphics.shadowStrength)}, 0 ${(graphics.shadowYOffset * 0.29).toFixed(1)}px ${(graphics.shadowYOffset * 0.86).toFixed(1)}px ${shadowColor(0.12 * graphics.shadowStrength)}`);
	root.style.setProperty('--MI-surfaceShadowRaised', `0 ${graphics.shadowRaisedYOffset.toFixed(1)}px ${(graphics.shadowRaisedYOffset * 3.5).toFixed(1)}px ${shadowColor(0.30 * graphics.shadowRaisedStrength)}, 0 ${(graphics.shadowRaisedYOffset * 0.39).toFixed(1)}px ${(graphics.shadowRaisedYOffset * 1.08).toFixed(1)}px ${shadowColor(0.16 * graphics.shadowRaisedStrength)}`);
}
