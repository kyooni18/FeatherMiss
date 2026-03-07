<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<button
	v-if="!link"
	ref="el" class="_button"
	:class="[$style.root, { [$style.inline]: inline, [$style.primary]: primary, [$style.gradate]: gradate, [$style.danger]: danger, [$style.rounded]: rounded, [$style.full]: full, [$style.small]: small, [$style.large]: large, [$style.transparent]: transparent, [$style.asLike]: asLike, [$style.iconOnly]: iconOnly, [$style.wait]: wait, [$style.active]: active }]"
	:type="type"
	:name="name"
	:value="value"
	:disabled="disabled || wait"
	@click="emit('click', $event)"
	@mousedown="onMousedown"
>
	<div ref="ripples" :class="$style.ripples" :data-children-class="$style.ripple"></div>
	<div :class="$style.content">
		<slot></slot>
	</div>
</button>
<MkA
	v-else class="_button"
	:class="[$style.root, { [$style.inline]: inline, [$style.primary]: primary, [$style.gradate]: gradate, [$style.danger]: danger, [$style.rounded]: rounded, [$style.full]: full, [$style.small]: small, [$style.large]: large, [$style.transparent]: transparent, [$style.asLike]: asLike, [$style.iconOnly]: iconOnly, [$style.wait]: wait, [$style.active]: active }]"
	:to="to ?? '#'"
	:behavior="linkBehavior"
	@mousedown="onMousedown"
>
	<div ref="ripples" :class="$style.ripples" :data-children-class="$style.ripple"></div>
	<div :class="$style.content">
		<slot></slot>
	</div>
</MkA>
</template>

<script lang="ts" setup>
import { nextTick, onMounted, useTemplateRef } from 'vue';
import type { MkABehavior } from '@/components/global/MkA.vue';

const props = defineProps<{
	type?: 'button' | 'submit' | 'reset';
	primary?: boolean;
	gradate?: boolean;
	rounded?: boolean;
	inline?: boolean;
	link?: boolean;
	to?: string;
	linkBehavior?: MkABehavior;
	autofocus?: boolean;
	wait?: boolean;
	danger?: boolean;
	full?: boolean;
	small?: boolean;
	large?: boolean;
	transparent?: boolean;
	asLike?: boolean;
	name?: string;
	value?: string;
	disabled?: boolean;
	iconOnly?: boolean;
	active?: boolean;
}>();

const emit = defineEmits<{
	(ev: 'click', payload: PointerEvent): void;
}>();

const el = useTemplateRef('el');
const ripples = useTemplateRef('ripples');

onMounted(() => {
	if (props.autofocus) {
		nextTick(() => {
			el.value!.focus();
		});
	}
});

function distance(p: { x: number; y: number }, q: { x: number; y: number }): number {
	return Math.hypot(p.x - q.x, p.y - q.y);
}

function calcCircleScale(boxW: number, boxH: number, circleCenterX: number, circleCenterY: number): number {
	const origin = { x: circleCenterX, y: circleCenterY };
	const dist1 = distance({ x: 0, y: 0 }, origin);
	const dist2 = distance({ x: boxW, y: 0 }, origin);
	const dist3 = distance({ x: 0, y: boxH }, origin);
	const dist4 = distance({ x: boxW, y: boxH }, origin);
	return Math.max(dist1, dist2, dist3, dist4) * 2;
}

function onMousedown(evt: MouseEvent): void {
	const target = evt.target! as HTMLElement;
	const rect = target.getBoundingClientRect();

	const ripple = window.document.createElement('div');
	ripple.classList.add(ripples.value!.dataset.childrenClass!);
	ripple.style.top = (evt.clientY - rect.top - 1).toString() + 'px';
	ripple.style.left = (evt.clientX - rect.left - 1).toString() + 'px';

	ripples.value!.appendChild(ripple);

	const circleCenterX = evt.clientX - rect.left;
	const circleCenterY = evt.clientY - rect.top;

	const scale = calcCircleScale(target.clientWidth, target.clientHeight, circleCenterX, circleCenterY);

	window.setTimeout(() => {
		ripple.style.transform = 'scale(' + (scale / 2) + ')';
	}, 1);
	window.setTimeout(() => {
		ripple.style.transition = 'all 1s ease';
		ripple.style.opacity = '0';
	}, 1000);
	window.setTimeout(() => {
		if (ripples.value) ripples.value.removeChild(ripple);
	}, 2000);
}
</script>

