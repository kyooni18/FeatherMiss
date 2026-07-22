<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.studio">
	<aside :class="$style.previewColumn">
		<div :class="$style.preview" aria-hidden="true">
			<div :class="$style.previewNav">
				<span :class="$style.previewDot"></span>
				<span :class="$style.previewLine"></span>
				<span :class="$style.previewLineShort"></span>
			</div>
			<div :class="$style.previewCanvas">
				<div :class="$style.previewCard">
					<div :class="$style.previewHeading"></div>
					<div :class="$style.previewText"></div>
					<div :class="$style.previewTextShort"></div>
				</div>
				<div :class="$style.previewPopup">
					<div :class="$style.previewMenuItem"><i class="ti ti-sparkles"></i><span>Floating surface</span></div>
					<div :class="$style.previewMenuItem"><i class="ti ti-adjustments"></i><span>Custom controls</span></div>
					<div :class="$style.previewMenuItem"><i class="ti ti-check"></i><span>Stable motion</span></div>
				</div>
				<div :class="$style.previewTooltip">Airy UI</div>
			</div>
		</div>

		<MkPreferenceContainer k="uiGraphics">
			<MkSwitch v-model="enabled">
				<template #label>Advanced interface styling</template>
				<template #caption>Applies immediately. This only changes frontend preferences and presentation.</template>
			</MkSwitch>
		</MkPreferenceContainer>

		<div>
			<div :class="$style.sectionLabel">Presets</div>
			<div :class="$style.presetGrid">
				<button
					v-for="preset in presets"
					:key="preset.key"
					type="button"
					:aria-pressed="activePreset === preset.key"
					class="_button"
					:class="[$style.preset, { [$style.presetActive]: activePreset === preset.key }]"
					@click="applyPreset(preset.key)"
				>
					<i :class="preset.icon"></i>
					<span :class="$style.presetText">
						<b>{{ preset.label }}</b>
						<small>{{ preset.caption }}</small>
					</span>
					<i v-if="activePreset === preset.key" class="ti ti-check" :class="$style.presetCheck"></i>
				</button>
			</div>
		</div>

		<div :class="$style.toolRow" aria-label="Interface configuration tools">
			<div :class="$style.historyButtons">
				<MkButton :disabled="!canUndo" @click="undo"><i class="ti ti-arrow-back-up"></i> Undo</MkButton>
				<MkButton :disabled="!canRedo" @click="redo"><i class="ti ti-arrow-forward-up"></i> Redo</MkButton>
			</div>
			<div :class="$style.transferButtons">
				<MkButton @click="copyConfiguration"><i class="ti ti-copy"></i> Copy</MkButton>
				<MkButton @click="pasteConfiguration"><i class="ti ti-clipboard"></i> Paste</MkButton>
				<MkButton @click="exportConfiguration"><i class="ti ti-download"></i> Export file</MkButton>
				<MkButton @click="importConfiguration"><i class="ti ti-upload"></i> Import file</MkButton>
			</div>
		</div>
	</aside>

	<section :class="$style.controls">
		<MkDisableSection :disabled="!enabled">
			<div class="_gaps_m">
				<MkFolder :defaultOpen="true">
					<template #label>Shape and spacing</template>
					<template #icon><i class="ti ti-layout-dashboard"></i></template>
					<div class="_gaps_s">
						<MkRange v-model="radius" :min="0" :max="32" :step="1" easing>
							<template #label>Surface corner radius</template><template #suffix>{{ radius }}px</template>
						</MkRange>
						<MkRange v-model="buttonRadius" :min="0" :max="32" :step="1" easing>
							<template #label>Button radius</template><template #suffix>{{ buttonRadius }}px</template>
						</MkRange>
						<MkRange v-model="spacingScale" :min="0.72" :max="1.4" :step="0.02" easing>
							<template #label>Interface breathing room</template><template #suffix>{{ spacingScale.toFixed(2) }}×</template>
						</MkRange>
						<MkRange v-model="menuItemHeight" :min="28" :max="52" :step="1" easing>
							<template #label>Menu row height</template><template #suffix>{{ menuItemHeight }}px</template>
						</MkRange>
						<MkRange v-model="menuMinWidth" :min="176" :max="320" :step="4" easing>
							<template #label>Menu minimum width</template><template #suffix>{{ menuMinWidth }}px</template>
						</MkRange>
						<MkRange v-model="floatingGap" :min="4" :max="24" :step="1" easing>
							<template #label>Floating edge gap</template><template #suffix>{{ floatingGap }}px</template>
						</MkRange>
						<MkRange v-model="drawerWidth" :min="260" :max="420" :step="4" easing>
							<template #label>Side drawer width</template><template #suffix>{{ drawerWidth }}px</template>
						</MkRange>
						<MkRange v-model="dialogPadding" :min="12" :max="56" :step="2" easing>
							<template #label>Dialog viewport padding</template><template #suffix>{{ dialogPadding }}px</template>
						</MkRange>
					</div>
				</MkFolder>

				<MkFolder>
					<template #label>Navigation and specialized geometry</template>
					<template #icon><i class="ti ti-shape"></i></template>
					<div class="_gaps_s">
						<MkRange v-model="buttonPillRadius" :min="12" :max="999" :step="1" easing>
							<template #label>Pill button radius</template><template #suffix>{{ buttonPillRadius }}px</template>
						</MkRange>
						<MkRange v-model="mobileDockRadius" :min="0" :max="48" :step="1" easing>
							<template #label>Mobile dock radius</template><template #suffix>{{ mobileDockRadius }}px</template>
						</MkRange>
						<MkRange v-model="mobileDockPaddingX" :min="0" :max="32" :step="1" easing>
							<template #label>Mobile dock horizontal inset</template><template #suffix>{{ mobileDockPaddingX }}px</template>
						</MkRange>
						<MkRange v-model="mobileDockPaddingTop" :min="0" :max="32" :step="1" easing>
							<template #label>Mobile dock top padding</template><template #suffix>{{ mobileDockPaddingTop }}px</template>
						</MkRange>
						<MkRange v-model="mobileDockPaddingBottom" :min="0" :max="40" :step="1" easing>
							<template #label>Mobile dock bottom lift</template><template #suffix>{{ mobileDockPaddingBottom }}px</template>
						</MkRange>
						<MkRange v-model="squircleSize" :min="8" :max="48" :step="1" easing>
							<template #label>Squircle size</template><template #suffix>{{ squircleSize }}px</template>
						</MkRange>
						<MkRange v-model="popupRadiusOffset" :min="0" :max="32" :step="1" easing>
							<template #label>Popup radius offset</template><template #suffix>{{ popupRadiusOffset }}px</template>
						</MkRange>
						<MkRange v-model="postFormRadiusOffset" :min="0" :max="32" :step="1" easing>
							<template #label>Post form radius offset</template><template #suffix>{{ postFormRadiusOffset }}px</template>
						</MkRange>
					</div>
				</MkFolder>

				<MkFolder>
					<template #label>Glass and layers</template>
					<template #icon><i class="ti ti-blur"></i></template>
					<div class="_gaps_s">
						<MkRange v-model="blur" :min="0" :max="30" :step="1" easing>
							<template #label>Surface blur</template><template #suffix>{{ blur }}px</template>
						</MkRange>
						<MkRange v-model="modalBlur" :min="0" :max="24" :step="1" easing>
							<template #label>Backdrop blur</template><template #suffix>{{ modalBlur }}px</template>
						</MkRange>
						<MkRange v-model="saturate" :min="50" :max="220" :step="2" easing>
							<template #label>Backdrop saturation</template><template #suffix>{{ saturate }}%</template>
						</MkRange>
						<MkRange v-model="brightness" :min="80" :max="130" :step="1" easing>
							<template #label>Backdrop brightness</template><template #suffix>{{ brightness }}%</template>
						</MkRange>
						<MkRange v-model="panelAlpha" :min="0.2" :max="1" :step="0.01" easing><template #label>Panel opacity</template></MkRange>
						<MkRange v-model="popupAlpha" :min="0.2" :max="1" :step="0.01" easing><template #label>Popup opacity</template></MkRange>
						<MkRange v-model="navAlpha" :min="0.2" :max="1" :step="0.01" easing><template #label>Navigation opacity</template></MkRange>
						<MkRange v-model="pageAlpha" :min="0.2" :max="1" :step="0.01" easing><template #label>Page opacity</template></MkRange>
						<MkRange v-model="overlayOpacity" :min="0" :max="0.8" :step="0.01" easing><template #label>Modal overlay darkness</template></MkRange>
						<MkRange v-model="borderAlpha" :min="0" :max="0.5" :step="0.01" easing><template #label>Hairline contrast</template></MkRange>
						<MkRange v-model="borderWidth" :min="0" :max="3" :step="0.1" easing>
							<template #label>Hairline width</template><template #suffix>{{ borderWidth.toFixed(1) }}px</template>
						</MkRange>
					</div>
				</MkFolder>

				<MkFolder>
					<template #label>Motion and depth</template>
					<template #icon><i class="ti ti-wand"></i></template>
					<div class="_gaps_s">
						<MkRange v-model="motionScale" :min="0.5" :max="1.8" :step="0.05" easing>
							<template #label>Motion duration</template><template #suffix>{{ motionScale.toFixed(2) }}×</template>
						</MkRange>
						<MkRange v-model="motionDistance" :min="0" :max="28" :step="1" easing>
							<template #label>Motion travel</template><template #suffix>{{ motionDistance }}px</template>
						</MkRange>
						<MkRange v-model="shadowStrength" :min="0" :max="2" :step="0.05" easing><template #label>Panel shadow</template></MkRange>
						<MkRange v-model="shadowYOffset" :min="0" :max="40" :step="1" easing>
							<template #label>Panel shadow depth</template><template #suffix>{{ shadowYOffset }}px</template>
						</MkRange>
						<MkRange v-model="shadowRaisedStrength" :min="0" :max="2" :step="0.05" easing><template #label>Floating shadow</template></MkRange>
						<MkRange v-model="shadowRaisedYOffset" :min="0" :max="70" :step="1" easing>
							<template #label>Floating shadow depth</template><template #suffix>{{ shadowRaisedYOffset }}px</template>
						</MkRange>
						<MkRange v-model="focusWidth" :min="1" :max="6" :step="1" easing>
							<template #label>Focus ring width</template><template #suffix>{{ focusWidth }}px</template>
						</MkRange>
						<MkRange v-model="focusOffset" :min="-4" :max="6" :step="1" easing>
							<template #label>Focus ring offset</template><template #suffix>{{ focusOffset }}px</template>
						</MkRange>
						<MkRange v-model="tooltipRadius" :min="4" :max="24" :step="1" easing>
							<template #label>Tooltip radius</template><template #suffix>{{ tooltipRadius }}px</template>
						</MkRange>
					</div>
				</MkFolder>

				<div class="_buttons">
					<MkButton @click="reset">Reset to Feather</MkButton>
				</div>
			</div>
		</MkDisableSection>
	</section>
