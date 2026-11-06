# Changelog

## 1.0.0 (unreleased, in progress)

Declared so far (slice 1, the parts that do not depend on the plugin object
itself):

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
- Identity, in the contract because any `auth.session` provider builds local
  login from it: `User`, `UserCreate`, `UserStore`, `Session`, `SessionManager`,
  `PasswordService`.
- `EngineServices` is `workflow`, `scheduler` and `staging` (`WorkflowEngine`,
  `Scheduler`, `StagingEngine`): core-owned subsystems an admin drives. Machine
  translation and the audit log are not here: they move into
  `@dune/plugin-admin`.
- `HistoryEngine`, `RecordInput`, `ContentRevision`, `ContentDiff`;
  `RateLimiter`, `RateLimitStore`, `Logger` and the security option types.

Still to come: `DunePlugin`, `PluginApi`, `MountApi`, `HookRegistry` and the
hook events, `PluginRuntime`, `PluginServices`, the capability types.
