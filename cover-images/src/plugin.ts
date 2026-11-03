import type {
	ContentPolicyEvent,
	PluginContext,
	SandboxedPlugin,
	SandboxedRouteContext,
} from "emdash/plugin";
import { z } from "zod";

/**
 * Cover Images: generates an AI cover image for a post with FLUX.2 [klein] 4B on
 * Replicate, and blocks publishing a post without one.
 *
 * This is the workshop's Checkpoint C: the finished plugin.
 */

/** What `generateCover` returns to every entry point. */
export type CoverResult = { ok: true; mediaId: string; url: string } | { ok: false; error: string };

/** The settings key that holds the Replicate API token. */
export const TOKEN_KEY = "replicateToken";

// ── generateCover (step 11) ──────────────────────────────────────────────────

const REPLICATE_PREDICTIONS =
	"https://api.replicate.com/v1/models/black-forest-labs/flux-2-klein-4b/predictions";

/** An image field value, as far as this plugin cares. */
function existingCover(value: unknown): { id: string; src?: string } | null {
	if (!isRecord(value) || typeof value.id !== "string" || !value.id) return null;
	return { id: value.id, src: typeof value.src === "string" ? value.src : undefined };
}

function text(value: unknown): string {
	return typeof value === "string" ? value.trim() : "";
}

/**
 * Generates a cover for a post, stores it in the media library, and sets it as
 * the post's `featured_image`. Every entry point calls this one function.
 */
export async function generateCover(ctx: PluginContext, postId: string): Promise<CoverResult> {
	const { content, media, http } = ctx;
	if (!content?.update || !media?.upload || !http) {
		return { ok: false, error: "The plugin is missing a capability. Check emdash-plugin.jsonc." };
	}

	// 1. Read the post. If it already has a cover, return it: calling this twice is safe.
	// `get` returns the saved post, not a pending draft. A cover we staged, or an
	// editor removing one, only exists in the draft, so read that when there is one.
	const post = await content.get("posts", postId);
	if (!post) return { ok: false, error: `No post with ID ${postId}.` };
	let data = post.data;
	if (post.draftRevisionId && content.getRevision) {
		const draft = await content.getRevision("posts", postId, post.draftRevisionId);
		if (draft) data = { ...post.data, ...draft.data };
	}
	const cover = existingCover(data.featured_image);
	if (cover) return { ok: true, mediaId: cover.id, url: cover.src ?? "" };

	const title = text(data.title) || "Untitled";
	const excerpt = text(data.excerpt);
	const prompt = [
		`An editorial illustration for a blog post titled "${title}".`,
		excerpt && `The post is about: ${excerpt}`,
		"Modern, clean composition. No text, letters or words anywhere in the image.",
	]
		.filter(Boolean)
		.join(" ");

	// 2. The token, stored encrypted by the host.
	const token = await ctx.settings.get<string>(TOKEN_KEY);
	if (!token) {
		return {
			ok: false,
			error: "Add a Replicate API token first: in the admin sidebar, open Settings under Plugins.",
		};
	}

	// 3. Ask Replicate. `Prefer: wait` holds the request open until the image is
	// ready, and `Cancel-After` stops it before the sandbox's 30 s wall time. No polling.
	const res = await http.fetch(REPLICATE_PREDICTIONS, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
			Prefer: "wait=20",
			"Cancel-After": "25s",
		},
		body: JSON.stringify({
			input: { prompt, aspect_ratio: "16:9", output_format: "webp" },
		}),
	});
	const prediction: unknown = await res.json().catch(() => null);
	if (!res.ok || !isRecord(prediction)) {
		const detail = isRecord(prediction) && typeof prediction.detail === "string" ? `: ${prediction.detail}` : "";
		return { ok: false, error: `Replicate returned ${res.status}${detail}` };
	}
	if (prediction.status !== "succeeded") {
		return {
			ok: false,
			error: `The image wasn't ready in time (status: ${String(prediction.status)}). Try again.`,
		};
	}
	const output = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
	if (typeof output !== "string") return { ok: false, error: "Replicate returned no image." };

	// 4. Download it straight away: Replicate deletes API outputs after an hour.
	const image = await http.fetch(output);
	if (!image.ok) return { ok: false, error: `Couldn't download the image (${image.status}).` };
	const bytes = await image.arrayBuffer();

	// 5. Keep our own copy in the media library.
	const { mediaId, url } = await media.upload("cover.webp", "image/webp", bytes);

	// 6. Set it as the cover. On a published post this stages a draft.
	await content.update("posts", postId, {
		featured_image: { id: mediaId, src: url, alt: `Cover image for "${title}"` },
	});

	return { ok: true, mediaId, url };
}

// ── Publish rule (step 13) ───────────────────────────────────────────────────

export const COVER_REQUIRED = "Add a cover image (try Generate cover).";

/** No cover, no publish. Runs on every path that publishes or schedules a post. */
async function requireCover(event: ContentPolicyEvent) {
	if (event.collection !== "posts") return;
	const data = isRecord(event.content.data) ? event.content.data : {};
	if (!existingCover(data.featured_image)) {
		return { cancel: true as const, reason: COVER_REQUIRED };
	}
}

// ── MCP tool input (step 12) ─────────────────────────────────────────────────

const generateCoverInput = z.object({ postId: z.string() });