</div>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import MkButton from '@/components/MkButton.vue';
import MkDisableSection from '@/components/MkDisableSection.vue';
import MkFolder from '@/components/MkFolder.vue';
import MkPreferenceContainer from '@/components/MkPreferenceContainer.vue';
import MkRange from '@/components/MkRange.vue';
import MkSwitch from '@/components/MkSwitch.vue';
import { prefer } from '@/preferences.js';
import * as os from '@/os.js';
import { copyToClipboard } from '@/utility/copy-to-clipboard.js';
import type { UiGraphicsStore } from '@/preferences/def.js';
import { cloneUiGraphicsPreset, DEFAULT_UI_GRAPHICS, findUiGraphicsPreset, normalizeUiGraphics } from '@/utility/ui-graphics.js';
import type { UiGraphicsPresetKey } from '@/utility/ui-graphics.js';

const graphics = prefer.model('uiGraphics');

const presets: ReadonlyArray<{ key: UiGraphicsPresetKey; label: string; caption: string; icon: string }> = [
	{ key: 'feather', label: 'Feather', caption: 'Balanced and calm', icon: 'ti ti-feather' },
	{ key: 'airy', label: 'Airy', caption: 'More space and softness', icon: 'ti ti-wind' },
	{ key: 'frosted', label: 'Frosted', caption: 'Stronger translucent glass', icon: 'ti ti-snowflake' },
	{ key: 'solid', label: 'Solid', caption: 'Maximum clarity and speed', icon: 'ti ti-square-filled' },
	{ key: 'compact', label: 'Compact', caption: 'Dense without feeling cramped', icon: 'ti ti-layout-grid' },
];

