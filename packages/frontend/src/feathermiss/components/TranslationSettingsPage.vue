<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="[]" :tabs="[]">
	<div class="_spacer" style="--MI_SPACER-w: 760px; --MI_SPACER-min: 16px; --MI_SPACER-max: 32px;">
		<div class="_gaps_m">
			<MkInfo>
				{{ i18n.ts._feathermiss.translationInfo }}
			</MkInfo>
			<MkSwitch v-model="backgroundEnabled">
				<template #label>{{ i18n.ts._feathermiss.backgroundTranslation }}</template>
				<template #caption>{{ i18n.ts._feathermiss.backgroundTranslationDescription }}</template>
			</MkSwitch>
			<MkInput v-model="targetLanguagesText">
				<template #label>{{ i18n.ts._feathermiss.targetLanguages }}</template>
				<template #caption>{{ i18n.ts._feathermiss.targetLanguagesDescription }}</template>
			</MkInput>
			<MkInput v-model="timelineIdsText">
				<template #label>{{ i18n.ts._feathermiss.timelineIds }}</template>
				<template #caption>{{ i18n.ts._feathermiss.timelineIdsDescription }}</template>
			</MkInput>
			<MkButton primary @click="save">{{ i18n.ts._feathermiss.saveTranslationPreferences }}</MkButton>
		</div>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import MkButton from '@/components/MkButton.vue';
import MkInfo from '@/components/MkInfo.vue';
import MkInput from '@/components/MkInput.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import { definePage } from '@/page.js';
import { i18n } from '@/i18n.js';
import { translationPreferences } from '@/feathermiss/preferences.js';

const backgroundEnabled = ref(translationPreferences.value.backgroundEnabled);
const targetLanguagesText = ref(translationPreferences.value.targetLanguages.join(', '));
const timelineIdsText = ref(translationPreferences.value.timelineIds.join(', '));

function save(): void {
	translationPreferences.value = {
		backgroundEnabled: backgroundEnabled.value,
		targetLanguages: targetLanguagesText.value.split(','),
		timelineIds: timelineIdsText.value.split(','),
	};
}

definePage({
	title: i18n.ts._feathermiss.translation,
	icon: 'ti ti-language',
});
</script>
