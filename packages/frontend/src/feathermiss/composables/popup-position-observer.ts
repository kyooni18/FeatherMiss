/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/** Shared resize/scroll scheduling for FeatherMiss popup ports. */
export function createFeatherMissPopupPositionObserver(update: () => void) {
	let resizeObserver: ResizeObserver | null = null;
	let frame: number | null = null;

	const schedule = () => {
		if (frame != null) return;
		frame = window.requestAnimationFrame(() => {
			frame = null;
			update();
		});
	};

	const observe = (elements: Array<Element | null | undefined>) => {
		resizeObserver?.disconnect();
		resizeObserver = null;
		if (typeof ResizeObserver === 'undefined') return;
		const observed = elements.filter((element): element is Element => element != null);
		if (observed.length === 0) return;
		resizeObserver = new ResizeObserver(schedule);
		for (const element of observed) resizeObserver.observe(element);
	};

	const dispose = () => {
		resizeObserver?.disconnect();
		resizeObserver = null;
		if (frame != null) window.cancelAnimationFrame(frame);
		frame = null;
	};

	return { schedule, observe, dispose };
}
