<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	:class="[
		surface && !asDrawer ? ['_popup', '_shadow'] : null,
		{
			[$style.root]: true,
			[$style.center]: align === 'center',
			[$style.big]: big,
			[$style.asDrawer]: asDrawer,
			[$style.insetDrawer]: asDrawer && insetDrawer,
			[$style.widthSpecified]: width != null,
		},
	]"
	@focusin.passive.stop="() => {}"
>
	<div v-if="asDrawer" :class="$style.drawerHeader">
		<div :class="$style.drawerHandle" aria-hidden="true"></div>
		<button v-if="canGoBackInDrawer" type="button" class="_button" :class="$style.drawerBack" :aria-label="i18n.ts.goBack" @click="goBackInDrawer">
			<i class="ti ti-chevron-left"></i>
		</button>
		<div v-else :class="$style.drawerHeaderSpacer" aria-hidden="true"></div>
		<div v-if="activeDrawerLabel" :class="$style.drawerTitle">{{ activeDrawerLabel }}</div>
		<button type="button" class="_button" :class="$style.drawerClose" :aria-label="i18n.ts.close" @click="close(false)">
			<i class="ti ti-x"></i>
		</button>
	</div>
	<div
		ref="itemsEl"
		v-hotkey="keymap"
		role="menu"
		tabindex="0"
		:class="$style.menu"
		:style="{
			width: (width && !asDrawer) ? `${width}px` : '',
			maxHeight: menuMaxHeight,
		}"
		@keydown.stop="onMenuKeydown"
		@contextmenu.self.prevent="() => {}"
		@mousemove.passive="onMouseMove"
		@mouseleave.passive="onMouseLeave"
	>
		<template v-for="item in (items2 ?? [])">
			<div v-if="item.type === 'divider'" role="separator" tabindex="-1" :class="$style.divider"></div>

			<div v-else-if="item.type === 'label'" role="presentation" :class="[$style.label]">
				<span>{{ item.text }}</span>
			</div>

			<span v-else-if="item.type === 'pending'" role="menuitem" tabindex="0" :class="[$style.pending, $style.item]">
				<span><MkEllipsis/></span>
			</span>

			<div v-else-if="item.type === 'component'" role="menuitem" tabindex="-1">
				<component :is="item.component" v-bind="item.props"/>
			</div>

			<MkA
				v-else-if="item.type === 'link'"
				role="menuitem"
				tabindex="0"
				:class="['_button', $style.item]"
				:to="item.to"
				@click.passive="close(true)"
				@mouseenter.passive="onItemMouseEnter"
				@mouseleave.passive="onItemMouseLeave"
			>
				<i v-if="item.icon" class="ti-fw" :class="[$style.icon, item.icon]"></i>
				<MkAvatar v-if="item.avatar" :user="item.avatar" :class="$style.avatar"/>
				<div :class="$style.item_content">
					<div :class="$style.item_content_text">
						<div :class="$style.item_content_text_title">{{ item.text }}</div>
						<div v-if="item.caption" :class="$style.item_content_text_caption">{{ item.caption }}</div>
					</div>
					<span v-if="item.indicate" :class="$style.indicator" class="_blink"><i class="_indicatorCircle"></i></span>
				</div>
			</MkA>

			<a
				v-else-if="item.type === 'a'"
				role="menuitem"
				tabindex="0"
				:class="['_button', $style.item]"
				:href="item.href"
				:target="item.target"
				:rel="item.target === '_blank' ? 'noopener noreferrer' : undefined"
				:download="item.download"
				@click.passive="close(true)"
				@mouseenter.passive="onItemMouseEnter"
				@mouseleave.passive="onItemMouseLeave"
			>
				<i v-if="item.icon" class="ti-fw" :class="[$style.icon, item.icon]"></i>
				<div :class="$style.item_content">
					<div :class="$style.item_content_text">
						<div :class="$style.item_content_text_title">{{ item.text }}</div>
						<div v-if="item.caption" :class="$style.item_content_text_caption">{{ item.caption }}</div>
					</div>
					<span v-if="item.indicate" :class="$style.indicator" class="_blink"><i class="_indicatorCircle"></i></span>
				</div>
			</a>

			<button
				v-else-if="item.type === 'user'"
				role="menuitem"
				tabindex="0"
				:class="['_button', $style.item, { [$style.active]: item.active }]"
				@click.prevent="item.active ? close(false) : clicked(item.action, $event)"
				@mouseenter.passive="onItemMouseEnter"
				@mouseleave.passive="onItemMouseLeave"
			>
				<MkAvatar :user="item.user" :class="$style.avatar"/><MkUserName :user="item.user"/>
				<div v-if="item.indicate" :class="$style.item_content">
					<span :class="$style.indicator" class="_blink"><i class="_indicatorCircle"></i></span>
				</div>
			</button>

			<button
				v-else-if="item.type === 'switch'"
				role="menuitemcheckbox"
				tabindex="0"
				:class="['_button', $style.item]"
				:disabled="unref(item.disabled)"
				:aria-checked="unref(item.ref) ? 'true' : 'false'"
				@click.prevent="switchItem(item)"
				@mouseenter.passive="onItemMouseEnter"
				@mouseleave.passive="onItemMouseLeave"
			>
				<i v-if="item.icon" class="ti-fw" :class="[$style.icon, item.icon]"></i>
				<MkSwitchButton v-else :class="$style.switchButton" :checked="item.ref" :disabled="item.disabled" @toggle="switchItem(item)"/>
				<div :class="$style.item_content">
					<div :class="[$style.item_content_text, { [$style.switchText]: !item.icon }]">
						<div :class="$style.item_content_text_title">{{ item.text }}</div>
						<div v-if="item.caption" :class="$style.item_content_text_caption">{{ item.caption }}</div>
					</div>
					<MkSwitchButton v-if="item.icon" :class="[$style.switchButton, $style.caret]" :checked="item.ref" :disabled="item.disabled" @toggle="switchItem(item)"/>
				</div>
			</button>

			<button
				v-else-if="item.type === 'radio'"
				role="menuitem"
				tabindex="0"
				:class="['_button', $style.item, $style.parent, { [$style.active]: childShowingItem === item }]"
				:disabled="unref(item.disabled)"
				aria-haspopup="menu"
				:aria-expanded="childShowingItem === item ? 'true' : 'false'"
				@mouseenter.prevent="preferClick ? null : showRadioOptions(item, $event)"
				@keydown.enter.prevent="showRadioOptions(item, $event)"
				@keydown.right.prevent="showRadioOptions(item, $event)"
				@keydown.space.prevent="showRadioOptions(item, $event)"
				@mousemove="parentMouseMove"
				@click.prevent="!preferClick ? null : showRadioOptions(item, $event)"
			>
				<i v-if="item.icon" class="ti-fw" :class="[$style.icon, item.icon]" style="pointer-events: none;"></i>
				<div :class="$style.item_content">
					<div :class="$style.item_content_text" style="pointer-events: none;">
						<div :class="$style.item_content_text_title">{{ item.text }}</div>
						<div v-if="item.caption" :class="$style.item_content_text_caption">{{ item.caption }}</div>
					</div>
					<span :class="$style.caret" style="pointer-events: none;"><i class="ti ti-chevron-right ti-fw"></i></span>
				</div>
			</button>

			<button
				v-else-if="item.type === 'radioOption'"
				role="menuitemradio"
				tabindex="0"
				:class="['_button', $style.item, $style.radio, { [$style.active]: unref(item.active) }]"
				:aria-checked="unref(item.active) ? 'true' : 'false'"
				@click.prevent="unref(item.active) ? null : clicked(item.action, $event, false)"
				@mouseenter.passive="onItemMouseEnter"
				@mouseleave.passive="onItemMouseLeave"
			>
				<div :class="$style.icon">
					<span :class="[$style.radioIcon, { [$style.radioChecked]: unref(item.active) }]"></span>
				</div>
				<div :class="$style.item_content">
					<div :class="$style.item_content_text">
						<div :class="$style.item_content_text_title">{{ item.text }}</div>
						<div v-if="item.caption" :class="$style.item_content_text_caption">{{ item.caption }}</div>
					</div>
				</div>
			</button>

			<button
				v-else-if="item.type === 'parent'"
				role="menuitem"
				tabindex="0"
				:class="['_button', $style.item, $style.parent, { [$style.active]: childShowingItem === item }]"
				aria-haspopup="menu"
				:aria-expanded="childShowingItem === item ? 'true' : 'false'"
				@mouseenter.prevent="preferClick ? null : showChildren(item, $event)"
				@keydown.enter.prevent="showChildren(item, $event)"
				@keydown.right.prevent="showChildren(item, $event)"
				@keydown.space.prevent="showChildren(item, $event)"
				@mousemove="parentMouseMove"
				@click.prevent="!preferClick ? null : showChildren(item, $event)"
			>
				<i v-if="item.icon" class="ti-fw" :class="[$style.icon, item.icon]" style="pointer-events: none;"></i>
				<div :class="$style.item_content">
					<div :class="$style.item_content_text" style="pointer-events: none;">
						<div :class="$style.item_content_text_title">{{ item.text }}</div>
						<div v-if="item.caption" :class="$style.item_content_text_caption">{{ item.caption }}</div>
					</div>
					<span :class="$style.caret" style="pointer-events: none;"><i class="ti ti-chevron-right ti-fw"></i></span>
				</div>
			</button>

			<button
				v-else
				role="menuitem"
				tabindex="0"
				:class="['_button', $style.item, { [$style.danger]: item.danger, [$style.active]: unref(item.active) }]"
				@click.prevent="unref(item.active) ? close(false) : clicked(item.action, $event)"
				@mouseenter.passive="onItemMouseEnter"
				@mouseleave.passive="onItemMouseLeave"
			>
				<i v-if="item.icon" class="ti-fw" :class="[$style.icon, item.icon]"></i>
				<MkAvatar v-if="item.avatar" :user="item.avatar" :class="$style.avatar"/>
				<div :class="$style.item_content">
					<div :class="$style.item_content_text">
						<div :class="$style.item_content_text_title">{{ item.text }}</div>
						<div v-if="item.caption" :class="$style.item_content_text_caption">{{ item.caption }}</div>
					</div>
					<span v-if="item.indicate" :class="$style.indicator" class="_blink"><i class="_indicatorCircle"></i></span>
				</div>
			</button>
		</template>

		<span v-if="items2 == null || items2.length === 0" tabindex="-1" :class="[$style.none, $style.item]">
			<span>{{ i18n.ts.none }}</span>
		</span>

		<div
			:class="[$style.guard, { [$style.showGuard]: debugShowPredictionCone }]"
			:style="{ clipPath: guardPolygon, top: guard.top + 'px' }"
			@mousemove="guardMouseMove"
		></div>
	</div>
	<XChild
		v-if="childMenu" :key="childMenuKey"
		ref="child"
		:items="childMenu"
		:anchorElement="childTarget!"
		:rootElement="itemsEl!"
		:debugDisablePredictionCone="props.debugDisablePredictionCone"
		:debugShowPredictionCone="props.debugShowPredictionCone"
		@actioned="childActioned"
		@closed="closeChild(true)"
	/>
