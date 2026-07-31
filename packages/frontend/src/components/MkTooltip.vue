<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<Transition
	:enterActiveClass="prefer.s.animation ? $style.transition_tooltip_enterActive : ''"
	:leaveActiveClass="prefer.s.animation ? $style.transition_tooltip_leaveActive : ''"
	:enterFromClass="prefer.s.animation ? $style.transition_tooltip_enterFrom : ''"
	:leaveToClass="prefer.s.animation ? $style.transition_tooltip_leaveTo : ''"
	appear :css="prefer.s.animation"
	@afterLeave="emit('closed')"
>
		<div v-show="showing" :id="tooltipId" ref="el" role="tooltip" :aria-hidden="showing ? undefined : 'true'" :class="$style.root" class="_acrylic _shadow" :style="{ zIndex, maxWidth: maxWidth + 'px' }">
		<slot>
			<template v-if="text">
				<Mfm v-if="asMfm" :text="text"/>
				<span v-else>{{ text }}</span>
			</template>
		</slot>
	</div>
</Transition>
</template>

<script lang="ts" setup>
import { nextTick, onMounted, onUnmounted, useId, useTemplateRef, watch } from 'vue';
import * as os from '@/os.js';
import { calcPopupPosition } from '@/utility/popup-position.js';
import { prefer } from '@/preferences.js';

const props = withDefaults(defineProps<{
	showing: boolean;
	anchorElement?: HTMLElement;
	x?: number;
	y?: number;
	text?: string;
	asMfm?: boolean;
	maxWidth?: number;
	direction?: 'top' | 'bottom' | 'right' | 'left';
	innerMargin?: number;
}>(), {
	maxWidth: 250,
	direction: 'top',
	innerMargin: 0,
});

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

// タイミングによっては最初から showing = false な場合があり、その場合に closed 扱いにしないと永久にDOMに残ることになる
if (!props.showing) emit('closed');

const el = useTemplateRef('el');
const tooltipId = `mk-tooltip-${useId()}`;
const zIndex = os.claimZIndex('high');

function setPosition() {
	if (el.value == null) return;
	const data = calcPopupPosition(el.value, {
		anchorElement: props.anchorElement,
		direction: props.direction,
		align: 'center',
		innerMargin: props.innerMargin,
		x: props.x,
		y: props.y,
	});

	el.value.style.transformOrigin = data.transformOrigin;
	el.value.style.left = data.left + 'px';
	el.value.style.top = data.top + 'px';
}

let resizeObserver: ResizeObserver | null = null;
let positionFrame: number | null = null;
let describedAnchor: HTMLElement | null = null;

function removeAnchorDescription() {
	if (describedAnchor == null) return;
	const ids = new Set((describedAnchor.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean));
	ids.delete(tooltipId);
	if (ids.size === 0) describedAnchor.removeAttribute('aria-describedby');
	else describedAnchor.setAttribute('aria-describedby', [...ids].join(' '));
	describedAnchor = null;
}

function syncAnchorDescription() {
	removeAnchorDescription();
	if (!props.showing || props.anchorElement == null) return;
	describedAnchor = props.anchorElement;
	const ids = new Set((describedAnchor.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean));
	ids.add(tooltipId);
	describedAnchor.setAttribute('aria-describedby', [...ids].join(' '));
}

const schedulePosition = () => {
	if (positionFrame != null) return;
	positionFrame = window.requestAnimationFrame(() => {
		positionFrame = null;
		setPosition();
	});
};

function observePositionSources() {
	resizeObserver?.disconnect();
	if (typeof ResizeObserver === 'undefined' || el.value == null) return;
	resizeObserver ??= new ResizeObserver(schedulePosition);
	resizeObserver.observe(el.value);
	if (props.anchorElement) resizeObserver.observe(props.anchorElement);
}

onMounted(() => {
	syncAnchorDescription();
	setPosition();
	nextTick(schedulePosition);

	observePositionSources();

	window.addEventListener('resize', schedulePosition, { passive: true });
	window.addEventListener('scroll', schedulePosition, { passive: true, capture: true });
	window.visualViewport?.addEventListener('resize', schedulePosition, { passive: true });
	window.visualViewport?.addEventListener('scroll', schedulePosition, { passive: true });
});

watch(() => props.showing, showing => {
	syncAnchorDescription();
	if (showing) nextTick(schedulePosition);
});

watch(
	[() => props.x, () => props.y, () => props.direction, () => props.innerMargin, () => props.maxWidth],
	() => nextTick(schedulePosition),
);

watch(() => props.anchorElement, () => {
	syncAnchorDescription();
	nextTick(() => {
		observePositionSources();
		schedulePosition();
	});
});

onUnmounted(() => {
	removeAnchorDescription();
	resizeObserver?.disconnect();
	if (positionFrame != null) window.cancelAnimationFrame(positionFrame);
	window.removeEventListener('resize', schedulePosition);
	window.removeEventListener('scroll', schedulePosition, true);
	window.visualViewport?.removeEventListener('resize', schedulePosition);
	window.visualViewport?.removeEventListener('scroll', schedulePosition);
});
</script>

<style lang="scss" module>
.transition_tooltip_enterActive,
.transition_tooltip_leaveActive {
	opacity: 1;
	transform: translateY(0) scale(1);
	transition: transform var(--MI-motionDurationFast) cubic-bezier(.2, .8, .2, 1), opacity var(--MI-motionDurationFast) ease;
}
.transition_tooltip_enterFrom,
.transition_tooltip_leaveTo {
	opacity: 0;
	transform: translateY(var(--MI-motionDistance35)) scale(0.96);
}

.root {
	position: absolute;
	font-size: 0.8em;
	line-height: 1.35;
	padding: 7px 11px;
	box-sizing: border-box;
	text-align: center;
	text-wrap: balance;
	border-radius: var(--MI-tooltipRadius);
	border: var(--MI-surfaceBorderWidth) solid var(--MI-surfaceBorder);
	pointer-events: none;
	transform-origin: center center;
	will-change: transform, opacity;
}
</style>
