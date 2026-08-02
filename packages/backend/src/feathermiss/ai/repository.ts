/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Pool } from 'pg';
import type { TranslationResult } from './types.js';

export type TranslationCacheKey = {
	accountId: string;
	noteId: string;
	targetLanguage: string;
	sourceFingerprint: string;
	translationMode: string;
	pipelineVersion: string;
	promptVersion: string;
};

export type CachedTranslation = TranslationResult & Pick<TranslationCacheKey, 'sourceFingerprint' | 'translationMode' | 'pipelineVersion' | 'promptVersion'>;

export type FeatherMissDeploymentConfig = {
	id: string;
	enabled: boolean;
	aiEnabled: boolean;
	aiKillSwitch: boolean;
	backgroundTranslationEnabled: boolean;
	permittedContentScope: string;
	retentionDays: number;
	maxRequestCharacters: number;
	rateLimitPerMinute: number;
};

export type FeatherMissProviderConfig = {
	id: number;
	providerType: string;
	endpoint: string | null;
	encryptedCredentials: string | null;
	model: string | null;
	enabled: boolean;
	limits: Record<string, unknown>;
};

export type FeatherMissLinkedAccount = {
	misskeyUserId: string;
	oauthSubject: string;
	instanceUrl: string;
	scopes: string[];
};

export type FeatherMissTranslationJob = {
	id: string;
	accountId: string;
	noteId: string;
	targetLanguage: string;
	sourceFingerprint: string;
	sourceText: string;
	status: 'queued' | 'running' | 'completed' | 'dead-letter';
	attempts: number;
};

export class FeatherMissRepository {
	public constructor(private readonly pool: Pool) {}

