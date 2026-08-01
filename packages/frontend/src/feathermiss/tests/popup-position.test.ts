/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { beforeEach, describe, expect, test } from 'vitest';
import { calcPopupPosition } from '../utilities/popup-position.js';

function popupElement(width: number, height: number): HTMLElement {
	const element = window.document.createElement('div');
	Object.defineProperty(element, 'offsetWidth', { configurable: true, value: width });
	Object.defineProperty(element, 'offsetHeight', { configurable: true, value: height });
	return element;
}

function anchorElement(rect: Pick<DOMRect, 'left' | 'right' | 'top' | 'bottom' | 'width' | 'height'>): HTMLElement {
	const element = window.document.createElement('button');
	element.getBoundingClientRect = () => ({
		x: rect.left,
		y: rect.top,
		...rect,
		toJSON: () => ({}),
	}) as DOMRect;
	return element;
}

beforeEach(() => {
	Object.defineProperty(window, 'innerWidth', { configurable: true, value: 320 });
	Object.defineProperty(window, 'innerHeight', { configurable: true, value: 240 });
	Object.defineProperty(window, 'scrollX', { configurable: true, value: 0 });
	Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
	Object.defineProperty(window, 'visualViewport', { configurable: true, value: undefined });
	window.document.documentElement.style.setProperty('--MI-floatingGap', '10px');
	window.document.documentElement.dataset.feathermiss = 'enabled';
});

describe('calcPopupPosition', () => {
	test('uses the original Misskey placement when FeatherMiss is disabled', () => {
		delete window.document.documentElement.dataset.feathermiss;
		const popup = popupElement(100, 60);

		expect(calcPopupPosition(popup, {
			x: 2,
			y: 40,
			innerMargin: 0,
			direction: 'bottom',
			align: 'left',
			strategy: 'fixed',
		}).left).toBe(0);
	});

	test('places a popup below its anchor when there is enough room', () => {
		const popup = popupElement(120, 80);
		const anchor = anchorElement({ left: 100, right: 140, top: 80, bottom: 100, width: 40, height: 20 });

		expect(calcPopupPosition(popup, {
			anchorElement: anchor,
			innerMargin: 8,
			direction: 'bottom',
			align: 'center',
		})).toEqual({
			left: 60,
			top: 108,
			transformOrigin: 'center top',
		});
	});

	test('flips above the anchor when the requested side does not fit', () => {
		const popup = popupElement(120, 80);
		const anchor = anchorElement({ left: 100, right: 140, top: 200, bottom: 220, width: 40, height: 20 });

		const result = calcPopupPosition(popup, {
			anchorElement: anchor,
			innerMargin: 8,
			direction: 'bottom',
			align: 'center',
		});

		expect(result.top).toBe(112);
		expect(result.transformOrigin).toBe('center bottom');
	});

	test('clamps fixed popups to the configured floating edge', () => {
		window.document.documentElement.style.setProperty('--MI-floatingGap', '14px');
		const popup = popupElement(100, 60);

		const result = calcPopupPosition(popup, {
			x: 2,
			y: 40,
			innerMargin: 0,
			direction: 'bottom',
			align: 'left',
			strategy: 'fixed',
		});

		expect(result.left).toBe(14);
		expect(result.top).toBe(40);
	});
});
