# Cover Images

A sandboxed [EmDash](https://docs.emdashcms.com/) plugin, built during the EmDash workshop at CMS Conf 2026. It generates a cover image for a post with [FLUX.2 [klein] 4B](https://replicate.com/black-forest-labs/flux-2-klein-4b) on Replicate, and blocks publishing a post that has no cover.

## What's in the starter

Already done:

- The scaffold from `emdash-plugin init`, with the test setup.
- The Settings page (`admin` route), in Block Kit. It saves the Replicate token through `ctx.settings` and never sends it back.
- The editor-action wiring: `editorEntry()` reads the post the editor clicked on, and `editorReply()` turns a result into a toast.

You write, following the workshop guide:

| Step | What |
| --- | --- |
| 10 | The trust contract in `emdash-plugin.jsonc`: capabilities, allowed hosts, the secret setting and the editor action |
| 11 | `generateCover(ctx, postId)` in `src/plugin.ts` |
| 12 | The editor and agent entry points: two private routes and an MCP tool |
| 13 | The publish rule: `content:beforePublish` and `content:beforeSchedule` hooks, with tests |

Look for `TODO(step N)` in the code.

## Develop

```sh
pnpm install
pnpm run validate
pnpm run typecheck
pnpm run test
pnpm run build
```

`pnpm run test` builds the plugin and runs the tests in a real sandbox, through EmDash's production wrapper and host bridge.

To use it in your site, run `pnpm add file:../cover-images` in the site, then add it to `plugins: []` (Workers Free) or `sandboxed: []` (Workers Paid) in `astro.config.mjs`. The workshop guide's step 14 walks through it.

After changing the plugin, bump `version` in `package.json`, run `pnpm run build`, and run `pnpm add file:../cover-images` in the site again before you deploy. pnpm copies the package instead of linking it, and EmDash caches a sandboxed plugin by its ID and version, so with the same version the site keeps running the old code.
