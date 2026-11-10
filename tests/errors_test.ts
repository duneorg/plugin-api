import { assertEquals } from "jsr:@std/assert@^1";
import { isDuneError } from "../src/mod.ts";

Deno.test("isDuneError tells an error by its code, not its class", () => {
  assertEquals(isDuneError({ code: "ssrf_blocked" }, "ssrf_blocked"), true);
  assertEquals(isDuneError({ code: "ssrf_blocked" }, "weak_password"), false);
  // A plain Error, a string and null are not Dune errors.
  assertEquals(isDuneError(new Error("x"), "ssrf_blocked"), false);
  assertEquals(isDuneError("ssrf_blocked", "ssrf_blocked"), false);
  assertEquals(isDuneError(null, "ssrf_blocked"), false);
});
