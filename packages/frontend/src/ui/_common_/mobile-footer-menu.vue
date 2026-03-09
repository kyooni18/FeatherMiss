<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div ref="rootEl" :class="$style.root">
	<button :class="$style.item" class="_button" @click="drawerMenuShowing = true">
		<div :class="$style.itemInner">
			<i :class="$style.itemIcon" class="ti ti-menu-2"></i><span v-if="menuIndicated" :class="$style.itemIndicator" class="_blink"><i class="_indicatorCircle"></i></span>
		</div>
	</button>

	<button :class="$style.item" class="_button" @click="mainRouter.push('/')">
		<div :class="$style.itemInner">
			<i :class="$style.itemIcon" class="ti ti-home"></i>
		</div>
	</button>

	<button :class="$style.item" class="_button" @click="mainRouter.push('/my/notifications')">
		<div :class="$style.itemInner">
			<i :class="$style.itemIcon" class="ti ti-bell"></i>
			<span v-if="$i?.hasUnreadNotification" :class="$style.itemIndicator" class="_blink">
				<span class="_indicateCounter" :class="$style.itemIndicateValueIcon">{{ $i.unreadNotificationsCount > 99 ? '99+' : $i.unreadNotificationsCount }}</span>
			</span>
		</div>
	</button>

	<button :class="$style.item" class="_button" @click="widgetsShowing = true">
		<div :class="$style.itemInner">
			<i :class="$style.itemIcon" class="ti ti-apps"></i>
		</div>
	</button>

	<button :class="[$style.item, $style.post]" class="_button" @click="os.post()">
		<div :class="$style.itemInner">
			<i :class="$style.itemIcon" class="ti ti-pencil"></i>
		</div>
	</button>
</div>
</template>

<script lang="ts" setup>
import { computed, onUnmounted, ref, useTemplateRef, watch } from 'vue';
import { $i } from '@/i.js';
import * as os from '@/os.js';
import { mainRouter } from '@/router.js';
import { navbarItemDef } from '@/navbar.js';

const drawerMenuShowing = defineModel<boolean>('drawerMenuShowing');
const widgetsShowing = defineModel<boolean>('widgetsShowing');

const rootEl = useTemplateRef('rootEl');
let rootResizeObserver: ResizeObserver | null = null;

const menuIndicated = computed(() => {
	for (const def in navbarItemDef) {
		if (def === 'notifications') continue; // 通知は下にボタンとして表示されてるから
		if (navbarItemDef[def].indicated) return true;
	}
	return false;
});

const rootElHeight = ref(0);

function syncBottomSpacing() {
	const el = rootEl.value;
	if (!el) {
		rootElHeight.value = 0;
		window.document.body.style.setProperty('--MI-minBottomSpacing', '0px');
		return;
	}

	const computedStyle = window.getComputedStyle(el);
	const bottomInset = Number.parseFloat(computedStyle.bottom) || 0;
	rootElHeight.value = (el.offsetHeight ?? 0) + bottomInset;
	window.document.body.style.setProperty('--MI-minBottomSpacing', rootElHeight.value > 0 ? `${rootElHeight.value}px` : '0px');
}

watch(rootEl, (el) => {
	rootResizeObserver?.disconnect();
	rootResizeObserver = null;

	if (el) {
		syncBottomSpacing();
		if (typeof ResizeObserver !== 'undefined') {
			rootResizeObserver = new ResizeObserver(() => {
				syncBottomSpacing();
			});
			rootResizeObserver.observe(el);
		}
	} else {
		rootElHeight.value = 0;
		window.document.body.style.setProperty('--MI-minBottomSpacing', '0px');
	}
}, {
	immediate: true,
});

onUnmounted(() => {
	rootResizeObserver?.disconnect();
	rootResizeObserver = null;
	window.document.body.style.setProperty('--MI-minBottomSpacing', '0px');
});
</script>

<style lang="scss" module>
.root {
	--_dockOuterInsetX: calc(var(--MI-margin) + var(--MI-mobileDockPaddingX));
	--_dockBottomInset: calc(max(env(safe-area-inset-bottom, 0px), 8px) + var(--MI-mobileDockPaddingBottom));
	--_dockInnerPaddingY: calc(8px + var(--MI-mobileDockPaddingTop));
	--_dockInnerPaddingX: calc(4px + (var(--MI-mobileDockPaddingX) * 0.2));
	--_dockMaxWidth: min(calc(100vw - (var(--_dockOuterInsetX) * 2)), 332px);

	position: fixed;
	left: 50%;
	right: auto;
	bottom: var(--_dockBottomInset);
	z-index: 1000;
	width: var(--_dockMaxWidth);
	transform: translateX(-50%);
	padding: var(--_dockInnerPaddingY) var(--_dockInnerPaddingX);
	display: grid;
	grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
	column-gap: calc(2px + (var(--MI-mobileDockPaddingX) * 0.15));
	box-sizing: border-box;
	color: var(--MI_THEME-navFg);
	background: var(--MI-materialBg);
	border: 1px solid var(--MI-surfaceBorder);
	border-radius: var(--MI-mobileDockRadius);
	box-shadow: var(--MI-surfaceShadow);
	-webkit-backdrop-filter: var(--MI-surfaceFilter);
	backdrop-filter: var(--MI-surfaceFilter);
	overflow: visible;
	isolation: isolate;
	pointer-events: none;
}

.item {
	min-width: 0;
	padding: calc(2px + (var(--MI-mobileDockPaddingTop) * 0.08)) 0;
	pointer-events: auto;

	&:focus-visible {
		outline: none;

		.itemInner {
			box-shadow: 0 0 0 2px var(--MI_THEME-focus);
		}
	}

	&.post {
		.itemInner {
			background: linear-gradient(90deg, var(--MI_THEME-buttonGradateA), var(--MI_THEME-buttonGradateB));
			color: var(--MI_THEME-fgOnAccent);

			&:hover {
				background: linear-gradient(90deg, hsl(from var(--MI_THEME-accent) h s calc(l + 5)), hsl(from var(--MI_THEME-accent) h s calc(l + 5)));
			}

			&:active {
				background: linear-gradient(90deg, hsl(from var(--MI_THEME-accent) h s calc(l + 5)), hsl(from var(--MI_THEME-accent) h s calc(l + 5)));
			}
		}
	}
}

.itemInner {
	position: relative;
	display: grid;
	place-items: center;
	padding: 0;
	width: min(100%, 48px);
	height: 46px;
	margin: auto;
	border-radius: var(--MI-buttonPillRadius);

	&:hover {
		background: var(--MI_THEME-panelHighlight);
	}

	&:active {
		background: var(--MI_THEME-panelHighlight);
	}
}

.itemIcon {
	font-size: 15px;
}

.itemIndicator {
	position: absolute;
	bottom: -4px;
	left: 0;
	right: 0;
	color: var(--MI_THEME-indicator);
	font-size: 10px;
	pointer-events: none;

	&:has(.itemIndicateValueIcon) {
		animation: none;
		font-size: 8px;
	}
}
</style>
