/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { TranslationInput, TranslationProvider, TranslationResult } from './types.js';

export type TranslationProviderErrorCategory = 'authentication' | 'bad_request' | 'rate_limit' | 'timeout' | 'network' | 'provider' | 'malformed';

export class TranslationProviderError extends Error {
	public constructor(
		public readonly category: TranslationProviderErrorCategory,
		message: string,
		public readonly retryable: boolean,
		public readonly status?: number,
	) {
		super(message);
		this.name = 'TranslationProviderError';
	}
}

export class OpenAICompatibleTranslationProvider implements TranslationProvider {
	public readonly name = 'openai-compatible';
	public readonly model: string;

	private readonly endpoint: string;
	private readonly apiKey: string;
	private readonly timeoutMs: number;

	public constructor(options: { baseUrl?: string; apiKey: string; model?: string; timeoutMs?: number }) {
		this.endpoint = appendProviderPath(options.baseUrl ?? 'https://api.openai.com/v1', '/chat/completions');
		this.apiKey = options.apiKey;
		this.model = options.model ?? 'gpt-4o-mini';
		this.timeoutMs = options.timeoutMs ?? 30_000;
	}

	public async translate(input: TranslationInput): Promise<TranslationResult> {
		const startedAt = Date.now();
		let response: Response;
		try {
			response = await fetch(this.endpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${this.apiKey}`,
				},
				signal: AbortSignal.timeout(this.timeoutMs),
				body: JSON.stringify({
					model: this.model,
					temperature: 0,
					messages: [
						{
							role: 'system',
							content: 'Translate the user text faithfully. Return only the translation. Preserve URLs, code, mentions, hashtags, custom emoji, and line breaks. Preserve FEATHERMISS markers exactly.',
						},
						{ role: 'user', content: `Target language: ${input.targetLanguage}\n\n${input.text}` },
					],
				}),
			});
		} catch (error) {
			if (error instanceof DOMException && error.name === 'TimeoutError') {
				throw new TranslationProviderError('timeout', 'AI provider request timed out', true);
			}
			throw new TranslationProviderError('network', 'AI provider request failed', true);
		}

		if (!response.ok) {
			if (response.status === 401 || response.status === 403) throw new TranslationProviderError('authentication', 'AI provider rejected credentials', false, response.status);
			if (response.status === 408 || response.status === 429) throw new TranslationProviderError('rate_limit', 'AI provider rate limit or timeout', true, response.status);
			if (response.status >= 500) throw new TranslationProviderError('provider', 'AI provider is unavailable', true, response.status);
			throw new TranslationProviderError('bad_request', 'AI provider rejected the request', false, response.status);
		}

		let body: {
			choices?: Array<{ message?: { content?: string | null } }>;
			usage?: { prompt_tokens?: number; completion_tokens?: number };
		};
		try {
			body = await response.json() as typeof body;
		} catch {
			throw new TranslationProviderError('malformed', 'AI provider returned invalid JSON', false);
		}
		const text = body.choices?.[0]?.message?.content?.trim();
		if (text == null || text.length === 0) throw new TranslationProviderError('malformed', 'AI provider returned an empty translation', false);

		return {
			sourceLang: 'unknown',
			text,
			provider: this.name,
			model: this.model,
			latencyMs: Date.now() - startedAt,
			inputTokens: body.usage?.prompt_tokens,
			outputTokens: body.usage?.completion_tokens,
		};
	}
}

export class OpenAIResponsesTranslationProvider implements TranslationProvider {
	public readonly name = 'openai-responses';
	public readonly model: string;

	private readonly endpoint: string;
	private readonly apiKey: string;
	private readonly timeoutMs: number;

	public constructor(options: { baseUrl?: string; apiKey: string; model?: string; timeoutMs?: number }) {
		this.endpoint = appendProviderPath(options.baseUrl ?? 'https://api.openai.com/v1', '/responses');
		this.apiKey = options.apiKey;
		this.model = options.model ?? 'gpt-4o-mini';
		this.timeoutMs = options.timeoutMs ?? 30_000;
	}

	public async translate(input: TranslationInput): Promise<TranslationResult> {
		const startedAt = Date.now();
		let response: Response;
		try {
			response = await fetch(this.endpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${this.apiKey}`,
				},
				signal: AbortSignal.timeout(this.timeoutMs),
				body: JSON.stringify({
					model: this.model,
					store: false,
					instructions: 'Translate the user text faithfully. Return only the translation. Preserve URLs, code, mentions, hashtags, custom emoji, and line breaks. Preserve FEATHERMISS markers exactly.',
					input: `Target language: ${input.targetLanguage}\n\n${input.text}`,
				}),
			});
		} catch (error) {
			if (error instanceof DOMException && error.name === 'TimeoutError') {
				throw new TranslationProviderError('timeout', 'AI provider request timed out', true);
			}
			throw new TranslationProviderError('network', 'AI provider request failed', true);
		}

		if (!response.ok) {
			if (response.status === 401 || response.status === 403) throw new TranslationProviderError('authentication', 'AI provider rejected credentials', false, response.status);
			if (response.status === 408 || response.status === 429) throw new TranslationProviderError('rate_limit', 'AI provider rate limit or timeout', true, response.status);
			if (response.status >= 500) throw new TranslationProviderError('provider', 'AI provider is unavailable', true, response.status);
			throw new TranslationProviderError('bad_request', 'AI provider rejected the request', false, response.status);
		}

		let body: {
			output_text?: string;
			output?: Array<{
				type?: string;
				content?: Array<{ type?: string; text?: string | null }>;
			}>;
			usage?: { input_tokens?: number; output_tokens?: number };
		};
		try {
			body = await response.json() as typeof body;
		} catch {
			throw new TranslationProviderError('malformed', 'AI provider returned invalid JSON', false);
		}
		const text = body.output_text?.trim() || body.output
			?.filter(item => item.type === 'message')
			.flatMap(item => item.content ?? [])
			.filter(content => content.type === 'output_text' && typeof content.text === 'string')
			.map(content => content.text!.trim())
			.filter(textPart => textPart.length > 0)
			.join('\n')
			.trim();
		if (text == null || text.length === 0) throw new TranslationProviderError('malformed', 'AI provider returned an empty translation', false);

		return {
			sourceLang: 'unknown',
			text,
			provider: this.name,
			model: this.model,
			latencyMs: Date.now() - startedAt,
			inputTokens: body.usage?.input_tokens,
			outputTokens: body.usage?.output_tokens,
		};
	}
}

