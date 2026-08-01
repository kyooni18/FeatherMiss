<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<Transition
	:enterActiveClass="prefer.s.animation ? $style.transition_toast_enterActive : ''"
	:leaveActiveClass="prefer.s.animation ? $style.transition_toast_leaveActive : ''"
	:enterFromClass="prefer.s.animation ? $style.transition_toast_enterFrom : ''"
	:leaveToClass="prefer.s.animation ? $style.transition_toast_leaveTo : ''"
	appear
	@afterLeave="emit('closed')"
>
		<div
			v-if="showing"
			ref="rootEl"
			role="status"
			aria-live="polite"
			aria-atomic="true"
		class="_acrylic"
		:class="$style.root"
		:style="{ zIndex, '--toastOffset': `${stackOffset}px` }"
	>
		<i class="ti ti-check" :class="$style.icon" aria-hidden="true"></i>
		<div :class="$style.message">{{ message }}</div>
	</div>
</Transition>
</template>

<script lang="ts" setup>
import { nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue';
import * as os from '@/os.js';
import { prefer } from '@/preferences.js';
import { claimToastStackEntry } from '@/feathermiss/utilities/toast-stack.js';

const props = defineProps<{
	message: string;
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

const zIndex = os.claimZIndex('high');
const rootEl = useTemplateRef('rootEl');
const { offset: stackOffset, setHeight: setStackHeight, release: releaseStackEntry } = claimToastStackEntry();
const showing = ref(true);
let closeTimer: number | null = null;
let resizeObserver: ResizeObserver | null = null;

function updateStackHeight() {
	setStackHeight(rootEl.value?.getBoundingClientRect().height ?? 0);
}

onMounted(() => {
	nextTick(updateStackHeight);
	if (typeof ResizeObserver !== 'undefined' && rootEl.value != null) {
		resizeObserver = new ResizeObserver(updateStackHeight);
		resizeObserver.observe(rootEl.value);
	}

	const duration = Math.min(8000, Math.max(3200, 1800 + props.message.length * 42));
	closeTimer = window.setTimeout(() => {
		showing.value = false;
	}, duration);
});

onBeforeUnmount(() => {
	if (closeTimer != null) window.clearTimeout(closeTimer);
	resizeObserver?.disconnect();
	releaseStackEntry();
});
</script>

<style lang="scss" module>
.transition_toast_enterActive,
.transition_toast_leaveActive {
	transition: opacity var(--MI-motionDurationNormal) ease, transform var(--MI-motionDurationNormal) cubic-bezier(.2, .8, .2, 1) !important;
}

.transition_toast_enterFrom,
.transition_toast_leaveTo {
	opacity: 0;
	transform: translateY(calc(var(--MI-motionDistance) * -1)) scale(0.98);
}

.root {
	position: fixed;
	left: max(var(--MI-floatingGap), env(safe-area-inset-left, 0px));
	right: max(var(--MI-floatingGap), env(safe-area-inset-right, 0px));
	top: calc(max(var(--MI-floatingGap), env(safe-area-inset-top, 0px)) + 42px + var(--toastOffset, 0px));
	display: flex;
	align-items: center;
	gap: var(--MI-space10);
	width: max-content;
	max-width: min(520px, calc(100vw - var(--MI-floatingGapDouble)));
	min-height: 42px;
	margin: 0 auto;
	padding: 10px 15px;
	box-sizing: border-box;
	border-radius: calc(var(--MI-radius) + 4px);
	box-shadow: var(--MI-surfaceShadowRaised);
	text-align: left;
	line-height: 1.4;
	pointer-events: none;
	will-change: transform, opacity;
}

.icon {
	flex: none;
	color: var(--MI_THEME-accent);
}

.message {
	min-width: 0;
	overflow-wrap: anywhere;
}

@media (max-width: 500px) {
	.root {
		top: calc(max(var(--MI-floatingGap), env(safe-area-inset-top, 0px)) + 36px + var(--toastOffset, 0px));
		width: auto;
	}
}
</style>