	public async initialize(): Promise<void> {
		const client = await this.pool.connect();
		try {
			await client.query('CREATE TABLE IF NOT EXISTS feathermiss_schema_migrations (version integer PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())');
			await client.query("SELECT pg_advisory_lock(hashtext('feathermiss-schema'))");
			const migration = await client.query<{ version: number }>('SELECT version FROM feathermiss_schema_migrations ORDER BY version DESC LIMIT 1');
			const version = migration.rows[0]?.version ?? 0;
			if (version < 1) {
				await client.query('BEGIN');
				try {
					await client.query(`
						CREATE TABLE IF NOT EXISTS feathermiss_translation_results (
							account_id varchar(32) NOT NULL,
							note_id varchar(32) NOT NULL,
							target_lang varchar(16) NOT NULL,
							source_fingerprint char(64) NOT NULL,
							translation_mode varchar(32) NOT NULL DEFAULT 'on-demand',
							pipeline_version varchar(32) NOT NULL DEFAULT '1',
							prompt_version varchar(32) NOT NULL DEFAULT '1',
							source_lang varchar(16) NOT NULL,
							translated_text text NOT NULL,
							provider varchar(128) NOT NULL,
							model varchar(128) NOT NULL,
							created_at timestamptz NOT NULL DEFAULT now(),
							expires_at timestamptz,
							PRIMARY KEY (account_id, note_id, target_lang, source_fingerprint, translation_mode, pipeline_version, prompt_version)
						)
					`);
					await client.query(`
						CREATE TABLE IF NOT EXISTS feathermiss_translation_requests (
							id bigserial PRIMARY KEY,
							account_id varchar(32) NOT NULL,
							note_id varchar(32) NOT NULL,
							target_lang varchar(16) NOT NULL,
							request_source varchar(32) NOT NULL DEFAULT 'on-demand',
							status varchar(32) NOT NULL,
							error_category varchar(64),
							provider varchar(128),
							model varchar(128),
							latency_ms integer,
							input_tokens integer,
							output_tokens integer,
							created_at timestamptz NOT NULL DEFAULT now(),
							completed_at timestamptz
						)
					`);
					await client.query(`
						CREATE TABLE IF NOT EXISTS feathermiss_ai_provider_configs (
							id bigserial PRIMARY KEY,
							provider_type varchar(64) NOT NULL,
							endpoint text,
							encrypted_credentials text,
							model varchar(128),
							enabled boolean NOT NULL DEFAULT false,
							limits jsonb NOT NULL DEFAULT '{}'::jsonb,
							created_at timestamptz NOT NULL DEFAULT now(),
							updated_at timestamptz NOT NULL DEFAULT now()
						)
					`);
					await client.query(`
						CREATE TABLE IF NOT EXISTS feathermiss_ai_usage (
							id bigserial PRIMARY KEY,
							account_id varchar(32),
							provider varchar(128) NOT NULL,
							period_start timestamptz NOT NULL,
							request_count integer NOT NULL DEFAULT 0,
							input_tokens bigint NOT NULL DEFAULT 0,
							output_tokens bigint NOT NULL DEFAULT 0,
							retention_until timestamptz,
							UNIQUE (account_id, provider, period_start)
						)
					`);
					await client.query(`
						CREATE TABLE IF NOT EXISTS feathermiss_translation_jobs (
							id bigserial PRIMARY KEY,
							account_id varchar(32) NOT NULL,
							note_id varchar(32) NOT NULL,
							target_lang varchar(16) NOT NULL,
							source_fingerprint char(64) NOT NULL,
							status varchar(32) NOT NULL DEFAULT 'queued',
							attempts integer NOT NULL DEFAULT 0,
							next_attempt_at timestamptz NOT NULL DEFAULT now(),
							last_error_category varchar(64),
							created_at timestamptz NOT NULL DEFAULT now(),
							completed_at timestamptz,
							UNIQUE (account_id, note_id, target_lang, source_fingerprint)
						)
					`);
					await client.query('INSERT INTO feathermiss_schema_migrations (version) VALUES (1)');
					await client.query('COMMIT');
				} catch (error) {
					await client.query('ROLLBACK');
					throw error;
				}
			}

			if (version < 2) {
				await client.query('BEGIN');
				try {
					await client.query('ALTER TABLE feathermiss_translation_requests ADD COLUMN IF NOT EXISTS request_source varchar(32) NOT NULL DEFAULT \'on-demand\'');
					await client.query('ALTER TABLE feathermiss_translation_requests ADD COLUMN IF NOT EXISTS error_category varchar(64)');
					await client.query('ALTER TABLE feathermiss_translation_requests ADD COLUMN IF NOT EXISTS provider varchar(128)');
					await client.query('ALTER TABLE feathermiss_translation_requests ADD COLUMN IF NOT EXISTS model varchar(128)');
					await client.query('ALTER TABLE feathermiss_translation_requests ADD COLUMN IF NOT EXISTS latency_ms integer');
					await client.query('ALTER TABLE feathermiss_translation_requests ADD COLUMN IF NOT EXISTS input_tokens integer');
					await client.query('ALTER TABLE feathermiss_translation_requests ADD COLUMN IF NOT EXISTS output_tokens integer');
					await client.query('ALTER TABLE feathermiss_translation_requests ADD COLUMN IF NOT EXISTS completed_at timestamptz');
					await client.query(`
						CREATE TABLE IF NOT EXISTS feathermiss_ai_provider_configs (
							id bigserial PRIMARY KEY,
							provider_type varchar(64) NOT NULL,
							endpoint text,
							encrypted_credentials text,
							model varchar(128),
							enabled boolean NOT NULL DEFAULT false,
							limits jsonb NOT NULL DEFAULT '{}'::jsonb,
							created_at timestamptz NOT NULL DEFAULT now(),
							updated_at timestamptz NOT NULL DEFAULT now()
						)
					`);
					await client.query(`
						CREATE TABLE IF NOT EXISTS feathermiss_ai_usage (
							id bigserial PRIMARY KEY,
							account_id varchar(32),
							provider varchar(128) NOT NULL,
							period_start timestamptz NOT NULL,
							request_count integer NOT NULL DEFAULT 0,
							input_tokens bigint NOT NULL DEFAULT 0,
							output_tokens bigint NOT NULL DEFAULT 0,
							retention_until timestamptz,
							UNIQUE (account_id, provider, period_start)
						)
					`);
					await client.query(`
						CREATE TABLE IF NOT EXISTS feathermiss_translation_jobs (
							id bigserial PRIMARY KEY,
							account_id varchar(32) NOT NULL,
							note_id varchar(32) NOT NULL,
							target_lang varchar(16) NOT NULL,
							source_fingerprint char(64) NOT NULL,
							status varchar(32) NOT NULL DEFAULT 'queued',
							attempts integer NOT NULL DEFAULT 0,
							next_attempt_at timestamptz NOT NULL DEFAULT now(),
							last_error_category varchar(64),
							created_at timestamptz NOT NULL DEFAULT now(),
							completed_at timestamptz,
							UNIQUE (account_id, note_id, target_lang, source_fingerprint)
						)
					`);
					await client.query('ALTER TABLE feathermiss_translation_results ADD COLUMN IF NOT EXISTS translation_mode varchar(32) NOT NULL DEFAULT \'on-demand\'');
					await client.query('ALTER TABLE feathermiss_translation_results ADD COLUMN IF NOT EXISTS pipeline_version varchar(32) NOT NULL DEFAULT \'1\'');
					await client.query('ALTER TABLE feathermiss_translation_results ADD COLUMN IF NOT EXISTS prompt_version varchar(32) NOT NULL DEFAULT \'1\'');
					await client.query('ALTER TABLE feathermiss_translation_results ADD COLUMN IF NOT EXISTS expires_at timestamptz');
					await client.query('ALTER TABLE feathermiss_translation_results DROP CONSTRAINT IF EXISTS feathermiss_translation_results_pkey');
					await client.query('ALTER TABLE feathermiss_translation_results ADD CONSTRAINT feathermiss_translation_results_pkey PRIMARY KEY (account_id, note_id, target_lang, source_fingerprint, translation_mode, pipeline_version, prompt_version)');
					await client.query('INSERT INTO feathermiss_schema_migrations (version) VALUES (2)');
					await client.query('COMMIT');
				} catch (error) {
					await client.query('ROLLBACK');
					throw error;
				}
			}

			if (version < 3) {
				await client.query('BEGIN');
				try {
					await client.query(`
						CREATE TABLE IF NOT EXISTS feathermiss_deployment_config (
							id varchar(64) PRIMARY KEY,
							enabled boolean NOT NULL DEFAULT true,
							ai_enabled boolean NOT NULL DEFAULT false,
							ai_kill_switch boolean NOT NULL DEFAULT false,
							background_translation_enabled boolean NOT NULL DEFAULT false,
							permitted_content_scope varchar(64) NOT NULL DEFAULT 'notes-on-demand',
							retention_days integer NOT NULL DEFAULT 7,
							max_request_characters integer NOT NULL DEFAULT 20000,
							rate_limit_per_minute integer NOT NULL DEFAULT 10,
							updated_at timestamptz NOT NULL DEFAULT now()
						)
					`);
					await client.query(`
						CREATE TABLE IF NOT EXISTS feathermiss_linked_accounts (
							misskey_user_id varchar(32) PRIMARY KEY,
							oauth_subject varchar(255) NOT NULL,
							instance_url text NOT NULL,
							scopes text[] NOT NULL DEFAULT '{}',
							encrypted_access_token text,
							encrypted_refresh_token text,
							access_token_expires_at timestamptz,
							created_at timestamptz NOT NULL DEFAULT now(),
							updated_at timestamptz NOT NULL DEFAULT now(),
							UNIQUE (instance_url, oauth_subject)
						)
					`);
					await client.query(`
						CREATE TABLE IF NOT EXISTS feathermiss_sessions (
							id uuid PRIMARY KEY,
							misskey_user_id varchar(32) NOT NULL,
							created_at timestamptz NOT NULL DEFAULT now(),
							last_used_at timestamptz NOT NULL DEFAULT now(),
							expires_at timestamptz NOT NULL,
							revoked_at timestamptz
						)
					`);
					await client.query(`
						CREATE TABLE IF NOT EXISTS feathermiss_ui_preferences (
							misskey_user_id varchar(32) PRIMARY KEY,
							preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
							updated_at timestamptz NOT NULL DEFAULT now()
						)
					`);
					await client.query(`
						CREATE TABLE IF NOT EXISTS feathermiss_extension_state (
							misskey_user_id varchar(32) PRIMARY KEY,
							state jsonb NOT NULL DEFAULT '{}'::jsonb,
							updated_at timestamptz NOT NULL DEFAULT now()
						)
					`);
					await client.query('INSERT INTO feathermiss_deployment_config (id) VALUES (\'default\') ON CONFLICT (id) DO NOTHING');
					await client.query('INSERT INTO feathermiss_schema_migrations (version) VALUES (3)');
					await client.query('COMMIT');
				} catch (error) {
					await client.query('ROLLBACK');
					throw error;
				}
			}

			if (version < 4) {
				await client.query('BEGIN');
				try {
					await client.query('ALTER TABLE feathermiss_translation_jobs ADD COLUMN IF NOT EXISTS source_text text');
					await client.query('INSERT INTO feathermiss_schema_migrations (version) VALUES (4)');
					await client.query('COMMIT');
				} catch (error) {
					await client.query('ROLLBACK');
					throw error;
				}
			}
		} finally {
			await client.query("SELECT pg_advisory_unlock(hashtext('feathermiss-schema'))");
			client.release();
		}
	}