</div>
</template>

<script lang="ts">
import { computed, defineAsyncComponent, inject, nextTick, onBeforeUnmount, onMounted, ref, useTemplateRef, unref, watch, shallowRef, reactive, isRef } from 'vue';
import type { MenuItem, InnerMenuItem, MenuPending, MenuAction, MenuSwitch, MenuRadio, MenuRadioOption, MenuParent } from '@/types/menu.js';
import type { Keymap } from '@/utility/hotkey.js';
import MkSwitchButton from '@/components/MkSwitch.button.vue';
import { i18n } from '@/i18n.js';
import { isTouchUsing } from '@/utility/touch.js';
import { isFocusable } from '@/utility/focus.js';
import { getNodeOrNull } from '@/utility/get-dom-node-or-null.js';

const childrenCache = new WeakMap<MenuParent, MenuItem[]>();
</script>

<script lang="ts" setup>
const XChild = defineAsyncComponent(() => import('./MkMenu.child.vue'));

const props = withDefaults(defineProps<{
	items: MenuItem[];
	asDrawer?: boolean;
	align?: 'center' | string;
	width?: number;
	maxHeight?: number;
	drawerLabel?: string;
	insetDrawer?: boolean;
	surface?: boolean;
	debugDisablePredictionCone?: boolean;
	debugShowPredictionCone?: boolean;
}>(), {
	asDrawer: false,
	insetDrawer: false,
	surface: true,
});

