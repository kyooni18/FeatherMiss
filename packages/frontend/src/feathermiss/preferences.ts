/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/** The presentation preferences owned by the FeatherMiss integration layer. */
export type UiGraphicsStore = {
	enabled: boolean;
	radius: number;
	buttonRadius: number;
	buttonPillRadius: number;
	mobileDockRadius: number;
	mobileDockPaddingX: number;
	mobileDockPaddingTop: number;
	mobileDockPaddingBottom: number;
	blur: number;
	saturate: number;
	brightness: number;
	panelAlpha: number;
	popupAlpha: number;
	navAlpha: number;
	pageAlpha: number;
	borderAlpha: number;
	borderWidth: number;
	overlayOpacity: number;
	modalBlur: number;
	squircleSize: number;
	popupRadiusOffset: number;
	postFormRadiusOffset: number;
	focusWidth: number;
	focusOffset: number;
	shadowStrength: number;
	shadowYOffset: number;
	shadowRaisedStrength: number;
	shadowRaisedYOffset: number;
	spacingScale: number;
	menuItemHeight: number;
	menuMinWidth: number;
	floatingGap: number;
	drawerWidth: number;
	dialogPadding: number;
	tooltipRadius: number;
	motionScale: number;
	motionDistance: number;
};

export const FEATHERMISS_PREFERENCE_KEY = 'uiGraphics' as const;
