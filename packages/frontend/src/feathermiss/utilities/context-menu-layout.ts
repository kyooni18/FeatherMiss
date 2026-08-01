/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { DeviceKind } from '@/utility/device-kind.js';
import { isFeatherMissEnabled } from '@/feathermiss/config.js';

export const CONTEXT_MENU_DRAWER_MAX_WIDTH = 720;

export function shouldUseContextMenuDrawer(options: {
	deviceKind: DeviceKind;
	isTouchUsing: boolean;
	viewportWidth: number;
}): boolean {
	if (!isFeatherMissEnabled()) return false;
	return options.deviceKind === 'smartphone' || (
		options.isTouchUsing && options.viewportWidth <= CONTEXT_MENU_DRAWER_MAX_WIDTH
	);
}
