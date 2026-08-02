/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { createHash } from 'node:crypto';
import type { Pool } from 'pg';
import { decryptFeatherMissSecret } from './crypto.js';
import { prepareTranslation, TRANSLATION_BACKGROUND_MODE, TRANSLATION_MODE, TRANSLATION_PIPELINE_VERSION, TRANSLATION_PROMPT_VERSION } from './content.js';
import { TranslationProviderError, createConfiguredTranslationProvider, createTranslationProviderFromConfig } from './providers.js';
import { FeatherMissRepository, type TranslationCacheKey } from './repository.js';
import type { TranslationProvider, TranslationResult } from './types.js';

type TranslationCache = Pick<FeatherMissRepository, 'find' | 'save'> & Partial<Pick<FeatherMissRepository, 'createRequest' | 'completeRequest' | 'failRequest' | 'recordUsage' | 'countRecentRequests' | 'getDeploymentConfig' | 'getProviderConfig' | 'getTranslationPreferences' | 'purgeExpiredTranslations' | 'enqueueTranslationJob' | 'claimTranslationJobs' | 'completeTranslationJob' | 'failTranslationJob' | 'cancelTranslationJobs' | 'linkAccount' | 'unlinkAccount'>>;

export class FeatherMissAiService {
	private provider: TranslationProvider | null;
	private readonly fallbackProvider: TranslationProvider | null;
	private readonly repository: TranslationCache | null;
	private readonly maxCharacters: number;
	private readonly cacheTtlMs: number;
	private lastCleanupAt = 0;
	private backgroundTimer: NodeJS.Timeout | null = null;
	private loadedProviderConfigSignature: string | null = null;

	public constructor(
		pool: Pool | null,
		provider: TranslationProvider | null = createConfiguredTranslationProvider(),
		repository: TranslationCache | null = pool == null ? null : new FeatherMissRepository(pool),
		options: { maxCharacters?: number; cacheTtlMs?: number } = {},
	) {
		this.provider = provider;
		this.fallbackProvider = provider;
		this.repository = repository;
		this.maxCharacters = options.maxCharacters ?? positiveNumber(process.env.FEATHERMISS_AI_MAX_CHARACTERS, 20_000);
		this.cacheTtlMs = options.cacheTtlMs ?? positiveNumber(process.env.FEATHERMISS_AI_CACHE_TTL_MS, 7 * 24 * 60 * 60 * 1000);
	}

	public async isAvailable(): Promise<boolean> {
		if (this.repository == null) return false;
		const deployment = await this.repository.getDeploymentConfig?.();
		if (deployment != null && (!deployment.enabled || !deployment.aiEnabled || deployment.aiKillSwitch)) return false;
		await this.reloadProvider();
		if (this.repository.purgeExpiredTranslations != null && Date.now() - this.lastCleanupAt >= 5 * 60 * 1000) {
			this.lastCleanupAt = Date.now();
			await this.repository.purgeExpiredTranslations().catch(() => undefined);
		}
		return this.provider != null;
	}

	public async linkAccount(userId: string, instanceUrl: string, scopes: string[]): Promise<void> {
		await this.repository?.linkAccount?.({
			misskeyUserId: userId,
			oauthSubject: userId,
			instanceUrl,
			scopes: [...new Set(scopes)],
		});
	}

	public async unlinkAccount(userId: string): Promise<void> {
		await this.repository?.unlinkAccount?.(userId);
	}

	public async reloadProvider(): Promise<void> {
		if (this.repository?.getProviderConfig == null) {
			this.provider = this.fallbackProvider;
			return;
		}

		const configured = await this.repository.getProviderConfig();
		const signature = configured == null ? 'none' : JSON.stringify(configured);
		if (signature === this.loadedProviderConfigSignature) return;
		if (configured == null || !configured.enabled || configured.encryptedCredentials == null) {
			this.provider = null;
			this.loadedProviderConfigSignature = signature;
			return;
		}

		try {
			this.provider = createTranslationProviderFromConfig({
				providerType: configured.providerType,
				endpoint: configured.endpoint,
				apiKey: decryptFeatherMissSecret(configured.encryptedCredentials),
				model: configured.model,
				limits: configured.limits,
			});
			this.loadedProviderConfigSignature = signature;
		} catch {
			this.provider = null;
			this.loadedProviderConfigSignature = null;
		}
	}

	public async translateNote(accountId: string, noteId: string, text: string, targetLanguage: string, mode = TRANSLATION_MODE): Promise<TranslationResult> {
		if (!(await this.isAvailable()) || this.repository == null || this.provider == null) throw new Error('FEATHERMISS_AI_UNAVAILABLE');
		const deployment = await this.repository.getDeploymentConfig?.();
		const normalizedLanguage = normalizeLanguage(targetLanguage);
		if (deployment != null && this.repository.countRecentRequests != null && await this.repository.countRecentRequests(accountId) >= deployment.rateLimitPerMinute) {
			throw new Error('FEATHERMISS_AI_RATE_LIMITED');
		}
		const maxCharacters = deployment == null ? this.maxCharacters : Math.min(this.maxCharacters, positiveNumberValue(deployment.maxRequestCharacters, this.maxCharacters));
		const prepared = prepareTranslation(text, maxCharacters);
		const sourceFingerprint = createSourceFingerprint(text, mode);
		const key: TranslationCacheKey = {
			accountId,
			noteId,
			targetLanguage: normalizedLanguage,
			sourceFingerprint,
			translationMode: mode,
			pipelineVersion: TRANSLATION_PIPELINE_VERSION,
			promptVersion: TRANSLATION_PROMPT_VERSION,
		};
		const requestId = await this.repository.createRequest?.(key);
		try {
			const cached = await this.repository.find(key);
			if (cached != null) {
				if (requestId != null) await this.repository.completeRequest?.(requestId, cached, 'cached');
				return cached;
			}

			const result = await this.provider.translate({ text: prepared.text, targetLanguage: normalizedLanguage });
			const normalizedResult = { ...result, text: prepared.restore(result.text) };
			const cacheTtlMs = deployment == null ? this.cacheTtlMs : positiveNumberValue(deployment.retentionDays, this.cacheTtlMs / (24 * 60 * 60 * 1000)) * 24 * 60 * 60 * 1000;
			const expiresAt = new Date(Date.now() + cacheTtlMs);
			await this.repository.save(key, normalizedResult, expiresAt);
			if (requestId != null) await this.repository.completeRequest?.(requestId, normalizedResult);
			await this.repository.recordUsage?.(accountId, normalizedResult);
			return normalizedResult;
		} catch (error) {
			if (requestId != null) await this.repository.failRequest?.(requestId, error instanceof TranslationProviderError ? error.category : 'pipeline');
			throw error;
		}
	}

