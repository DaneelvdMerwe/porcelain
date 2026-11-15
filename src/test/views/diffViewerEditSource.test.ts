import * as assert from "node:assert";
import * as vscode from "vscode";
import type { MessageRouter } from "../../messages/messageRouter";
import { DiffViewerManager } from "../../views/diffViewerManager";

describe("DiffViewerManager: Edit Source requested by the host", () => {
  let broadcasts: Array<{ event: string; data: unknown }>;
  let manager: DiffViewerManager;

  beforeEach(() => {
    broadcasts = [];
    const router = {
      broadcastEvent(event: string, data: unknown) {
        broadcasts.push({ event, data });
      },
    } as unknown as MessageRouter;
    manager = new DiffViewerManager(vscode.Uri.file("/extension"), router);
  });

  afterEach(() => {
    (manager as unknown as { panel: unknown }).panel = undefined;
    manager.dispose();
  });

  it("asks the open diff to run Edit Source", () => {
    // The caret lives in the webview, so the host hands the request over.
    (manager as unknown as { panel: unknown }).panel = {};
    assert.strictEqual(manager.requestEditSource(), true);
    assert.deepStrictEqual(broadcasts, [
      { event: "editSourceRequested", data: null },
    ]);
  });

  it("does nothing when no diff is open", () => {
    assert.strictEqual(manager.requestEditSource(), false);
    assert.deepStrictEqual(broadcasts, []);
  });
});
