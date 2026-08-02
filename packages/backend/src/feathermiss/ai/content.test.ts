/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import { prepareTranslation } from './content.js';

describe('FeatherMiss translation content preparation', () => {
	test('protects code, links, mentions, and hashtags while retaining line breaks', () => {
		const prepared = prepareTranslation('Hello\n`const x = 1` https://example.com @alice #hello', 1000);

		expect(prepared.text).toContain('⟦FEATHERMISS_0⟧');
		expect(prepared.text).toContain('⟦FEATHERMISS_3⟧');
		expect(prepared.text).toContain('\n');
		expect(prepared.restore('Bonjour\n⟦FEATHERMISS_0⟧ ⟦FEATHERMISS_1⟧ ⟦FEATHERMISS_2⟧ ⟦FEATHERMISS_3⟧')).toBe('Bonjour\n`const x = 1` https://example.com @alice #hello');
	});

	test('rejects output that drops protected content', () => {
		const prepared = prepareTranslation('Keep https://example.com', 1000);

		expect(() => prepared.restore('Keep')).toThrow('FEATHERMISS_AI_MALFORMED_OUTPUT');
	});
});
