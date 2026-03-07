<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<span
	v-tooltip="checked ? i18n.ts.itsOn : i18n.ts.itsOff"
	:class="{
		[$style.button]: true,
		[$style.buttonChecked]: checked,
		[$style.buttonDisabled]: props.disabled
	}"
	data-cy-switch-toggle
	@click.prevent.stop="toggle"
>
	<div :class="{ [$style.knob]: true, [$style.knobChecked]: checked }"></div>
</span>
</template>

<script lang="ts" setup>
import { toRefs } from 'vue';
import type { Ref } from 'vue';
import { i18n } from '@/i18n.js';

const props = withDefaults(defineProps<{
	checked: boolean | Ref<boolean>;
	disabled?: boolean | Ref<boolean>;
}>(), {
	disabled: false,
});

const emit = defineEmits<{
	(ev: 'toggle'): void;
}>();

const checked = toRefs(props).checked;
const toggle = () => {
	emit('toggle');
};
</script>

<style lang="scss" module>
.button {
	--height: 21px;
	--inset: 2px;
	--radius: 12px;

	position: relative;
	display: inline-flex;
	align-items: center;
	flex-shrink: 0;
	margin: 0;
	box-sizing: border-box;
	width: calc(var(--height) * 1.6);
	height: var(--height);
	padding: var(--inset);
	outline: none;
	background: color(from var(--MI_THEME-switchOffBg) srgb r g b / 0.46);
	border: solid 1px color(from var(--MI_THEME-switchOffBg) srgb r g b / 0.58);
	border-radius: var(--radius);
	-webkit-backdrop-filter: var(--MI-surfaceFilter);
	backdrop-filter: var(--MI-surfaceFilter);
	cursor: pointer;
	transition: background-color 0.18s ease, border-color 0.18s ease;
	user-select: none;
}

.buttonChecked {
	background-color: color(from var(--MI_THEME-switchOnBg) srgb r g b / 0.52) !important;
	border-color: color(from var(--MI_THEME-switchOnBg) srgb r g b / 0.64) !important;
}

.buttonDisabled {
	cursor: not-allowed;
	opacity: 0.6;
}

.knob {
	position: absolute;
	box-sizing: border-box;
	top: 50%;
	left: var(--inset);
	width: calc(var(--height) - (var(--inset) * 2));
	height: calc(var(--height) - (var(--inset) * 2));
	transform: translateY(-50%);
	border-radius: var(--radius);
	transition: left 0.2s ease, background-color 0.2s ease;

	&:not(.knobChecked) {
		background: color(from var(--MI_THEME-switchOffFg) srgb r g b / 0.82);
	}
}

.knobChecked {
	left: calc(100% - var(--height) + var(--inset));
	background: color(from var(--MI_THEME-switchOnFg) srgb r g b / 0.9);
}
</style>
