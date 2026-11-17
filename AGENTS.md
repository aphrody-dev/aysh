# AGENTS.md

Contract for every agent working in aysh. Names, hosts and upstreams come from `aysh.toml`.

## Scope

- aysh is the Aphrody shell: one multi-call binary (`aysh`, with `bash`, `sh` and `tmux` faces) native on Windows, Linux
  and macOS, assembled from upstream forks. It depends on no other Aphrody repository.
- Upstreams that are not native on Windows are absorbed as a Rust equivalent or as a patched fork: GNU bash by rubash,
  tmux by psmux (Windows) and tmux-rs (Unix). GPL code (GNU bash) is a test corpus and an oracle only; it is never linked.

## Rules

- Assemble upstream first: a registry package when no patch is needed, a fork vendored as a submodule when one is.
  Never copy an upstream's code into this tree.
- `aysh.toml` is the only list of upstreams. `bun tools/stack.ts` creates the forks, writes `.gitmodules` (relative URLs
  to the forks) and pins the gitlinks; `.gitmodules` is never edited by hand.
- Patches to an upstream live in its fork, on the fork's followed branch, merged with upstream by merge commit: no
  force-push, no rebase of a published branch.
- No prototypes, scaffolds or placeholders: add a folder only with a working, tested unit.
- Nothing hardcoded: no absolute path, host or account literal in tracked files.
- Heavy builds and fork merges run on the `build` host of `aysh.toml`, conformance corpora and oracles on the `test`
  host, never on a workstation.
- Work on `main`; commit by path; no branches, worktrees, stash or reset; no AI attribution in commits.
- A feature is done only with a proof: a test id, an inspected screenshot or a checked response, never a status code.

## Checks

```sh
bun test                    # tools
bun tools/stack.ts status   # forks against their upstreams, gitlinks against their forks; exits 1 on drift
```
