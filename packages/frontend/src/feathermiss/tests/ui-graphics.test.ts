/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import {
	DEFAULT_UI_GRAPHICS,
	cloneUiGraphicsPreset,
	findUiGraphicsPreset,
	normalizeUiGraphics,
} from '../config.js';

describe('UI graphics preferences', () => {
	test('fills missing fields and clamps unsafe imported values', () => {
		const normalized = normalizeUiGraphics({
			radius: -100,
			blur: 999,
			panelAlpha: -1,
			floatingGap: 999,
			motionDistance: Number.NaN,
		});

		expect(normalized.radius).toBe(0);
		expect(normalized.blur).toBe(30);
		expect(normalized.panelAlpha).toBe(0.2);
		expect(normalized.floatingGap).toBe(24);
		expect(normalized.motionDistance).toBe(0);
		expect(normalized.buttonRadius).toBe(DEFAULT_UI_GRAPHICS.buttonRadius);
	});

	test('returns independent preset copies', () => {
		const first = cloneUiGraphicsPreset('airy');
		const second = cloneUiGraphicsPreset('airy');
		first.radius = 0;

		expect(second.radius).not.toBe(0);
		expect(findUiGraphicsPreset(second)).toBe('airy');
	});

	test('does not identify a customized preset as an exact preset', () => {
		const customized = cloneUiGraphicsPreset('feather');
		customized.spacingScale += 0.02;

		expect(findUiGraphicsPreset(customized)).toBeNull();
	});
});
