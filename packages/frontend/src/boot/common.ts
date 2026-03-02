/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { watch, version as vueVersion } from 'vue';
import { compareVersions } from 'compare-versions';
import { version, lang, apiUrl, isSafeMode } from '@@/js/config.js';
import defaultLightTheme from '@@/themes/l-light.json5';
import defaultDarkTheme from '@@/themes/d-green-lime.json5';
import { storeBootloaderErrors } from '@@/js/store-boot-errors';
import type { App } from 'vue';
import widgets from '@/widgets/index.js';
import directives from '@/directives/index.js';
import components from '@/components/index.js';
import { applyTheme } from '@/theme.js';
import { isDeviceDarkmode } from '@/utility/is-device-darkmode.js';
import { i18n } from '@/i18n.js';
import { refreshCurrentAccount, login } from '@/accounts.js';
import { store } from '@/store.js';
import { fetchInstance, instance } from '@/instance.js';
import { updateDeviceKind } from '@/utility/device-kind.js';
import { reloadChannel } from '@/utility/unison-reload.js';
import { getUrlWithoutLoginId } from '@/utility/login-id.js';
import { getAccountFromId } from '@/utility/get-account-from-id.js';
import { deckStore } from '@/ui/deck/deck-store.js';
import { analytics, initAnalytics } from '@/analytics.js';
import { miLocalStorage } from '@/local-storage.js';
import { fetchCustomEmojis } from '@/custom-emojis.js';
import { prefer } from '@/preferences.js';
import { $i } from '@/i.js';
import { launchPlugins } from '@/plugin.js';
import type { UiGraphicsStore } from '@/preferences/def.js';

const UI_GRAPHICS_OVERRIDE_KEYS = [
	'--MI-radius',
	'--MI-buttonRadius',
	'--MI-buttonPillRadius',
	'--MI-mobileDockRadius',
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
	'--MI-postFormRadiusOffset',
	'--MI-uiModalBlur',
	'--MI-focusOutlineWidth',
	'--MI-focusOutlineOffset',
] as const;

function clamp(value: number, min: number, max: number): number {
	return Math.min(max, Math.max(min, value));
}

