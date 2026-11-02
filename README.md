# EmDash workshop: Checkpoint B

Code for the hands-on EmDash CMS workshop at CMS Conf 2026 (12–14 Nov 2026), with Matt Kane and Harshil Agrawal.

**This branch is Checkpoint B.** The blog at the end of step 8 (Part 2, Automate), plus the `cover-images/` plugin starter for Part 3.

What's here:

- Everything in Checkpoint A.
- `src/pages/posts/[slug].astro`: a **Related posts** section, up to three other posts that share a tag.
- `cover-images/`: the plugin starter. Its README says what's done and what you write.

## Catching up

Fell behind? Paste the guide's catch-up prompt for this checkpoint into your coding agent. It fetches this branch with [giget](https://github.com/unjs/giget) and copies the code into your site, keeping your own Cloudflare config (`wrangler.jsonc`, `.env`).

## Branches

| Branch | What's in it |
| --- | --- |
| `checkpoint-a` | The blog after step 4: the `featured` and `subtitle` fields on the homepage |
| `checkpoint-b` | The blog after step 8, plus the `cover-images/` plugin starter |
| `checkpoint-c` | The finished `cover-images` plugin, with tests |

The site at the root is the EmDash [Blog template](https://github.com/emdash-cms/templates/tree/main/blog-cloudflare) for Cloudflare Workers, scaffolded with `pnpm create emdash@latest my-blog --template cloudflare:blog --no-sandboxed-plugins` on EmDash 1.4.0.

- [EmDash docs](https://docs.emdashcms.com/)
- [EmDash on GitHub](https://github.com/emdash-cms/emdash)

