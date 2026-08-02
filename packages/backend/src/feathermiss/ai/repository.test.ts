/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { Pool } from 'pg';
import { describe, expect, test, vi } from 'vitest';
import { FeatherMissRepository } from './repository.js';

function makePool(version: number) {
	const client = {
		query: vi.fn(async (query: string) => query.includes('ORDER BY version') ? { rows: version === 0 ? [] : [{ version }], rowCount: 1 } : { rows: [], rowCount: 1 }),
		release: vi.fn(),
	};
	return { pool: { connect: vi.fn(async () => client) } as unknown as Pool, client };
}

describe('FeatherMiss AI repository migrations', () => {
	test('creates the complete FeatherMiss schema on a fresh database', async () => {
		const { pool, client } = makePool(0);
		await new FeatherMissRepository(pool).initialize();

		const statements = client.query.mock.calls.map(([query]) => query);
		expect(statements.some(query => query.includes('feathermiss_deployment_config'))).toBe(true);
		expect(statements.some(query => query.includes('feathermiss_linked_accounts'))).toBe(true);
		expect(statements.some(query => query.includes('feathermiss_translation_results'))).toBe(true);
		expect(statements.some(query => query.includes('INSERT INTO feathermiss_schema_migrations (version) VALUES (4)'))).toBe(true);
		expect(client.release).toHaveBeenCalledOnce();
	});

	test('upgrades a version two database without touching Misskey tables', async () => {
		const { pool, client } = makePool(2);
		await new FeatherMissRepository(pool).initialize();

		const statements = client.query.mock.calls.map(([query]) => query);
		expect(statements.some(query => query.includes('CREATE TABLE IF NOT EXISTS feathermiss_deployment_config'))).toBe(true);
		expect(statements.every(query => !/\b(?:from|join|update|delete from|alter table|references)\s+misskey_/i.test(query))).toBe(true);
	});

	test('stores extension preferences only in the FeatherMiss database', async () => {
		const query = vi.fn(async (statement: string) => statement.startsWith('SELECT')
			? { rows: [{ preferences: { uiGraphics: { enabled: false }, translation: { enabled: true } } }], rowCount: 1 }
			: { rows: [], rowCount: 1 });
		const pool = { query } as unknown as Pool;
		const repository = new FeatherMissRepository(pool);

		await repository.saveUiGraphics('user-id', { enabled: true });
		expect(await repository.getUiGraphics('user-id')).toEqual({ enabled: false });
		expect(query.mock.calls.every(([statement]) => statement.includes('feathermiss_ui_preferences'))).toBe(true);
		expect(await repository.getTranslationPreferences('user-id')).toEqual({ enabled: true });
	});

	test('links and unlinks accounts without touching Misskey tables', async () => {
		const query = vi.fn(async (_statement: string, _parameters?: unknown[]) => ({ rows: [], rowCount: 1 }));
		const pool = { query } as unknown as Pool;
		const repository = new FeatherMissRepository(pool);

		await repository.linkAccount({
			misskeyUserId: 'user-id',
			oauthSubject: 'user-id',
			instanceUrl: 'https://example.test',
			scopes: ['read:account'],
		});
		await repository.unlinkAccount('user-id');

		const statements = query.mock.calls.map(([statement]) => statement);
		expect(statements[0]).toContain('feathermiss_linked_accounts');
		expect(statements[1]).toContain('feathermiss_sessions');
		expect(statements[2]).toContain('feathermiss_linked_accounts');
		expect(statements.every(statement => !/\b(?:from|join|update|delete from|alter table|references)\s+misskey_/i.test(statement))).toBe(true);
	});
});