const emit = defineEmits<{
	(ev: 'close', actioned?: boolean): void;
}>();

const big = isTouchUsing;

const isNestingMenu = inject<boolean>('isNestingMenu', false);

const itemsEl = useTemplateRef('itemsEl');

const items2 = ref<InnerMenuItem[]>();

const child = useTemplateRef('child');
let focusChildWhenReady = false;

const keymap = {
	'up|k|shift+tab': {
		allowRepeat: true,
		callback: () => focusUp(),
	},
	'down|j|tab': {
		allowRepeat: true,
		callback: () => focusDown(),
	},
	'esc': {
		allowRepeat: true,
		callback: () => close(false),
	},
	'left|h': {
		allowRepeat: true,
		callback: () => {
			if (props.asDrawer && canGoBackInDrawer.value) {
				goBackInDrawer();
			} else if (isNestingMenu) {
				close(false);
			}
		},
	},
	'home': {
		allowRepeat: true,
		callback: () => focusFirst(),
	},
	'end': {
		allowRepeat: true,
		callback: () => focusLast(),
	},
} as const satisfies Keymap;

const childShowingItem = ref<MenuItem | null>();

let preferClick = isTouchUsing || props.asDrawer;

const menuMaxHeight = computed(() => {
	if (props.asDrawer) {
		return props.maxHeight != null
			? `${Math.max(120, Math.floor(props.maxHeight - 58))}px`
			: 'calc(78dvh - 58px)';
	}
	return props.maxHeight != null
		? `min(${props.maxHeight}px, calc(100dvh - var(--MI-floatingGapDouble)))`
		: 'calc(100dvh - var(--MI-floatingGapDouble))';
});

