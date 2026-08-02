<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 1080px; --MI_SPACER-min: 16px; --MI_SPACER-max: 40px;">
		<div :class="$style.page">
			<section :class="$style.hero">
				<div :class="$style.heroIcon"><i class="ti ti-palette"></i></div>
				<div :class="$style.heroText">
					<h1>{{ i18n.ts._feathermiss.interfaceStudio }}</h1>
					<p>{{ i18n.ts._feathermiss.interfaceStudioDescription }}</p>
				</div>
				<MkButton link to="/settings/preferences" transparent :class="$style.preferencesLink">
					<i class="ti ti-adjustments"></i> {{ i18n.ts._feathermiss.preferences }}
				</MkButton>
			</section>

			<MkInfo :class="$style.scopeInfo">
				{{ i18n.ts._feathermiss.studioScopeInfo }}
			</MkInfo>

			<UiCustomization/>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import MkButton from '@/components/MkButton.vue';
import MkInfo from '@/components/MkInfo.vue';
import UiCustomization from '@/feathermiss/components/UiCustomization.vue';
import { definePage } from '@/page.js';
import { i18n } from '@/i18n.js';

const headerActions = computed(() => []);
const headerTabs = computed(() => []);

definePage({
	title: i18n.ts._feathermiss.interfaceStudio,
	icon: 'ti ti-palette',
});
</script>

<style lang="scss" module>
.page {
	display: flex;
	flex-direction: column;
	gap: var(--MI-space21);
	padding-block: var(--MI-space20) 48px;
}

.hero {
	display: grid;
	grid-template-columns: auto minmax(0, 1fr) auto;
	align-items: center;
	gap: var(--MI-space18);
	padding: clamp(18px, 3vw, 30px);
	border: var(--MI-surfaceBorderWidth) solid var(--MI-surfaceBorder);
	border-radius: calc(var(--MI-radius) + 10px);
	background: var(--MI-surfacePanel, var(--MI_THEME-panel));
	box-shadow: var(--MI-surfaceShadow);
	-webkit-backdrop-filter: var(--MI-surfaceFilter);
	backdrop-filter: var(--MI-surfaceFilter);
}

.heroIcon {
	display: grid;
	place-items: center;
	width: 58px;
	height: 58px;
	border-radius: max(16px, var(--MI-buttonRadius));
	color: var(--MI_THEME-fgOnAccent);
	background: var(--MI_THEME-accent);
	background: linear-gradient(135deg, var(--MI_THEME-accent), var(--MI_THEME-buttonGradateB, var(--MI_THEME-accent)));
	box-shadow: 0 12px 30px color-mix(in srgb, var(--MI_THEME-accent) 22%, transparent);
	font-size: 1.55rem;
}

.heroText {
	min-width: 0;

	h1 {
		margin: 0;
		font-size: clamp(1.35rem, 3vw, 2rem);
		line-height: 1.1;
	}

	p {
		max-width: 720px;
		margin: 8px 0 0;
		line-height: 1.55;
		opacity: 0.72;
		text-wrap: pretty;
	}
}

.preferencesLink {
	white-space: nowrap;
}

.scopeInfo {
	margin: 0;
}

@supports not (color: color-mix(in srgb, white 50%, transparent)) {
	.heroIcon { box-shadow: var(--MI-surfaceShadow); }
}

@media (max-width: 700px) {
	.page { padding-block-start: var(--MI-space10); }

	.hero {
		grid-template-columns: auto minmax(0, 1fr);
		align-items: start;
	}

	.heroIcon {
		width: 48px;
		height: 48px;
		font-size: 1.3rem;
	}

	.preferencesLink {
		grid-column: 1 / -1;
		width: 100%;
	}
}
</style>
