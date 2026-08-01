/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { onMounted, onUnmounted, watch } from 'vue';

/** Keep the mobile dock's dynamic safe-area spacing outside the upstream shell. */
export function useFeatherMissMobileDockSpacing(rootEl: { readonly value: HTMLElement | null }): void {
	let resizeObserver: ResizeObserver | null = null;

	const sync = () => {
		const element = rootEl.value;
		if (!element) {
			window.document.body.style.setProperty('--MI-minBottomSpacing', '0px');
			return;
		}

		const bottomInset = Number.parseFloat(window.getComputedStyle(element).bottom) || 0;
		const height = element.offsetHeight + bottomInset;
		window.document.body.style.setProperty('--MI-minBottomSpacing', height > 0 ? `${height}px` : '0px');
	};

	watch(() => rootEl.value, element => {
		resizeObserver?.disconnect();
		resizeObserver = null;
		if (element && typeof ResizeObserver !== 'undefined') {
			resizeObserver = new ResizeObserver(sync);
			resizeObserver.observe(element);
		}
		sync();
	}, { immediate: true });

	onMounted(() => {
		window.addEventListener('resize', sync, { passive: true });
		window.visualViewport?.addEventListener('resize', sync, { passive: true });
	});

	onUnmounted(() => {
		window.removeEventListener('resize', sync);
		window.visualViewport?.removeEventListener('resize', sync);
		resizeObserver?.disconnect();
		resizeObserver = null;
		window.document.body.style.setProperty('--MI-minBottomSpacing', '0px');
	});
}
