import { assertEquals, assertStrictEquals } from "jsr:@std/assert@^1";
import {
  ADMIN_ROLE_RANK,
  buildPageTitle,
  dirPathToRoute,
  getMimeType,
  highestAdminRole,
  isDuneError,
  isMediaFile,
  isRtl,
  MIN_CORE_VERSION,
  parseContentFilename,
  PLUGIN_API_VERSION,
  SearchConfigError,
} from "../src/mod.ts";
import denoJson from "../deno.json" with { type: "json" };

Deno.test("parseContentFilename: template, format and language", () => {
  assertEquals(parseContentFilename("default.md"), {
    template: "default",
    format: "md",
    ext: ".md",
    raw: "default.md",
  });
  assertEquals(
    parseContentFilename("default.de.md", ["en", "de"])?.language,
    "de",
  );
  assertEquals(parseContentFilename("default.de.md")?.template, "default.de");
  assertEquals(
    parseContentFilename("01.my-article.md")?.template,
    "my-article",
  );
  assertEquals(parseContentFilename("page.tsx", ["en"])?.template, "self");
  assertStrictEquals(parseContentFilename("photo.jpg"), null);
  assertStrictEquals(parseContentFilename("noext"), null);
});

Deno.test("dirPathToRoute: strips numeric prefixes", () => {
  assertEquals(dirPathToRoute("04.blog/01.post"), "/blog/post");
  assertEquals(dirPathToRoute("04.blog"), "/blog");
  assertEquals(dirPathToRoute("_modules/hero"), "/modules/hero");
  assertEquals(dirPathToRoute(""), "");
  assertEquals(dirPathToRoute("."), "");
});

Deno.test("isMediaFile and getMimeType", () => {
  assertStrictEquals(isMediaFile("a.PNG"), true);
  assertStrictEquals(isMediaFile("a.md"), false);
  assertStrictEquals(isMediaFile("a"), false);
  assertEquals(getMimeType("x/y.PDF"), "application/pdf");
  assertEquals(getMimeType("x.unknown"), "application/octet-stream");
  assertEquals(getMimeType("noext"), "application/octet-stream");
});

Deno.test("buildPageTitle", () => {
  assertEquals(buildPageTitle(null, "Site"), "Site");
  assertEquals(
    buildPageTitle({ frontmatter: { title: "A" } }, "Site"),
    "A | Site",
  );
  assertEquals(
    buildPageTitle({ frontmatter: { title: "A", descriptor: "B" } }, "Site"),
    "A - B | Site",
  );
});

Deno.test("isRtl", () => {
  assertStrictEquals(isRtl("ar-SA"), true);
  assertStrictEquals(isRtl("de"), false);
  assertStrictEquals(isRtl("xx", ["xx"]), true);
});

Deno.test("highestAdminRole ignores content-gating tags", () => {
  assertEquals(highestAdminRole(["member", "editor", "author"]), "editor");
  assertEquals(highestAdminRole(["member"]), "");
  assertEquals(highestAdminRole(undefined), "");
  assertEquals(ADMIN_ROLE_RANK.admin > ADMIN_ROLE_RANK.editor, true);
});

Deno.test("SearchConfigError is recognisable by name", () => {
  const e = new SearchConfigError("rejected key");
  assertEquals(e.name, "SearchConfigError");
  assertStrictEquals(e instanceof Error, true);
  assertStrictEquals(isDuneError(e, "weak_password"), false);
});

Deno.test("PLUGIN_API_VERSION tracks deno.json's major.minor", () => {
  assertEquals(
    PLUGIN_API_VERSION,
    denoJson.version.split(".").slice(0, 2).join("."),
  );
});

Deno.test("MIN_CORE_VERSION is a readable version", () => {
  assertEquals(/^\d+\.\d+\.\d+$/.test(MIN_CORE_VERSION), true);
});
