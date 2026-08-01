<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<Transition
	:name="transitionName"
	:enterActiveClass="normalizeClass({
		[$style.transition_modalDrawer_enterActive]: transitionName === 'modal-drawer',
		[$style.transition_modalPopup_enterActive]: transitionName === 'modal-popup',
		[$style.transition_modal_enterActive]: transitionName === 'modal',
		[$style.transition_send_enterActive]: transitionName === 'send',
	})"
	:leaveActiveClass="normalizeClass({
		[$style.transition_modalDrawer_leaveActive]: transitionName === 'modal-drawer',
		[$style.transition_modalPopup_leaveActive]: transitionName === 'modal-popup',
		[$style.transition_modal_leaveActive]: transitionName === 'modal',
		[$style.transition_send_leaveActive]: transitionName === 'send',
	})"
	:enterFromClass="normalizeClass({
		[$style.transition_modalDrawer_enterFrom]: transitionName === 'modal-drawer',
		[$style.transition_modalPopup_enterFrom]: transitionName === 'modal-popup',
		[$style.transition_modal_enterFrom]: transitionName === 'modal',
		[$style.transition_send_enterFrom]: transitionName === 'send',
	})"
	:leaveToClass="normalizeClass({
		[$style.transition_modalDrawer_leaveTo]: transitionName === 'modal-drawer',
		[$style.transition_modalPopup_leaveTo]: transitionName === 'modal-popup',
		[$style.transition_modal_leaveTo]: transitionName === 'modal',
		[$style.transition_send_leaveTo]: transitionName === 'send',
	})"
	:duration="transitionDuration" appear @afterLeave="onClosed" @enter="emit('opening')" @afterEnter="onOpened"
>
	<div v-show="manualShowing != null ? manualShowing : showing" ref="modalRootEl" v-hotkey.global="keymap" tabindex="-1" :role="type === 'dialog' ? 'dialog' : undefined" :aria-modal="type === 'dialog' ? 'true' : undefined" :class="[$style.root, { [$style.drawer]: type === 'drawer', [$style.drawerInset]: type === 'drawer' && drawerInset, [$style.dialog]: type === 'dialog', [$style.popup]: type === 'popup' }]" :style="{ zIndex, pointerEvents: (manualShowing != null ? manualShowing : showing) ? 'auto' : 'none', '--transformOrigin': transformOrigin }">
		<div data-cy-bg data-testid="bg" :data-cy-transparent="isEnableBgTransparent" :data-test-is-transparent="isEnableBgTransparent" class="_modalBg" :class="[$style.bg, { [$style.bgTransparent]: isEnableBgTransparent }]" :style="{ zIndex }" @click="onBgClick" @mousedown="onBgClick" @contextmenu.prevent.stop="() => {}"></div>
		<div ref="content" :class="[$style.content, { [$style.fixed]: fixed }]" :style="{ zIndex }" @click.self="onBgClick">
			<slot :max-height="maxHeight" :type="type"></slot>
		</div>
	</div>
</Transition>
</template>

<script lang="ts" setup>
import { nextTick, normalizeClass, onMounted, onUnmounted, provide, watch, ref, useTemplateRef, computed } from 'vue';
import type { Keymap } from '@/utility/hotkey.js';
import * as os from '@/os.js';
import { isTouchUsing } from '@/utility/touch.js';
import { deviceKind } from '@/utility/device-kind.js';
import { focusTrap } from '@/utility/focus-trap.js';
import { focusParent } from '@/utility/focus.js';
import { prefer } from '@/preferences.js';
import { DI } from '@/di.js';
import { motionDuration } from '@/feathermiss/config.js';

function getFixedContainer(el: Element | null): Element | null {
	if (el == null || el.tagName === 'BODY') return null;
	const position = window.getComputedStyle(el).getPropertyValue('position');
	if (position === 'fixed') {
		return el;
	} else {
		return getFixedContainer(el.parentElement);
	}
}

type ModalTypes = 'popup' | 'dialog' | 'drawer';