function applyUiGraphics(graphics: UiGraphicsStore): void {
	const root = window.document.documentElement;
	const normalized: UiGraphicsStore = {
		enabled: graphics.enabled ?? false,
		radius: graphics.radius ?? 12,
		buttonRadius: graphics.buttonRadius ?? 12,
		buttonPillRadius: graphics.buttonPillRadius ?? 999,
		mobileDockRadius: graphics.mobileDockRadius ?? 22,
		blur: graphics.blur ?? 9,
		saturate: graphics.saturate ?? 125,
		panelAlpha: graphics.panelAlpha ?? 0.62,
		popupAlpha: graphics.popupAlpha ?? 0.52,
		navAlpha: graphics.navAlpha ?? 0.58,
		pageAlpha: graphics.pageAlpha ?? 0.62,
		borderAlpha: graphics.borderAlpha ?? 0.07,
		borderWidth: graphics.borderWidth ?? 1,
		overlayOpacity: graphics.overlayOpacity ?? 0.18,
		modalBlur: graphics.modalBlur ?? 4,
		squircleSize: graphics.squircleSize ?? 28,
		popupRadiusOffset: graphics.popupRadiusOffset ?? 12,
		postFormRadiusOffset: graphics.postFormRadiusOffset ?? 12,
		focusWidth: graphics.focusWidth ?? 2,
		focusOffset: graphics.focusOffset ?? -2,
		shadowStrength: graphics.shadowStrength ?? 1,
		shadowYOffset: graphics.shadowYOffset ?? 14,
		shadowRaisedStrength: graphics.shadowRaisedStrength ?? 1,
		shadowRaisedYOffset: graphics.shadowRaisedYOffset ?? 26,
	};

	if (!normalized.enabled) {
		for (const key of UI_GRAPHICS_OVERRIDE_KEYS) {
			root.style.removeProperty(key);
		}

		const defaultModalBlur = window.innerWidth <= 500 ? '2px' : '4px';
		root.style.setProperty('--MI-modalBgFilter', prefer.s.useBlurEffectForModal ? `blur(${defaultModalBlur})` : 'none');
		return;
	}

	const radius = clamp(normalized.radius, 0, 48);
	const buttonRadius = clamp(normalized.buttonRadius, 0, 48);
	const buttonPillRadius = clamp(normalized.buttonPillRadius, 0, 999);
	const mobileDockRadius = clamp(normalized.mobileDockRadius, 0, 48);
	const blur = clamp(normalized.blur, 0, 24);
	const saturate = clamp(normalized.saturate, 50, 220);
	const panelAlpha = clamp(normalized.panelAlpha, 0, 1);
	const popupAlpha = clamp(normalized.popupAlpha, 0, 1);
	const navAlpha = clamp(normalized.navAlpha, 0, 1);
	const pageAlpha = clamp(normalized.pageAlpha, 0, 1);
	const borderAlpha = clamp(normalized.borderAlpha, 0, 1);
	const borderWidth = clamp(normalized.borderWidth, 0, 4);
	const overlayOpacity = clamp(normalized.overlayOpacity, 0, 1);
	const modalBlur = clamp(normalized.modalBlur, 0, 20);
	const squircleSize = clamp(normalized.squircleSize, 8, 48);
	const popupRadiusOffset = clamp(normalized.popupRadiusOffset, 0, 32);
	const postFormRadiusOffset = clamp(normalized.postFormRadiusOffset, 0, 32);
	const focusWidth = clamp(normalized.focusWidth, 1, 8);
	const focusOffset = clamp(normalized.focusOffset, -8, 8);
	const shadowStrength = clamp(normalized.shadowStrength, 0, 2);
	const shadowYOffset = clamp(normalized.shadowYOffset, 0, 40);
	const shadowRaisedStrength = clamp(normalized.shadowRaisedStrength, 0, 2);
	const shadowRaisedYOffset = clamp(normalized.shadowRaisedYOffset, 0, 70);

	root.style.setProperty('--MI-radius', `${radius}px`);
	root.style.setProperty('--MI-buttonRadius', `${buttonRadius}px`);
	root.style.setProperty('--MI-buttonPillRadius', `${buttonPillRadius}px`);
	root.style.setProperty('--MI-mobileDockRadius', `${mobileDockRadius}px`);
	root.style.setProperty('--MI-surfaceFilter', `blur(${blur}px) saturate(${saturate}%)`);
	root.style.setProperty('--MI-surfacePanel', `color(from var(--MI_THEME-panel) srgb r g b / ${panelAlpha.toFixed(3)})`);
	root.style.setProperty('--MI-surfacePopup', `color(from var(--MI_THEME-popup) srgb r g b / ${popupAlpha.toFixed(3)})`);
	root.style.setProperty('--MI-surfaceNav', `color(from var(--MI_THEME-navBg) srgb r g b / ${navAlpha.toFixed(3)})`);
	root.style.setProperty('--MI-surfacePage', `color(from var(--MI_THEME-bg) srgb r g b / ${pageAlpha.toFixed(3)})`);
	root.style.setProperty('--MI-surfaceBorder', `color(from var(--MI_THEME-fg) srgb r g b / ${borderAlpha.toFixed(3)})`);
	root.style.setProperty('--MI-surfaceBorderWidth', `${borderWidth.toFixed(2)}px`);
	root.style.setProperty('--MI-overlayOpacity', overlayOpacity.toFixed(3));
	root.style.setProperty('--MI-squircleSize', `${squircleSize}px`);
	root.style.setProperty('--MI-popupRadiusOffset', `${popupRadiusOffset}px`);
	root.style.setProperty('--MI-postFormRadiusOffset', `${postFormRadiusOffset}px`);
	root.style.setProperty('--MI-uiModalBlur', `${modalBlur.toFixed(1)}px`);
	if (prefer.s.useBlurEffectForModal) {
		root.style.setProperty('--MI-modalBgFilter', `blur(${modalBlur.toFixed(1)}px)`);
	}
	root.style.setProperty('--MI-focusOutlineWidth', `${focusWidth}px`);
	root.style.setProperty('--MI-focusOutlineOffset', `${focusOffset}px`);
	root.style.setProperty('--MI-surfaceShadow', `0 ${shadowYOffset.toFixed(1)}px ${(shadowYOffset * 2.7).toFixed(1)}px color(from var(--MI_THEME-shadow) srgb r g b / ${(0.24 * shadowStrength).toFixed(3)}), 0 ${(shadowYOffset * 0.29).toFixed(1)}px ${(shadowYOffset * 0.86).toFixed(1)}px color(from var(--MI_THEME-shadow) srgb r g b / ${(0.12 * shadowStrength).toFixed(3)})`);
	root.style.setProperty('--MI-surfaceShadowRaised', `0 ${shadowRaisedYOffset.toFixed(1)}px ${(shadowRaisedYOffset * 3.5).toFixed(1)}px color(from var(--MI_THEME-shadow) srgb r g b / ${(0.30 * shadowRaisedStrength).toFixed(3)}), 0 ${(shadowRaisedYOffset * 0.39).toFixed(1)}px ${(shadowRaisedYOffset * 1.08).toFixed(1)}px color(from var(--MI_THEME-shadow) srgb r g b / ${(0.16 * shadowRaisedStrength).toFixed(3)})`);
}

