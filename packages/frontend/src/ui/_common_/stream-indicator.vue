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
>
	<div v-if="hasDisconnected && prefer.s.serverDisconnectedBehavior === 'quiet'" :class="$style.root" class="_popup _shadow" role="alert" :style="{ zIndex }">
		<div :class="$style.message">
			<i class="ti ti-cloud-off" :class="$style.icon" aria-hidden="true"></i>
			<strong>{{ i18n.ts.disconnectedFromServer }}</strong>
		</div>
		<div :class="$style.command" class="_buttons">
			<MkButton small primary @click="reload">{{ i18n.ts.reload }}</MkButton>
			<MkButton small @click="resetDisconnected">{{ i18n.ts.doNothing }}</MkButton>
		</div>
	</div>
</Transition>
</template>

<script lang="ts" setup>
import { onUnmounted, ref } from 'vue';
import { useStream } from '@/stream.js';
import { i18n } from '@/i18n.js';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os.js';
import { prefer } from '@/preferences.js';
import { store } from '@/store.js';

const zIndex = os.claimZIndex('high');
const hasDisconnected = ref(false);

function onDisconnected() {
	hasDisconnected.value = true;
}

function resetDisconnected() {
	hasDisconnected.value = false;
}

function reload() {
	window.location.reload();
}

if (store.s.realtimeMode) {
	useStream().on('_disconnected_', onDisconnected);

	onUnmounted(() => {
		useStream().off('_disconnected_', onDisconnected);
	});
}
</script>

<style lang="scss" module>
.transition_enterActive,
.transition_leaveActive {
	transition: opacity var(--MI-motionDurationNormal) ease, transform var(--MI-motionDurationNormal) cubic-bezier(.2, .8, .2, 1) !important;
}

.transition_enterFrom,
.transition_leaveTo {
	opacity: 0;
	transform: translateY(var(--MI-motionDistance)) scale(0.98);
}

.root {
	position: fixed;
	bottom: calc(var(--MI-minBottomSpacing) + max(var(--MI-floatingGap), env(safe-area-inset-bottom, 0px)));
	right: max(var(--MI-floatingGap), env(safe-area-inset-right, 0px));
	width: min(360px, calc(100vw - var(--MI-floatingGapDouble)));
	padding: var(--MI-space16);
	box-sizing: border-box;
	font-size: 0.9em;
	will-change: transform, opacity;
}

.message {
	display: flex;
	align-items: flex-start;
	gap: var(--MI-space12);
	line-height: 1.4;
}

.icon {
	flex: none;
	color: var(--MI_THEME-warn);
	font-size: 1.35em;
}

.command {
	margin-top: var(--MI-space12);
	padding-left: calc(1.35em + var(--MI-space12));
}

@media (max-width: 500px) {
	.root {
		left: max(var(--MI-floatingGap), env(safe-area-inset-left, 0px));
		right: max(var(--MI-floatingGap), env(safe-area-inset-right, 0px));
		width: auto;
	}
}
</style>