const props = withDefaults(defineProps<{
	manualShowing?: boolean | null;
	anchor?: { x: string; y: string; };
	anchorElement?: HTMLElement | null;
	preferType?: ModalTypes | 'auto';
	zPriority?: 'low' | 'middle' | 'high';
	noOverlap?: boolean;
	transparentBg?: boolean;
	drawerInset?: boolean;
	hasInteractionWithOtherFocusTrappedEls?: boolean;
	returnFocusTo?: HTMLElement | null;
}>(), {
	manualShowing: null,
	anchorElement: null,
	anchor: () => ({ x: 'center', y: 'bottom' }),
	preferType: 'auto',
	zPriority: 'low',
	noOverlap: true,
	transparentBg: false,
	drawerInset: false,
	hasInteractionWithOtherFocusTrappedEls: false,
	returnFocusTo: null,
});

const emit = defineEmits<{
	(ev: 'opening'): void;
	(ev: 'opened'): void;
	(ev: 'click'): void;
	(ev: 'esc'): void;
	(ev: 'close'): void; // TODO: (refactor) closing に改名する
	(ev: 'closed'): void;
}>();

provide(DI.inModal, true);

const maxHeight = ref<number>();
const fixed = ref(false);
const transformOrigin = ref('center');
const showing = ref(true);
const modalRootEl = useTemplateRef('modalRootEl');
const content = useTemplateRef('content');
const zIndex = os.claimZIndex(props.zPriority);
const useSendAnime = ref(false);
const type = computed<ModalTypes>(() => {
	if (props.preferType === 'auto') {
		if ((prefer.s.menuStyle === 'drawer') || (prefer.s.menuStyle === 'auto' && isTouchUsing && deviceKind === 'smartphone')) {
			return 'drawer';
		} else {
			return props.anchorElement != null ? 'popup' : 'dialog';
		}
	} else {
		return props.preferType!;
	}
});
const isEnableBgTransparent = computed(() => props.transparentBg && (type.value === 'popup'));
const transitionName = computed((() =>
	prefer.s.animation
		? useSendAnime.value
			? 'send'
			: type.value === 'drawer'
				? 'modal-drawer'
				: type.value === 'popup'
					? 'modal-popup'
					: 'modal'
		: ''
));
const transitionDuration = computed(() => {
	const base = transitionName.value === 'send'
		? 360
		: transitionName.value === 'modal-popup'
			? 160
			: transitionName.value === 'modal'
				? 240
				: transitionName.value === 'modal-drawer'
					? 280
					: 0;
	return motionDuration(base, prefer.r.uiGraphics.value);
});

let releaseFocusTrap: (() => void) | null = null;
let disabledAnchorElement: HTMLElement | null = null;
let disabledAnchorPointerEvents = '';
let disabledAnchorAriaExpanded: string | null = null;

function close(opts: { useSendAnimation?: boolean } = {}) {
	if (opts.useSendAnimation) {
		useSendAnime.value = true;
	}

	restoreDisabledAnchor();
	showing.value = false;
	emit('close');
}

function onBgClick() {
	emit('click');
}

if (type.value === 'drawer') {
	maxHeight.value = window.innerHeight / 1.5;
}

const keymap = {
	'esc': {
		allowRepeat: true,
		callback: () => emit('esc'),
	},
} as const satisfies Keymap;

const DEFAULT_MARGIN = 10;
const MIN_POPUP_HEIGHT = 96;

function viewportBounds() {
	const viewport = window.visualViewport;
	const left = viewport?.offsetLeft ?? 0;
	const top = viewport?.offsetTop ?? 0;
	const width = viewport?.width ?? window.innerWidth;
	const height = viewport?.height ?? window.innerHeight;
	return { left, top, right: left + width, bottom: top + height };
}

function floatingMargin(): number {
	const value = Number.parseFloat(window.getComputedStyle(window.document.documentElement).getPropertyValue('--MI-floatingGap'));
	return Number.isFinite(value) ? value : DEFAULT_MARGIN;
}