	public async find(key: TranslationCacheKey): Promise<CachedTranslation | null> {
		const result = await this.pool.query<CachedTranslation>(
			`SELECT source_fingerprint AS "sourceFingerprint", source_lang AS "sourceLang", translated_text AS text, provider, model,
					translation_mode AS "translationMode", pipeline_version AS "pipelineVersion", prompt_version AS "promptVersion",
					created_at AS "createdAt", expires_at AS "expiresAt", NULL::integer AS "latencyMs", NULL::integer AS "inputTokens", NULL::integer AS "outputTokens"
				 FROM feathermiss_translation_results
				 WHERE account_id = $1 AND note_id = $2 AND target_lang = $3 AND source_fingerprint = $4
				 AND translation_mode = $5 AND pipeline_version = $6 AND prompt_version = $7
				 AND (expires_at IS NULL OR expires_at > now())`,
			[key.accountId, key.noteId, key.targetLanguage, key.sourceFingerprint, key.translationMode, key.pipelineVersion, key.promptVersion],
		);
		return result.rows[0] ?? null;
	}

	public async save(key: TranslationCacheKey, result: TranslationResult, expiresAt: Date | null): Promise<void> {
		await this.pool.query(
			`INSERT INTO feathermiss_translation_results
			 (account_id, note_id, target_lang, source_fingerprint, translation_mode, pipeline_version, prompt_version, source_lang, translated_text, provider, model, expires_at)
			 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
			 ON CONFLICT (account_id, note_id, target_lang, source_fingerprint, translation_mode, pipeline_version, prompt_version) DO UPDATE SET
			 translated_text = EXCLUDED.translated_text, provider = EXCLUDED.provider, model = EXCLUDED.model, expires_at = EXCLUDED.expires_at`,
			 [key.accountId, key.noteId, key.targetLanguage, key.sourceFingerprint, key.translationMode, key.pipelineVersion, key.promptVersion, result.sourceLang, result.text, result.provider, result.model, expiresAt],
		);
	}