type DrawerLevel = {
	items: MenuItem[];
	label?: string;
};

const drawerHistory = shallowRef<DrawerLevel[]>([]);
const currentDrawerItems = shallowRef<MenuItem[]>(props.items);
const activeDrawerLabel = ref(props.drawerLabel);
const canGoBackInDrawer = computed(() => drawerHistory.value.length > 0);
let itemsLoadVersion = 0;

function setVisibleItems(source: MenuItem[]) {
	const version = ++itemsLoadVersion;
	const items = [...source].filter(item => item !== undefined) as (NonNullable<MenuItem> | MenuPending)[];

	for (let i = 0; i < items.length; i++) {
		const item = items[i];

		if ('then' in item) { // if item is Promise
			items[i] = { type: 'pending' };
			item.then(actualItem => {
				if (version !== itemsLoadVersion || items2.value?.[i] == null) return;
				items2.value[i] = actualItem;
			});
		}
	}

	items2.value = items as InnerMenuItem[];
}

function openDrawerLevel(items: MenuItem[], label?: string) {
	drawerHistory.value.push({
		items: currentDrawerItems.value,
		label: activeDrawerLabel.value,
	});
	currentDrawerItems.value = items;
	activeDrawerLabel.value = label;
	setVisibleItems(items);
	nextTick(focusFirst);
}

function goBackInDrawer() {
	const previous = drawerHistory.value.pop();
	if (previous == null) return;
	currentDrawerItems.value = previous.items;
	activeDrawerLabel.value = previous.label;
	setVisibleItems(previous.items);
	nextTick(focusFirst);
}

watch(() => props.items, items => {
	drawerHistory.value = [];
	currentDrawerItems.value = items;
	activeDrawerLabel.value = props.drawerLabel;
	setVisibleItems(items);
}, { immediate: true });

watch(() => props.drawerLabel, label => {
	if (drawerHistory.value.length === 0) activeDrawerLabel.value = label;
});

const childMenu = ref<MenuItem[] | null>();
const childMenuKey = ref(0);
const childTarget = shallowRef<HTMLElement>();

function closeChild(restoreFocus = false) {
	focusChildWhenReady = false;
	const target = childTarget.value;
	childMenu.value = null;
	childShowingItem.value = null;
	if (restoreFocus && target?.isConnected) nextTick(() => target.focus({ preventScroll: true }));
}

function focusChildFromKeyboard(ev: MouseEvent | PointerEvent | KeyboardEvent) {
	if (!(ev instanceof KeyboardEvent)) return;
	focusChildWhenReady = true;
	nextTick(() => {
		if (child.value == null) return;
		child.value.focusFirst();
		focusChildWhenReady = false;
	});
}

watch(child, instance => {
	if (instance == null || !focusChildWhenReady) return;
	nextTick(() => {
		instance.focusFirst();
		focusChildWhenReady = false;
	});
});

function childActioned() {
	closeChild();
	close(true);
}

let childCloseTimer: null | number = null;

function onItemMouseEnter() {
	childCloseTimer = window.setTimeout(() => {
		closeChild();
	}, 300);
}

function onItemMouseLeave() {
	if (childCloseTimer) window.clearTimeout(childCloseTimer);
}

