/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { test, expect } from './fixtures.js';
import {
	BASE_URL,
	closeUserSetupDialogIfVisible,
	registerUser,
	resetState,
	signIn,
	visitHome,
} from './utils.js';

test.describe('FeatherMiss two-mode smoke', () => {
	test.beforeEach(async ({ page }) => {
		await resetState();
		await registerUser('admin', 'pass', true);
		await registerUser('alice', 'alice1234');
		await signIn(page, 'alice', 'alice1234');
		await closeUserSetupDialogIfVisible(page);
	});

	test('loads the timeline, composer, settings, and mode switch', async ({ page }) => {
		await visitHome(page);
		await expect(page.getByTestId('open-post-form')).toBeVisible();

		const expectedMode = process.env.FEATHERMISS_UI === '0' ? null : 'enabled';
		if (expectedMode == null) {
			await expect(page.locator('html')).not.toHaveAttribute('data-feathermiss');
		} else {
			await expect(page.locator('html')).toHaveAttribute('data-feathermiss', expectedMode);
		}

		await page.getByTestId('open-post-form').click();
		await expect(page.getByTestId('post-form-text')).toBeVisible();
		await page.keyboard.press('Escape');
		await expect(page.getByTestId('post-form-text')).toBeHidden();

		await page.goto(`${BASE_URL}/settings/preferences`);
		await expect(page.locator('main')).toBeVisible();
	});
});