const activePreset = computed(() => findUiGraphicsPreset(graphics.value));

const history = ref<UiGraphicsStore[]>([normalizeUiGraphics(graphics.value)]);
const historyIndex = ref(0);
const canUndo = computed(() => historyIndex.value > 0);
const canRedo = computed(() => historyIndex.value < history.value.length - 1);
let historyTimer: number | null = null;
let applyingHistory = false;

function snapshotKey(value: UiGraphicsStore): string {
	return JSON.stringify(value);
}

function commitHistorySnapshot() {
	if (applyingHistory) return;
	const snapshot = normalizeUiGraphics(graphics.value);
	if (snapshotKey(history.value[historyIndex.value]) === snapshotKey(snapshot)) return;
	history.value = history.value.slice(0, historyIndex.value + 1);
	history.value.push(snapshot);
	if (history.value.length > 60) history.value.shift();
	historyIndex.value = history.value.length - 1;
}

watch(graphics, () => {
	if (applyingHistory) return;
	if (historyTimer != null) window.clearTimeout(historyTimer);
	historyTimer = window.setTimeout(commitHistorySnapshot, 180);
}, { deep: true });

onBeforeUnmount(() => {
	window.removeEventListener('keydown', onHistoryShortcut);
	if (historyTimer != null) {
		window.clearTimeout(historyTimer);
		commitHistorySnapshot();
	}
});