export async function common(createVue: () => Promise<App<Element>>) {
	console.info(`Misskey v${version}`);

	if (_DEV_) {
		console.warn('Development mode!!!');

		console.info(`vue ${vueVersion}`);

		window.addEventListener('error', event => {
			console.error(event);
			/*
			alert({
				type: 'error',
				title: 'DEV: Unhandled error',
				text: event.message
			});
			*/
		});

		window.addEventListener('unhandledrejection', event => {
			console.error(event);
			/*
			alert({
				type: 'error',
				title: 'DEV: Unhandled promise rejection',
				text: event.reason
			});
			*/
		});
	}

	let isClientUpdated = false;

	//#region クライアントが更新されたかチェック
	const lastVersion = miLocalStorage.getItem('lastVersion');
	if (lastVersion !== version) {
		miLocalStorage.setItem('lastVersion', version);

		try { // 変なバージョン文字列来るとcompareVersionsでエラーになるため
			if (lastVersion != null && compareVersions(version, lastVersion) === 1) {
				isClientUpdated = true;
			}
		} catch (err) { /* empty */ }
	}
	//#endregion

	//#region Detect language & fetch translations
	storeBootloaderErrors({ ...i18n.ts._bootErrors, reload: i18n.ts.reload });

	if (import.meta.hot) {
		import.meta.hot.on('locale-update', async (updatedLang: string) => {
			console.info(`Locale updated: ${updatedLang}`);
			if (updatedLang === lang) {
				await new Promise(resolve => {
					window.setTimeout(resolve, 500);
				});
				// fetch with cache: 'no-store' to ensure the latest locale is fetched
				await window.fetch(`/assets/locales/${lang}.${version}.json`, { cache: 'no-store' }).then(async res => res.status === 200 && await res.text());
				window.location.reload();
			}
		});
	}
	//#endregion

	// タッチデバイスでCSSの:hoverを機能させる
	window.document.addEventListener('touchend', () => {}, { passive: true });

	// URLに#pswpを含む場合は取り除く
	if (window.location.hash === '#pswp') {
		window.history.replaceState(null, '', window.location.href.replace('#pswp', ''));
	}

	// 一斉リロード
	reloadChannel.addEventListener('message', path => {
		if (path !== null) window.location.href = path;
		else window.location.reload();
	});

	//#region Set lang attr
	const html = window.document.documentElement;
	html.setAttribute('lang', lang);
	//#endregion

	await store.ready;
	await deckStore.ready;

	const fetchInstanceMetaPromise = fetchInstance();

	fetchInstanceMetaPromise.then(() => {
		miLocalStorage.setItem('v', instance.version);
	});

	//#region loginId
	const params = new URLSearchParams(window.location.search);
	const loginId = params.get('loginId');

	if (loginId) {
		const target = getUrlWithoutLoginId(window.location.href);

		if (!$i || $i.id !== loginId) {
			const account = await getAccountFromId(loginId);
			if (account) {
				await login(account.token, target);
			}
		}

		window.history.replaceState({ misskey: 'loginId' }, '', target);
	}
	//#endregion

	//#region Sync dark mode
	if (prefer.s.syncDeviceDarkMode) {
		store.set('darkMode', isDeviceDarkmode());
	}

	window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (mql) => {
		if (prefer.s.syncDeviceDarkMode) {
			store.set('darkMode', mql.matches);
		}
	});
	//#endregion

	if (!isSafeMode) {
		// TODO: instance.defaultLightTheme/instance.defaultDarkThemeが不正な形式だった場合のケア
		if (prefer.s.lightTheme == null && instance.defaultLightTheme != null) prefer.commit('lightTheme', JSON.parse(instance.defaultLightTheme));
		if (prefer.s.darkTheme == null && instance.defaultDarkTheme != null) prefer.commit('darkTheme', JSON.parse(instance.defaultDarkTheme));
	}

	// NOTE: この処理は必ずクライアント更新チェック処理より後に来ること(テーマ再構築のため)
	// NOTE: この処理は必ずダークモード判定処理より後に来ること(初回のテーマ適用のため)
	// NOTE: この処理は必ずサーバーテーマ適用処理より後に来ること(二重applyTheme発火を防ぐため)
	// see: https://github.com/misskey-dev/misskey/issues/16562
	watch(store.r.darkMode, (darkMode) => {
		const theme = (() => {
			if (darkMode) {
				return isSafeMode ? defaultDarkTheme : (prefer.s.darkTheme ?? defaultDarkTheme);
			} else {
				return isSafeMode ? defaultLightTheme : (prefer.s.lightTheme ?? defaultLightTheme);
			}
		})();

		applyTheme(theme);
	}, { immediate: true });

	window.document.documentElement.dataset.colorScheme = store.s.darkMode ? 'dark' : 'light';

	if (!isSafeMode) {
		watch(prefer.r.darkTheme, (theme) => {
			if (store.s.darkMode) {
				applyTheme(theme ?? defaultDarkTheme);
			}
		});

		watch(prefer.r.lightTheme, (theme) => {
			if (!store.s.darkMode) {
				applyTheme(theme ?? defaultLightTheme);
			}
		});
	}

	watch(prefer.r.overridedDeviceKind, (kind) => {
		updateDeviceKind(kind);
	}, { immediate: true });

	watch(prefer.r.useBlurEffectForModal, v => {
		const root = window.document.documentElement;
		const uiModalBlur = window.getComputedStyle(root).getPropertyValue('--MI-uiModalBlur').trim();
		const defaultModalBlur = window.innerWidth <= 500 ? '2px' : '4px';
		const blur = uiModalBlur || defaultModalBlur;
		root.style.setProperty('--MI-modalBgFilter', v ? `blur(${blur})` : 'none');
	}, { immediate: true });

	watch(prefer.r.useBlurEffect, v => {
		if (v) {
			window.document.documentElement.style.removeProperty('--MI-blur');
		} else {
			window.document.documentElement.style.setProperty('--MI-blur', 'none');
		}
	}, { immediate: true });

	watch(prefer.r.uiGraphics, (value) => {
		applyUiGraphics(value);
	}, { immediate: true, deep: true });

	// Keep screen on
	const onVisibilityChange = () => window.document.addEventListener('visibilitychange', () => {
		if (window.document.visibilityState === 'visible') {
			navigator.wakeLock.request('screen');
		}
	});
	if (prefer.s.keepScreenOn && 'wakeLock' in navigator) {
		navigator.wakeLock.request('screen')
			.then(onVisibilityChange)
			.catch(() => {
				// On WebKit-based browsers, user activation is required to send wake lock request
				// https://webkit.org/blog/13862/the-user-activation-api/
				window.document.addEventListener(
					'click',
					() => navigator.wakeLock.request('screen').then(onVisibilityChange),
					{ once: true },
				);
			});
	}

	if (prefer.s.makeEveryTextElementsSelectable) {
		window.document.documentElement.classList.add('forceSelectableAll');
	}

	//#region Fetch user
	if ($i && $i.token) {
		if (_DEV_) {
			console.log('account cache found. refreshing...');
		}

		refreshCurrentAccount();
	}
	//#endregion

	try {
		await fetchCustomEmojis();
	} catch (err) { /* empty */ }

	// analytics
	fetchInstanceMetaPromise.then(async () => {
		await initAnalytics(instance);

		if ($i) {
			analytics.identify($i.id);
		}

		analytics.page({
			path: window.location.pathname,
		});
	});

	const app = await createVue();

	if (_DEV_) {
		app.config.performance = true;
	}

	widgets(app);
	directives(app);
	components(app);

	// https://github.com/misskey-dev/misskey/pull/8575#issuecomment-1114239210
	// なぜか2回実行されることがあるため、mountするdivを1つに制限する
	const rootEl = ((): HTMLElement => {
		const MISSKEY_MOUNT_DIV_ID = 'misskey_app';

		const currentRoot = window.document.getElementById(MISSKEY_MOUNT_DIV_ID);

		if (currentRoot) {
			console.warn('multiple import detected');
			return currentRoot;
		}

		const root = window.document.createElement('div');
		root.id = MISSKEY_MOUNT_DIV_ID;
		window.document.body.appendChild(root);
		return root;
	})();

	if (instance.sentryForFrontend) {
		const Sentry = await import('@sentry/vue');
		Sentry.init({
			app,
			integrations: [
				...(instance.sentryForFrontend.vueIntegration !== undefined ? [
					Sentry.vueIntegration(instance.sentryForFrontend.vueIntegration ?? undefined),
				] : []),
				...(instance.sentryForFrontend.browserTracingIntegration !== undefined ? [
					Sentry.browserTracingIntegration(instance.sentryForFrontend.browserTracingIntegration ?? undefined),
				] : []),
				...(instance.sentryForFrontend.replayIntegration !== undefined ? [
					Sentry.replayIntegration(instance.sentryForFrontend.replayIntegration ?? undefined),
				] : []),
			],

			// Set tracesSampleRate to 1.0 to capture 100%
			tracesSampleRate: 1.0,

			// Set `tracePropagationTargets` to control for which URLs distributed tracing should be enabled
			...(instance.sentryForFrontend.browserTracingIntegration !== undefined ? {
				tracePropagationTargets: [apiUrl],
			} : {}),

			// Capture Replay for 10% of all sessions,
			// plus for 100% of sessions with an error
			...(instance.sentryForFrontend.replayIntegration !== undefined ? {
				replaysSessionSampleRate: 0.1,
				replaysOnErrorSampleRate: 1.0,
			} : {}),

			...instance.sentryForFrontend.options,
		});
	}

	try {
		await launchPlugins();
	} catch (error) {
		console.error('Failed to launch plugins:', error);
	}

	app.mount(rootEl);

	// boot.jsのやつを解除
	window.onerror = null;
	window.onunhandledrejection = null;

	removeSplash();

	//#region Self-XSS 対策メッセージ
	if (!_DEV_) {
		console.log(
			`%c${i18n.ts._selfXssPrevention.warning}`,
			'color: #f00; background-color: #ff0; font-size: 36px; padding: 4px;',
		);
		console.log(
			`%c${i18n.ts._selfXssPrevention.title}`,
			'color: #f00; font-weight: 900; font-family: "Hiragino Sans W9", "Hiragino Kaku Gothic ProN", sans-serif; font-size: 24px;',
		);
		console.log(
			`%c${i18n.ts._selfXssPrevention.description1}`,
			'font-size: 16px; font-weight: 700;',
		);
		console.log(
			`%c${i18n.ts._selfXssPrevention.description2}`,
			'font-size: 16px;',
			'font-size: 20px; font-weight: 700; color: #f00;',
		);
		console.log(i18n.tsx._selfXssPrevention.description3({ link: 'https://misskey-hub.net/docs/for-users/resources/self-xss/' }));
	}
	//#endregion

	return {
		isClientUpdated,
		lastVersion,
		app,
	};
}

function removeSplash() {
	const splash = window.document.getElementById('splash');
	if (splash) {
		splash.style.opacity = '0';
		splash.style.pointerEvents = 'none';

		// transitionendイベントが発火しない場合があるため
		window.setTimeout(() => {
			splash.remove();
		}, 1000);
	}
}