<style lang="scss" module>
.root {
	--button-padding-y: var(--MI-buttonPaddingY, 7px);
	--button-padding-x: var(--MI-buttonPaddingX, 14px);
	--button-min-height: var(--MI-buttonMinHeight, 34px);

	position: relative;
	z-index: 1; // 他コンポーネントのbox-shadowに隠されないようにするため
	display: block;
	min-width: 100px;
	width: max-content;
	padding: var(--button-padding-y) var(--button-padding-x);
	min-height: var(--button-min-height);
	text-align: center;
	font-weight: normal;
	font-size: 95%;
	box-shadow: none;
	text-decoration: none;
	background: var(--MI_THEME-buttonBg);
	border-radius: min(var(--MI-buttonRadius), calc(var(--button-min-height) / 2));
	overflow: clip;
	box-sizing: border-box;
	transition: background 0.1s ease;

	&:hover {
		text-decoration: none;
	}

	&:not(:disabled):hover {
		background: var(--MI_THEME-buttonHoverBg);
	}

	&:not(:disabled):active {
		background: var(--MI_THEME-buttonHoverBg);
	}

	&.iconOnly {
		padding: 0;
		min-width: var(--MI-buttonIconSize, 40px);
		width: var(--MI-buttonIconSize, 40px);
		min-height: var(--MI-buttonIconSize, 40px);
		height: var(--MI-buttonIconSize, 40px);
		display: inline-grid;
		place-items: center;
	}

	&.small {
		--button-padding-y: var(--MI-buttonPaddingYSmall, 6px);
		--button-padding-x: var(--MI-buttonPaddingXSmall, 12px);
		--button-min-height: var(--MI-buttonMinHeightSmall, 30px);
		font-size: 90%;
	}

	&.large {
		--button-padding-y: var(--MI-buttonPaddingYLarge, 8px);
		--button-padding-x: var(--MI-buttonPaddingXLarge, 16px);
		--button-min-height: var(--MI-buttonMinHeightLarge, 38px);
		font-size: 100%;
	}

	&.full {
		width: 100%;
	}

	&.rounded {
		border-radius: var(--MI-buttonPillRadius);
	}

	&.primary {
		font-weight: bold;
		color: var(--MI_THEME-fgOnAccent) !important;
		background: var(--MI_THEME-accent);

		&:not(:disabled):hover {
			background: hsl(from var(--MI_THEME-accent) h s calc(l + 5));
		}

		&:not(:disabled):active {
			background: hsl(from var(--MI_THEME-accent) h s calc(l + 5));
		}
	}

	&.asLike {
		background: rgba(255, 86, 125, 0.07);
		color: #ff002f;

		&:not(:disabled):hover {
			background: rgba(255, 74, 116, 0.11);
		}

		&:not(:disabled):active {
			background: rgba(224, 57, 96, 0.125);
		}

		> .ripples {
			> .ripple {
				background: rgba(255, 60, 106, 0.15);
			}
		}

		&.primary {
			background: rgb(241 97 132);

			&:not(:disabled):hover {
				background: rgb(241 92 128);
			}

			&:not(:disabled):active {
				background: rgb(241 92 128);
			}
		}
	}

	&.transparent {
		background: transparent;
	}

	&.gradate {
		font-weight: bold;
		color: var(--MI_THEME-fgOnAccent) !important;
		background: linear-gradient(90deg, var(--MI_THEME-buttonGradateA), var(--MI_THEME-buttonGradateB));

		&:not(:disabled):hover {
			background: linear-gradient(90deg, hsl(from var(--MI_THEME-buttonGradateA) h s calc(l + 5)), hsl(from var(--MI_THEME-buttonGradateB) h s calc(l + 5)));
		}

		&:not(:disabled):active {
			background: linear-gradient(90deg, hsl(from var(--MI_THEME-buttonGradateA) h s calc(l + 5)), hsl(from var(--MI_THEME-buttonGradateB) h s calc(l + 5)));
		}
	}

	&.danger {
		font-weight: bold;
		color: var(--MI_THEME-error);

		&.primary {
			color: #fff;
			background: var(--MI_THEME-error);

			&:not(:disabled):hover {
				background: hsl(from var(--MI_THEME-error) h s calc(l + 10));
			}

			&:not(:disabled):active {
				background: hsl(from var(--MI_THEME-error) h s calc(l - 10));
			}
		}
	}

	&.active {
		color: var(--MI_THEME-accent) !important;
	}

	&:disabled {
		opacity: 0.5;
	}

	&.wait {
		cursor: wait !important;
	}

	&:focus-visible {
		outline-offset: 2px;
	}

	&.inline {
		display: inline-block;
		width: auto;
		min-width: 100px;
	}

	&.primary > .ripples > .ripple {
		background: rgba(0, 0, 0, 0.15);
	}
}

.ripples {
	position: absolute;
	z-index: 0;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	border-radius: inherit;
	overflow: clip;
	pointer-events: none;
}

.ripple {
	position: absolute;
	width: 2px;
	height: 2px;
	border-radius: 100%;
	background: rgba(0, 0, 0, 0.1);
	opacity: 1;
	transform: scale(1);
	transition: all 0.5s cubic-bezier(0,.5,0,1);
}

.content {
	position: relative;
	z-index: 1;
	pointer-events: none;
}
</style>
