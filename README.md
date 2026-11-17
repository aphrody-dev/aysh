# aysh

The Aphrody shell: Bash 5.3, a terminal multiplexer and an agent surface in one binary, native on Windows, Linux and macOS.

[![ci](https://github.com/aphrody-dev/aysh/actions/workflows/ci.yml/badge.svg)](https://github.com/aphrody-dev/aysh/actions/workflows/ci.yml)
[![license](https://img.shields.io/github/license/aphrody-dev/aysh)](LICENSE)

## Why

A shell, a multiplexer and the tools around them usually assume a POSIX host, so Windows gets an emulation layer.
aysh assembles upstreams that are native everywhere instead, and replaces the ones that are not by a Rust equivalent or
a patched fork. It is an assembly, not a rewrite: the upstreams are forks tracked in [`aysh.toml`](aysh.toml).

## Status

The repository holds the upstream registry, the tools that apply it, and two units: `aysh`, the shell (GNU Bash 5.3
through rubash, with the niubash interactive host), and `aysh-pty`, a program on a pseudo-terminal with its screen.

| Part | Upstream | State |
| :-- | :-- | :-- |
| Bash 5.3 engine | [rubash](https://github.com/unixwin/rubash) | `crates/aysh`, built from the fork |
| Interactive host | [niubash](https://github.com/unixwin/niubash), [ruline](https://github.com/unixwin/ruline) | `crates/aysh`, built from the forks (launcher exposed as a library) |
| PTY and VT core | [rio](https://github.com/raphamorim/rio) (`rio-vt`, `teletypewriter`) | `crates/aysh-pty`, built from the fork |
| Multiplexer | [psmux](https://github.com/psmux/psmux), ported to Unix in the fork | fork patched, not vendored yet |
| Terminal tests | [tui-test](https://github.com/microsoft/tui-test) | fork tracked |
| Agent | [fx](https://github.com/vercel-labs/fx) | fork tracked |
| Web terminal | [wterm](https://github.com/vercel-labs/wterm), [just-bash](https://github.com/vercel-labs/just-bash) | forks tracked |

GNU bash is used as a conformance corpus and a reference oracle only; none of its code is linked.

## Usage

```sh
bun tools/stack.ts status    # forks against their upstreams, gitlinks against their forks
bun tools/stack.ts forks     # create missing forks, fast-forward the ones without commits of their own
bun tools/stack.ts modules   # write .gitmodules and add missing submodules
bun tools/stack.ts pin       # move every gitlink to its fork's tip

bun tools/remote.ts build cargo test --workspace --locked   # run a command on the build host against this tree

bun tools/shells.ts          # install the shell and terminal configuration of config/ on this machine
bun tools/shells.ts --check  # report every difference (exit 1)
```

## Shell configuration

`config/` is the configuration of the shells and terminal tools (bash family and PowerShell profiles, starship, atuin,
yazi, helix, lazygit, ...); `tools/shells.ts` installs it. `config/env.toml` is the single source of the environment: the
installer generates `env.sh` and `env.ps1` from it into the shell cache directory, with the workspace root (`SRC_ROOT`,
the parent of this checkout) derived at that moment. The `~/.bashrc`, `~/.bash_profile` and `~/.niubashrc` stubs source
`config/bash` from this checkout; PowerShell profiles, starship and the other tool configs are copies. A tool that is not
on PATH gets no file, and the git, bun and `ay` completions are taken from the installed tools. `config/links.toml` lists
what goes where.

## Development

```sh
bun test
bun tools/remote.ts build cargo test --workspace --locked
```

Rust builds run on the build host named in `aysh.toml`, never on a workstation.

Agent and contributor rules are in [AGENTS.md](AGENTS.md). Contributions follow the [organization guide](https://github.com/aphrody-labs/.github/blob/main/CONTRIBUTING.md). Report vulnerabilities as described in the [security policy](https://github.com/aphrody-labs/.github/blob/main/SECURITY.md).

## License

Apache-2.0, see [LICENSE](LICENSE). Each upstream keeps its own license in its fork.
