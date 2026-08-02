/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test, vi } from 'vitest';
import { OpenAICompatibleTranslationProvider, OpenAIResponsesTranslationProvider, ResilientTranslationProvider, TranslationProviderError, createConfiguredTranslationProvider, createTranslationProviderFromConfig } from './providers.js';
import type { TranslationProvider } from './types.js';

describe('FeatherMiss translation providers', () => {
	test('requires explicit AI enablement and a provider key', () => {
		expect(createConfiguredTranslationProvider({})).toBeNull();
		expect(createConfiguredTranslationProvider({ FEATHERMISS_AI_ENABLED: '1' })).toBeNull();
		expect(createConfiguredTranslationProvider({ FEATHERMISS_AI_ENABLED: '1', FEATHERMISS_AI_API_KEY: 'secret', FEATHERMISS_AI_KILL_SWITCH: '1' })).toBeNull();
	});

	test('creates a provider from database configuration without exposing credentials', () => {
		const provider = createTranslationProviderFromConfig({
			providerType: 'openai-compatible',
			endpoint: 'http://localhost:1234/v1',
			apiKey: 'secret',
			model: 'local-model',
			limits: { maxRetries: 0, maxConcurrent: 1 },
		});

		expect(provider).not.toBeNull();
		expect(provider).toMatchObject({ name: 'openai-compatible', model: 'local-model' });
	});

	test('creates a Responses API provider from database configuration', () => {
		const provider = createTranslationProviderFromConfig({
			providerType: 'openai-responses',
			endpoint: 'http://localhost:1234/v1',
			apiKey: 'secret',
			model: 'local-model',
			limits: { maxRetries: 0, maxConcurrent: 1 },
		});

		expect(provider).toMatchObject({ name: 'openai-responses', model: 'local-model' });
	});

	test('normalizes an OpenAI-compatible response', async () => {
		const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: ' Bonjour ' } }] }), { status: 200 }));
		const provider = new OpenAICompatibleTranslationProvider({ apiKey: 'test', baseUrl: 'http://localhost:1234/v1', model: 'local-model' });

		await expect(provider.translate({ text: 'Hello', targetLanguage: 'fr' })).resolves.toMatchObject({ text: 'Bonjour', provider: 'openai-compatible', model: 'local-model' });
		expect(fetchMock).toHaveBeenCalledWith('http://localhost:1234/v1/chat/completions', expect.objectContaining({ method: 'POST' }));
		fetchMock.mockRestore();
	});

	test('does not duplicate a full OpenAI-compatible endpoint', async () => {
		const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: ' Bonjour ' } }] }), { status: 200 }));
		const provider = new OpenAICompatibleTranslationProvider({ apiKey: 'test', baseUrl: 'http://localhost:1234/v1/chat/completions', model: 'local-model' });

		await provider.translate({ text: 'Hello', targetLanguage: 'fr' });
		expect(fetchMock).toHaveBeenCalledWith('http://localhost:1234/v1/chat/completions', expect.anything());
		fetchMock.mockRestore();
	});

	test('normalizes a raw Responses API response', async () => {
		const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
			output: [{
				type: 'message',
				content: [{ type: 'output_text', text: ' Bonjour ' }],
			}],
			usage: { input_tokens: 12, output_tokens: 4 },
		}), { status: 200 }));
		const provider = new OpenAIResponsesTranslationProvider({ apiKey: 'test', baseUrl: 'http://localhost:1234/v1', model: 'local-model' });

		await expect(provider.translate({ text: 'Hello', targetLanguage: 'fr' })).resolves.toMatchObject({
			text: 'Bonjour',
			provider: 'openai-responses',
			model: 'local-model',
			inputTokens: 12,
			outputTokens: 4,
		});
		expect(fetchMock).toHaveBeenCalledWith('http://localhost:1234/v1/responses', expect.objectContaining({
			method: 'POST',
			body: expect.stringContaining('"instructions"'),
		}));
		fetchMock.mockRestore();
	});

	test('does not duplicate a full Responses API endpoint', async () => {
		const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ output_text: ' Bonjour ' }), { status: 200 }));
		const provider = new OpenAIResponsesTranslationProvider({ apiKey: 'test', baseUrl: 'http://localhost:1234/v1/responses', model: 'local-model' });

		await provider.translate({ text: 'Hello', targetLanguage: 'fr' });
		expect(fetchMock).toHaveBeenCalledWith('http://localhost:1234/v1/responses', expect.objectContaining({ method: 'POST' }));
		fetchMock.mockRestore();
	});

	test('retries transient provider failures and opens the circuit after repeated failures', async () => {
		const provider: TranslationProvider = {
			name: 'fake',
			model: 'test',
			translate: vi.fn()
				.mockRejectedValueOnce(new TranslationProviderError('timeout', 'timeout', true))
				.mockResolvedValue({ sourceLang: 'en', text: 'こんにちは', provider: 'fake', model: 'test' }),
		};
		const resilient = new ResilientTranslationProvider(provider, { maxRetries: 1, maxConcurrent: 1 });

		await expect(resilient.translate({ text: 'Hello', targetLanguage: 'ja' })).resolves.toMatchObject({ text: 'こんにちは' });
		expect(provider.translate).toHaveBeenCalledTimes(2);

		const failing: TranslationProvider = {
			name: 'fake',
			model: 'test',
			translate: vi.fn().mockRejectedValue(new TranslationProviderError('provider', 'down', true)),
		};
		const circuit = new ResilientTranslationProvider(failing, { maxRetries: 0, circuitFailureThreshold: 1 });
		await expect(circuit.translate({ text: 'Hello', targetLanguage: 'ja' })).rejects.toThrow('down');
		await expect(circuit.translate({ text: 'Hello', targetLanguage: 'ja' })).rejects.toThrow('circuit is open');
	});
});
