# FeatherMiss integration manifest

FeatherMiss is a downstream UI layer on top of Misskey. The permanent branch
`misskey-upstream` is the exact official release baseline; `main` contains
stable FeatherMiss releases; `next` is for update integration and testing.

The upstream remote is deliberately separate from `origin`:

```sh
git remote add upstream https://github.com/misskey-dev/misskey.git
git fetch upstream --tags
git config rerere.enabled true
git config rerere.autoupdate true
```

Stable updates are merged from official tags in a dedicated branch:

```sh
git switch main
git switch -c update/misskey-2026.8.0
git merge --no-ff 2026.8.0
```

Resolve only the conflicts required by that release, run both UI modes, and
merge the update pull request after review. Do not combine an upstream update
with a redesign, dependency cleanup, or branding change.

## Root integration ports

These are the intended narrow ports into Misskey. Every other FeatherMiss
implementation belongs below `packages/frontend/src/feathermiss/`.

| Upstream file | Purpose | Expected upstream modification |
| --- | --- | --- |
| `packages/frontend/src/boot/common.ts` | Resolve the build/preference switch and set `data-feathermiss` | Import `initializeFeatherMiss` and call it from the existing graphics watcher |
| `packages/frontend/src/feathermiss/preferences.ts` | Load and persist extension-owned UI graphics | Authenticated FeatherMiss API calls backed by the separate database |
| `packages/frontend/src/router.definition.ts` | Register Interface Studio | One route entry to `feathermiss/components/UiCustomizationPage.vue` |
| `packages/frontend/src/style.scss` | Load the downstream stylesheet after Misskey styles | One stylesheet import |
| `packages/frontend/src/pages/settings/index.vue` | Make Interface Studio discoverable in settings | One navigation entry |
| `packages/frontend/src/components/MkToast.vue` | Select the FeatherMiss toast while retaining Misskey fallback behavior | One conditional component port |
| `packages/frontend/src/utility/popup-position.ts` | Preserve the upstream import path while selecting the active popup algorithm | One re-export to the FeatherMiss popup adapter |

The direct upstream surface is intentionally narrow: boot, the Interface
Studio route and settings entry, the stylesheet import, the toast port, and
the popup-position compatibility adapter. Menus,
dialogs, navigation, composer, and transient popup components remain the
official Misskey implementations; FeatherMiss changes their shared visual
tokens and surfaces from its scoped stylesheet instead of forking each
component.

## Layer layout

```text
packages/frontend/src/feathermiss/
├── index.ts
├── config.ts
├── preferences.ts
├── components/
├── composables/
│   └── (future behavior ports only when an upstream hook is unavoidable)
├── utilities/
├── styles/
│   ├── tokens.scss
│   ├── surfaces.scss
│   ├── navigation.scss
│   └── index.scss
└── tests/
```

All FeatherMiss styles are rooted at `:root[data-feathermiss='enabled']`.
Disabling the preference or building with `FEATHERMISS_UI=0` removes the root
attribute and routes popup/context-menu behavior through the Misskey adapters.

## AI and translation

FeatherMiss runs inside the existing Misskey backend process. Its only
separate boundary is the PostgreSQL database configured by
`FEATHERMISS_DATABASE_URL`; it never creates a second service, package, or
Misskey database connection. That database owns FeatherMiss deployment state,
account/session linkage, UI preferences, extension state, and AI state without
foreign keys or joins to Misskey tables.

Set `FEATHERMISS_ENABLED=1` and configure the database values in `.env`:

```sh
FEATHERMISS_ENABLED=1
FEATHERMISS_AI_ENABLED=1
FEATHERMISS_DB_PASSWORD=replace-with-a-strong-password
FEATHERMISS_ENCRYPTION_KEY=$(openssl rand -hex 32)

docker compose up -d --build
```