export class ResilientTranslationProvider implements TranslationProvider {
	public readonly name: string;
	public readonly model: string;

	private activeRequests = 0;
	private readonly waiters: Array<() => void> = [];
	private consecutiveFailures = 0;
	private circuitOpenedAt: number | null = null;

	public constructor(
		private readonly delegate: TranslationProvider,
		private readonly options: { maxConcurrent?: number; maxRetries?: number; circuitFailureThreshold?: number; circuitResetMs?: number } = {},
	) {
		this.name = delegate.name;
		this.model = delegate.model;
	}

	public async translate(input: TranslationInput): Promise<TranslationResult> {
		if (this.isCircuitOpen()) throw new TranslationProviderError('provider', 'AI provider circuit is open', true);
		await this.acquire();
		try {
			const maxRetries = this.options.maxRetries ?? 2;
			for (let attempt = 0; ; attempt++) {
				try {
					const result = await this.delegate.translate(input);
					this.consecutiveFailures = 0;
					this.circuitOpenedAt = null;
					return result;
				} catch (error) {
					const normalized = error instanceof TranslationProviderError
						? error
						: new TranslationProviderError('provider', 'AI provider failed', true);
					if (!normalized.retryable || attempt >= maxRetries) {
						this.recordFailure();
						throw normalized;
					}
					await new Promise(resolve => setTimeout(resolve, 250 * (2 ** attempt)));
				}
			}
		} finally {
			this.release();
		}
	}

	private isCircuitOpen(): boolean {
		if (this.circuitOpenedAt == null) return false;
		if (Date.now() - this.circuitOpenedAt < (this.options.circuitResetMs ?? 30_000)) return true;
		this.circuitOpenedAt = null;
		this.consecutiveFailures = 0;
		return false;
	}

	private recordFailure(): void {
		this.consecutiveFailures++;
		if (this.consecutiveFailures >= (this.options.circuitFailureThreshold ?? 5)) this.circuitOpenedAt = Date.now();
	}