	public async createRequest(key: TranslationCacheKey): Promise<string> {
		const result = await this.pool.query<{ id: string }>(
			`INSERT INTO feathermiss_translation_requests (account_id, note_id, target_lang, request_source, status)
			 VALUES ($1, $2, $3, $4, 'running') RETURNING id`,
			[key.accountId, key.noteId, key.targetLanguage, key.translationMode],
		);
		return result.rows[0].id;
	}

	public async countRecentRequests(accountId: string, since = new Date(Date.now() - 60_000)): Promise<number> {
		const result = await this.pool.query<{ count: string }>(
			`SELECT count(*)::text AS count FROM feathermiss_translation_requests WHERE account_id = $1 AND created_at >= $2`,
			[accountId, since],
		);
		return Number(result.rows[0]?.count ?? 0);
	}

	public async completeRequest(requestId: string, result: TranslationResult, status: 'completed' | 'cached' = 'completed'): Promise<void> {
		await this.pool.query(
			`UPDATE feathermiss_translation_requests
			 SET status = $2, provider = $3, model = $4, latency_ms = $5, input_tokens = $6, output_tokens = $7, completed_at = now()
			 WHERE id = $1`,
			[requestId, status, result.provider, result.model, result.latencyMs ?? null, result.inputTokens ?? null, result.outputTokens ?? null],
		);
	}

