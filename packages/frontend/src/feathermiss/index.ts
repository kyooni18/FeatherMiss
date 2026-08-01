/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { resolveFeatherMissEnabled, setFeatherMissEnabled } from './config.js';

export * from './config.js';
export * from './preferences.js';

/** Apply the one root-level integration switch used by all FeatherMiss ports. */
export function initializeFeatherMiss(preferenceEnabled: boolean): boolean {
	const enabled = resolveFeatherMissEnabled(preferenceEnabled);
	setFeatherMissEnabled(enabled);
	return enabled;
}
