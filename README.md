# mk4me

Generate functions on the go

## Prerequisites
- [OpenCode](https://opencode.ai/) installed
- ChatGPT/OpenAI plan linked, with access to GPT 4.5 Fast (`openai/gpt-4.5-fast`)

## Usage
Install dependencies
```bash
bun install
```
Run playground script which will demonstrate function generation and recall
```bash
bun run playground.ts
```
## Todo

- Add claude code support via AGENT env variable
- Add codex support via AGENT env variable
- Add compilation module
  - Will scower through codebase looking for ungenerated/missing functions, and pregenerate them
