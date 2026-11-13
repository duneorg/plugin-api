# Changelog

## 1.3.0 (2026-11-14)

Closes the gap between a plugin and the core it runs on (duneorg/dune#161).
Additive.

- `MIN_CORE_VERSION` (`"0.37.0"`): the oldest `@dune/core` that implements this
  version of the contract. It is raised in any release that adds something core
  must provide, and left alone for types, helpers and optional fields.
- `DunePlugin.requiresCore` (optional): how a plugin passes the contract's
  minimum core to core. Always set it to `MIN_CORE_VERSION`; the number belongs
  to the contract version, not to the plugin. Core 0.37.1 and later skip a
  plugin on an older core and log why; earlier cores ignore the field.
- `PLUGIN_API_VERSION` is `"1.3"`.

## 1.2.0 (2026-11-13)

Lets first-party plugins stop importing `@dune/core` (duneorg/dune#161).

Additive for code that **reads** these types. Code that **builds or mocks** them
(test doubles in plugin tests, fixtures) must add the new required members
before it type-checks again: `Page.media`, `ThemeLoader.theme`,
`SiteConfig.author`, `SiteConfig.metadata` and
`PluginEngine.getAvailableThemes()`. Everything else below is a new export or an
optional field.

- Content and URL helpers, one copy for every plugin that touches content files:
  `parseContentFilename`, `dirPathToRoute`, `isMediaFile`, `getMimeType`,
  `buildPageTitle`, `isRtl` (and the `ContentFileInfo` type). Core keeps its own
  implementations and tests that they agree.
- The admin-tier role ladder: `Role`, `ADMIN_ROLE_RANK`, `highestAdminRole`.
- `SearchConfigError`: a search engine plugin throws it for a failure that will
  not fix itself (a rejected API key). Core recognises it by `name`.
- `PLUGIN_API_VERSION` (`"1.2"`): the contract's major.minor.
- `SystemConfig.content.allow_tsx_format` (optional): the roles allowed to save
  TSX pages.
- Optional config fields the admin reads: `SiteConfig.feed`,
  `SiteConfig.workflow`, `LanguageConfig.rtl_override`,
  `SystemConfig.trusted_proxies`, `.metrics`, `.page_cache`, and
  `DuneConfig.pluginList`.
- **Required members** (core provides all of them): `Page.media`
  (`MediaFile[]`), `ThemeLoader.theme` (`manifest`, `templateNames`,
  `layoutNames`), `SiteConfig.author` (`{ name, email? }`),
  `SiteConfig.metadata` (`Record<string, string>`) and
  `PluginEngine.getAvailableThemes()`. New types: `MediaFile`, `ThemeManifest`.

## 1.1.0 (2026-11-12)

- `SessionManager.listForUser(userId)` and
  `SessionManager.revokeOthers(userId, keepSessionId)`: list a user's live
  sessions and end all but one. Additive; for "sign out other sessions" in an
  account page. Implementations of `SessionManager` must add both (core's does).

## 1.0.0 (2026-11-10)

First release: the plugin contract of Dune 0.36. It was declared in slices; this
is the full list.

Slice 1 (the parts that do not depend on the plugin object itself):

- `PluginApp`, `PluginRouteContext`: the structural app and route-context types,
  free of any web-framework type.
- `StorageAdapter` and its entry/stat/watch types.
- `ContentApi` and its result types; `PageIndex` (wider than the theme
  contract's: search engines hand entries back to core).
- The search-engine contract: `SearchEngine`, `SearchEngineCreateContext`
  (narrow: `register`, `setActiveEngine`, `pages`, `injectedRecords`,
  `loadText`; core's storage, config and format registry are not part of it),
  `SearchResult`, `SearchOptions`, `SearchFilter`, `FacetCounts`,
  `InjectedSearchRecord`, `SearchRecordsCollectContext`.
- `Submission` and related types; `BlueprintField` and its parts;
  `InlineEditManager`; `ScheduledAction`.
- `isDuneError` and `DuneErrorCode`.

Slice 2a (services and what they return):

- `PluginServices` and its parts: `SecurityService`, `RateLimitService`,
  `PasswordService`, `AuthzService`, `BlueprintService`, `SearchServices`,
  `PathServices`, `SessionService`, `UserService`, `EngineServices`.
- Identity, in the contract because any `editor.session` provider builds local
  login from it: `User`, `UserCreate`, `UserStore`, `Session`, `SessionManager`,
  `PasswordService`.
- `EngineServices` is `workflow`, `scheduler` and `staging` (`WorkflowEngine`,
  `Scheduler`, `StagingEngine`): core-owned subsystems an admin drives. Machine
  translation and the audit log are not here: they move into
  `@dune/plugin-admin`.
- `HistoryEngine`, `RecordInput`, `ContentRevision`, `ContentDiff`;
  `RateLimiter`, `RateLimitStore`, `Logger` and the security option types.

Slice 2b (the plugin object, hooks, capabilities and the runtime):

- `DunePlugin`, `PluginApi`, `MountApi`, `HookRegistry`, `HookContext`,
  `HookHandler`, `HookEvent` and the event payloads, `ResponseTransformContext`,
  `PublicRouteRegistration`. `HookHandler`, `setup`, `mount` and
  `transformResponse` are bivariant: core hands handlers a wider context than
  this package declares.
- Extension points belong to the plugin that reads them (#127). The admin's
  `AdminPageRegistration`, `AdminRouteRegistration` and `ContentEditorPlugin`
  (and the keys `admin.pages`, `admin.routes`, `admin.editor`) are declared by
  `@dune/plugin-admin`; the bar's `BarAction`, `BarActionContext` and
  `bar.actions` by `@dune/plugin-inline-edit`, as typed keys made with
  `capabilityKey<T>(name)` and named after the consuming plugin (`admin.*`,
  `bar.*`); unprefixed names are the contract's. `provide`, `contribute`, `get`
  and `list` accept a key. There is no module augmentation, so `Contributions`
  is gone and `Capabilities` is closed. `ResponseTransformContext` carries
  `capabilities` (the reader `MountApi` offers) instead of `adminPrefix` and
  `barActions`.
- Capabilities: `Capabilities` (slots), `CapabilityKey`, `capabilityKey`,
  `CapabilityContext`, `CapabilityFactory`, `CapabilityRegistrar`,
  `CapabilityReader`, `CapabilityProvider`, `RequestAuthenticator`,
  `ScheduledActionExecutor`.
- A narrow `DuneConfig` (`site`, `system.content.dir`, `system.languages`,
  `system.debug`, `theme.name`, `plugins`); `admin` config is not part of it.
- `AuthzRelation` and a structural `PluginAuthz` (`check`, `allow`,
  `disallowAllMatching`).
- `PluginRuntime` with narrow structural interfaces for what plugins call:
  `PluginEngine`, `RouteResolver`, `ThemeLoader`, `Page`, `PluginSearch`,
  `FlexEngine`, `SubmissionManager`, `SectionRegistry`, `MetricsCollector`,
  `JobScheduler`. `PluginEngine.switchTheme` does not persist the choice; the
  caller writes the config.

Out of the contract on purpose: `imageCache`, `engine.getAvailableThemes`,
`rebuildCount`, `indexErrors`, `resolve`, `serveMedia`.

Trimmed to what plugins read (measured against the first-party plugins and the
testing harness): `User` no longer declares `avatarUrl`, `lastSeenAt` or
`stripeCustomerId`. `providerId`, `linkedProviders` and the `UserStore` methods
`getByProvider`, `linkProvider` and `unlinkProvider` stay although no
first-party plugin uses them yet: an OAuth login provider is built from them.
`PageIndex` no longer declares `gated`, `roles`, `publishAt`, `unpublishAt`,
`fileUrl`, `termPageFor` or `coverImage`; it keeps `mtime` and `hash` (required
by core's search-result type; treat `hash` as opaque) and `extra` (read by the
Meilisearch plugin). Core's own types carry the omitted fields.

Slot added: `admin.prefix` (`AdminPrefix { readonly prefix: string }`), where
the admin is mounted. The admin provides it; core reads it instead of assuming
`/admin`. With no provider there is no admin.

- `InlineEditManager` gains
  `handleRequest(req, { editor, path, pageFrontmatter })` and loses `commit` /
  `patchFields`; `EditorIdentity` and `InlineEditRequestContext` are declared.
  Page-event payloads (`onPageMove`'s `PageMovePayload`, and the others by
  documentation) carry an optional `actor`.
- `EditorIdentity.relation` (`admin` | `editor` | `author`): the admin-tier
  relation core decided for the editor from the site's role grants, for
  providers that apply an ownership rule.