	public async failRequest(requestId: string, category: string): Promise<void> {
		await this.pool.query(
			`UPDATE feathermiss_translation_requests SET status = 'failed', error_category = $2, completed_at = now() WHERE id = $1`,
			[requestId, category],
		);
	}

	public async recordUsage(accountId: string, result: TranslationResult): Promise<void> {
		await this.pool.query(
			`INSERT INTO feathermiss_ai_usage (account_id, provider, period_start, request_count, input_tokens, output_tokens)
			 VALUES ($1, $2, date_trunc('hour', now()), 1, $3, $4)
			 ON CONFLICT (account_id, provider, period_start) DO UPDATE SET
			 request_count = feathermiss_ai_usage.request_count + 1,
			 input_tokens = feathermiss_ai_usage.input_tokens + EXCLUDED.input_tokens,
			 output_tokens = feathermiss_ai_usage.output_tokens + EXCLUDED.output_tokens`,
			[accountId, result.provider, result.inputTokens ?? 0, result.outputTokens ?? 0],
		);
	}

	public async purgeExpiredTranslations(now = new Date()): Promise<number> {
		const result = await this.pool.query('DELETE FROM feathermiss_translation_results WHERE expires_at IS NOT NULL AND expires_at <= $1', [now]);
		return result.rowCount ?? 0;
	}

	public async purgeAccountTranslations(accountId: string): Promise<number> {
		const result = await this.pool.query('DELETE FROM feathermiss_translation_results WHERE account_id = $1', [accountId]);
		return result.rowCount ?? 0;
	}

	public async purgeAllTranslations(): Promise<number> {
		const result = await this.pool.query('DELETE FROM feathermiss_translation_results');
		return result.rowCount ?? 0;
	}

	public async enqueueTranslationJob(job: Pick<FeatherMissTranslationJob, 'accountId' | 'noteId' | 'targetLanguage' | 'sourceFingerprint' | 'sourceText'>): Promise<string> {
		const result = await this.pool.query<{ id: string }>(
			`INSERT INTO feathermiss_translation_jobs
				(account_id, note_id, target_lang, source_fingerprint, source_text, status, attempts, next_attempt_at, completed_at)
			 VALUES ($1, $2, $3, $4, $5, 'queued', 0, now(), NULL)
			 ON CONFLICT (account_id, note_id, target_lang, source_fingerprint) DO UPDATE SET
				source_text = EXCLUDED.source_text, status = 'queued', attempts = 0, next_attempt_at = now(), last_error_category = NULL, completed_at = NULL
				WHERE feathermiss_translation_jobs.status <> 'completed'
			 RETURNING id`,
			[job.accountId, job.noteId, job.targetLanguage, job.sourceFingerprint, job.sourceText],
		);
		if (result.rows[0] != null) return result.rows[0].id;
		const existing = await this.pool.query<{ id: string }>(
			`SELECT id FROM feathermiss_translation_jobs
			 WHERE account_id = $1 AND note_id = $2 AND target_lang = $3 AND source_fingerprint = $4`,
			[job.accountId, job.noteId, job.targetLanguage, job.sourceFingerprint],
		);
		return existing.rows[0].id;
	}

	public async claimTranslationJobs(limit = 2): Promise<FeatherMissTranslationJob[]> {
		const result = await this.pool.query<FeatherMissTranslationJob>(
			`WITH candidates AS (
				SELECT id FROM feathermiss_translation_jobs
				WHERE status = 'queued' AND next_attempt_at <= now()
				ORDER BY next_attempt_at, id
				FOR UPDATE SKIP LOCKED LIMIT $1
			)
			UPDATE feathermiss_translation_jobs AS jobs
			SET status = 'running', attempts = jobs.attempts + 1
			FROM candidates
			WHERE jobs.id = candidates.id
			RETURNING jobs.id, jobs.account_id AS "accountId", jobs.note_id AS "noteId", jobs.target_lang AS "targetLanguage",
				jobs.source_fingerprint AS "sourceFingerprint", jobs.source_text AS "sourceText", jobs.status, jobs.attempts`,
			[limit],
		);
		return result.rows;
	}

