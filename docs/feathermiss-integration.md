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
| `packages/frontend/src/os.ts` | Port context-menu selection | One call through `feathermiss/utilities/context-menu-layout.ts` |
| `packages/frontend/src/components/MkContextMenu.vue` | Port popup positioning | One import through the FeatherMiss popup adapter |
| `packages/frontend/src/components/MkModal.vue` | Port motion duration | One import through the FeatherMiss config adapter |
| `packages/frontend/src/components/MkToast.vue` | Port toast stacking | One import through the FeatherMiss utility |
| `packages/frontend/src/utility/popup-position.ts` | Preserve the upstream import path while selecting the active popup algorithm | One re-export to the FeatherMiss popup adapter |
| `packages/frontend/src/components/MkStreamingNotesTimeline.vue` | Mark the two streaming-timeline surfaces for the downstream stylesheet | Two stable marker classes |
| `packages/frontend/src/components/MkTooltip.vue` | Port popup positioning | One import through the FeatherMiss popup adapter |
| `packages/frontend/src/components/MkUrlPreviewPopup.vue` | Port popup positioning | One import through the FeatherMiss popup adapter |
| `packages/frontend/src/components/MkUserPopup.vue` | Port popup positioning | One import through the FeatherMiss popup adapter |

The remaining direct ports below are intentionally explicit. They are the
small set of upstream files that still need behavioral or structural hooks;
every one has an owner during an update PR.

| File | Migration owner |
| --- | --- |
| `packages/frontend/src/components/MkAutocomplete.vue` | Move presentation hooks to FeatherMiss composables |
| `packages/frontend/src/components/MkDialog.vue` | Move surface styling to scoped FeatherMiss styles |
| `packages/frontend/src/components/MkMenu.child.vue` | Move menu styling to FeatherMiss styles |
| `packages/frontend/src/components/MkMenu.vue` | Move menu layout hooks to FeatherMiss utilities |
| `packages/frontend/src/components/MkPopupMenu.vue` | Move drawer styling to FeatherMiss styles |
| `packages/frontend/src/components/MkPostForm.vue` | Move note composer styling to FeatherMiss styles |
| `packages/frontend/src/components/MkStreamingNotesTimeline.vue` | Move note presentation hook to FeatherMiss |
| `packages/frontend/src/ui/_common_/mobile-footer-menu.vue` | Move navigation styling to FeatherMiss styles |
| `packages/frontend/src/ui/_common_/navbar-h.vue` | Move navigation styling to FeatherMiss styles |
| `packages/frontend/src/ui/_common_/navbar.vue` | Move navigation styling to FeatherMiss styles |
| `packages/frontend/src/ui/_common_/mobile-footer-menu.vue` | Delegate dock spacing to the FeatherMiss utility and retain the upstream shell |
| `packages/frontend/src/ui/_common_/PreferenceRestore.vue` | Mark the upstream suggestion for scoped surface styling |
| `packages/frontend/src/ui/_common_/ReloadSuggestion.vue` | Mark the upstream suggestion for scoped surface styling |
| `packages/frontend/src/ui/_common_/announcements.vue` | Mark the upstream announcement banner for scoped surface styling |
| `packages/frontend/src/pages/settings/index.vue` | Keep one link to Interface Studio |

## Layer layout

```text
packages/frontend/src/feathermiss/
├── index.ts
├── config.ts
├── preferences.ts
├── components/
├── composables/
│   ├── instance-icon.ts
│   └── mobile-dock-spacing.ts
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