	private async acquire(): Promise<void> {
		const maxConcurrent = this.options.maxConcurrent ?? 2;
		if (this.activeRequests < maxConcurrent) {
			this.activeRequests++;
			return;
		}
		if (this.waiters.length >= maxConcurrent * 4) throw new TranslationProviderError('rate_limit', 'AI provider concurrency limit reached', true);
		await new Promise<void>(resolve => this.waiters.push(resolve));
		this.activeRequests++;
	}

	private release(): void {
		this.activeRequests--;
		this.waiters.shift()?.();
	}
}

export class ProviderRegistry {
	public constructor(private readonly providers: ReadonlyMap<string, TranslationProvider>) {}

	public resolve(name: string): TranslationProvider | null {
		return this.providers.get(name) ?? null;
	}
}

export type ConfiguredProvider = {
	providerType: string;
	endpoint?: string | null;
	apiKey: string;
	model?: string | null;
	limits?: Record<string, unknown> | null;
};

export function createTranslationProviderFromConfig(config: ConfiguredProvider): TranslationProvider | null {
	if (!['openai-compatible', 'openai-responses'].includes(config.providerType) || config.apiKey.length === 0) return null;
	const limits = config.limits ?? {};
	const Provider = config.providerType === 'openai-responses' ? OpenAIResponsesTranslationProvider : OpenAICompatibleTranslationProvider;
	const provider = new Provider({
		baseUrl: config.endpoint ?? undefined,
		apiKey: config.apiKey,
		model: config.model ?? undefined,
		timeoutMs: positiveNumberValue(limits.timeoutMs, 30_000),
	});
	return new ResilientTranslationProvider(provider, {
		maxConcurrent: positiveNumberValue(limits.maxConcurrent, 2),
		maxRetries: nonNegativeNumberValue(limits.maxRetries, 2),
		circuitFailureThreshold: positiveNumberValue(limits.circuitFailureThreshold, 5),
		circuitResetMs: positiveNumberValue(limits.circuitResetMs, 30_000),
	});
}

export function createConfiguredTranslationProvider(env: NodeJS.ProcessEnv = process.env): TranslationProvider | null {
	if (env.FEATHERMISS_ENABLED === '0' || env.FEATHERMISS_ENABLED === 'false') return null;
	if (env.FEATHERMISS_AI_ENABLED !== '1' && env.FEATHERMISS_AI_ENABLED !== 'true') return null;
	if (env.FEATHERMISS_AI_KILL_SWITCH === '1' || env.FEATHERMISS_AI_KILL_SWITCH === 'true') return null;
	const apiKey = env.FEATHERMISS_AI_API_KEY;
	if (apiKey == null || apiKey.length === 0) return null;
	const providerType = env.FEATHERMISS_AI_PROVIDER ?? 'openai-compatible';
	if (!['openai-compatible', 'openai-responses'].includes(providerType)) return null;
	const provider = createTranslationProviderFromConfig({
		providerType,
		endpoint: env.FEATHERMISS_AI_BASE_URL,
		apiKey,
		model: env.FEATHERMISS_AI_MODEL,
		limits: {
			timeoutMs: env.FEATHERMISS_AI_TIMEOUT_MS,
			maxRetries: env.FEATHERMISS_AI_MAX_RETRIES,
			maxConcurrent: env.FEATHERMISS_AI_MAX_CONCURRENT,
			circuitFailureThreshold: env.FEATHERMISS_AI_CIRCUIT_FAILURE_THRESHOLD,
			circuitResetMs: env.FEATHERMISS_AI_CIRCUIT_RESET_MS,
		},
	});
	return provider == null ? null : new ProviderRegistry(new Map([[provider.name, provider]])).resolve(provider.name);
}

function positiveNumber(value: string | undefined, fallback: number): number {
	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function nonNegativeNumber(value: string | undefined, fallback: number): number {
	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function positiveNumberValue(value: unknown, fallback: number): number {
	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function nonNegativeNumberValue(value: unknown, fallback: number): number {
	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function appendProviderPath(baseUrl: string, path: '/chat/completions' | '/responses'): string {
	const normalized = baseUrl.replace(/\/+$/, '');
	return normalized.endsWith(path) ? normalized : `${normalized}${path}`;
}
