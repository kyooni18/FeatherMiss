/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { ComputedRef, InjectionKey } from 'vue';

/** Stable context shared by native timeline containers and note views. */
export const FEATHERMISS_TIMELINE_ID: InjectionKey<ComputedRef<string | null>> = Symbol('feathermiss.timelineId');
