<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root" role="status" aria-live="polite">
	<span :class="$style.icon" aria-hidden="true">
		<i class="ti ti-refresh-alert"></i>
	</span>
	<span :class="$style.title">{{ i18n.ts.reloadRequiredToApplySettings }}</span>
	<span :class="$style.actions">
		<button class="_button" :class="$style.primary" @click="reload">{{ i18n.ts.reload }}</button>
		<button class="_button" :class="$style.secondary" @click="skip">{{ i18n.ts.skip }}</button>
	</span>
</div>
</template>

<script lang="ts" setup>
import { i18n } from '@/i18n.js';
import { shouldSuggestReload } from '@/utility/reload-suggest.js';
import { unisonReload } from '@/utility/unison-reload.js';

function reload() {
	unisonReload();
}

function skip() {
	shouldSuggestReload.value = false;
}
</script>

<style lang="scss" module>
.root {
	display: flex;
	align-items: center;
	gap: var(--MI-space10);
	min-height: 42px;
	width: 100%;
	padding: 6px max(var(--MI-space12), env(safe-area-inset-right, 0px)) 6px max(var(--MI-space12), env(safe-area-inset-left, 0px));
	box-sizing: border-box;
	background: var(--MI-surfacePopup, var(--MI_THEME-accent));
	border-bottom: var(--MI-surfaceBorderWidth) solid var(--MI-surfaceBorder);
	-webkit-backdrop-filter: var(--MI-surfaceFilter);
	backdrop-filter: var(--MI-surfaceFilter);
	color: var(--MI_THEME-fg);
	box-shadow: 0 4px 18px rgba(0, 0, 0, 0.1);
	box-shadow: 0 4px 18px color(from var(--MI_THEME-shadow) srgb r g b / 0.1);
}

.icon {
	flex: none;
	color: var(--MI_THEME-accent);
	font-size: 1.1em;
}

.title {
	min-width: 0;
	flex: 1;
	font-size: 0.9em;
	font-weight: 650;
	line-height: 1.35;
}

.actions {
	display: flex;
	align-items: center;
	gap: 6px;
	flex: none;
}

.primary,
.secondary {
	min-height: 36px;
	padding: 4px 10px;
	border-radius: var(--MI-buttonRadius);
	font-size: 0.86em;
	font-weight: 650;
}

.primary {
	background: var(--MI_THEME-accent);
	color: var(--MI_THEME-fgOnAccent);
}

.secondary {
	background: var(--MI_THEME-buttonBg);
}

@media (max-width: 500px) {
	.root {
		align-items: flex-start;
		flex-wrap: wrap;
		padding: 8px var(--MI-space10);
	}

	.title {
		padding-top: 5px;
	}

	.actions {
		width: 100%;
		padding-left: calc(1.1em + var(--MI-space10));
	}
}
</style>
