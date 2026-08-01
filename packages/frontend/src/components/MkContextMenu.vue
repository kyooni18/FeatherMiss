<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<Transition
	appear
	:enterActiveClass="prefer.s.animation ? $style.transition_fade_enterActive : ''"
	:leaveActiveClass="prefer.s.animation ? $style.transition_fade_leaveActive : ''"
	:enterFromClass="prefer.s.animation ? $style.transition_fade_enterFrom : ''"
	:leaveToClass="prefer.s.animation ? $style.transition_fade_leaveTo : ''"
>
	<div ref="rootEl" class="_popup _shadow" :class="$style.root" :style="{ zIndex }" @contextmenu.prevent.stop="() => {}">
		<MkMenu :items="items" :align="'left'" :surface="false" :class="$style.menuContent" @close="emit('closed')"/>
	</div>
</Transition>
</template>

<script lang="ts" setup>
import { nextTick, onMounted, onBeforeUnmount, useTemplateRef, ref } from 'vue';
import MkMenu from './MkMenu.vue';
import type { MenuItem } from '@/types/menu.js';
import { elementContains } from '@/utility/element-contains.js';
import { prefer } from '@/preferences.js';
import * as os from '@/os.js';
import { calcPopupPosition } from '@/feathermiss/utilities/popup-position.js';

const props = defineProps<{
	items: MenuItem[];
	ev: PointerEvent;
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

const rootEl = useTemplateRef('rootEl');

const zIndex = ref<number>(os.claimZIndex('high'));
let resizeObserver: ResizeObserver | null = null;
let positionFrame: number | null = null;

function positionMenu() {
	if (rootEl.value == null) return;
	const position = calcPopupPosition(rootEl.value, {
		x: props.ev.clientX + 1,
		y: props.ev.clientY + 1,
		direction: 'bottom',
		align: 'left',
		innerMargin: 1,
		strategy: 'fixed',
	});
	rootEl.value.style.top = `${position.top}px`;
	rootEl.value.style.left = `${position.left}px`;
	rootEl.value.style.transformOrigin = position.transformOrigin;
}

function schedulePosition() {
	if (positionFrame != null) return;
	positionFrame = window.requestAnimationFrame(() => {
		positionFrame = null;
		positionMenu();
	});
}

onMounted(() => {
	positionMenu();
	nextTick(schedulePosition);
	window.document.body.addEventListener('mousedown', onMousedown);
	window.addEventListener('resize', schedulePosition, { passive: true });
	window.visualViewport?.addEventListener('resize', schedulePosition, { passive: true });
	window.visualViewport?.addEventListener('scroll', schedulePosition, { passive: true });
	if (typeof ResizeObserver !== 'undefined' && rootEl.value != null) {
		resizeObserver = new ResizeObserver(schedulePosition);
		resizeObserver.observe(rootEl.value);
	}
});

onBeforeUnmount(() => {
	window.document.body.removeEventListener('mousedown', onMousedown);
	window.removeEventListener('resize', schedulePosition);
	window.visualViewport?.removeEventListener('resize', schedulePosition);
	window.visualViewport?.removeEventListener('scroll', schedulePosition);
	resizeObserver?.disconnect();
	if (positionFrame != null) window.cancelAnimationFrame(positionFrame);
});

function onMousedown(evt: MouseEvent) {
	if (!elementContains(rootEl.value, evt.target as Element) && (rootEl.value !== evt.target)) emit('closed');
}
</script>

<style lang="scss" module>
.transition_fade_enterActive > .menuContent,
.transition_fade_leaveActive > .menuContent {
	transition: opacity var(--MI-motionDurationFast) ease, transform var(--MI-motionDurationFast) cubic-bezier(.2, .8, .2, 1);
}
.transition_fade_enterFrom > .menuContent,
.transition_fade_leaveTo > .menuContent {
	opacity: 0;
	transform: translateY(var(--MI-motionDistance40)) scale(0.97);
}

.root {
	position: fixed;
	max-width: calc(100vw - var(--MI-floatingGapDouble));
	background: var(--MI-surfacePopup, var(--MI-materialBg));
	-webkit-backdrop-filter: var(--MI-surfaceFilter);
	backdrop-filter: var(--MI-surfaceFilter);
}
</style>
