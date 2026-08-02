/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test, vi } from 'vitest';
import { encryptFeatherMissSecret } from './crypto.js';
import { FeatherMissAiService } from './service.js';
import type { CachedTranslation, TranslationCacheKey } from './repository.js';
import type { TranslationProvider } from './types.js';

describe('FeatherMissAiService', () => {
	test('uses the separate cache before invoking the provider', async () => {
		const provider: TranslationProvider = {
			name: 'fake',
			model: 'test',
			translate: vi.fn(async () => ({ sourceLang: 'en', text: 'こんにちは', provider: 'fake', model: 'test' })),
		};
		const cache = {
			find: vi.fn<(key: TranslationCacheKey) => Promise<CachedTranslation | null>>(async () => null),
			save: vi.fn(async () => undefined),
		};
		const service = new FeatherMissAiService(null, provider, cache);

		await expect(service.translateNote('account-1', 'note-1', 'Hello', 'ja-JP')).resolves.toMatchObject({ text: 'こんにちは' });
		expect(provider.translate).toHaveBeenCalledWith({ text: 'Hello', targetLanguage: 'ja' });
		expect(cache.save).toHaveBeenCalledOnce();

		cache.find.mockResolvedValue({ sourceFingerprint: 'cached', sourceLang: 'en', text: 'cached', provider: 'fake', model: 'test', translationMode: 'on-demand', pipelineVersion: '1', promptVersion: '1' });
		await expect(service.translateNote('account-1', 'note-1', 'Hello', 'ja')).resolves.toMatchObject({ text: 'cached' });
		expect(provider.translate).toHaveBeenCalledOnce();
	});

	test('rejects invalid target languages before provider use', async () => {
		const provider: TranslationProvider = {
			name: 'fake',
			model: 'test',
			translate: vi.fn(),
		};
		const service = new FeatherMissAiService(null, provider, { find: vi.fn(), save: vi.fn() });

		await expect(service.translateNote('account-1', 'note-1', 'Hello', 'en_US')).rejects.toThrow('FEATHERMISS_AI_INVALID_LANGUAGE');
		expect(provider.translate).not.toHaveBeenCalled();
	});

	test('honors the database deployment kill switch before provider use', async () => {
		const provider: TranslationProvider = {
			name: 'fake',
			model: 'test',
			translate: vi.fn(),
		};
		const service = new FeatherMissAiService(null, provider, {
			find: vi.fn(),
			save: vi.fn(),
			getDeploymentConfig: vi.fn(async () => ({
				id: 'default',
				enabled: true,
				aiEnabled: true,
				aiKillSwitch: true,
				backgroundTranslationEnabled: false,
				permittedContentScope: 'notes-on-demand',
				retentionDays: 7,
				maxRequestCharacters: 20000,
				rateLimitPerMinute: 10,
			})),
		});

		expect(await service.isAvailable()).toBe(false);
		await expect(service.translateNote('account-1', 'note-1', 'Hello', 'ja')).rejects.toThrow('FEATHERMISS_AI_UNAVAILABLE');
		expect(provider.translate).not.toHaveBeenCalled();
	});

	test('reloads an encrypted database provider configuration', async () => {
		const key = Buffer.alloc(32, 9);
		vi.stubEnv('FEATHERMISS_ENCRYPTION_KEY', key.toString('hex'));
		const service = new FeatherMissAiService(null, null, {
			find: vi.fn(),
			save: vi.fn(),
			getDeploymentConfig: vi.fn(async () => ({
				id: 'default', enabled: true, aiEnabled: true, aiKillSwitch: false,
				backgroundTranslationEnabled: false, permittedContentScope: 'notes-on-demand',
				retentionDays: 7, maxRequestCharacters: 20000, rateLimitPerMinute: 10,
			})),
			getProviderConfig: vi.fn(async () => ({
				id: 1, providerType: 'openai-compatible', endpoint: 'http://localhost:1234/v1',
				encryptedCredentials: encryptFeatherMissSecret('secret', key), model: 'local-model',
				enabled: true, limits: { maxRetries: 0 },
			})),
		});

		expect(await service.isAvailable()).toBe(true);
		vi.unstubAllEnvs();
	});

	test('processes queued background jobs and clears source text on completion', async () => {
		const provider: TranslationProvider = {
			name: 'fake',
			model: 'test',
			translate: vi.fn(async () => ({ sourceLang: 'en', text: 'こんにちは', provider: 'fake', model: 'test' })),
		};
		const deployment = {
			id: 'default', enabled: true, aiEnabled: true, aiKillSwitch: false,
			backgroundTranslationEnabled: true, permittedContentScope: 'selected-timelines',
			retentionDays: 7, maxRequestCharacters: 20000, rateLimitPerMinute: 10,
		} as const;
		const repository = {
			find: vi.fn(async () => null),
			save: vi.fn(async () => undefined),
			getDeploymentConfig: vi.fn(async () => deployment),
			claimTranslationJobs: vi.fn(async () => [{
				id: 'job-1', accountId: 'account-1', noteId: 'note-1', targetLanguage: 'ja',
				sourceFingerprint: 'fingerprint', sourceText: 'Hello', status: 'running' as const, attempts: 1,
			}]),
			completeTranslationJob: vi.fn(async () => undefined),
			failTranslationJob: vi.fn(async () => undefined),
		};
		const service = new FeatherMissAiService(null, provider, repository);

		await service.processBackgroundJobs();

		expect(provider.translate).toHaveBeenCalledWith({ text: 'Hello', targetLanguage: 'ja' });
		expect(repository.completeTranslationJob).toHaveBeenCalledWith('job-1');
		expect(repository.failTranslationJob).not.toHaveBeenCalled();
	});

	test('queues every selected language for an opted-in timeline', async () => {
		const repository = {
			find: vi.fn(async () => null),
			save: vi.fn(async () => undefined),
			getDeploymentConfig: vi.fn(async () => ({
				id: 'default', enabled: true, aiEnabled: true, aiKillSwitch: false,
				backgroundTranslationEnabled: true, permittedContentScope: 'selected-timelines',
				retentionDays: 7, maxRequestCharacters: 20000, rateLimitPerMinute: 10,
			})),
			getTranslationPreferences: vi.fn(async () => ({ timelineIds: ['home'] })),
			enqueueTranslationJob: vi.fn(async ({ targetLanguage }: { targetLanguage: string }) => `job-${targetLanguage}`),
		};
		const service = new FeatherMissAiService(null, {
			name: 'fake', model: 'test', translate: vi.fn(),
		}, repository);

		await expect(service.enqueueBackgroundTranslations('account-1', 'note-1', 'Hello', ['ja-JP', 'ko-KR'], 'home'))
			.resolves.toEqual(['job-ja', 'job-ko']);
		expect(repository.enqueueTranslationJob).toHaveBeenCalledTimes(2);
	});

	test('cancels queued background source text when background work is disabled', async () => {
		const repository = {
			find: vi.fn(async () => null),
			save: vi.fn(async () => undefined),
			getDeploymentConfig: vi.fn(async () => ({
				id: 'default', enabled: true, aiEnabled: true, aiKillSwitch: false,
				backgroundTranslationEnabled: false, permittedContentScope: 'notes-on-demand',
				retentionDays: 7, maxRequestCharacters: 20000, rateLimitPerMinute: 10,
			})),
			claimTranslationJobs: vi.fn(),
			completeTranslationJob: vi.fn(),
			failTranslationJob: vi.fn(),
			cancelTranslationJobs: vi.fn(async () => 1),
		};
		const service = new FeatherMissAiService(null, null, repository);

		await service.processBackgroundJobs();

		expect(repository.cancelTranslationJobs).toHaveBeenCalledOnce();
		expect(repository.claimTranslationJobs).not.toHaveBeenCalled();
	});
});
