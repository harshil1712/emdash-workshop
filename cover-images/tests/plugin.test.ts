import { afterEach, describe, expect, it } from "vitest";

import { createPluginTestHost, type PluginTestHost } from "@emdash-cms/plugin-test";

let host: PluginTestHost | undefined;

afterEach(async () => {
	await host?.dispose();
	host = undefined;
});

// The test host runs the built plugin in a real sandbox, through EmDash's
// production wrapper and host bridge. Generation calls Replicate, so we check
// it live instead: these tests stay fast and free.

function publishEvent(data: Record<string, unknown>) {
	return {
		collection: "posts",
		content: { id: "post-1", slug: "hello", status: "draft", data: { title: "Hello", ...data } },
		origin: { source: "mcp" },
	};
}

describe("publish rule", () => {
	it("lets a post with a cover through", async () => {
		host = await createPluginTestHost();
		const decision = await host.invokeHook(
			"content:beforePublish",
			publishEvent({ featured_image: { id: "media-1", src: "/cover.webp", alt: "A cover" } }),
		);
		expect(decision).toBeFalsy();
	});

	it("cancels a post without a cover, with our reason", async () => {
		host = await createPluginTestHost();
		const decision = await host.invokeHook("content:beforePublish", publishEvent({}));
		expect(decision).toEqual({ cancel: true, reason: "Add a cover image (try Generate cover)." });
	});
});
