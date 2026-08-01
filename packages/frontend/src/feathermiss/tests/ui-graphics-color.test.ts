/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { withAlphaFromCssColor } from '../config.js';

describe('withAlphaFromCssColor', () => {
	test('applies opacity to an opaque rgb color', () => {
		expect(withAlphaFromCssColor('rgb(24, 48, 96)', 0.72)).toBe('rgba(24, 48, 96, 0.720)');
	});

	test('multiplies an existing alpha channel', () => {
		expect(withAlphaFromCssColor('rgba(24, 48, 96, 0.5)', 0.6)).toBe('rgba(24, 48, 96, 0.300)');
		expect(withAlphaFromCssColor('rgb(24 48 96 / 50%)', 0.6)).toBe('rgba(24, 48, 96, 0.300)');
	});

	test('supports short and long hex theme colors', () => {
		expect(withAlphaFromCssColor('#fff', 0.5)).toBe('rgba(255, 255, 255, 0.500)');
		expect(withAlphaFromCssColor('#293330cc', 0.5)).toBe('rgba(41, 51, 48, 0.400)');
	});

	test('rejects unsupported color strings', () => {
		expect(withAlphaFromCssColor('oklch(60% 0.2 20)', 0.5)).toBeNull();
	});
});
