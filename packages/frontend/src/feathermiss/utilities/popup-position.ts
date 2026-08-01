/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { isFeatherMissEnabled } from '@/feathermiss/config.js';

type PopupPositionProps = {
	anchorElement?: HTMLElement | null;
	innerMargin: number;
	direction: 'top' | 'bottom' | 'left' | 'right';
	align: 'top' | 'bottom' | 'left' | 'right' | 'center';
	alignOffset?: number;
	x?: number;
	y?: number;
	strategy?: 'absolute' | 'fixed';
};

export function calculateFeatherMissPopupPosition(el: HTMLElement, props: PopupPositionProps): { top: number; left: number; transformOrigin: string; } {
	const width = el.offsetWidth;
	const height = el.offsetHeight;
	const viewport = window.visualViewport;
	const strategy = props.strategy ?? 'absolute';
	const documentLeft = viewport?.pageLeft ?? window.scrollX;
	const documentTop = viewport?.pageTop ?? window.scrollY;
	const viewportLeft = strategy === 'fixed' ? (viewport?.offsetLeft ?? 0) : documentLeft;
	const viewportTop = strategy === 'fixed' ? (viewport?.offsetTop ?? 0) : documentTop;
	const viewportWidth = viewport?.width ?? window.innerWidth;
	const viewportHeight = viewport?.height ?? window.innerHeight;
	const viewportRight = viewportLeft + viewportWidth;
	const viewportBottom = viewportTop + viewportHeight;
	const configuredEdge = Number.parseFloat(window.getComputedStyle(window.document.documentElement).getPropertyValue('--MI-floatingGap'));
	const edge = Number.isFinite(configuredEdge) ? Math.max(4, configuredEdge) : 8;
	const gap = Math.max(0, props.innerMargin);

	const rect = props.anchorElement?.getBoundingClientRect();
	const coordinateOffsetLeft = strategy === 'fixed' ? 0 : documentLeft;
	const coordinateOffsetTop = strategy === 'fixed' ? 0 : documentTop;
	const anchor = rect ? {
		left: rect.left + coordinateOffsetLeft,
		right: rect.right + coordinateOffsetLeft,
		top: rect.top + coordinateOffsetTop,
		bottom: rect.bottom + coordinateOffsetTop,
		width: rect.width,
		height: rect.height,
	} : {
		left: props.x ?? viewportLeft + viewportWidth / 2,
		right: props.x ?? viewportLeft + viewportWidth / 2,
		top: props.y ?? viewportTop + viewportHeight / 2,
		bottom: props.y ?? viewportTop + viewportHeight / 2,
		width: 0,
		height: 0,
	};

	const horizontalAlignedLeft = () => {
		if (props.align === 'left') return anchor.left + (props.alignOffset ?? 0);
		if (props.align === 'right') return anchor.right - width + (props.alignOffset ?? 0);
		return anchor.left + (anchor.width - width) / 2 + (props.alignOffset ?? 0);
	};

	const verticalAlignedTop = () => {
		if (props.align === 'top') return anchor.top + (props.alignOffset ?? 0);
		if (props.align === 'bottom') return anchor.bottom - height + (props.alignOffset ?? 0);
		return anchor.top + (anchor.height - height) / 2 + (props.alignOffset ?? 0);
	};

	const candidates = {
		top: { left: horizontalAlignedLeft(), top: anchor.top - height - gap, origin: 'center bottom' },
		bottom: { left: horizontalAlignedLeft(), top: anchor.bottom + gap, origin: 'center top' },
		left: { left: anchor.left - width - gap, top: verticalAlignedTop(), origin: 'right center' },
		right: { left: anchor.right + gap, top: verticalAlignedTop(), origin: 'left center' },
	};

	const opposite = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' } as const;
	const fits = (direction: keyof typeof candidates) => {
		const candidate = candidates[direction];
		return candidate.left >= viewportLeft + edge &&
			candidate.top >= viewportTop + edge &&
			candidate.left + width <= viewportRight - edge &&
			candidate.top + height <= viewportBottom - edge;
	};

	let direction = props.direction;
	if (!fits(direction) && fits(opposite[direction])) direction = opposite[direction];
	const candidate = candidates[direction];
	const left = Math.min(Math.max(candidate.left, viewportLeft + edge), Math.max(viewportLeft + edge, viewportRight - width - edge));
	const top = Math.min(Math.max(candidate.top, viewportTop + edge), Math.max(viewportTop + edge, viewportBottom - height - edge));

	return {
		left: Math.round(left),
		top: Math.round(top),
		transformOrigin: candidate.origin,
	};
}

/** The unmodified Misskey placement algorithm, kept as an explicit runtime port. */
export function calculateMisskeyPopupPosition(el: HTMLElement, props: PopupPositionProps): { top: number; left: number; transformOrigin: string; } {
	const width = el.offsetWidth;
	const height = el.offsetHeight;
	const isFixed = props.strategy === 'fixed';
	const scrollLeft = isFixed ? 0 : window.scrollX;
	const scrollTop = isFixed ? 0 : window.scrollY;
	const rect = props.anchorElement?.getBoundingClientRect();
	const anchorLeft = rect == null ? (props.x ?? 0) : rect.left + scrollLeft;
	const anchorTop = rect == null ? (props.y ?? 0) : rect.top + scrollTop;
	const anchorWidth = rect?.width ?? props.anchorElement?.offsetWidth ?? 0;
	const anchorHeight = rect?.height ?? props.anchorElement?.offsetHeight ?? 0;
	const centerLeft = anchorLeft + anchorWidth / 2 - width / 2;
	const centerTop = anchorTop + anchorHeight / 2 - height / 2;
	const positions = {
		top: { left: centerLeft, top: anchorTop - height - props.innerMargin, origin: 'center bottom' },
		bottom: { left: centerLeft, top: anchorTop + anchorHeight + props.innerMargin, origin: 'center top' },
		left: { left: anchorLeft - width - props.innerMargin, top: centerTop, origin: 'right center' },
		right: { left: anchorLeft + anchorWidth + props.innerMargin, top: centerTop, origin: 'left center' },
	};
	const opposite = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' } as const;
	const viewportWidth = window.innerWidth;
	const viewportHeight = window.innerHeight;
	const fits = (position: typeof positions[keyof typeof positions]) =>
		position.left >= scrollLeft && position.top >= scrollTop &&
		position.left + width <= scrollLeft + viewportWidth &&
		position.top + height <= scrollTop + viewportHeight;
	let direction = props.direction;
	if (!fits(positions[direction]) && fits(positions[opposite[direction]])) direction = opposite[direction];
	const position = positions[direction];
	return {
		left: Math.max(scrollLeft, Math.min(position.left, scrollLeft + viewportWidth - width)),
		top: Math.max(scrollTop, Math.min(position.top, scrollTop + viewportHeight - height)),
		transformOrigin: position.origin,
	};
}

export function calcPopupPosition(el: HTMLElement, props: PopupPositionProps): { top: number; left: number; transformOrigin: string; } {
	return isFeatherMissEnabled()
		? calculateFeatherMissPopupPosition(el, props)
		: calculateMisskeyPopupPosition(el, props);
}