async function showRadioOptions(item: MenuRadio, ev: MouseEvent | PointerEvent | KeyboardEvent) {
	const children: MenuItem[] = item.options.map<MenuRadioOption>(def => {
		return {
			type: 'radioOption',
			text: def.label,
			action: () => {
				if (isRef(item.ref)) {
					item.ref.value = def.value;
				} else {
					// @ts-expect-error リアクティビティは保たれる
					item.ref = def.value;
				}
			},
			active: computed(() => {
				if (isRef(item.ref)) {
					return item.ref.value === def.value;
				} else {
					return item.ref === def.value;
				}
			}),
		};
	});

	if (props.asDrawer) {
		openDrawerLevel(children, unref(item.text));
	} else {
		childTarget.value = (ev.currentTarget ?? ev.target) as HTMLElement;
		childMenu.value = children;
		childMenuKey.value++;
		childShowingItem.value = item;
		focusChildFromKeyboard(ev);
	}
}

async function showChildren(item: MenuParent, ev: MouseEvent | PointerEvent | KeyboardEvent) {
	ev.stopPropagation();

	const children: MenuItem[] = await (async () => {
		if (childrenCache.has(item)) {
			return childrenCache.get(item)!;
		} else {
			if (typeof item.children === 'function') {
				return Promise.resolve(item.children());
			} else {
				return item.children;
			}
		}
	})();

	childrenCache.set(item, children);

	if (props.asDrawer) {
		openDrawerLevel(children, unref(item.text));
	} else {
		childTarget.value = (ev.currentTarget ?? ev.target) as HTMLElement;
		// これでもリアクティビティは保たれる
		childMenu.value = children;
		childMenuKey.value++;
		childShowingItem.value = item;
		focusChildFromKeyboard(ev);
	}
}

function clicked(fn: MenuAction, ev: PointerEvent, doClose = true) {
	fn(ev);

	if (!doClose) return;
	close(true);
}

function close(actioned = false) {
	disposeHandlers();
	nextTick(() => {
		closeChild();
		emit('close', actioned);
	});
}

function switchItem(item: MenuSwitch) {
	if (item.disabled !== undefined && (typeof item.disabled === 'boolean' ? item.disabled : item.disabled.value)) return;
	if (isRef(item.ref)) {
		item.ref.value = !item.ref.value;
	} else {
		// @ts-expect-error リアクティビティは保たれる
		item.ref = !item.ref;
	}
}

function focusableMenuItems(): HTMLElement[] {
	if (itemsEl.value == null) return [];
	return Array.from(itemsEl.value.children).filter(isFocusable) as HTMLElement[];
}

function focusFirst() {
	if (disposed) return;
	(focusableMenuItems()[0] ?? itemsEl.value)?.focus({ preventScroll: true });
}

function focusLast() {
	if (disposed) return;
	const elements = focusableMenuItems();
	(elements[elements.length - 1] ?? itemsEl.value)?.focus({ preventScroll: true });
}

let typeahead = '';
let typeaheadTimer: number | null = null;

function onMenuKeydown(ev: KeyboardEvent) {
	if (ev.ctrlKey || ev.metaKey || ev.altKey || ev.key.length !== 1 || ev.key.trim() === '') return;
	const elements = focusableMenuItems();
	if (elements.length === 0) return;

	if (typeaheadTimer != null) window.clearTimeout(typeaheadTimer);
	const key = ev.key.toLocaleLowerCase();
	typeahead = typeahead === key ? key : typeahead + key;
	typeaheadTimer = window.setTimeout(() => {
		typeahead = '';
		typeaheadTimer = null;
	}, 650);

	const activeIndex = elements.indexOf(window.document.activeElement as HTMLElement);
	const ordered = [...elements.slice(activeIndex + 1), ...elements.slice(0, activeIndex + 1)];
	const match = ordered.find(element => (element.textContent ?? '').trim().toLocaleLowerCase().startsWith(typeahead));
	if (match != null) {
		ev.preventDefault();
		match.focus({ preventScroll: true });
	}
}

function focusUp() {
	if (disposed) return;
	if (!itemsEl.value?.contains(window.document.activeElement)) return;

	const focusableElements = focusableMenuItems();
	const activeIndex = focusableElements.findIndex(el => el === window.document.activeElement);
	const targetIndex = (activeIndex !== -1 && activeIndex !== 0) ? (activeIndex - 1) : (focusableElements.length - 1);
	const targetElement = focusableElements.at(targetIndex) ?? itemsEl.value;

	targetElement.focus();
}

function focusDown() {
	if (disposed) return;
	if (!itemsEl.value?.contains(window.document.activeElement)) return;

	const focusableElements = focusableMenuItems();
	const activeIndex = focusableElements.findIndex(el => el === window.document.activeElement);
	const targetIndex = (activeIndex !== -1 && activeIndex !== (focusableElements.length - 1)) ? (activeIndex + 1) : 0;
	const targetElement = focusableElements.at(targetIndex) ?? itemsEl.value;

	targetElement.focus();
}

