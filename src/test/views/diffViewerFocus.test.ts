import * as assert from "node:assert";
import * as vscode from "vscode";
import { MessageRouter } from "../../messages/messageRouter";
import {
  type DiffSpec,
  DiffViewerManager,
} from "../../views/diffViewerManager";

function spec(path: string): DiffSpec {
  return {
    repoId: "repo-under-test",
    path,
    leftPath: path,
    rightPath: path,
    leftRef: "HEAD",
    rightRef: "",
    title: path,
  };
}

describe("DiffViewerManager: a reused diff panel takes focus", () => {
  let manager: DiffViewerManager;

  beforeEach(() => {
    manager = new DiffViewerManager(
      vscode.Uri.file("/extension"),
      new MessageRouter(),
    );
  });

  afterEach(() => {
    // The stand-in panel has no dispose; drop it before the manager's own.
    (manager as unknown as { panel: unknown }).panel = undefined;
    manager.dispose();
  });

  it("reveals the panel with focus when it shows the next diff", async () => {
    // The panel is reused for every diff. Revealed with preserveFocus, it
    // left focus where the diff was opened from, and the diff's keys (F7,
    // Alt+Arrow) did nothing until a click.
    const reveals: Array<{ column: unknown; preserveFocus: unknown }> = [];
    const panel = {
      title: "",
      viewColumn: vscode.ViewColumn.One,
      webview: {
        html: "",
        cspSource: "test-csp",
        asWebviewUri: (uri: vscode.Uri) => uri,
      },
      reveal(column: unknown, preserveFocus: unknown) {
        reveals.push({ column, preserveFocus });
      },
    };
    (manager as unknown as { panel: unknown }).panel = panel;

    await manager.show(spec("b.ts"));

    assert.strictEqual(panel.title, "b.ts");
    assert.deepStrictEqual(reveals, [
      { column: vscode.ViewColumn.One, preserveFocus: false },
    ]);
  });
});