function applyHistory(index: number) {
	const snapshot = history.value[index];
	if (snapshot == null) return;
	applyingHistory = true;
	historyIndex.value = index;
	graphics.value = { ...snapshot };
	queueMicrotask(() => { applyingHistory = false; });
}

function undo() {
	if (historyTimer != null) {
		window.clearTimeout(historyTimer);
		historyTimer = null;
		commitHistorySnapshot();
	}
	if (canUndo.value) applyHistory(historyIndex.value - 1);
}

function redo() {
	if (canRedo.value) applyHistory(historyIndex.value + 1);
}

function serializeConfiguration(pretty = true): string {
	return JSON.stringify({ version: 1, uiGraphics: normalizeUiGraphics(graphics.value) }, null, pretty ? 2 : undefined);
}

function parseConfiguration(text: string): UiGraphicsStore {
	const parsed: unknown = JSON.parse(text);
	if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid configuration');
	const record = parsed as Record<string, unknown>;
	if (record.version != null && record.version !== 1) throw new Error('Unsupported configuration version');
	const candidate = record.uiGraphics != null ? record.uiGraphics : record;
	if (candidate == null || typeof candidate !== 'object' || Array.isArray(candidate)) throw new Error('Invalid configuration');
	const candidateRecord = candidate as Record<string, unknown>;
	if (!(Object.keys(DEFAULT_UI_GRAPHICS) as (keyof UiGraphicsStore)[]).some(key => key in candidateRecord)) throw new Error('No interface fields found');
	return normalizeUiGraphics(candidateRecord as Partial<UiGraphicsStore>);
}

function applyConfigurationText(text: string) {
	graphics.value = parseConfiguration(text);
	os.toast('Interface configuration applied');
}

function copyConfiguration() {
	copyToClipboard(serializeConfiguration());
}

