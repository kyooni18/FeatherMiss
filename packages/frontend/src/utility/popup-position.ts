/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// Compatibility port: upstream callers keep their import path while the
// implementation and runtime mode switch live in the FeatherMiss layer.
export { calcPopupPosition } from '@/feathermiss/utilities/popup-position.js';