Set `FEATHERMISS_ENCRYPTION_KEY` to a secret 32-byte key (64 hexadecimal
characters or base64) before configuring provider credentials. Then an
administrator enables AI and stores the provider through the protected
`feathermiss/admin/config/set` and `feathermiss/admin/provider/set` API
endpoints. Provider API keys are encrypted at rest and are never returned by
the read endpoint. The frontend calls the registered
`feathermiss/notes/translate` API endpoint. The
endpoint uses the authenticated token with Misskey's canonical `notes/show`
and `i` APIs, so FeatherMiss does not read Misskey note or policy tables; AI
cache rows live only in the FeatherMiss database. The deployment database kill
switch and
`FEATHERMISS_AI_KILL_SWITCH=1` immediately disable provider use without
disabling native Misskey translation.
Authenticated requests link the Misskey subject/user ID and granted scopes in
the FeatherMiss database. Embedded mode keeps the bearer token request-scoped
and does not persist passwords or tokens; logout removes the FeatherMiss
account/session linkage.

The administrator provider settings support both OpenAI-compatible Chat
Completions and Responses API providers. Select the matching provider mode and
enter the base URL (for example, `https://api.openai.com/v1`); FeatherMiss
appends `/chat/completions` or `/responses` according to that selection.

Provider retries, concurrency, circuit breaking, input-size limits, and cache
retention are deployment-controlled through the corresponding
`FEATHERMISS_AI_*` variables.

Account-scoped translation preferences are stored beside the UI preferences in
the FeatherMiss database. The translation settings page selects target
languages and explicitly opts into background work; an empty timeline list
does not create background jobs. Administrator provider/deployment controls
remain separate from these user preferences.

When an opted-in note is rendered by a native Misskey timeline, the host
adapter sends one batched enqueue request for the selected languages. Timeline
identifiers are stable host values: \`home\`, \`local\`, \`social\`, \`global\`, or a
scoped value such as \`list:<id>\`, \`channel:<id>\`, \`antenna:<id>\`, or
\`role:<id>\`. The queue is deduplicated by account, note, language, and source
fingerprint; completed jobs are not requeued when a note is remounted. Source
text is cleared after completion or dead-lettering.

Environment provider variables remain compatibility/bootstrap defaults for the
in-process service; the database-backed provider configuration is authoritative
after initialization and external providers stay disabled until an administrator
explicitly enables one. If the provider configuration or encryption key is
unavailable, AI is disabled while the
FeatherMiss database remains an optional state boundary. If that separate
database is unavailable, FeatherMiss features are disabled without preventing
the canonical Misskey backend from starting; the existing native Misskey
translation path remains available.

The base `compose.yml` includes the separate FeatherMiss PostgreSQL service
alongside the canonical database and Redis services. It starts with
`FEATHERMISS_ENABLED=0`, so native Misskey operation remains the safe default;
set the values above in `.env` to enable the extension. The FeatherMiss
database is never used as the canonical Misskey database.

## Podman

The same deployment can run with Podman. `podman compose` uses an external
Compose provider; if `podman compose version` reports that no provider is
available, install `podman-compose` (or another provider supported by your
Podman installation). On macOS, initialize and start a Podman VM once:

```sh
podman machine list
podman machine init --now  # only when the list is empty
# Otherwise start the machine name shown above, for example:
podman machine start Main
```

Prepare the normal Misskey configuration and start the stack with the Podman
override:

```sh
podman compose -f compose.yml -f compose.podman.yml config
podman compose -f compose.yml -f compose.podman.yml up -d --build
podman compose -f compose.yml -f compose.podman.yml ps
```

The override adds Podman bind-mount labels and rootless ownership handling to
the application, Redis, and both PostgreSQL data directories. The `:U` option
may update ownership under `files/`, `db/`, `redis/`, and `feathermiss-db/` on
first start; do not use it on directories shared with another host service.
Keep using the same two Compose files for later commands, for example:

```sh
podman compose -f compose.yml -f compose.podman.yml logs -f web
podman compose -f compose.yml -f compose.podman.yml down
```

## Release and update policy

Release tags preserve the upstream version:

```text
feathermiss-2026.7.0.1
feathermiss-2026.7.0.2
feathermiss-2026.8.0.1
```

Generate a patch only when publishing an artifact, never as a checked-in copy:

```sh
git diff misskey-upstream..main > FeatherMiss.patch
```

The scheduled upstream workflow may create a draft update branch and pull
request. It must not merge or deploy automatically.