const onGlobalFocusin = (ev: FocusEvent) => {
	if (disposed) return;
	if (itemsEl.value?.parentElement?.contains(getNodeOrNull(ev.target))) return;
	nextTick(() => {
		if (itemsEl.value != null && isFocusable(itemsEl.value)) {
			itemsEl.value.focus({ preventScroll: true });
			nextTick(() => focusDown());
		}
	});
};

const onGlobalMousedown = (ev: MouseEvent) => {
	if (disposed) return;
	if (childTarget.value?.contains(getNodeOrNull(ev.target))) return;
	if (child.value?.checkHit(ev)) return;
	closeChild();
};

const setupHandlers = () => {
	if (!isNestingMenu) {
		window.document.addEventListener('focusin', onGlobalFocusin, { passive: true });
	}
	window.document.addEventListener('mousedown', onGlobalMousedown, { passive: true });
};

let disposed = false;

const disposeHandlers = () => {
	disposed = true;
	if (!isNestingMenu) {
		window.document.removeEventListener('focusin', onGlobalFocusin);
	}
	window.document.removeEventListener('mousedown', onGlobalMousedown);
};

onMounted(() => {
	setupHandlers();

	if (!isNestingMenu) {
		nextTick(() => itemsEl.value?.focus({ preventScroll: true }));
	}
});

onBeforeUnmount(() => {
	if (typeaheadTimer != null) window.clearTimeout(typeaheadTimer);
	disposeHandlers();
});

defineExpose({
	focusFirst,
});
const guard = reactive({
	enabled: false,
	top: 0,
	cursorSideX: 0,
	cursorSideY: 0,
	childSideTopY: 0,
	childSideBottomY: 0,
	direction: 'toRight',
});

const guardPolygon = computed(() =>
	guard.enabled
		? guard.direction === 'toRight'
			? `polygon(${guard.cursorSideX}px ${guard.cursorSideY}px, 101% ${guard.childSideTopY}px, 101% ${guard.childSideBottomY}px)` // ぴったり端に100%で覆ってもなぜか端でカーソルのイベントが後ろに貫通するので1%だけ伸ばす
			: `polygon(0% ${guard.childSideTopY}px, 0% ${guard.childSideBottomY}px, ${guard.cursorSideX}px ${guard.cursorSideY}px)`
		: 'polygon(0 0, 0 0, 0 0)',
);

function parentMouseMove(ev: MouseEvent) {
	if (props.debugDisablePredictionCone) return;
	if (isTouchUsing) return;
	if (child.value == null || child.value.rootElement == null) return;

	ev.stopPropagation();

	const itemBounding = (ev.currentTarget as HTMLElement).getBoundingClientRect();
	const rootBounding = itemsEl.value!.getBoundingClientRect();
	const childBounding = child.value.rootElement.getBoundingClientRect();
	const isChildRight = childBounding.left > rootBounding.left;

	const CURSOR_SIDE_X_PADDING = 3; // (px)
	const CHILD_SIDE_Y_PADDING_BASE = 70; // (px)
	const CHILD_SIDE_Y_PADDING_EXTEND = 30; // (px)
	const SCALE_FACTOR_COMPUTE_DISTANCE = 300; // コーンの広さが最大になる距離(px)
	const localMouseX = ev.clientX - itemBounding.left;
	const localMouseY = ev.clientY - rootBounding.top;
	const scaleFactor = isChildRight ? Math.min((itemBounding.width - localMouseX), SCALE_FACTOR_COMPUTE_DISTANCE) / SCALE_FACTOR_COMPUTE_DISTANCE : Math.min(localMouseX, SCALE_FACTOR_COMPUTE_DISTANCE) / SCALE_FACTOR_COMPUTE_DISTANCE;
	const cursorSideXPadding = isChildRight ? CURSOR_SIDE_X_PADDING : -CURSOR_SIDE_X_PADDING;
	const childSideYPadding = CHILD_SIDE_Y_PADDING_BASE + (CHILD_SIDE_Y_PADDING_EXTEND * scaleFactor);

	guard.enabled = true;
	guard.top = itemsEl.value!.scrollTop;
	guard.cursorSideX = localMouseX - cursorSideXPadding;
	guard.cursorSideY = localMouseY;
	guard.childSideTopY = (childBounding.top - rootBounding.top) - childSideYPadding;
	guard.childSideBottomY = (childBounding.bottom - rootBounding.top) + childSideYPadding;
	guard.direction = isChildRight ? 'toRight' : 'toLeft';
}

