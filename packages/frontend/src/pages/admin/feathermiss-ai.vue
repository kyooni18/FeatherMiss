<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<PageWithHeader :actions="headerActions" :tabs="headerTabs">
	<div class="_spacer" style="--MI_SPACER-w: 760px; --MI_SPACER-min: 16px; --MI_SPACER-max: 32px;">
		<SearchMarker path="/admin/feathermiss-ai" :label="i18n.ts._feathermiss.aiAdministration" :keywords="['feathermiss', 'ai', 'translation', 'provider']" icon="ti ti-sparkles">
			<div class="_gaps_m">
				<MkInfo>{{ i18n.ts._feathermiss.aiAdministrationDescription }}</MkInfo>

				<MkFolder :defaultOpen="true">
					<template #icon><i class="ti ti-adjustments"></i></template>
					<template #label>{{ i18n.ts._feathermiss.deploymentSettings }}</template>
					<template #suffix>{{ config.aiEnabled ? i18n.ts._feathermiss.enabled : i18n.ts._feathermiss.disabled }}</template>

					<div class="_gaps_m">
						<MkSwitch v-model="config.enabled">
							<template #label>{{ i18n.ts._feathermiss.featherMissEnabled }}</template>
							<template #caption>{{ i18n.ts._feathermiss.featherMissEnabledDescription }}</template>
						</MkSwitch>
						<MkSwitch v-model="config.aiEnabled">
							<template #label>{{ i18n.ts._feathermiss.aiEnabled }}</template>
							<template #caption>{{ i18n.ts._feathermiss.aiEnabledDescription }}</template>
						</MkSwitch>
						<MkSwitch v-model="config.aiKillSwitch">
							<template #label>{{ i18n.ts._feathermiss.aiKillSwitch }}</template>
							<template #caption>{{ i18n.ts._feathermiss.aiKillSwitchDescription }}</template>
						</MkSwitch>
						<MkSwitch v-model="config.backgroundTranslationEnabled">
							<template #label>{{ i18n.ts._feathermiss.backgroundTranslationEnabled }}</template>
						</MkSwitch>

						<MkRadios v-model="config.permittedContentScope" :options="contentScopeOptions">
							<template #label>{{ i18n.ts._feathermiss.permittedContentScope }}</template>
							<template #caption>{{ i18n.ts._feathermiss.permittedContentScopeDescription }}</template>
						</MkRadios>
						<div :class="$style.twoColumns">
							<MkInput v-model.number="config.retentionDays" type="number" :min="1">
								<template #label>{{ i18n.ts._feathermiss.retentionDays }}</template>
							</MkInput>
							<MkInput v-model.number="config.maxRequestCharacters" type="number" :min="1">
								<template #label>{{ i18n.ts._feathermiss.maxRequestCharacters }}</template>
							</MkInput>
						</div>
						<MkInput v-model.number="config.rateLimitPerMinute" type="number" :min="1">
							<template #label>{{ i18n.ts._feathermiss.rateLimitPerMinute }}</template>
						</MkInput>
						<MkButton primary @click="saveDeployment"><i class="ti ti-device-floppy"></i> {{ i18n.ts.save }}</MkButton>
					</div>
				</MkFolder>

				<MkFolder :defaultOpen="true">
					<template #icon><i class="ti ti-robot"></i></template>
					<template #label>{{ i18n.ts._feathermiss.providerSettings }}</template>
					<template #suffix>{{ provider.enabled ? i18n.ts._feathermiss.enabled : i18n.ts._feathermiss.disabled }}</template>

					<div class="_gaps_m">
						<MkRadios v-model="provider.providerType" :options="providerOptions">
							<template #label>{{ i18n.ts._feathermiss.provider }}</template>
						</MkRadios>
						<MkInput v-model="provider.endpoint" type="url">
							<template #prefix><i class="ti ti-link"></i></template>
							<template #label>{{ i18n.ts._feathermiss.providerEndpoint }}</template>
							<template #caption>{{ i18n.ts._feathermiss.providerEndpointDescription }}</template>
						</MkInput>
						<MkInput v-model="provider.model">
							<template #label>{{ i18n.ts._feathermiss.providerModel }}</template>
						</MkInput>
						<MkInput v-model="provider.apiKey" type="password" autocomplete="new-password">
							<template #prefix><i class="ti ti-key"></i></template>
							<template #label>{{ i18n.ts._feathermiss.providerApiKey }}</template>
							<template #caption>{{ provider.hasCredentials ? i18n.ts._feathermiss.providerApiKeyConfigured : i18n.ts._feathermiss.providerApiKeyDescription }}</template>
						</MkInput>
						<MkSwitch v-model="provider.enabled">
							<template #label>{{ i18n.ts._feathermiss.providerEnabled }}</template>
						</MkSwitch>

						<div :class="$style.twoColumns">
							<MkInput v-model.number="provider.limits.timeoutMs" type="number" :min="1">
								<template #label>{{ i18n.ts._feathermiss.timeoutMs }}</template>
							</MkInput>
							<MkInput v-model.number="provider.limits.maxConcurrent" type="number" :min="1">
								<template #label>{{ i18n.ts._feathermiss.maxConcurrent }}</template>
							</MkInput>
							<MkInput v-model.number="provider.limits.maxRetries" type="number" :min="0">
								<template #label>{{ i18n.ts._feathermiss.maxRetries }}</template>
							</MkInput>
							<MkInput v-model.number="provider.limits.circuitFailureThreshold" type="number" :min="1">
								<template #label>{{ i18n.ts._feathermiss.circuitFailureThreshold }}</template>
							</MkInput>
							<MkInput v-model.number="provider.limits.circuitResetMs" type="number" :min="1">
								<template #label>{{ i18n.ts._feathermiss.circuitResetMs }}</template>
							</MkInput>
						</div>
						<MkButton primary @click="saveProvider"><i class="ti ti-device-floppy"></i> {{ i18n.ts.save }}</MkButton>
					</div>
				</MkFolder>

				<MkFolder>
					<template #icon><i class="ti ti-database-x"></i></template>
					<template #label>{{ i18n.ts._feathermiss.dataManagement }}</template>
					<div class="_gaps_m">
						<MkInfo warn>{{ i18n.ts._feathermiss.purgeDescription }}</MkInfo>
						<MkButton danger @click="purgeTranslations"><i class="ti ti-trash"></i> {{ i18n.ts._feathermiss.purgeTranslations }}</MkButton>
					</div>
				</MkFolder>
			</div>
		</SearchMarker>
	</div>
