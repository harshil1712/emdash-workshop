# EmDash workshop: Checkpoint A

Code for the hands-on EmDash CMS workshop at CMS Conf 2026 (12–14 Nov 2026), with Matt Kane and Harshil Agrawal.

**This branch is Checkpoint A.** The blog at the end of step 4 (Part 1, Ship): the Blog template, with the homepage's featured post card showing the newest post marked `featured`, and its `subtitle`.

What's here:

- `src/pages/index.astro` and `src/components/PostCard.astro`: the featured post card.
- `emdash-env.d.ts`: the `featured` and `subtitle` fields on `Post`.

## Catching up

Fell behind? Paste the guide's catch-up prompt for this checkpoint into your coding agent. It fetches this branch with [giget](https://github.com/unjs/giget) and copies the code into your site, keeping your own Cloudflare config (`wrangler.jsonc`, `.env`).

Your live site needs the two fields: in the admin, under **Content Types → Posts**, add a Boolean labelled `Featured` and a Short Text labelled `Subtitle`, with every switch off.

## Branches

| Branch | What's in it |
| --- | --- |
| `checkpoint-a` | The blog after step 4: the `featured` and `subtitle` fields on the homepage |
| `checkpoint-b` | The blog after step 8, plus the `cover-images/` plugin starter |
| `checkpoint-c` | The finished `cover-images` plugin, with tests |

The site at the root is the EmDash [Blog template](https://github.com/emdash-cms/templates/tree/main/blog-cloudflare) for Cloudflare Workers, scaffolded with `pnpm create emdash@latest my-blog --template cloudflare:blog --no-sandboxed-plugins` on EmDash 1.4.0.

- [EmDash docs](https://docs.emdashcms.com/)
- [EmDash on GitHub](https://github.com/emdash-cms/emdash)