function onMouseLeave() {
	guard.enabled = false;
}

function onMouseMove() {
	guard.enabled = false;
}

function guardMouseMove(ev: MouseEvent) {
	ev.stopPropagation();
}
</script>

<style lang="scss" module>
.root {
	&.center > .menu > .item { text-align: center; }
	&:not(.asDrawer):not(.widthSpecified) > .menu { max-width: min(420px, calc(100vw - var(--MI-floatingGapDouble))); }
	&.big:not(.asDrawer) > .menu { min-width: max(230px, var(--MI-menuMinWidth)); > .item { min-height: max(44px, var(--MI-menuItemHeight)); font-size: 0.95em; } }

	&.asDrawer {
		display: flex;
		flex-direction: column;
		width: min(100%, 620px);
		max-height: min(82dvh, 760px);
		margin: auto;
		overflow: hidden;

		> .menu {
			position: relative;
			padding: 4px 10px max(env(safe-area-inset-bottom, 0px), 14px);
			width: 100%;
			overflow-x: hidden;
			overflow-y: auto;
			scroll-padding-block: 8px 20px;

			> .item {
				min-height: max(48px, var(--MI-menuItemHeight));
				font-size: 1em;
				padding: 8px 16px;
				white-space: normal;
				border-radius: max(13px, var(--MI-buttonRadius));
				> .icon { margin-right: 14px; width: 24px; }
			}

			> .divider { margin: 10px 8px; }
		}

		&.insetDrawer > .menu {
			padding-bottom: 14px;
		}
	}
}

.drawerHeader {
	position: relative;
	display: grid;
	grid-template-columns: 40px minmax(0, 1fr) 40px;
	align-items: center;
	min-height: 54px;
	padding: 4px 10px 0;
	border-bottom: 1px solid var(--MI_THEME-divider);
	border-bottom-color: color-mix(in srgb, var(--MI_THEME-divider) 72%, transparent);
	flex: 0 0 auto;
}

.drawerHandle {
	position: absolute;
	top: 8px;
	left: 50%;
	width: 38px;
	height: 4px;
	border-radius: 999px;
	background: var(--MI_THEME-fg);
	opacity: 0.18;
	transform: translateX(-50%);
}

.drawerHeaderSpacer,
.drawerBack {
	grid-column: 1;
}

.drawerHeaderSpacer {
	width: 36px;
	height: 36px;
}

