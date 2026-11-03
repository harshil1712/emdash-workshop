import type { PluginContext, SandboxedPlugin, SandboxedRouteContext } from "emdash/plugin";

/**
 * Cover Images: generates an AI cover image for a post with FLUX.2 [klein] 4B on
 * Replicate, and (from step 13) blocks publishing a post without one.
 *
 * The starter has the parts that aren't worth typing in a workshop: the
 * settings page and the editor-action wiring. The TODOs mark what you write.
 */

/** What `generateCover` returns to every entry point. */
export type CoverResult = { ok: true; mediaId: string; url: string } | { ok: false; error: string };

/** The settings key that holds the Replicate API token. */
export const TOKEN_KEY = "replicateToken";

// ── Step 11 ──────────────────────────────────────────────────────────────────
// TODO(step 11): write `generateCover(ctx, postId)` here. It returns a
// `CoverResult`, and the editor action, the MCP tool and anything else that
// makes a cover all call it.

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

		// The "Generate cover" button in the post editor (declared in step 10).
		// TODO(step 12): give this route the permission `content:edit_any`, and
		// call `generateCover` with the post from `editorEntry(routeCtx)`.
		"covers/generate": {
			handler: async (routeCtx) => {
				const entry = editorEntry(routeCtx);
				if (!entry) return editorReply({ ok: false, error: "Open a saved post first." });
				return editorReply({ ok: false, error: "Generate cover isn't written yet." });
			},
		},

		// TODO(step 12): add a second private route for the MCP tool. It reads
		// `routeCtx.input` instead of `routeCtx.ui`.
	},

	// TODO(step 12): expose `generateCover` to agents under `mcp.tools`.

	// TODO(step 13): add the `content:beforePublish` and `content:beforeSchedule` hooks.
};

export default plugin;
