<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModal
	ref="modal"
	v-slot="{ type, maxHeight }"
	:manualShowing="manualShowing"
	:zPriority="'high'"
	:anchorElement="anchorElement"
	:transparentBg="true"
	:returnFocusTo="returnFocusTo"
	@click="click"
	@close="onModalClose"
	@closed="onModalClosed"
>
	<MkMenu
		:items="items"
		:align="align"
		:width="width"
		:max-height="maxHeight"
		:asDrawer="type === 'drawer'"
		:returnFocusTo="returnFocusTo"
		:debugDisablePredictionCone="debugDisablePredictionCone"
		:debugShowPredictionCone="debugShowPredictionCone"
		:drawerLabel="contextMenu ? i18n.ts.quickAction : undefined"
		:insetDrawer="contextMenu"
		:class="{ [$style.drawer]: type === 'drawer', [$style.contextDrawer]: type === 'drawer' && contextMenu }"
		@close="onMenuClose"
	/>
</MkModal>
</template>

<script lang="ts" setup>
import { ref, useTemplateRef } from 'vue';
import MkModal from './MkModal.vue';
import MkMenu from './MkMenu.vue';
import type { MenuItem } from '@/types/menu.js';
import { i18n } from '@/i18n.js';

defineProps<{
	items: MenuItem[];
	align?: 'center' | string;
	width?: number;
	anchorElement?: HTMLElement | null;
	returnFocusTo?: HTMLElement | null;
	preferType?: 'auto' | 'popup' | 'drawer';
	contextMenu?: boolean;
	debugDisablePredictionCone?: boolean;
	debugShowPredictionCone?: boolean;
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
	(ev: 'closing'): void;
}>();

const modal = useTemplateRef('modal');
const manualShowing = ref(true);

function click() {
	close();
}

function onModalClose() {
	emit('closing');
}

function onMenuClose() {
	close();
}

function onModalClosed() {
	emit('closed');
}

function close() {
	manualShowing.value = false;

	// closeは呼ぶ必要がある
	modal.value?.close();
}
</script>

<style lang="scss" module>
.drawer {
	border-radius: var(--MI-drawerRadius) var(--MI-drawerRadius) 0 0;
}

.contextDrawer {
	width: min(100%, 620px);
}

</style>
