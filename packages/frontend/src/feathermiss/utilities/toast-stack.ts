/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { computed, ref, shallowReactive } from 'vue';
import type { ComputedRef, Ref } from 'vue';

type ToastStackEntry = {
	id: symbol;
	height: Ref<number>;
};

const entries = shallowReactive<ToastStackEntry[]>([]);
const STACK_GAP = 8;

export function claimToastStackEntry(): {
	offset: ComputedRef<number>;
	setHeight: (height: number) => void;
	release: () => void;
} {
	const id = Symbol('toast');
	const height = ref(0);
	const entry: ToastStackEntry = { id, height };
	entries.push(entry);

	const offset = computed(() => {
		let value = 0;
		for (const candidate of entries) {
			if (candidate.id === id) break;
			value += candidate.height.value + STACK_GAP;
		}
		return value;
	});

	let released = false;
	return {
		offset,
		setHeight: value => {
			height.value = Number.isFinite(value) ? Math.max(0, value) : 0;
		},
		release: () => {
			if (released) return;
			released = true;
			const index = entries.findIndex(candidate => candidate.id === id);
			if (index !== -1) entries.splice(index, 1);
		},
	};
}