const align = () => {
	if (type.value === 'drawer') {
		const viewport = window.visualViewport;
		const viewportHeight = viewport?.height ?? window.innerHeight;
		const obscuredBottom = viewport == null
			? 0
			: Math.max(0, window.innerHeight - viewport.offsetTop - viewport.height);
		maxHeight.value = viewportHeight * (props.drawerInset ? 0.78 : 0.72);
		modalRootEl.value?.style.setProperty('--MI-drawerViewportBottom', `${Math.round(obscuredBottom)}px`);
		return;
	}
	if (props.anchorElement == null || type.value === 'dialog' || content.value == null) return;

	fixed.value = true;
	const anchorRect = props.anchorElement.getBoundingClientRect();
	const bounds = viewportBounds();
	const margin = floatingMargin();
	const width = content.value.offsetWidth;
	const height = content.value.offsetHeight;
	const gap = Math.max(4, margin * 0.45);

	const roomRight = bounds.right - anchorRect.right - gap - margin;
	const roomLeft = anchorRect.left - bounds.left - gap - margin;
	let horizontalPlacement: 'left' | 'center' | 'right' = props.anchor.x === 'left' ? 'left' : props.anchor.x === 'right' ? 'right' : 'center';
	if (horizontalPlacement === 'right' && width > roomRight && roomLeft > roomRight) horizontalPlacement = 'left';
	if (horizontalPlacement === 'left' && width > roomLeft && roomRight > roomLeft) horizontalPlacement = 'right';

	let left = horizontalPlacement === 'right'
		? anchorRect.right + gap
		: horizontalPlacement === 'left'
			? anchorRect.left - width - gap
			: anchorRect.left + (anchorRect.width - width) / 2;

	const roomBelow = bounds.bottom - anchorRect.bottom - gap - margin;
	const roomAbove = anchorRect.top - bounds.top - gap - margin;
	let placeAbove = false;
	let top: number;
	let availableHeight: number;

	if (props.anchor.y === 'top') {
		placeAbove = true;
		top = anchorRect.top - height - gap;
		availableHeight = roomAbove;
	} else if (props.anchor.y === 'center') {
		top = anchorRect.top + (anchorRect.height - height) / 2;
		availableHeight = bounds.bottom - bounds.top - (margin * 2);
	} else if (height > roomBelow && roomAbove > roomBelow) {
		placeAbove = true;
		top = anchorRect.top - height - gap;
		availableHeight = roomAbove;
	} else {
		top = anchorRect.bottom + gap;
		availableHeight = roomBelow;
	}

	const viewportAvailableHeight = Math.max(0, bounds.bottom - bounds.top - (margin * 2));
	maxHeight.value = Math.min(viewportAvailableHeight, Math.max(MIN_POPUP_HEIGHT, availableHeight));

	left = Math.min(Math.max(left, bounds.left + margin), Math.max(bounds.left + margin, bounds.right - width - margin));
	top = Math.min(Math.max(top, bounds.top + margin), Math.max(bounds.top + margin, bounds.bottom - height - margin));

	const anchorCenterX = anchorRect.left + anchorRect.width / 2;
	const popupCenterX = left + width / 2;
	const transformOriginX = horizontalPlacement === 'right'
		? 'left'
		: horizontalPlacement === 'left'
			? 'right'
			: anchorCenterX < popupCenterX - 8 ? 'left' : anchorCenterX > popupCenterX + 8 ? 'right' : 'center';
	const transformOriginY = placeAbove ? 'bottom' : props.anchor.y === 'center' ? 'center' : 'top';
	transformOrigin.value = `${transformOriginX} ${transformOriginY}`;

	content.value.style.left = `${Math.round(left)}px`;
	content.value.style.top = `${Math.round(top)}px`;
};

const onOpened = () => {
	emit('opened');
	nextTick(align);
};

const onClosed = () => {
	emit('closed');
};

const alignObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(align);

