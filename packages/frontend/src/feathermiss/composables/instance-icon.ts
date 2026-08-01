/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { computed, ref, watch } from 'vue';
import { getProxiedImageUrlNullable } from '@/utility/media-proxy.js';

type InstanceIconSource = {
	iconUrl: string | null | undefined;
	mediaProxy?: string | null;
};

const FALLBACK_INSTANCE_ICON = '/favicon.ico';
const LAST_RESORT_INSTANCE_ICON = '/client-assets/unknown.png';

/** Keep instance icon fallback behavior out of the upstream navigation shells. */
export function useFeatherMissInstanceIcon(instance: InstanceIconSource) {
	const candidateIndex = ref(0);
	const candidates = computed(() => [...new Set([
		getProxiedImageUrlNullable(instance.iconUrl, 'preview'),
		instance.iconUrl ?? null,
		FALLBACK_INSTANCE_ICON,
		LAST_RESORT_INSTANCE_ICON,
	].filter((url): url is string => !!url))]);
	const url = computed(() => candidates.value[Math.min(candidateIndex.value, Math.max(0, candidates.value.length - 1))] ?? LAST_RESORT_INSTANCE_ICON);

	function onError() {
		if (candidateIndex.value < candidates.value.length - 1) candidateIndex.value += 1;
	}

	watch(() => [instance.iconUrl, instance.mediaProxy], () => {
		candidateIndex.value = 0;
	});

	return { url, onError };
}