	public async completeTranslationJob(id: string): Promise<void> {
		await this.pool.query(
			`UPDATE feathermiss_translation_jobs SET status = 'completed', source_text = NULL, completed_at = now() WHERE id = $1`,
			[id],
		);
	}

	public async failTranslationJob(id: string, category: string, retryAfterMs: number, maxAttempts = 5): Promise<void> {
		await this.pool.query(
			`UPDATE feathermiss_translation_jobs SET
				status = CASE WHEN attempts >= $3 THEN 'dead-letter' ELSE 'queued' END,
				last_error_category = $2,
				next_attempt_at = now() + ($4 * interval '1 millisecond'),
				source_text = CASE WHEN attempts >= $3 THEN NULL ELSE source_text END,
				completed_at = CASE WHEN attempts >= $3 THEN now() ELSE NULL END
			 WHERE id = $1`,
			[id, category, maxAttempts, retryAfterMs],
		);
	}

	public async cancelTranslationJobs(accountId?: string): Promise<number> {
		const result = await this.pool.query(
			`UPDATE feathermiss_translation_jobs SET status = 'dead-letter', source_text = NULL, last_error_category = 'cancelled', completed_at = now()
			 WHERE status IN ('queued', 'running') AND ($1::varchar IS NULL OR account_id = $1)`,
			[accountId ?? null],
		);
		return result.rowCount ?? 0;
	}

	public async getDeploymentConfig(): Promise<FeatherMissDeploymentConfig | null> {
		const result = await this.pool.query<FeatherMissDeploymentConfig>(
			`SELECT id, enabled, ai_enabled AS "aiEnabled", ai_kill_switch AS "aiKillSwitch",
					background_translation_enabled AS "backgroundTranslationEnabled",
					permitted_content_scope AS "permittedContentScope", retention_days AS "retentionDays",
					max_request_characters AS "maxRequestCharacters", rate_limit_per_minute AS "rateLimitPerMinute"
				 FROM feathermiss_deployment_config WHERE id = 'default'`,
		);
		return result.rows[0] ?? null;
	}

	public async updateDeploymentConfig(patch: Partial<Omit<FeatherMissDeploymentConfig, 'id'>>): Promise<FeatherMissDeploymentConfig> {
		await this.pool.query('INSERT INTO feathermiss_deployment_config (id) VALUES (\'default\') ON CONFLICT (id) DO NOTHING');
		const result = await this.pool.query<FeatherMissDeploymentConfig>(
			`UPDATE feathermiss_deployment_config SET
				enabled = COALESCE($1, enabled),
				ai_enabled = COALESCE($2, ai_enabled),
				ai_kill_switch = COALESCE($3, ai_kill_switch),
				background_translation_enabled = COALESCE($4, background_translation_enabled),
				permitted_content_scope = COALESCE($5, permitted_content_scope),
				retention_days = COALESCE($6, retention_days),
				max_request_characters = COALESCE($7, max_request_characters),
				rate_limit_per_minute = COALESCE($8, rate_limit_per_minute),
				updated_at = now()
			 WHERE id = 'default'
			 RETURNING id, enabled, ai_enabled AS "aiEnabled", ai_kill_switch AS "aiKillSwitch",
					background_translation_enabled AS "backgroundTranslationEnabled",
					permitted_content_scope AS "permittedContentScope", retention_days AS "retentionDays",
					max_request_characters AS "maxRequestCharacters", rate_limit_per_minute AS "rateLimitPerMinute"`,
			[patch.enabled ?? null, patch.aiEnabled ?? null, patch.aiKillSwitch ?? null, patch.backgroundTranslationEnabled ?? null,
				patch.permittedContentScope ?? null, patch.retentionDays ?? null, patch.maxRequestCharacters ?? null, patch.rateLimitPerMinute ?? null],
		);
		return result.rows[0];
	}

	public async getProviderConfig(): Promise<FeatherMissProviderConfig | null> {
		const result = await this.pool.query<FeatherMissProviderConfig>(
			`SELECT id, provider_type AS "providerType", endpoint, encrypted_credentials AS "encryptedCredentials",
					model, enabled, limits
				 FROM feathermiss_ai_provider_configs ORDER BY id DESC LIMIT 1`,
		);
		return result.rows[0] ?? null;
	}

