import { expect, test } from "bun:test";
import { receiveScript, remoteScript, vendorScript, word } from "./remote.ts";

test("a shell word is quoted only when it needs to be", () => {
  expect(word("cargo")).toBe("cargo");
  expect(word("--features=a,b")).toBe("--features=a,b");
  expect(word("two words")).toBe("'two words'");
  expect(word("it's")).toBe(`'it'\\''s'`);
  expect(word("$HOME;rm")).toBe("'$HOME;rm'");
  expect(word("")).toBe("''");
});

test("the remote command runs in the copied tree with the build directory beside it", () => {
  expect(remoteScript("/work/aysh", ["cargo", "test", "-p", "aysh-pty", "--", "a b"])).toBe(
    "cd /work/aysh/src && env CARGO_TARGET_DIR=/work/aysh/target/aysh CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 cargo test -p aysh-pty -- 'a b'",
  );
});

test("the remote tree is replaced, never merged, and the build directory is outside it", () => {
  expect(receiveScript("/work/aysh")).toBe("rm -rf /work/aysh/src && mkdir -p /work/aysh/src && tar -xf - -C /work/aysh/src");
  expect(remoteScript("/work/aysh", ["true"])).toContain("CARGO_TARGET_DIR=/work/aysh/target/aysh ");
});

test("a vendored fork is fetched at its pinned commit beside the copy and linked into it", () => {
  const sha = "c".repeat(40);
  expect(vendorScript("/work/aysh", [{ path: "third_party/rio", url: "https://example.org/labs/rio.git", sha }])).toBe(
    [
      "{ test -d /work/aysh/vendor/third_party/rio/.git || git init -q /work/aysh/vendor/third_party/rio; }",
      `git -C /work/aysh/vendor/third_party/rio fetch -q --depth 1 https://example.org/labs/rio.git ${sha}`,
      `git -C /work/aysh/vendor/third_party/rio checkout -q --detach ${sha}`,
      'mkdir -p "$(dirname /work/aysh/src/third_party/rio)"',
      "ln -sfn /work/aysh/vendor/third_party/rio /work/aysh/src/third_party/rio",
    ].join(" && "),
  );
  expect(vendorScript("/work/aysh", [])).toBe("");
});