.drawerTitle {
	grid-column: 2;
	min-width: 0;
	padding-top: 8px;
	font-size: 0.92em;
	font-weight: 700;
	text-align: center;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.drawerBack,
.drawerClose {
	display: grid;
	place-items: center;
	width: 36px;
	height: 36px;
	margin-top: 6px;
	border-radius: 999px;
	background: var(--MI_THEME-buttonBg);
	background: color-mix(in srgb, var(--MI_THEME-fg) 7%, transparent);
	transition: background-color var(--MI-motionDurationFast) ease, transform var(--MI-motionDurationFast) ease;

	&:hover, &:focus-visible {
		background: var(--MI_THEME-buttonHoverBg);
		background: color-mix(in srgb, var(--MI_THEME-fg) 12%, transparent);
	}
	&:active { transform: scale(0.96); }
}

.drawerBack {
	justify-self: start;
}

.drawerClose {
	grid-column: 3;
	justify-self: end;
}

.menu {
	padding: var(--MI-space7) 6px;
	box-sizing: border-box;
	max-width: calc(100vw - var(--MI-floatingGapDouble));
	min-width: var(--MI-menuMinWidth);
	overflow: auto;
	overscroll-behavior: contain;
	scrollbar-gutter: stable;
	&:focus-visible { outline: none; }
}

.item {
	--menuHoverFg: var(--MI_THEME-accent);
	--menuHoverBg: var(--MI_THEME-accentedBg);
	--menuActiveFg: var(--MI_THEME-accent);
	--menuActiveBg: var(--MI_THEME-accentedBg);
	display: flex;
	align-items: center;
	position: relative;
	isolation: isolate;
	min-height: var(--MI-menuItemHeight);
	padding: 5px 14px;
	width: 100%;
	box-sizing: border-box;
	white-space: nowrap;
	font-size: 0.9em;
	line-height: 20px;
	text-align: left;
	overflow: hidden;
	text-overflow: ellipsis;
	text-decoration: none !important;
	color: var(--menuFg, var(--MI_THEME-fg));
	border-radius: var(--MI-buttonRadius);
	transition: color var(--MI-motionDurationFast) ease, transform var(--MI-motionDurationFast) ease;

	&::before {
		content: "";
		position: absolute;
		z-index: -1;
		inset: 0;
		border-radius: inherit;
		transition: background-color var(--MI-motionDurationFast) ease, opacity var(--MI-motionDurationFast) ease;
	}

	&:focus-visible {
		outline: none;
		&:not(:hover):not(:active)::before { outline: var(--MI_THEME-focus) solid var(--MI-focusOutlineWidth); outline-offset: -1px; }
	}

	&:not(:disabled) {
		&:hover,
		&:focus-visible:active,
		&:focus-visible.active {
			color: var(--menuHoverFg, var(--MI_THEME-accent));
			position: relative;
			z-index: 10; // guardより上にする

			&::before {
				background-color: var(--menuHoverBg, var(--MI_THEME-accentedBg));
			}
		}

		&:not(:focus-visible):active,
		&:not(:focus-visible).active {
			color: var(--menuActiveFg, var(--MI_THEME-fgOnAccent));

			&::before {
				background-color: var(--menuActiveBg, var(--MI_THEME-accent));
			}
		}
	}

	&:disabled { cursor: not-allowed; opacity: 0.52; }
	&.danger { --menuFg: var(--MI_THEME-error); --menuHoverFg: #fff; --menuHoverBg: var(--MI_THEME-error); --menuActiveFg: #fff; --menuActiveBg: var(--MI_THEME-error); }
	&.radio, &.parent { --menuActiveFg: var(--MI_THEME-accent); --menuActiveBg: var(--MI_THEME-accentedBg); }
	&.pending, &.none { pointer-events: none; opacity: 0.7; }
}

@supports (color: color-mix(in srgb, white 50%, black)) {
	.item {
		--menuHoverFg: color-mix(in srgb, var(--MI_THEME-accent) 84%, var(--MI_THEME-fg) 16%);
		--menuHoverBg: color-mix(in srgb, var(--MI_THEME-accent) 12%, transparent);
		--menuActiveFg: color-mix(in srgb, var(--MI_THEME-accent) 90%, var(--MI_THEME-fg) 10%);
		--menuActiveBg: color-mix(in srgb, var(--MI_THEME-accent) 16%, transparent);
	}
}

.item_content { width: 100%; min-width: 0; display: flex; align-items: center; justify-content: space-between; gap: 10px; text-overflow: ellipsis; }
.item_content_text { min-width: 0; max-width: calc(100vw - 4rem); }
.item_content_text_title { text-overflow: ellipsis; overflow: hidden; }
.item_content_text_caption { text-wrap: pretty; white-space: normal; font-size: 85%; line-height: 1.35; opacity: 0.68; }
.switchButton { margin-left: 0; margin-right: 2px; align-self: center; --height: 1.3em; }
.switchText { margin-left: 8px; overflow: hidden; text-overflow: ellipsis; }
.icon { flex: 0 0 auto; margin-right: 9px; line-height: 1; }
.caret { margin-left: auto; opacity: 0.65; }
.avatar { flex: 0 0 auto; margin-right: 7px; width: 22px; height: 22px; }
.indicator { display: flex; align-items: center; color: var(--MI_THEME-indicator); font-size: 12px; }
.label { position: relative; padding: 8px 14px 5px; box-sizing: border-box; white-space: nowrap; font-size: 0.7em; font-weight: 700; text-align: left; overflow: hidden; text-overflow: ellipsis; opacity: 0.62; pointer-events: none; }
.divider { margin: 7px 5px; border-top: solid 0.5px var(--MI_THEME-divider); }

.radioIcon {
	display: inline-block;
	position: relative;
	width: 1em;
	height: 1em;
	vertical-align: -0.125em;
	border-radius: 50%;
	border: solid 2px var(--MI_THEME-divider);
	background-color: var(--MI_THEME-panel);
	&.radioChecked { border-color: var(--MI_THEME-accent); &::after { content: ""; display: block; position: absolute; inset: 25%; border-radius: 50%; background-color: var(--MI_THEME-accent); } }
}

@media (max-width: 500px) {
	.switchButton { margin-right: 4px; --height: 1.45em; }
	.root.asDrawer { max-height: min(86dvh, 720px); }
	.root.asDrawer > .menu { padding-inline: 8px; }
	.drawerHeader { padding-inline: 8px; }
}

.guard {
	position: absolute;
	left: 0;
	width: 100%;
	height: 100%;
	cursor: pointer;

	&.showGuard {
		background: #0f04;

		&:hover {
			background: #f004;
		}
	}
}
</style>