	public async enqueueBackgroundTranslation(accountId: string, noteId: string, text: string, targetLanguage: string, timelineId: string): Promise<string> {
		const jobIds = await this.enqueueBackgroundTranslations(accountId, noteId, text, [targetLanguage], timelineId);
		return jobIds[0];
	}

	public async enqueueBackgroundTranslations(accountId: string, noteId: string, text: string, targetLanguages: string[], timelineId: string): Promise<string[]> {
		if (this.repository?.enqueueTranslationJob == null || !(await this.isAvailable())) throw new Error('FEATHERMISS_AI_UNAVAILABLE');
		const deployment = await this.repository.getDeploymentConfig?.();
		if (deployment == null || !deployment.backgroundTranslationEnabled || deployment.permittedContentScope !== 'selected-timelines') {
			throw new Error('FEATHERMISS_BACKGROUND_TRANSLATION_UNAVAILABLE');
		}
		const preferences = await this.repository.getTranslationPreferences?.(accountId);
		const timelineIds = preferences?.timelineIds;
		if (!Array.isArray(timelineIds) || !timelineIds.includes(timelineId)) throw new Error('FEATHERMISS_BACKGROUND_TIMELINE_NOT_SELECTED');
		if (targetLanguages.length > 8) throw new Error('FEATHERMISS_AI_INVALID_LANGUAGE');
		const normalizedLanguages = [...new Set(targetLanguages.map(normalizeLanguage))];
		if (normalizedLanguages.length === 0) throw new Error('FEATHERMISS_AI_INVALID_LANGUAGE');
		return await Promise.all(normalizedLanguages.map(async targetLanguage => await this.repository!.enqueueTranslationJob!({
			accountId,
			noteId,
			targetLanguage,
			sourceFingerprint: createSourceFingerprint(text, TRANSLATION_BACKGROUND_MODE),
			sourceText: text,
		})));
	}

	public startBackgroundWorker(intervalMs = 15_000): void {
		if (this.backgroundTimer != null || this.repository?.claimTranslationJobs == null) return;
		this.backgroundTimer = setInterval(() => void this.processBackgroundJobs(), intervalMs);
		this.backgroundTimer.unref?.();
	}

	public stopBackgroundWorker(): void {
		if (this.backgroundTimer == null) return;
		clearInterval(this.backgroundTimer);
		this.backgroundTimer = null;
	}

	public async processBackgroundJobs(limit = 2): Promise<void> {
		if (this.repository?.claimTranslationJobs == null || this.repository.completeTranslationJob == null || this.repository.failTranslationJob == null) return;
		const deployment = await this.repository.getDeploymentConfig?.();
		if (deployment == null) return;
		if (deployment.aiKillSwitch || !deployment.enabled || !deployment.aiEnabled || !deployment.backgroundTranslationEnabled || deployment.permittedContentScope !== 'selected-timelines') {
			await this.repository.cancelTranslationJobs?.();
			return;
		}
		if (!(await this.isAvailable())) return;

		const jobs = await this.repository.claimTranslationJobs(limit);
		for (const job of jobs) {
			try {
				if (job.sourceText == null || job.sourceText.length === 0) throw new Error('FEATHERMISS_BACKGROUND_SOURCE_MISSING');
				await this.translateNote(job.accountId, job.noteId, job.sourceText, job.targetLanguage, TRANSLATION_BACKGROUND_MODE);
				await this.repository.completeTranslationJob(job.id);
			} catch (error) {
				const category = error instanceof TranslationProviderError ? error.category : 'pipeline';
				await this.repository.failTranslationJob(job.id, category, Math.min(15 * 60 * 1000, 1000 * (2 ** Math.max(0, job.attempts - 1))));
			}
		}
	}
}

function normalizeLanguage(language: string): string {
	const normalized = language.trim().toLowerCase().split('-')[0];
	if (!/^[a-z]{2,8}$/.test(normalized)) throw new Error('FEATHERMISS_AI_INVALID_LANGUAGE');
	return normalized;
}

function positiveNumber(value: string | undefined, fallback: number): number {
	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function positiveNumberValue(value: unknown, fallback: number): number {
	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function createSourceFingerprint(text: string, mode: string): string {
	return createHash('sha256')
		.update(JSON.stringify({ text, mode, pipeline: TRANSLATION_PIPELINE_VERSION, prompt: TRANSLATION_PROMPT_VERSION }))
		.digest('hex');
}
