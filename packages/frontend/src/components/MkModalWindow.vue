<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModal ref="modal" v-slot="{ type }" :preferType="deviceKind === 'smartphone' ? 'drawer' : 'dialog'" @click="onBgClick" @closed="emit('closed')" @esc="emit('esc')">
	<div ref="rootEl" :class="[$style.root, type === 'drawer' ? $style.asDrawer : null]" :style="{ width: type === 'drawer' ? '' : `${width}px`, height: type === 'drawer' ? '' : `min(${height}px, 100%)` }">
		<div :class="$style.header">
			<button v-if="withCloseButton" :class="$style.headerButton" class="_button" data-cy-modal-window-close @click="emit('close')"><i class="ti ti-x"></i></button>
			<span :class="$style.title">
				<slot name="header"></slot>
			</span>
			<div v-if="withOkButton" style="padding: 0 16px; place-content: center;">
				<MkButton primary gradate small rounded :disabled="okButtonDisabled" @click="emit('ok')">{{ i18n.ts.done }} <i class="ti ti-check"></i></MkButton>
			</div>
		</div>
		<div :class="$style.body">
			<slot></slot>
		</div>
		<div v-if="$slots.footer" :class="$style.footer">
			<slot name="footer"></slot>
		</div>
	</div>
</MkModal>
</template>

<script lang="ts" setup>
import { onMounted, onUnmounted, useTemplateRef, ref } from 'vue';
import MkModal from '@/components/MkModal.vue';
import MkButton from '@/components/MkButton.vue';
import { i18n } from '@/i18n';
import { deviceKind } from '@/utility/device-kind.js';

const props = withDefaults(defineProps<{
	withOkButton?: boolean;
	withCloseButton?: boolean;
	okButtonDisabled?: boolean;
	width?: number;
	height?: number;
}>(), {
	withOkButton: false,
	withCloseButton: true,
	okButtonDisabled: false,
	width: 400,
	height: 500,
});

const emit = defineEmits<{
	(event: 'click'): void;
	(event: 'close'): void;
	(event: 'closed'): void;
	(event: 'ok'): void;
	(event: 'esc'): void;
}>();

const modal = useTemplateRef('modal');

function close() {
	modal.value?.close();
}

function onBgClick() {
	emit('click');
}

defineExpose({
	close,
});
</script>

<style lang="scss" module>
.root {
	margin: auto;
	overflow: hidden;
	display: flex;
	flex-direction: column;
	contain: content;
	border-radius: calc(var(--MI-radius) + 4px);
	border: var(--MI-surfaceBorderWidth) solid var(--MI-surfaceBorder);
	background: var(--MI-surfacePopup, var(--MI_THEME-panel));
	box-shadow: var(--MI-surfaceShadowRaised);
	-webkit-backdrop-filter: var(--MI-surfaceFilter);
	backdrop-filter: var(--MI-surfaceFilter);

	--root-margin: 24px;
	--MI_THEME-headerHeight: 50px;
	--MI_THEME-headerHeightNarrow: 46px;

	@media (max-width: 500px) { --root-margin: 16px; }

	&.asDrawer {
		height: calc(100dvh - max(18px, env(safe-area-inset-top, 0px)));
		border: 0;
		border-radius: inherit;
		box-shadow: none;

		.body { padding-bottom: env(safe-area-inset-bottom, 0px); }
		.footer { padding-bottom: max(12px, env(safe-area-inset-bottom, 0px)); }
	}
}

.header {
	display: flex;
	position: relative;
	z-index: 2;
	flex-shrink: 0;
	background: var(--MI-surfacePopup, var(--MI_THEME-windowHeader));
	border-bottom: var(--MI-surfaceBorderWidth) solid var(--MI-surfaceBorder);
	-webkit-backdrop-filter: var(--MI-surfaceFilter);
	backdrop-filter: var(--MI-surfaceFilter);
}

.headerButton {
	height: var(--MI_THEME-headerHeight);
	width: var(--MI_THEME-headerHeight);
	border-radius: var(--MI-buttonRadius);
	transition: background-color var(--MI-motionDurationFast) ease;
	&:hover { background: var(--MI_THEME-panelHighlight); }
	@media (max-width: 500px) { height: var(--MI_THEME-headerHeightNarrow); width: var(--MI_THEME-headerHeightNarrow); }
}

.title {
	flex: 1;
	line-height: var(--MI_THEME-headerHeight);
	padding-left: 24px;
	font-weight: 700;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	pointer-events: none;
	@media (max-width: 500px) { line-height: var(--MI_THEME-headerHeightNarrow); padding-left: 16px; }
}

.headerButton + .title { padding-left: 0; }

.body {
	flex: 1;
	overflow: auto;
	overscroll-behavior: contain;
	background: var(--MI-surfacePage, var(--MI_THEME-bg));
	container-type: size;
	scrollbar-gutter: stable;
}

.footer {
	padding: var(--MI-space12) var(--MI-space16);
	overflow: auto;
	background: var(--MI-surfacePopup, var(--MI_THEME-panel));
	border-top: var(--MI-surfaceBorderWidth) solid var(--MI-surfaceBorder);
	-webkit-backdrop-filter: var(--MI-surfaceFilter);
	backdrop-filter: var(--MI-surfaceFilter);
}
</style>