</PageWithHeader>
</template>

<script lang="ts" setup>
import { computed, reactive } from 'vue';
import * as Misskey from 'misskey-js';
import MkButton from '@/components/MkButton.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkInfo from '@/components/MkInfo.vue';
import MkInput from '@/components/MkInput.vue';
import MkRadios from '@/components/MkRadios.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import * as os from '@/os.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { i18n } from '@/i18n.js';
import { definePage } from '@/page.js';

type ContentScope = 'notes-on-demand' | 'selected-timelines';
type DeploymentConfig = Omit<Misskey.entities.FeathermissAdminConfigGetResponse, 'permittedContentScope'> & {
	permittedContentScope: ContentScope;
};
type ProviderLimits = {
	timeoutMs: number;
	maxConcurrent: number;
	maxRetries: number;
	circuitFailureThreshold: number;
	circuitResetMs: number;
};
type ProviderType = 'openai-compatible' | 'openai-responses';
type ProviderState = {
	providerType: ProviderType;
	endpoint: string;
	model: string;
	apiKey: string;
	enabled: boolean;
	hasCredentials: boolean;
	limits: ProviderLimits;
};

const [deployment, providerResult] = await Promise.all([
	misskeyApi('feathermiss/admin/config/get'),
	misskeyApi('feathermiss/admin/provider/get'),
]);

const config = reactive<DeploymentConfig>({
	...deployment,
	permittedContentScope: deployment.permittedContentScope as ContentScope,
});
const provider = reactive<ProviderState>({
	providerType: providerResult.providerType === 'openai-responses' ? 'openai-responses' : 'openai-compatible',
	endpoint: providerResult.endpoint ?? '',
	model: providerResult.model ?? '',
	apiKey: '',
	enabled: providerResult.enabled,
	hasCredentials: providerResult.hasCredentials,
	limits: {
		timeoutMs: numberLimit(providerResult.limits.timeoutMs, 30000),
		maxConcurrent: numberLimit(providerResult.limits.maxConcurrent, 2),
		maxRetries: numberLimit(providerResult.limits.maxRetries, 2),
		circuitFailureThreshold: numberLimit(providerResult.limits.circuitFailureThreshold, 5),
		circuitResetMs: numberLimit(providerResult.limits.circuitResetMs, 30000),
	},
});

const contentScopeOptions = computed(() => [
	{ value: 'notes-on-demand' as const, label: i18n.ts._feathermiss.notesOnDemand },
	{ value: 'selected-timelines' as const, label: i18n.ts._feathermiss.selectedTimelines },
]);

const providerOptions = computed(() => [{
	value: 'openai-compatible' as const,
	label: i18n.ts._feathermiss.openaiCompatible,
	caption: i18n.ts._feathermiss.openaiCompatibleDescription,
}, {
	value: 'openai-responses' as const,
	label: i18n.ts._feathermiss.openaiResponses,
	caption: i18n.ts._feathermiss.openaiResponsesDescription,
}]);

const headerActions = computed(() => []);
const headerTabs = computed(() => []);

function numberLimit(value: unknown, fallback: number): number {
	return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

async function saveDeployment(): Promise<void> {
	const saved = await os.apiWithDialog('feathermiss/admin/config/set', {
		enabled: config.enabled,
		aiEnabled: config.aiEnabled,
		aiKillSwitch: config.aiKillSwitch,
		backgroundTranslationEnabled: config.backgroundTranslationEnabled,
		permittedContentScope: config.permittedContentScope,
		retentionDays: config.retentionDays,
		maxRequestCharacters: config.maxRequestCharacters,
		rateLimitPerMinute: config.rateLimitPerMinute,
	});
	Object.assign(config, { ...saved, permittedContentScope: saved.permittedContentScope as ContentScope });
	os.toast(i18n.ts._feathermiss.settingsSaved);
}

async function saveProvider(): Promise<void> {
	const saved = await os.apiWithDialog('feathermiss/admin/provider/set', {
		providerType: provider.providerType,
		endpoint: provider.endpoint || null,
		model: provider.model || null,
		...(provider.apiKey !== '' ? { apiKey: provider.apiKey } : {}),
		enabled: provider.enabled,
		limits: provider.limits,
	});
	provider.hasCredentials = saved.hasCredentials;
	provider.apiKey = '';
	os.toast(i18n.ts._feathermiss.settingsSaved);
}

async function purgeTranslations(): Promise<void> {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: i18n.ts._feathermiss.purgeConfirm,
	});
	if (canceled) return;
	const result = await os.apiWithDialog('feathermiss/admin/purge', {});
	os.toast(i18n.tsx._feathermiss.purgedTranslations({ n: result.deleted }));
}

definePage(() => ({
	title: i18n.ts._feathermiss.aiAdministration,
	icon: 'ti ti-sparkles',
}));
</script>

<style lang="scss" module>
.twoColumns {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 16px;

	@media (max-width: 500px) {
		grid-template-columns: 1fr;
	}
}
</style>
