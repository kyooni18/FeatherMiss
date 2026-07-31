<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div ref="el" class="_popup _shadow" :class="[$style.root, { [$style.animated]: prefer.s.animation }]" :style="{ '--transformOrigin': transformOrigin, '--entryOffset': entryOffset }">
	<MkMenu
		ref="menu"
		:items="items"
		:align="align"
		:width="width"
		:asDrawer="false"
		:surface="false"
		:debugDisablePredictionCone="debugDisablePredictionCone"
		:debugShowPredictionCone="debugShowPredictionCone"
		:class="$style.menuContent"
		@close="onChildClosed"
	/>
</div>
</template>

<script lang="ts" setup>
import { nextTick, onMounted, onUnmounted, provide, ref, useTemplateRef, watch } from 'vue';
import MkMenu from './MkMenu.vue';
import type { MenuItem } from '@/types/menu.js';
import { prefer } from '@/preferences.js';

const props = defineProps<{
	items: MenuItem[];
	anchorElement: HTMLElement;
	rootElement: HTMLElement;
	width?: number;
	debugDisablePredictionCone?: boolean;
	debugShowPredictionCone?: boolean;
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
	(ev: 'actioned'): void;
}>();

provide('isNestingMenu', true);

const el = useTemplateRef('el');
const menu = useTemplateRef('menu');
const align = 'left';
const transformOrigin = ref('left top');
const entryOffset = ref('calc(var(--MI-motionDistance35) * -1)');
let resizeObserver: ResizeObserver | null = null;
let positionFrame: number | null = null;

function viewportBounds() {
	const viewport = window.visualViewport;
	const left = viewport?.offsetLeft ?? 0;
	const top = viewport?.offsetTop ?? 0;
	const width = viewport?.width ?? window.innerWidth;
	const height = viewport?.height ?? window.innerHeight;
	return { left, top, right: left + width, bottom: top + height };
}

function floatingGap(): number {
	const value = Number.parseFloat(window.getComputedStyle(window.document.documentElement).getPropertyValue('--MI-floatingGap'));
	return Number.isFinite(value) ? Math.max(4, value * 0.55) : 6;
}

function setPosition() {
	if (el.value == null || !props.anchorElement.isConnected || !props.rootElement.isConnected) return;

	const rootRect = props.rootElement.getBoundingClientRect();
	const anchorRect = props.anchorElement.getBoundingClientRect();
	const menuRect = el.value.getBoundingClientRect();
	const bounds = viewportBounds();
	const edge = Math.max(6, floatingGap());
	const gap = Math.max(2, edge * 0.5);

	const roomRight = bounds.right - anchorRect.right - gap - edge;
	const roomLeft = anchorRect.left - bounds.left - gap - edge;
	const openRight = menuRect.width <= roomRight || roomRight >= roomLeft;
	entryOffset.value = openRight ? 'calc(var(--MI-motionDistance35) * -1)' : 'var(--MI-motionDistance35)';

	let clientLeft = openRight
		? anchorRect.right + gap
		: anchorRect.left - menuRect.width - gap;
	let clientTop = anchorRect.top - 6;

	clientLeft = Math.min(
		Math.max(clientLeft, bounds.left + edge),
		Math.max(bounds.left + edge, bounds.right - menuRect.width - edge),
	);
	clientTop = Math.min(
		Math.max(clientTop, bounds.top + edge),
		Math.max(bounds.top + edge, bounds.bottom - menuRect.height - edge),
	);

	el.value.style.left = `${Math.round(clientLeft - rootRect.left)}px`;
	el.value.style.top = `${Math.round(clientTop - rootRect.top)}px`;
	transformOrigin.value = `${openRight ? 'left' : 'right'} ${clientTop > anchorRect.top ? 'top' : clientTop + menuRect.height < anchorRect.bottom ? 'bottom' : 'center'}`;
}

function schedulePosition() {
	if (positionFrame != null) return;
	positionFrame = window.requestAnimationFrame(() => {
		positionFrame = null;
		setPosition();
	});
}

function observePositionSources() {
	resizeObserver?.disconnect();
	if (typeof ResizeObserver === 'undefined' || el.value == null) return;
	resizeObserver ??= new ResizeObserver(schedulePosition);
	resizeObserver.observe(el.value);
	resizeObserver.observe(props.anchorElement);
	resizeObserver.observe(props.rootElement);
}

function onChildClosed(actioned?: boolean) {
	if (actioned) {
		emit('actioned');
	} else {
		emit('closed');
	}
}

watch(() => [props.anchorElement, props.rootElement, props.width, props.items.length] as const, () => {
	nextTick(() => {
		observePositionSources();
		schedulePosition();
	});
});

onMounted(() => {
	observePositionSources();
	setPosition();
	nextTick(schedulePosition);
	window.addEventListener('resize', schedulePosition, { passive: true });
	window.addEventListener('scroll', schedulePosition, { passive: true, capture: true });
	window.visualViewport?.addEventListener('resize', schedulePosition, { passive: true });
	window.visualViewport?.addEventListener('scroll', schedulePosition, { passive: true });
});

onUnmounted(() => {
	resizeObserver?.disconnect();
	if (positionFrame != null) window.cancelAnimationFrame(positionFrame);
	window.removeEventListener('resize', schedulePosition);
	window.removeEventListener('scroll', schedulePosition, true);
	window.visualViewport?.removeEventListener('resize', schedulePosition);
	window.visualViewport?.removeEventListener('scroll', schedulePosition);
});

defineExpose({
	focusFirst: () => menu.value?.focusFirst(),
	rootElement: el,
	checkHit: (ev: MouseEvent) => {
		return ev.target === el.value || el.value?.contains(ev.target as Node);
	},
});
</script>

<style lang="scss" module>
.root {
	position: absolute;
	background: var(--MI-surfacePopup, var(--MI-materialBg));
	-webkit-backdrop-filter: var(--MI-surfaceFilter);
	backdrop-filter: var(--MI-surfaceFilter);
	transform-origin: var(--transformOrigin);
}

.animated > .menuContent {
	animation: submenuIn var(--MI-motionDurationFast) cubic-bezier(.2, .8, .2, 1) both;
}

@keyframes submenuIn {
	from {
		opacity: 0;
		transform: translateX(var(--entryOffset)) scale(0.975);
	}
	to {
		opacity: 1;
		transform: translateX(0) scale(1);
	}
}
</style>
