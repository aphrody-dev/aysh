#!/usr/bin/env bun
/**
 * Runs a command on a host of aysh.toml against a copy of this working tree, so heavy builds never run on a workstation.
 *
 *   bun tools/remote.ts build cargo test -p aysh-pty
 *   bun tools/remote.ts test cargo test --workspace
 *
 * The role (`build`, `test`) selects the ssh alias in [hosts]; the tree lands under [paths.build].work/src. Only files
 * git knows or would add are copied (tracked and untracked, ignored files excluded), and files deleted here are deleted
 * there. A vendored fork is not copied: the host fetches the commit this tree pins from the fork and links it in place.
 * The build directory and the fetched forks live next to the copy and are kept between runs.
 */

import { resolve } from "node:path";
import { load } from "./stack.ts";

/** One POSIX shell word. */
export function word(arg: string): string {
  return /^[A-Za-z0-9_@%+=:,./-]+$/.test(arg) ? arg : `'${arg.replaceAll("'", `'\\''`)}'`;
}

/** The script run on the host once the tree is in place. */
export function remoteScript(work: string, argv: readonly string[]): string {
  const env = [`CARGO_TARGET_DIR=${word(`${work}/target/aysh`)}`, "CARGO_INCREMENTAL=0", "CARGO_PROFILE_DEV_DEBUG=0"];
  return `cd ${word(`${work}/src`)} && env ${env.join(" ")} ${argv.map(word).join(" ")}`;
}

/** The script that replaces the remote tree by the tar stream on its stdin, keeping nothing that is not in the stream. */
export function receiveScript(work: string): string {
  const src = word(`${work}/src`);
  return `rm -rf ${src} && mkdir -p ${src} && tar -xf - -C ${src}`;
}

/** A vendored fork as this tree pins it. */
export interface Pin {
  path: string;
  url: string;
  sha: string;
}

/** The script that checks out every pinned fork beside the copy and links it at its path inside the copy. */
export function vendorScript(work: string, pins: readonly Pin[]): string {
  return pins
    .map(p => {
      const dir = word(`${work}/vendor/${p.path}`);
      const link = word(`${work}/src/${p.path}`);
      return [
        `{ test -d ${dir}/.git || git init -q ${dir}; }`,
        `git -C ${dir} fetch -q --depth 1 ${word(p.url)} ${p.sha}`,
        `git -C ${dir} checkout -q --detach ${p.sha}`,
        `mkdir -p "$(dirname ${link})"`,
        `ln -sfn ${dir} ${link}`,
      ].join(" && ");
    })
    .join(" && ");
}

if (import.meta.main) {
  const [role, ...argv] = process.argv.slice(2);
  const reg = await load();
  const host = role ? reg.hosts[role] : undefined;
  const work = reg.paths?.build?.work;
  if (!host || !work || argv.length === 0) {
    console.error(`usage: bun tools/remote.ts <${Object.keys(reg.hosts).join("|")}> <command...>`);
    process.exit(2);
  }
  // The copy is removed before each run: refuse a work directory that is not a dedicated absolute subdirectory.
  if (!/^\/[^/\s]+\/[^/\s]+/.test(work)) throw new Error(`[paths.build].work "${work}" is not an absolute path two levels deep`);
  const root = resolve(import.meta.dirname, "..");
  const listed = Bun.spawnSync(["git", "ls-files", "-z", "--cached", "--others", "--exclude-standard"], { cwd: root });
  const staged = Bun.spawnSync(["git", "ls-files", "-s"], { cwd: root });
  if (listed.exitCode !== 0 || staged.exitCode !== 0) throw new Error(listed.stderr.toString() + staged.stderr.toString());
  const pins: Pin[] = [];
  for (const line of staged.stdout.toString().split("\n")) {
    const m = line.match(/^160000 ([0-9a-f]{40}) \d\t(.+)$/);
    if (!m) continue;
    const fork = reg.upstream.find(u => u.path === m[2]);
    if (!fork) throw new Error(`${m[2]} is a gitlink that aysh.toml does not list`);
    if (fork.mode === "source") pins.push({ path: m[2]!, url: `https://github.com/${reg.product.forks}/${fork.name}.git`, sha: m[1]! });
  }
  // A gitlink is listed as one entry and is not a file, so the loop below leaves it out of the copy.
  const files = listed.stdout.toString().split("\0").filter(Boolean);
  const present: string[] = [];
  for (const file of files) if (await Bun.file(resolve(root, file)).exists()) present.push(file);

  const tar = Bun.spawn(["tar", "-cf", "-", "--null", "-T", "-"], { cwd: root, stdin: "pipe", stdout: "pipe", stderr: "inherit" });
  tar.stdin.write(present.join("\0"));
  await tar.stdin.end();
  const receive = Bun.spawn(["ssh", "-o", "BatchMode=yes", host, receiveScript(work)], { stdin: tar.stdout, stdout: "inherit", stderr: "inherit" });
  if ((await tar.exited) !== 0 || (await receive.exited) !== 0) throw new Error(`could not copy the tree to ${host}`);
  if (pins.length) {
    const vendor = Bun.spawn(["ssh", "-o", "BatchMode=yes", host, vendorScript(work, pins)], { stdin: "ignore", stdout: "inherit", stderr: "inherit" });
    if ((await vendor.exited) !== 0) throw new Error(`could not fetch the vendored forks on ${host}`);
  }

  const run = Bun.spawn(["ssh", "-o", "BatchMode=yes", host, remoteScript(work, argv)], { stdin: "ignore", stdout: "inherit", stderr: "inherit" });
  process.exit(await run.exited);
}
