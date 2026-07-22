<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root">
	<XNotification :notification="notification" class="notification _acrylic" :full="false"/>
</div>
</template>

<script lang="ts" setup>
import { } from 'vue';
import * as Misskey from 'misskey-js';
import XNotification from '@/components/MkNotification.vue';

defineProps<{
	notification: Misskey.entities.Notification;
}>();
</script>

<style lang="scss" module>
.root {
	background: var(--MI-surfacePopup, var(--MI_THEME-popup));
	border: var(--MI-surfaceBorderWidth) solid var(--MI-surfaceBorder);
	border-radius: calc(var(--MI-radius) + 2px);
	box-shadow: var(--MI-surfaceShadowRaised);
	-webkit-backdrop-filter: var(--MI-surfaceFilter);
	backdrop-filter: var(--MI-surfaceFilter);
	overflow: clip;
	contain: content;
}
</style>
