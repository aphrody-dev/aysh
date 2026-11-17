# aysh

The Aphrody shell: Bash 5.3, a terminal multiplexer and an agent surface in one binary, native on Windows, Linux and macOS.

[![ci](https://github.com/aphrody-dev/aysh/actions/workflows/ci.yml/badge.svg)](https://github.com/aphrody-dev/aysh/actions/workflows/ci.yml)
[![license](https://img.shields.io/github/license/aphrody-dev/aysh)](LICENSE)

## Why

A shell, a multiplexer and the tools around them usually assume a POSIX host, so Windows gets an emulation layer.
aysh assembles upstreams that are native everywhere instead, and replaces the ones that are not by a Rust equivalent or
a patched fork. It is an assembly, not a rewrite: the upstreams are forks tracked in [`aysh.toml`](aysh.toml).

## Status

The repository currently holds the upstream registry and the tool that applies it. The shell binary is not built yet.

| Part | Upstream | State |
| :-- | :-- | :-- |
| Bash 5.3 engine | [rubash](https://github.com/unixwin/rubash) | fork tracked |
| Interactive host | [niubash](https://github.com/unixwin/niubash), [ruline](https://github.com/unixwin/ruline) | forks tracked |
| PTY and VT core | [rio](https://github.com/raphamorim/rio) (`rio-vt`, `teletypewriter`) | fork tracked |
| Multiplexer | [psmux](https://github.com/psmux/psmux) on Windows, [tmux-rs](https://github.com/richardscollin/tmux-rs) on Unix | forks tracked |
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
```

## Development

```sh
bun test
```

Agent and contributor rules are in [AGENTS.md](AGENTS.md). Contributions follow the [organization guide](https://github.com/aphrody-labs/.github/blob/main/CONTRIBUTING.md). Report vulnerabilities as described in the [security policy](https://github.com/aphrody-labs/.github/blob/main/SECURITY.md).

## License

Apache-2.0, see [LICENSE](LICENSE). Each upstream keeps its own license in its fork.
