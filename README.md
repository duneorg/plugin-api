# @dune/plugin-api

The contract between [Dune CMS](https://getdune.org) and its plugins, as types.

A leaf package: no dependency on `@dune/core` or `@dune/theme-api`. Core imports
it and type-tests that what it hands a plugin is assignable to these
declarations, and that what a plugin hands in is accepted by core.

Born at 1.0.0 (no release candidate) together with Dune 0.36. See `CHANGELOG.md`
for what it declares.