async function pasteConfiguration() {
	try {
		let text: string | null = null;
		try {
			text = await navigator.clipboard.readText();
		} catch {
			const result = await os.inputText({
				title: 'Paste interface configuration',
				text: 'Clipboard access is unavailable. Paste the exported JSON below.',
				default: '',
			});
			if (result.canceled || result.result == null) return;
			text = result.result;
		}
		applyConfigurationText(text);
	} catch {
		await showInvalidConfigurationAlert();
	}
}

function exportConfiguration() {
	const blob = new Blob([serializeConfiguration()], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const anchor = window.document.createElement('a');
	anchor.href = url;
	anchor.download = 'feathermiss-interface.json';
	anchor.hidden = true;
	window.document.body.appendChild(anchor);
	anchor.click();
	anchor.remove();
	window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function importConfiguration() {
	const input = window.document.createElement('input');
	input.type = 'file';
	input.accept = '.json,.feathermissui,application/json';
	input.onchange = async () => {
		const file = input.files?.[0];
		if (file == null) return;
		try {
			applyConfigurationText(await file.text());
		} catch {
			await showInvalidConfigurationAlert();
		}
	};
	input.click();
}

async function showInvalidConfigurationAlert() {
	await os.alert({
		type: 'error',
		title: 'Invalid interface configuration',
		text: 'Use JSON copied or exported by Interface Studio, then try again.',
	});
}

function isTextEditingTarget(target: EventTarget | null): boolean {
	return target instanceof HTMLElement && (
		target.isContentEditable ||
		target instanceof HTMLInputElement ||
		target instanceof HTMLTextAreaElement ||
		target instanceof HTMLSelectElement
	);
}

function onHistoryShortcut(event: KeyboardEvent) {
	if (isTextEditingTarget(event.target) || event.altKey || (!event.metaKey && !event.ctrlKey)) return;
	const key = event.key.toLowerCase();
	if (key === 'y' && !event.metaKey) {
		event.preventDefault();
		redo();
		return;
	}
	if (key !== 'z') return;
	event.preventDefault();
	if (event.shiftKey) redo();
	else undo();
}

onMounted(() => window.addEventListener('keydown', onHistoryShortcut));

function field<K extends keyof UiGraphicsStore>(key: K) {
	return computed<UiGraphicsStore[K]>({
		get: () => (graphics.value[key] ?? DEFAULT_UI_GRAPHICS[key]) as UiGraphicsStore[K],
		set: value => {
			graphics.value = { ...normalizeUiGraphics(graphics.value), [key]: value };
		},
	});
}

const enabled = field('enabled');
const radius = field('radius');
const buttonRadius = field('buttonRadius');
const buttonPillRadius = field('buttonPillRadius');
const mobileDockRadius = field('mobileDockRadius');
const mobileDockPaddingX = field('mobileDockPaddingX');
const mobileDockPaddingTop = field('mobileDockPaddingTop');
const mobileDockPaddingBottom = field('mobileDockPaddingBottom');
const blur = field('blur');
const saturate = field('saturate');
const brightness = field('brightness');
const panelAlpha = field('panelAlpha');
const popupAlpha = field('popupAlpha');
const navAlpha = field('navAlpha');
const pageAlpha = field('pageAlpha');
const borderAlpha = field('borderAlpha');
const borderWidth = field('borderWidth');
const overlayOpacity = field('overlayOpacity');
const modalBlur = field('modalBlur');
const squircleSize = field('squircleSize');
const popupRadiusOffset = field('popupRadiusOffset');
const postFormRadiusOffset = field('postFormRadiusOffset');
const focusWidth = field('focusWidth');
const focusOffset = field('focusOffset');
const shadowStrength = field('shadowStrength');
const shadowYOffset = field('shadowYOffset');
const shadowRaisedStrength = field('shadowRaisedStrength');
const shadowRaisedYOffset = field('shadowRaisedYOffset');
const spacingScale = field('spacingScale');
const menuItemHeight = field('menuItemHeight');
const menuMinWidth = field('menuMinWidth');
const floatingGap = field('floatingGap');
const drawerWidth = field('drawerWidth');
const dialogPadding = field('dialogPadding');
const tooltipRadius = field('tooltipRadius');
const motionScale = field('motionScale');
const motionDistance = field('motionDistance');

function applyPreset(key: UiGraphicsPresetKey) {
	graphics.value = cloneUiGraphicsPreset(key);
}

function reset() {
	graphics.value = cloneUiGraphicsPreset('feather');
}
</script>

<style lang="scss" module>
.studio {
	display: grid;
	grid-template-columns: minmax(300px, 0.86fr) minmax(420px, 1.14fr);
	align-items: start;
	gap: clamp(18px, 3vw, 34px);
}

.previewColumn {
	position: sticky;
	top: max(18px, var(--MI-floatingGap));
	display: flex;
	flex-direction: column;
	gap: var(--MI-space18);
	min-width: 0;
	max-height: calc(100dvh - max(36px, var(--MI-floatingGapDouble)));
	padding-right: 4px;
	overflow: auto;
	overscroll-behavior: contain;
}

.controls {
	min-width: 0;
}

.preview {
	position: relative;
	display: grid;
	grid-template-columns: minmax(70px, 0.28fr) 1fr;
	min-height: 230px;
	border-radius: calc(var(--MI-radius) + 8px);
	border: var(--MI-surfaceBorderWidth) solid var(--MI-surfaceBorder);
	background: var(--MI-surfacePage, var(--MI_THEME-bg));
	box-shadow: var(--MI-surfaceShadow);
	overflow: hidden;
	isolation: isolate;
}

.previewNav {
	display: flex;
	flex-direction: column;
	gap: var(--MI-space13);
	padding: 22px 16px;
	background: var(--MI-surfaceNav, var(--MI_THEME-navBg));
	border-right: var(--MI-surfaceBorderWidth) solid var(--MI-surfaceBorder);
	-webkit-backdrop-filter: var(--MI-surfaceFilter);
	backdrop-filter: var(--MI-surfaceFilter);
}

.previewDot {
	width: 34px;
	height: 34px;
	border-radius: var(--MI-buttonPillRadius);
	background: var(--MI_THEME-accent);
}

.previewLine,
.previewLineShort,
.previewHeading,
.previewText,
.previewTextShort {
	display: block;
	height: 8px;
	border-radius: 999px;
	background: var(--MI_THEME-fg);
	opacity: 0.12;
}

.previewLineShort { width: 68%; }

.previewCanvas {
	position: relative;
	padding: var(--MI-space24);
	background: var(--MI_THEME-bg);
	background:
		radial-gradient(circle at 82% 18%, color-mix(in srgb, var(--MI_THEME-accent) 30%, transparent), transparent 34%),
		radial-gradient(circle at 22% 82%, color-mix(in srgb, var(--MI_THEME-fg) 10%, transparent), transparent 38%);

	&::before {
		content: "";
		position: absolute;
		inset: 0;
		background-image: linear-gradient(var(--MI-surfaceBorder) 1px, transparent 1px), linear-gradient(90deg, var(--MI-surfaceBorder) 1px, transparent 1px);
		background-size: 24px 24px;
		-webkit-mask-image: linear-gradient(to bottom right, rgba(0, 0, 0, 0.72), transparent 82%);
		mask-image: linear-gradient(to bottom right, rgba(0, 0, 0, 0.72), transparent 82%);
		opacity: 0.55;
		pointer-events: none;
	}
}

.previewCard {
	position: relative;
	z-index: 1;
	width: min(62%, 330px);
	padding: var(--MI-space18);
	border-radius: var(--MI-radius);
	background: var(--MI-surfacePanel, var(--MI_THEME-panel));
	border: var(--MI-surfaceBorderWidth) solid var(--MI-surfaceBorder);
	box-shadow: var(--MI-surfaceShadow);
	-webkit-backdrop-filter: var(--MI-surfaceFilter);
	backdrop-filter: var(--MI-surfaceFilter);
}

.previewHeading { width: 42%; height: 12px; opacity: 0.22; }
.previewText { width: 100%; margin-top: 18px; }
.previewTextShort { width: 72%; margin-top: 10px; }

.previewPopup {
	position: absolute;
	z-index: 3;
	right: calc(18px + var(--MI-floatingGap));
	bottom: calc(18px + var(--MI-floatingGap));
	min-width: min(210px, 54%);
	padding: 7px;
	border-radius: calc(var(--MI-radius) + var(--MI-popupRadiusOffset));
	background: var(--MI-surfacePopup, var(--MI_THEME-popup));
	border: var(--MI-surfaceBorderWidth) solid var(--MI-surfaceBorder);
	box-shadow: var(--MI-surfaceShadowRaised);
	-webkit-backdrop-filter: var(--MI-surfaceFilter);
	backdrop-filter: var(--MI-surfaceFilter);
}

.previewMenuItem {
	display: flex;
	align-items: center;
	gap: 10px;
	min-height: calc(var(--MI-menuItemHeight) - 5px);
	padding: 0 10px;
	border-radius: var(--MI-buttonRadius);
	font-size: 0.82em;

	&:first-child {
		color: var(--MI_THEME-accent);
		background: var(--MI_THEME-accentedBg);
	}
}

.previewTooltip {
	position: absolute;
	z-index: 2;
	top: 18px;
	right: 18px;
	padding: 7px 10px;
	border-radius: var(--MI-tooltipRadius);
	background: var(--MI-surfacePopup, var(--MI_THEME-popup));
	border: var(--MI-surfaceBorderWidth) solid var(--MI-surfaceBorder);
	box-shadow: var(--MI-surfaceShadow);
	font-size: 0.75em;
}

.sectionLabel {
	margin-bottom: 8px;
	font-size: 0.85em;
	font-weight: 700;
	opacity: 0.72;
}

.presetGrid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
	gap: 8px;
}

.preset {
	position: relative;
	display: flex;
	align-items: center;
	gap: 12px;
	min-height: 62px;
	padding: 11px 13px;
	text-align: left;
	border: 1px solid var(--MI_THEME-divider);
	border-radius: var(--MI-buttonRadius);
	transition: transform var(--MI-motionDurationFast), border-color var(--MI-motionDurationFast), background-color var(--MI-motionDurationFast);

	&:hover {
		transform: translateY(-1px);
		border-color: var(--MI_THEME-accent);
		background: var(--MI_THEME-accentedBg);
	}
}

.presetActive {
	border-color: var(--MI_THEME-accent);
	background: var(--MI_THEME-accentedBg);
}

.presetText {
	display: flex;
	flex-direction: column;
	gap: 2px;
	min-width: 0;

	small {
		opacity: 0.68;
	}
}

.presetCheck {
	margin-left: auto;
	color: var(--MI_THEME-accent);
}

.toolRow {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: var(--MI-space10);
	padding: var(--MI-space10);
	border: var(--MI-surfaceBorderWidth) solid var(--MI-surfaceBorder);
	border-radius: var(--MI-radius);
	background: var(--MI-surfacePanel, var(--MI_THEME-panel));
	-webkit-backdrop-filter: var(--MI-surfaceFilter);
	backdrop-filter: var(--MI-surfaceFilter);
}

.historyButtons,
.transferButtons {
	display: flex;
	gap: var(--MI-space8);
	flex-wrap: wrap;
}


@media (max-width: 900px) {
	.studio {
		grid-template-columns: 1fr;
	}

	.previewColumn {
		position: static;
		max-height: none;
		padding-right: 0;
		overflow: visible;
	}
}

@media (max-width: 700px) {
	.toolRow {
		align-items: stretch;
		flex-direction: column;
	}
}

@media (max-width: 500px) {
	.preview {
		grid-template-columns: 58px 1fr;
		min-height: 210px;
	}

	.previewNav {
		padding: 16px 11px;
	}

	.previewPopup {
		min-width: 58%;
	}
}
</style>
