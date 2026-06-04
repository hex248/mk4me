# mk4me

Generate functions on the go

## Prerequisites

- [OpenCode](https://opencode.ai/) or [Claude Code](https://claude.com/product/claude-code) or [Open AI Codex](https://developers.openai.com/codex/cli) installed

## Usage

Install dependencies

```bash
bun install
```

Run playground script which will demonstrate function generation and recall

```bash
bun opencode|claude|codex
```

## Environment Variables

`HARNESS`: `opencode`|`claude`|`codex`
`MODEL`: `openai/gpt-5.4-fast`|`claude-sonnet-4-6`|`gpt-5.4-mini`

## Todo

- Add compilation module
  - Will scower through codebase looking for ungenerated/missing functions, and pregenerate them
