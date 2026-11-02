import { afterEach, describe, expect, it } from "vitest";

import { createPluginTestHost, type PluginTestHost } from "@emdash-cms/plugin-test";

let host: PluginTestHost | undefined;

afterEach(async () => {
	await host?.dispose();
	host = undefined;
});

// The test host runs the built plugin in a real sandbox, through EmDash's
// production wrapper and host bridge. Step 13 replaces this file with tests
// for the publish rule.

describe("settings page", () => {
	it("asks for a token when none is saved", async () => {
		host = await createPluginTestHost();
		const page = await host.invokeRoute("admin", { type: "page_load", page: "/settings" });
		expect(JSON.stringify(page)).toContain("No Replicate token yet.");
	});
});