function observePositionSources() {
	alignObserver?.disconnect();
	if (content.value != null) alignObserver?.observe(content.value);
	if (props.anchorElement != null) alignObserver?.observe(props.anchorElement);
}

function restoreDisabledAnchor() {
	if (disabledAnchorElement == null) return;
	disabledAnchorElement.style.pointerEvents = disabledAnchorPointerEvents;
	if (disabledAnchorAriaExpanded == null) {
		disabledAnchorElement.removeAttribute('aria-expanded');
	} else {
		disabledAnchorElement.setAttribute('aria-expanded', disabledAnchorAriaExpanded);
	}
}

function setDisabledAnchor(anchor: HTMLElement | null) {
	if (disabledAnchorElement === anchor) return;
	restoreDisabledAnchor();
	disabledAnchorElement = anchor;
	if (disabledAnchorElement == null) return;
	disabledAnchorPointerEvents = disabledAnchorElement.style.pointerEvents;
	disabledAnchorAriaExpanded = disabledAnchorElement.getAttribute('aria-expanded');
	disabledAnchorElement.style.pointerEvents = 'none';
	disabledAnchorElement.setAttribute('aria-expanded', 'true');
}

function disableCurrentAnchor() {
	if (disabledAnchorElement == null) return;
	disabledAnchorElement.style.pointerEvents = 'none';
	disabledAnchorElement.setAttribute('aria-expanded', 'true');
}

onMounted(() => {
	watch([() => props.anchorElement, type], async ([anchor]) => {
		setDisabledAnchor(anchor);
		fixed.value = type.value !== 'dialog' || getFixedContainer(anchor) != null;

		await nextTick();
		observePositionSources();
		align();
	}, { immediate: true });

	watch([showing, () => props.manualShowing], ([showing, manualShowing]) => {
		const visible = manualShowing === true || (manualShowing == null && showing === true);
		if (visible) {
			disableCurrentAnchor();
			if (modalRootEl.value != null) {
				releaseFocusTrap?.();
				const { release } = focusTrap(modalRootEl.value, props.hasInteractionWithOtherFocusTrappedEls);

				releaseFocusTrap = release;
				modalRootEl.value.focus();
			}
		} else {
			restoreDisabledAnchor();
			releaseFocusTrap?.();
			releaseFocusTrap = null;
			focusParent(props.returnFocusTo ?? props.anchorElement, true, false);
		}
	}, { immediate: true });

	window.addEventListener('resize', align, { passive: true });
	window.addEventListener('scroll', align, { passive: true, capture: true });
	window.visualViewport?.addEventListener('resize', align, { passive: true });
	window.visualViewport?.addEventListener('scroll', align, { passive: true });
});

onUnmounted(() => {
	alignObserver?.disconnect();
	releaseFocusTrap?.();
	restoreDisabledAnchor();
	window.removeEventListener('resize', align);
	window.removeEventListener('scroll', align, true);
	window.visualViewport?.removeEventListener('resize', align);
	window.visualViewport?.removeEventListener('scroll', align);
});

defineExpose({
	close,
});
</script>

<style lang="scss" module>
.transition_send_enterActive,
.transition_send_leaveActive {
	> .bg { transition: opacity var(--MI-motionDurationNormal) ease !important; }
	> .content { transition: opacity var(--MI-motionDurationNormal) ease, transform var(--MI-motionDurationSlow) cubic-bezier(.4, 0, .2, 1) !important; }
}
.transition_send_enterFrom,
.transition_send_leaveTo {
	> .bg { opacity: 0; }
	> .content { pointer-events: none; opacity: 0; transform: translateY(var(--MI-motionDistanceNegative3)); }
}

.transition_modal_enterActive,
.transition_modal_leaveActive {
	> .bg { transition: opacity var(--MI-motionDurationNormal) ease !important; }
	> .content {
		transform-origin: var(--transformOrigin);
		transition: opacity var(--MI-motionDurationNormal) ease, transform var(--MI-motionDurationNormal) cubic-bezier(.2, .8, .2, 1) !important;
	}
}
.transition_modal_enterFrom,
.transition_modal_leaveTo {
	> .bg { opacity: 0; }
	> .content {
		pointer-events: none;
		opacity: 0;
		transform-origin: var(--transformOrigin);
		transform: translateY(var(--MI-motionDistance)) scale(0.975);
	}
}

