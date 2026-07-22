<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<Transition
	:enterActiveClass="prefer.s.animation ? $style.transition_enterActive : ''"
	:leaveActiveClass="prefer.s.animation ? $style.transition_leaveActive : ''"
	:enterFromClass="prefer.s.animation ? $style.transition_enterFrom : ''"
	:leaveToClass="prefer.s.animation ? $style.transition_leaveTo : ''"
	appear
	@afterLeave="emit('closed')"
>
	<div v-if="showing" ref="rootEl" :class="$style.root" class="_popup _shadow" :style="{ zIndex, top: top + 'px', left: left + 'px', transformOrigin }">
		<MkUrlPreview :url="url" :showActions="false"/>
	</div>
</Transition>
</template>

<script lang="ts" setup>
import { nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue';
import MkUrlPreview from '@/components/MkUrlPreview.vue';
import * as os from '@/os.js';
import { prefer } from '@/preferences.js';
import { calcPopupPosition } from '@/utility/popup-position.js';

const props = defineProps<{
	showing: boolean;
	url: string;
	anchorElement: HTMLElement;
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

const zIndex = os.claimZIndex('middle');
const top = ref(0);
const left = ref(0);
const transformOrigin = ref('center top');
const rootEl = useTemplateRef('rootEl');
let resizeObserver: ResizeObserver | null = null;
let positionFrame: number | null = null;

function updatePosition() {
	if (rootEl.value == null || !props.anchorElement.isConnected) return;
	const position = calcPopupPosition(rootEl.value, {
		anchorElement: props.anchorElement,
		direction: 'bottom',
		align: 'center',
		innerMargin: 8,
	});
	top.value = position.top;
	left.value = position.left;
	transformOrigin.value = position.transformOrigin;
}

function schedulePosition() {
	if (positionFrame != null) return;
	positionFrame = window.requestAnimationFrame(() => {
		positionFrame = null;
		updatePosition();
	});
}

function observePositionSources() {
	resizeObserver?.disconnect();
	if (typeof ResizeObserver === 'undefined' || rootEl.value == null) return;
	resizeObserver ??= new ResizeObserver(schedulePosition);
	resizeObserver.observe(rootEl.value);
	resizeObserver.observe(props.anchorElement);
}

onMounted(() => {
	updatePosition();
	nextTick(() => {
		observePositionSources();
		schedulePosition();
	});
	window.addEventListener('resize', schedulePosition, { passive: true });
	window.addEventListener('scroll', schedulePosition, { passive: true, capture: true });
	window.visualViewport?.addEventListener('resize', schedulePosition, { passive: true });
	window.visualViewport?.addEventListener('scroll', schedulePosition, { passive: true });
});

watch([() => props.showing, () => props.url, () => props.anchorElement], () => {
	nextTick(() => {
		observePositionSources();
		schedulePosition();
	});
});

onBeforeUnmount(() => {
	resizeObserver?.disconnect();
	if (positionFrame != null) window.cancelAnimationFrame(positionFrame);
	window.removeEventListener('resize', schedulePosition);
	window.removeEventListener('scroll', schedulePosition, true);
	window.visualViewport?.removeEventListener('resize', schedulePosition);
	window.visualViewport?.removeEventListener('scroll', schedulePosition);
});
</script>

<style lang="scss" module>
.transition_enterActive,
.transition_leaveActive {
	transition: opacity var(--MI-motionDurationFast) ease, transform var(--MI-motionDurationFast) cubic-bezier(.2, .8, .2, 1) !important;
}

.transition_enterFrom,
.transition_leaveTo {
	opacity: 0;
	transform: translateY(var(--MI-motionDistance35)) scale(0.975);
}

.root {
	position: absolute;
	width: min(500px, calc(100vw - var(--MI-floatingGapDouble)));
	max-height: calc(100dvh - var(--MI-floatingGapDouble));
	overflow: clip auto;
	overscroll-behavior: contain;
	box-sizing: border-box;
	pointer-events: none;
	will-change: transform, opacity;
}
</style>