	public async saveProviderConfig(config: Omit<FeatherMissProviderConfig, 'id'>): Promise<void> {
		await this.pool.query(
			`INSERT INTO feathermiss_ai_provider_configs
				(id, provider_type, endpoint, encrypted_credentials, model, enabled, limits, updated_at)
			 VALUES (1, $1, $2, $3, $4, $5, $6::jsonb, now())
			 ON CONFLICT (id) DO UPDATE SET provider_type = EXCLUDED.provider_type,
				endpoint = EXCLUDED.endpoint, encrypted_credentials = EXCLUDED.encrypted_credentials,
				model = EXCLUDED.model, enabled = EXCLUDED.enabled, limits = EXCLUDED.limits, updated_at = now()`,
			[config.providerType, config.endpoint, config.encryptedCredentials, config.model, config.enabled, JSON.stringify(config.limits)],
		);
	}

	public async getUiGraphics(userId: string): Promise<Record<string, unknown> | null> {
		const preferences = await this.getPreferences(userId);
		return preferences?.uiGraphics ?? null;
	}

	public async linkAccount(account: FeatherMissLinkedAccount): Promise<void> {
		await this.pool.query(
			`INSERT INTO feathermiss_linked_accounts
				(misskey_user_id, oauth_subject, instance_url, scopes, updated_at)
			 VALUES ($1, $2, $3, $4, now())
			 ON CONFLICT (misskey_user_id) DO UPDATE SET
				oauth_subject = EXCLUDED.oauth_subject, instance_url = EXCLUDED.instance_url,
				scopes = EXCLUDED.scopes, updated_at = now()`,
			[account.misskeyUserId, account.oauthSubject, account.instanceUrl, account.scopes],
		);
	}

	public async unlinkAccount(userId: string): Promise<void> {
		await this.pool.query('DELETE FROM feathermiss_sessions WHERE misskey_user_id = $1', [userId]);
		await this.pool.query('DELETE FROM feathermiss_linked_accounts WHERE misskey_user_id = $1', [userId]);
	}

	public async saveUiGraphics(userId: string, value: Record<string, unknown>): Promise<void> {
		await this.savePreferences(userId, 'uiGraphics', value);
	}

	public async getTranslationPreferences(userId: string): Promise<Record<string, unknown> | null> {
		const preferences = await this.getPreferences(userId);
		return preferences?.translation ?? null;
	}

	public async saveTranslationPreferences(userId: string, value: Record<string, unknown>): Promise<void> {
		await this.savePreferences(userId, 'translation', value);
	}

	private async getPreferences(userId: string): Promise<{ uiGraphics?: Record<string, unknown>; translation?: Record<string, unknown> } | null> {
		const result = await this.pool.query<{ preferences: { uiGraphics?: Record<string, unknown>; translation?: Record<string, unknown> } | null }>(
			`SELECT preferences FROM feathermiss_ui_preferences WHERE misskey_user_id = $1`,
			[userId],
		);
		return result.rows[0]?.preferences ?? null;
	}

	private async savePreferences(userId: string, key: 'uiGraphics' | 'translation', value: Record<string, unknown>): Promise<void> {
		await this.pool.query(
			`INSERT INTO feathermiss_ui_preferences (misskey_user_id, preferences, updated_at)
			 VALUES ($1, jsonb_build_object($2::text, $3::jsonb), now())
			 ON CONFLICT (misskey_user_id) DO UPDATE SET preferences = jsonb_set(feathermiss_ui_preferences.preferences, ARRAY[$2::text], $3::jsonb, true), updated_at = now()`,
			[userId, key, JSON.stringify(value)],
		);
	}
}

export async function createFeatherMissDbPool(connectionString: string | undefined): Promise<Pool | null> {
	if (connectionString == null || connectionString.length === 0) return null;
	const pool = new Pool({ connectionString, max: 5, application_name: 'feathermiss' });
	try {
		await new FeatherMissRepository(pool).initialize();
		return pool;
	} catch (error) {
		await pool.end();
		throw error;
	}
}
