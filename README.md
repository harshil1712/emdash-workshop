# EmDash workshop: Checkpoint C

Code for the hands-on EmDash CMS workshop at CMS Conf 2026 (12–14 Nov 2026), with Matt Kane and Harshil Agrawal.

**This branch is Checkpoint C.** The blog as in Checkpoint B, with the finished `cover-images/` plugin at the end of step 13 (Part 3, Extend).

What's here:

- `cover-images/emdash-plugin.jsonc`: the trust contract.
- `cover-images/src/plugin.ts`: `generateCover`, the editor action and MCP tool routes, and the publish rule.
- `cover-images/tests/plugin.test.ts`: tests for the publish rule.

## Catching up

Fell behind? Paste the guide's catch-up prompt for this checkpoint into your coding agent. It fetches this branch with [giget](https://github.com/unjs/giget) and copies the code into your site, keeping your own Cloudflare config (`wrangler.jsonc`, `.env`).

Your own `publisher` in `emdash-plugin.jsonc` is the only thing to keep from your version.

## Branches

| Branch | What's in it |
| --- | --- |
| `checkpoint-a` | The blog after step 4: the `featured` and `subtitle` fields on the homepage |
| `checkpoint-b` | The blog after step 8, plus the `cover-images/` plugin starter |
| `checkpoint-c` | The finished `cover-images` plugin, with tests |

The site at the root is the EmDash [Blog template](https://github.com/emdash-cms/templates/tree/main/blog-cloudflare) for Cloudflare Workers, scaffolded with `pnpm create emdash@latest my-blog --template cloudflare:blog --no-sandboxed-plugins` on EmDash 1.4.0.

- [EmDash docs](https://docs.emdashcms.com/)
- [EmDash on GitHub](https://github.com/emdash-cms/emdash)

