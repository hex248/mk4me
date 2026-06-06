# mk4me

Generate functions on the go

## Prerequisites

- [OpenCode](https://opencode.ai) or [Claude Code](https://claude.com/product/claude-code) or [Open AI Codex](https://developers.openai.com/codex/cli) installed
- [Bun](https://bun.sh) installed

## Usage

Install dependencies
```bash
bun install
```

Run playground script which will demonstrate function generation and recall

```bash
bun opencode|claude|codex
```

OR

Compile/generate functions before runtime
```bash
bun purge # if needed - deletes all generated functions
bun compile . # generates all needed functions for any .ts files in the current directory.
bun opencode|claude|codex
```

See `playground.ts` for examples.

## Environment Variables
(bold is default)

`HARNESS`: **`opencode`**|`claude`|`codex`<br/>
`MODEL`: **`openai/gpt-5.4-fast`**|`claude-sonnet-4-6`|`gpt-5.4-mini`<br/>
`LOG_PATH` **`logs`**|`some_directory_for_logs`<br/>
`DEBUG_LEVEL` `NONE`|`ERROR`|`WARN`|**`INFO`**|`DEBUG`
