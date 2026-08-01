/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { beforeEach, describe, expect, test } from 'vitest';
import { CONTEXT_MENU_DRAWER_MAX_WIDTH, shouldUseContextMenuDrawer } from '../utilities/context-menu-layout.js';

describe('shouldUseContextMenuDrawer', () => {
	beforeEach(() => {
		window.document.documentElement.dataset.feathermiss = 'enabled';
	});

	test('always uses a drawer on smartphones', () => {
		expect(shouldUseContextMenuDrawer({
			deviceKind: 'smartphone',
			isTouchUsing: false,
			viewportWidth: 1200,
		})).toBe(true);
	});

	test('uses a drawer for touch-first narrow layouts', () => {
		expect(shouldUseContextMenuDrawer({
			deviceKind: 'tablet',
			isTouchUsing: true,
			viewportWidth: CONTEXT_MENU_DRAWER_MAX_WIDTH,
		})).toBe(true);
	});

	test('keeps a pointer-positioned menu on desktop layouts', () => {
		expect(shouldUseContextMenuDrawer({
			deviceKind: 'desktop',
			isTouchUsing: false,
			viewportWidth: 390,
		})).toBe(false);
		expect(shouldUseContextMenuDrawer({
			deviceKind: 'tablet',
			isTouchUsing: true,
			viewportWidth: CONTEXT_MENU_DRAWER_MAX_WIDTH + 1,
		})).toBe(false);
	});

	test('does not opt Misskey into the FeatherMiss drawer path when disabled', () => {
		delete window.document.documentElement.dataset.feathermiss;
		expect(shouldUseContextMenuDrawer({
			deviceKind: 'smartphone',
			isTouchUsing: true,
			viewportWidth: 390,
		})).toBe(false);
	});
});