.transition_modalPopup_enterActive,
.transition_modalPopup_leaveActive {
	> .bg { transition: opacity var(--MI-motionDurationFast) ease !important; }
	> .content {
		transform-origin: var(--transformOrigin);
		transition: opacity var(--MI-motionDurationFast) ease, transform var(--MI-motionDurationFast) cubic-bezier(.2, .8, .2, 1) !important;
	}
}
.transition_modalPopup_enterFrom,
.transition_modalPopup_leaveTo {
	> .bg { opacity: 0; }
	> .content {
		pointer-events: none;
		opacity: 0;
		transform-origin: var(--transformOrigin);
		transform: translateY(var(--MI-motionDistance45)) scale(0.97);
	}
}

.transition_modalDrawer_enterActive,
.transition_modalDrawer_leaveActive {
	> .bg { transition: opacity var(--MI-motionDurationNormal) ease !important; }
	> .content { transition: transform var(--MI-motionDurationSlow) cubic-bezier(.22, 1, .36, 1) !important; }
}
.transition_modalDrawer_enterFrom,
.transition_modalDrawer_leaveTo {
	> .bg { opacity: 0; }
	> .content { pointer-events: none; transform: translateY(calc(100% + var(--MI-floatingGap))); }
}

.root {
	outline: none;

	&.dialog {
		> .content {
			position: fixed;
			inset: 0;
			margin: auto;
			padding: var(--MI-dialogPadding);
			display: flex;
			overflow: auto;
			overscroll-behavior: contain;
			scrollbar-gutter: stable both-edges;

			@media (max-width: 500px) {
				padding: var(--MI-dialogPaddingNarrow);
			}
		}
	}

	&.popup {
		> .content {
			position: fixed;
			max-width: calc(100vw - var(--MI-floatingGapDouble));
			max-height: calc(100dvh - var(--MI-floatingGapDouble));

			> :global(._panel) {
				-webkit-backdrop-filter: var(--MI-surfaceFilter);
				backdrop-filter: var(--MI-surfaceFilter);
			}
		}
	}

	&.drawer {
		position: fixed;
		inset: 0;
		width: 100%;
		height: 100%;
		overflow: clip;

		> .content {
			position: fixed;
			bottom: var(--MI-drawerViewportBottom, 0px);
			left: 0;
			right: 0;
			margin: auto;

			> :first-child {
				background: var(--MI-surfacePopup, var(--MI-materialBg));
				border: var(--MI-surfaceBorderWidth, 1px) solid var(--MI-surfaceBorder);
				border-bottom: none;
				-webkit-backdrop-filter: var(--MI-surfaceFilter);
				backdrop-filter: var(--MI-surfaceFilter);
				border-radius: min(calc(var(--MI-radius) + 12px), 30px) min(calc(var(--MI-radius) + 12px), 30px) 0 0;
				box-shadow: var(--MI-surfaceShadowRaised);
				overflow: clip;

				@media (max-width: 500px) {
					border-radius: min(calc(var(--MI-radius) + 10px), 26px) min(calc(var(--MI-radius) + 10px), 26px) 0 0;
				}
			}
		}

		&.drawerInset > .content {
			box-sizing: border-box;
			padding: 0 var(--MI-floatingGap) max(var(--MI-floatingGap), env(safe-area-inset-bottom, 0px));

			> :first-child {
				width: min(100%, 620px);
				border-bottom: var(--MI-surfaceBorderWidth, 1px) solid var(--MI-surfaceBorder);
				border-radius: var(--MI-drawerRadius);
			}
		}
	}
}

.bg {
	contain: strict;

	&.bgTransparent {
		background: transparent;
		-webkit-backdrop-filter: none;
		backdrop-filter: none;
	}
}
</style>
