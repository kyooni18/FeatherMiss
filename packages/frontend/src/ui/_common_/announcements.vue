<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-if="$i" :class="$style.root" aria-live="polite">
	<MkA
		v-for="announcement in $i.unreadAnnouncements.filter(x => x.display === 'banner')"
		:key="announcement.id"
		:class="$style.item"
		:to="`/announcements/${announcement.id}`"
	>
		<span :class="$style.icon" aria-hidden="true">
			<i v-if="announcement.icon === 'info'" class="ti ti-info-circle"></i>
			<i v-else-if="announcement.icon === 'warning'" class="ti ti-alert-triangle" :class="$style.warning"></i>
			<i v-else-if="announcement.icon === 'error'" class="ti ti-circle-x" :class="$style.error"></i>
			<i v-else-if="announcement.icon === 'success'" class="ti ti-check" :class="$style.success"></i>
		</span>
		<span :class="$style.content">
			<strong v-if="announcement.title" :class="$style.title">{{ announcement.title }}</strong>
			<span :class="$style.body">{{ announcement.text }}</span>
		</span>
		<i class="ti ti-chevron-right" :class="$style.chevron" aria-hidden="true"></i>
	</MkA>
</div>
</template>

<script lang="ts" setup>
import { $i } from '@/i.js';
</script>

<style lang="scss" module>
.root {
	display: flex;
	flex-direction: column;
	background: var(--MI-surfacePanel, var(--MI_THEME-panel));
	border-bottom: var(--MI-surfaceBorderWidth) solid var(--MI-surfaceBorder);
	-webkit-backdrop-filter: var(--MI-surfaceFilter);
	backdrop-filter: var(--MI-surfaceFilter);
}

.item {
	display: flex;
	align-items: center;
	gap: var(--MI-space10);
	min-height: 44px;
	padding: 7px max(var(--MI-space12), env(safe-area-inset-right, 0px)) 7px max(var(--MI-space12), env(safe-area-inset-left, 0px));
	box-sizing: border-box;
	background: var(--MI-surfacePopup, var(--MI_THEME-accentedBg));
	color: var(--MI_THEME-fg);
	transition: background-color var(--MI-motionDurationFast) ease;

	&:not(:last-child) {
		border-bottom: var(--MI-surfaceBorderWidth) solid var(--MI-surfaceBorder);
	}

	&:hover {
		background: var(--MI_THEME-accentedBg);
	}
}

.icon,
.chevron {
	flex: none;
}

.icon {
	color: var(--MI_THEME-accent);
	font-size: 1.08em;
}

.warning { color: var(--MI_THEME-warn); }
.error { color: var(--MI_THEME-error); }
.success { color: var(--MI_THEME-success); }

.content {
	display: flex;
	align-items: baseline;
	gap: var(--MI-space10);
	min-width: 0;
	flex: 1;
	line-height: 1.35;
}

.title {
	flex: none;
	max-width: 40%;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-size: 0.9em;
}

.body {
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	font-size: 0.86em;
	opacity: 0.82;
}

.chevron {
	opacity: 0.45;
}

@media (max-width: 700px) {
	.item {
		align-items: flex-start;
		padding: 9px var(--MI-space10);
	}

	.content {
		align-items: stretch;
		flex-direction: column;
		gap: 2px;
	}

	.title {
		max-width: none;
	}

	.body {
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		white-space: normal;
	}

	.chevron {
		margin-top: 3px;
	}
}
</style>
