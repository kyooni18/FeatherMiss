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
| `packages/frontend/src/preferences/def.ts` | Register the persisted UI graphics preference | Import the FeatherMiss preference type and add one `uiGraphics` entry |
| `packages/frontend/src/router.definition.ts` | Register Interface Studio | One route entry to `feathermiss/components/UiCustomizationPage.vue` |
| `packages/frontend/src/style.scss` | Load the downstream stylesheet after Misskey styles | One stylesheet import |
| `packages/frontend/src/pages/settings/index.vue` | Make Interface Studio discoverable in settings | One navigation entry |
| `packages/frontend/src/components/MkToast.vue` | Select the FeatherMiss toast while retaining Misskey fallback behavior | One conditional component port |
| `packages/frontend/src/utility/popup-position.ts` | Preserve the upstream import path while selecting the active popup algorithm | One re-export to the FeatherMiss popup adapter |

The direct upstream surface is intentionally seven files: boot, persisted
preference registration, the Interface Studio route and settings entry, the
stylesheet import, the toast port, and the popup-position compatibility
adapter. Menus,
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