// ── Settings page (done for you) ─────────────────────────────────────────────

/**
 * The plugin's Settings page, in Block Kit. The admin renders it; no plugin
 * code runs in the browser. The token goes through `ctx.settings`, which
 * encrypts it once the manifest declares `replicateToken` as a secret (step 10).
 */
function settingsPage(hasToken: boolean) {
	return {
		blocks: [
			{ type: "header", text: "Cover Images" },
			{
				type: "section",
				text: "Generates a cover image for a post with FLUX.2 [klein] 4B on Replicate, about $0.001 an image. Paste a Replicate API token below. It's stored encrypted, and this page never shows it again.",
			},
			hasToken
				? { type: "banner", title: "A Replicate token is saved.", variant: "default" }
				: {
						type: "banner",
						title: "No Replicate token yet.",
						description: "Generate cover won't work until you save one.",
						variant: "alert",
					},
			{
				type: "form",
				block_id: "settings",
				fields: [
					{
						type: "secret_input",
						action_id: TOKEN_KEY,
						label: "Replicate API token",
						placeholder: hasToken ? "Paste a new token to replace the saved one" : "r8_…",
						has_value: hasToken,
					},
				],
				submit: { label: "Save", action_id: "save" },
			},
			{
				type: "actions",
				elements: [
					{
						type: "link",
						label: "Get a token from Replicate",
						target: { kind: "external", url: "https://replicate.com/account/api-tokens" },
					},
					...(hasToken
						? [
								{
									type: "button",
									action_id: "remove_token",
									label: "Remove token",
									style: "danger",
									confirm: {
										title: "Remove the Replicate token?",
										text: "Generate cover stops working until you save a new one.",
										confirm: "Remove",
										deny: "Cancel",
									},
								},
							]
						: []),
				],
			},
		],
	};
}

async function hasToken(ctx: PluginContext): Promise<boolean> {
	const token = await ctx.settings.get<string>(TOKEN_KEY);
	return typeof token === "string" && token.length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null;
}

// ── Editor-action wiring (done for you) ──────────────────────────────────────

/**
 * The saved post an editor action was clicked on. The host reloads the entry
 * and checks the caller before it calls the route, so trust this, not the
 * request body.
 */
export function editorEntry(routeCtx: Pick<SandboxedRouteContext, "ui">): { id: string } | null {
	const ui = routeCtx.ui;
	if (ui?.surface !== "content-editor-action" || ui.entry.collection !== "posts") return null;
	return { id: ui.entry.id };
}

/** Turns a `CoverResult` into what an editor action may return: a toast, and a refresh on success. */
export function editorReply(result: CoverResult) {
	return result.ok
		? { toast: { type: "success" as const, message: "Cover generated." }, refresh: true as const }
		: { toast: { type: "error" as const, message: result.error } };
}

// ── Plugin ───────────────────────────────────────────────────────────────────

const plugin: SandboxedPlugin = {
	routes: {
		// The Settings page. Only admins can open it.
		admin: {
			permission: "plugins:manage",
			handler: async (routeCtx, ctx) => {
				const interaction = isRecord(routeCtx.input) ? routeCtx.input : {};

				if (interaction.type === "form_submit" && interaction.action_id === "save") {
					const values = isRecord(interaction.values) ? interaction.values : {};
					const token = typeof values[TOKEN_KEY] === "string" ? values[TOKEN_KEY].trim() : "";
					// An empty box means "keep the saved token".
					if (token) await ctx.settings.set(TOKEN_KEY, token);
					return {
						...settingsPage(await hasToken(ctx)),
						toast: { type: "success", message: token ? "Token saved" : "Nothing to save" },
					};
				}

				if (interaction.type === "block_action" && interaction.action_id === "remove_token") {
					await ctx.settings.delete(TOKEN_KEY);
					return {
						...settingsPage(false),
						toast: { type: "success", message: "Token removed" },
					};
				}

				return settingsPage(await hasToken(ctx));
			},
		},

		// The "Generate cover" button in the post editor. The post comes from
		// `routeCtx.ui.entry`, which the host checks. A plugin route checks only
		// the caller's role, so we need the role that may edit any post.
		"covers/generate": {
			permission: "content:edit_any",
			handler: async (routeCtx, ctx) => {
				const entry = editorEntry(routeCtx);
				if (!entry) return editorReply({ ok: false, error: "Open a saved post first." });
				return editorReply(await generateCover(ctx, entry.id));
			},
		},

		// Backs the `generateCover` MCP tool.
		"covers/generate-tool": {
			permission: "content:edit_any",
			handler: async (routeCtx, ctx) => {
				const input = generateCoverInput.safeParse(routeCtx.input);
				if (!input.success) return { ok: false, error: "Pass the post's ID as postId." };
				return generateCover(ctx, input.data.postId);
			},
		},
	},

	mcp: {
		tools: {
			generateCover: {
				description:
					"Generate an AI cover image for a post that has none. Use it when publishing fails because a post has no cover.",
				route: "covers/generate-tool",
				input: generateCoverInput,
				// Never replaces an existing cover, so it isn't destructive.
				destructive: false,
			},
		},
	},

	hooks: {
		"content:beforePublish": requireCover,
		"content:beforeSchedule": requireCover,
	},
};

export default plugin;
